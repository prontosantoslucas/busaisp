package com.busaisp.android.ui.map

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import androidx.test.rule.GrantPermissionRule
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.data.repository.TrafficRepository
import com.busaisp.android.data.repository.TrafficResult
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.TrafficHeatmapData
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.ui.theme.BusaiSPTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test

class MapScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @get:Rule
    val permissionRule: GrantPermissionRule =
        GrantPermissionRule.grant(android.Manifest.permission.ACCESS_FINE_LOCATION)

    private class FakeBusRepository : BusRepository {
        override fun observeVehicles(linha: Linha): Flow<VehiclesResult> = emptyFlow()
    }

    private class FakeLineSearchRepository(
        private val resultsByQuery: Map<String, List<Linha>> = emptyMap()
    ) : LineSearchRepository {
        override suspend fun searchLinhas(query: String): List<Linha> =
            resultsByQuery[query] ?: emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation(): Flow<LocationClient.Position> = emptyFlow()
    }

    private class FakeTrafficRepository : TrafficRepository {
        override suspend fun getTrafficHeatmap(lat: Double, lng: Double): TrafficResult =
            TrafficResult.Success(
                TrafficHeatmapData(
                    hotspots = emptyList(),
                    cityStatus = TrafficHotspotStatus.FLUINDO,
                    totalCongestionKm = 12,
                    lastUpdated = "17:30"
                )
            )
    }

    private fun buildViewModel(
        lineSearchRepository: LineSearchRepository = FakeLineSearchRepository()
    ) = MapViewModel(FakeBusRepository(), lineSearchRepository, FakeLocationClient(), FakeTrafficRepository())

    @Test
    fun rendersWithoutThrowing() {
        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(viewModel = buildViewModel())
            }
        }
    }

    @Test
    fun typingInSearchFieldShowsRealResultsFromTheRepository() {
        val linha = Linha(
            codigo = 1001,
            letreiro = "1703",
            tipoLinha = 10,
            terminalPrincipal = "JD. FONTALIS",
            terminalSecundario = "SHOPPING CENTER NORTE"
        )
        val viewModel = buildViewModel(
            lineSearchRepository = FakeLineSearchRepository(mapOf("1703" to listOf(linha)))
        )

        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(viewModel = viewModel)
            }
        }

        composeRule.onNodeWithText("Buscar linha (ex: 1703)").performTextInput("1703")
        composeRule.waitForIdle()

        composeRule.onNodeWithText("1703 — JD. FONTALIS / SHOPPING CENTER NORTE").assertExists()
    }

    @Test
    fun locateButtonClickDoesNotThrowWithPermissionAlreadyGranted() {
        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(viewModel = buildViewModel())
            }
        }

        composeRule.onNodeWithContentDescription("Localização atual").performClick()
        composeRule.waitForIdle()
    }

    @Test
    fun trafficRadarButtonClickTogglesStateWithoutThrowing() {
        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(viewModel = buildViewModel())
            }
        }

        composeRule.onNodeWithContentDescription("Exibir radar de trânsito").performClick()
        composeRule.waitForIdle()
        composeRule.onNodeWithContentDescription("Ocultar radar de trânsito").assertExists()
    }
}
