package com.busaisp.android.ui.routesearch

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
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
import com.busaisp.android.ui.theme.BusaiSPTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test

// Mesmo espírito do MapScreenTest.kt (sub-projeto #1): monta a tela real (não
// um mock testando a si mesmo) e interage de verdade com os controles, com
// fakes passados via override do parâmetro `viewModel` — sem infraestrutura
// de teste do Hilt. Sem emulador/dispositivo neste ambiente, só a compilação
// é verificável aqui, não a execução real (ver commit para o resultado
// honesto de `connectedDebugAndroidTest`).
class RouteSearchScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val fakePlan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem Real", null, -23.55, -46.63),
        destination = RouteLocation("Destino Real", null, -23.52, -46.65),
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
        private val suggestions: Map<String, List<RouteLocation>>,
        private val result: RouteRepositoryResult
    ) : RouteRepository {
        override suspend fun calculateRoute(origin: RouteLocation, destination: RouteLocation, timeMode: RouteTimeMode) = result
        override suspend fun searchAddresses(query: String): List<RouteLocation> = suggestions[query] ?: emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation(): Flow<LocationClient.Position> = emptyFlow()
    }

    @Test
    fun rendersWithoutThrowing() {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(emptyMap(), RouteRepositoryResult.Success(RouteSearchResult(fakePlan, emptyList()))),
            FakeLocationClient()
        )
        composeRule.setContent {
            BusaiSPTheme {
                RouteSearchScreen(viewModel = viewModel, onRouteCalculated = {})
            }
        }
    }

    @Test
    fun typingOriginShowsRealSuggestions() {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(
                mapOf("Paulista" to listOf(RouteLocation("Av. Paulista, 1000", null, -23.56, -46.65))),
                RouteRepositoryResult.Failure("não usado neste teste")
            ),
            FakeLocationClient()
        )
        composeRule.setContent {
            BusaiSPTheme {
                RouteSearchScreen(viewModel = viewModel, onRouteCalculated = {})
            }
        }

        composeRule.onNodeWithText("Origem").performTextInput("Paulista")
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Av. Paulista, 1000").assertExists()
    }
}
