package com.busaisp.android.ui.routesearch

import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.GeoPoint
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RoutePolyline
import com.busaisp.android.domain.model.RouteSearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class RouteSearchViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private val fakePlan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem", null, -23.55, -46.63),
        destination = RouteLocation("Destino", null, -23.52, -46.65),
        totalDurationMinutes = 42,
        transferCount = 1,
        departureHour = "14:30",
        arrivalHour = "15:12",
        farePrice = "R$ 4,40",
        trafficStatus = "FLUINDO",
        isRail = false,
        arrivalTimeUnreachable = false,
        accuracyLevel = RouteAccuracy.HIGH,
        recommendedLine = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE"),
        polyline = RoutePolyline(
            walkToStop = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.5505, -46.6305)),
            transit = listOf(GeoPoint(-23.5505, -46.6305), GeoPoint(-23.52, -46.65)),
            walkToDest = listOf(GeoPoint(-23.52, -46.65), GeoPoint(-23.521, -46.651))
        ),
        steps = emptyList()
    )

    private class FakeRouteRepository(
        private val result: RouteRepositoryResult
    ) : RouteRepository {
        override suspend fun calculateRoute(
            origin: RouteLocation,
            destination: RouteLocation,
            timeMode: RouteTimeMode
        ) = result

        override suspend fun searchAddresses(query: String): List<RouteLocation> = emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation() = emptyFlow<LocationClient.Position>()
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `calcular rota com sucesso preenche o estado com o resultado real`() = runTest {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(RouteRepositoryResult.Success(RouteSearchResult(fakePlan, emptyList()))),
            FakeLocationClient()
        )

        viewModel.onOriginChanged("Origem")
        // NOTA: o texto do plano original tinha um typo aqui (onDestinationSelected em vez
        // de onOriginSelected para a origem), o que deixava selectedOrigin sempre nulo e o
        // teste falhava mesmo com a implementação de referência do próprio plano — corrigido
        // para refletir a intenção óbvia do teste (selecionar origem, depois destino).
        viewModel.onOriginSelected(fakePlan.origin)
        viewModel.onDestinationChanged("Destino")
        viewModel.onDestinationSelected(fakePlan.destination)
        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is RouteSearchUiState.Results)
        assertEquals(42, (state as RouteSearchUiState.Results).result.primaryRoute.totalDurationMinutes)
    }

    @Test
    fun `falha na busca de rota vira estado de erro honesto`() = runTest {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(RouteRepositoryResult.Failure("Nenhuma rota encontrada")),
            FakeLocationClient()
        )

        viewModel.onOriginChanged("Origem")
        viewModel.onOriginSelected(fakePlan.origin)
        viewModel.onDestinationChanged("Destino")
        viewModel.onDestinationSelected(fakePlan.destination)
        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is RouteSearchUiState.Error)
        assertEquals("Nenhuma rota encontrada", (state as RouteSearchUiState.Error).message)
    }

    @Test
    fun `calcular sem origem e destino selecionados nao chama o repositorio`() = runTest {
        var called = false
        val repo = object : RouteRepository {
            override suspend fun calculateRoute(origin: RouteLocation, destination: RouteLocation, timeMode: RouteTimeMode): RouteRepositoryResult {
                called = true
                return RouteRepositoryResult.Failure("não deveria chamar")
            }
            override suspend fun searchAddresses(query: String): List<RouteLocation> = emptyList()
        }
        val viewModel = RouteSearchViewModel(repo, FakeLocationClient())

        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(!called)
        assertTrue(viewModel.uiState.value is RouteSearchUiState.Idle)
    }

    // Auto-iniciado (fora do texto literal da tarefa): onOriginChanged/onDestinationChanged
    // relançam uma nova busca de autocomplete a cada tecla digitada (após o limiar de 3
    // caracteres) via viewModelScope.launch, sem cancelar a busca anterior — mesmo padrão de
    // corrida que o code review pegou em MapViewModel.onLineSelected (vehiclePollingJob).
    // Se o usuário digitar rápido, uma resposta MAIS LENTA de uma busca ANTIGA pode chegar
    // depois de uma resposta MAIS RÁPIDA de uma busca NOVA e sobrescrever as sugestões com
    // dado obsoleto. Este teste prova a corrida: a query "AB" demora mais para responder
    // que "ABC"; "ABC" é digitada logo depois de "AB", e o estado final de sugestões deve
    // refletir "ABC", nunca "AB".
    private class SlowThenFastAddressRepository(
        private val slowQuery: String,
        private val slowResult: List<RouteLocation>,
        private val slowDelayMs: Long,
        private val fastResult: List<RouteLocation>,
        private val fastDelayMs: Long
    ) : RouteRepository {
        override suspend fun calculateRoute(
            origin: RouteLocation,
            destination: RouteLocation,
            timeMode: RouteTimeMode
        ): RouteRepositoryResult = RouteRepositoryResult.Failure("não usado neste teste")

        override suspend fun searchAddresses(query: String): List<RouteLocation> {
            return if (query == slowQuery) {
                delay(slowDelayMs)
                slowResult
            } else {
                delay(fastDelayMs)
                fastResult
            }
        }
    }

    @Test
    fun `digitar rapido no campo de origem nao deixa uma busca antiga sobrescrever sugestoes mais novas`() = runTest {
        val staleResults = listOf(RouteLocation("Rua Antiga Obsoleta", null, -23.0, -46.0))
        val freshResults = listOf(RouteLocation("Rua Nova Correta", null, -23.1, -46.1))
        val repo = SlowThenFastAddressRepository(
            slowQuery = "Ave",
            slowResult = staleResults,
            slowDelayMs = 1_000L,
            fastResult = freshResults,
            fastDelayMs = 100L
        )
        val viewModel = RouteSearchViewModel(repo, FakeLocationClient())

        viewModel.onOriginChanged("Ave")
        dispatcher.scheduler.advanceTimeBy(50L)
        viewModel.onOriginChanged("Avenida")
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(freshResults, viewModel.originSuggestions.value)
    }

    @Test
    fun `digitar rapido no campo de destino nao deixa uma busca antiga sobrescrever sugestoes mais novas`() = runTest {
        val staleResults = listOf(RouteLocation("Rua Antiga Obsoleta", null, -23.0, -46.0))
        val freshResults = listOf(RouteLocation("Rua Nova Correta", null, -23.1, -46.1))
        val repo = SlowThenFastAddressRepository(
            slowQuery = "Ave",
            slowResult = staleResults,
            slowDelayMs = 1_000L,
            fastResult = freshResults,
            fastDelayMs = 100L
        )
        val viewModel = RouteSearchViewModel(repo, FakeLocationClient())

        viewModel.onDestinationChanged("Ave")
        dispatcher.scheduler.advanceTimeBy(50L)
        viewModel.onDestinationChanged("Avenida")
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(freshResults, viewModel.destinationSuggestions.value)
    }

    // Ao contrário de FakeLocationClient (emptyFlow(), que COMPLETA de
    // imediato sem emitir — não representa "sem sinal de GPS" de verdade), a
    // implementação real via callbackFlow (FusedLocationClient) só completa
    // quando cancelada; se o callback de localização nunca disparar, a flow
    // fica suspensa para sempre. awaitCancellation() reproduz esse
    // comportamento real de forma fiel.
    private class HangingLocationClient : LocationClient {
        override fun observeLocation(): kotlinx.coroutines.flow.Flow<LocationClient.Position> =
            kotlinx.coroutines.flow.flow { kotlinx.coroutines.awaitCancellation() }
    }

    @Test
    fun `useCurrentLocationAsOrigin nao trava para sempre quando o GPS nunca emite`() = runTest {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(RouteRepositoryResult.Failure("não usado neste teste")),
            HangingLocationClient()
        )

        viewModel.useCurrentLocationAsOrigin()
        dispatcher.scheduler.advanceTimeBy(LOCATE_ORIGIN_TIMEOUT_MS + 1_000L)
        dispatcher.scheduler.advanceUntilIdle()

        // A coroutine terminou (não travou) e, sem posição real, a origem
        // continua sem seleção — calculateRoute() ainda deve no-op.
        viewModel.onDestinationSelected(fakePlan.destination)
        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is RouteSearchUiState.Idle)
    }
}
