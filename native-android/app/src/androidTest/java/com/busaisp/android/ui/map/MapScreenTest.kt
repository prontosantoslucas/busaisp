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
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.ui.theme.BusaiSPTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test

// Mesmo espírito do LiveMap.test.tsx da versão web: monta a tela real (não um
// mock testando a si mesmo) e interage de verdade com os controles. Isso
// pegaria, por exemplo, o mesmo tipo de bug real que o LiveMap.test.tsx foi
// escrito para pegar na versão web (handler quebrado, tela que não renderiza).
class MapScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    // Concede a permissão de localização de antemão para exercitar o caminho
    // real de "permissão já concedida" do botão "Localização atual", em vez
    // de precisar simular o diálogo de permissão do sistema.
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

    private fun buildViewModel(
        lineSearchRepository: LineSearchRepository = FakeLineSearchRepository()
    ) = MapViewModel(FakeBusRepository(), lineSearchRepository, FakeLocationClient())

    @Test
    fun rendersWithoutThrowing() {
        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(viewModel = buildViewModel())
            }
        }
        // Se chegou até aqui sem lançar exceção, a tela montou de verdade.
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
        // Não lançar é o resultado esperado aqui — a permissão já foi concedida
        // pela GrantPermissionRule, então isto exercita o caminho real de
        // "permissão já concedida → chama onLocationPermissionGranted()" sem
        // precisar simular o diálogo de permissão do sistema.
    }
}
