package com.busaisp.android.ui.map

import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.data.repository.TrafficRepository
import com.busaisp.android.data.repository.TrafficResult
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.TrafficHeatmapData
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class MapViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private val linha = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE")

    private class FakeBusRepository(private val result: VehiclesResult) : BusRepository {
        override fun observeVehicles(linha: Linha) = flowOf(result)
    }

    private class FakeLineSearchRepository : LineSearchRepository {
        override suspend fun searchLinhas(query: String): List<Linha> = emptyList()
    }

    private class FakeLocationClient(
        private val positions: Flow<LocationClient.Position> = emptyFlow()
    ) : LocationClient {
        override fun observeLocation(): Flow<LocationClient.Position> = positions
    }

    private class FakeTrafficRepository(
        var result: TrafficResult = TrafficResult.Success(
            TrafficHeatmapData(emptyList(), TrafficHotspotStatus.FLUINDO, 0, "17:00")
        )
    ) : TrafficRepository {
        override suspend fun getTrafficHeatmap(lat: Double, lng: Double): TrafficResult = result
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `ao selecionar uma linha o estado passa a ter os veiculos reais`() = runTest {
        val vehicle = Vehicle("21045", -23.5, -46.6, 90.0, 24.5, 0L, true)
        val busRepository = FakeBusRepository(VehiclesResult.Success(listOf(vehicle), 0L))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), FakeTrafficRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.WithVehicles)
        assertEquals(1, (state as MapUiState.WithVehicles).vehicles.size)
    }

    @Test
    fun `falha de rede resulta em estado de erro honesto`() = runTest {
        val busRepository = FakeBusRepository(VehiclesResult.Failure("Falha de conexão"))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), FakeTrafficRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.Error)
        assertEquals("Falha de conexão", (state as MapUiState.Error).message)
    }

    private class SlowThenFastBusRepository(
        private val slowLinhaCodigo: Int,
        private val slowVehicle: Vehicle,
        private val slowDelayMs: Long,
        private val fastVehicle: Vehicle,
        private val fastDelayMs: Long
    ) : BusRepository {
        override fun observeVehicles(linha: Linha): Flow<VehiclesResult> = flow {
            if (linha.codigo == slowLinhaCodigo) {
                delay(slowDelayMs)
                emit(VehiclesResult.Success(listOf(slowVehicle), 0L))
            } else {
                delay(fastDelayMs)
                emit(VehiclesResult.Success(listOf(fastVehicle), 0L))
            }
        }
    }

    @Test
    fun `trocar de linha antes do polling anterior terminar nao deixa a linha antiga sobrescrever o estado`() = runTest {
        val linhaA = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE")
        val linhaB = Linha(2002, "875A-10", 10, "TERMINAL LAPA", "METRO VILA MADALENA")
        val vehicleA = Vehicle("A", -23.5, -46.6, 90.0, 24.5, 0L, true)
        val vehicleB = Vehicle("B", -23.6, -46.7, 180.0, 10.0, 0L, true)

        val busRepository = SlowThenFastBusRepository(
            slowLinhaCodigo = linhaA.codigo,
            slowVehicle = vehicleA,
            slowDelayMs = 1_000L,
            fastVehicle = vehicleB,
            fastDelayMs = 100L
        )
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), FakeTrafficRepository())

        viewModel.onLineSelected(linhaA)
        dispatcher.scheduler.advanceTimeBy(50L)
        viewModel.onLineSelected(linhaB)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.WithVehicles)
        val withVehicles = state as MapUiState.WithVehicles
        assertEquals(linhaB.codigo, withVehicles.linha.codigo)
        assertEquals("B", withVehicles.vehicles.first().prefix)
    }

    private class SuccessThenFailureBusRepository(
        private val successResult: VehiclesResult.Success,
        private val failureMessage: String = "Falha de conexão"
    ) : BusRepository {
        override fun observeVehicles(linha: Linha): Flow<VehiclesResult> = flow {
            emit(successResult)
            delay(1_000L)
            emit(VehiclesResult.Failure(failureMessage))
        }
    }

    private val staleGraceMs = 90_000L

    @Test
    fun `falha logo apos um sucesso recente mantem os veiculos visiveis marcados como desatualizados`() = runTest {
        val recentFetchedAt = System.currentTimeMillis()
        val vehicle = Vehicle("21045", -23.5, -46.6, 90.0, 24.5, 0L, true)
        val busRepository = SuccessThenFailureBusRepository(
            VehiclesResult.Success(listOf(vehicle), recentFetchedAt)
        )
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), FakeTrafficRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.WithVehicles)
        val withVehicles = state as MapUiState.WithVehicles
        assertTrue(withVehicles.isStale)
        assertEquals(linha.codigo, withVehicles.linha.codigo)
        assertEquals(1, withVehicles.vehicles.size)
        assertEquals("21045", withVehicles.vehicles.first().prefix)
    }

    @Test
    fun `falha apos um sucesso ja expirado vira estado de erro em vez de manter dados obsoletos`() = runTest {
        val expiredFetchedAt = System.currentTimeMillis() - staleGraceMs - 5_000L
        val vehicle = Vehicle("21045", -23.5, -46.6, 90.0, 24.5, 0L, true)
        val busRepository = SuccessThenFailureBusRepository(
            VehiclesResult.Success(listOf(vehicle), expiredFetchedAt),
            failureMessage = "Falha de conexão"
        )
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), FakeTrafficRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.Error)
        assertEquals("Falha de conexão", (state as MapUiState.Error).message)
    }

    private class CountingLocationClient(private val position: LocationClient.Position) : LocationClient {
        var subscriptionCount = 0
            private set

        override fun observeLocation(): Flow<LocationClient.Position> = flow {
            subscriptionCount++
            emit(position)
            kotlinx.coroutines.awaitCancellation()
        }
    }

    @Test
    fun `onLocationPermissionGranted popula userLocation com a posicao real do GPS`() = runTest {
        val position = LocationClient.Position(-23.5, -46.6)
        val busRepository = FakeBusRepository(VehiclesResult.Success(emptyList(), 0L))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(flowOf(position)), FakeTrafficRepository())

        assertNull(viewModel.userLocation.value)

        viewModel.onLocationPermissionGranted()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(position, viewModel.userLocation.value)
    }

    @Test
    fun `chamar onLocationPermissionGranted duas vezes nao abre uma segunda subscricao de localizacao`() = runTest {
        val locationClient = CountingLocationClient(LocationClient.Position(-23.5, -46.6))
        val busRepository = FakeBusRepository(VehiclesResult.Success(emptyList(), 0L))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), locationClient, FakeTrafficRepository())

        viewModel.onLocationPermissionGranted()
        dispatcher.scheduler.advanceUntilIdle()
        viewModel.onLocationPermissionGranted()
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(1, locationClient.subscriptionCount)
    }

    @Test
    fun `toggleTrafficHeatmap ativa e desativa o radar e carrega dados reais`() = runTest {
        val busRepository = FakeBusRepository(VehiclesResult.Success(emptyList(), 0L))
        val trafficRepository = FakeTrafficRepository()
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository(), FakeLocationClient(), trafficRepository)

        assertFalse(viewModel.isHeatmapVisible.value)
        assertNull(viewModel.heatmapData.value)

        viewModel.toggleTrafficHeatmap()
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.isHeatmapVisible.value)
        assertTrue(viewModel.heatmapData.value != null)

        viewModel.toggleTrafficHeatmap()
        assertFalse(viewModel.isHeatmapVisible.value)
    }
}
