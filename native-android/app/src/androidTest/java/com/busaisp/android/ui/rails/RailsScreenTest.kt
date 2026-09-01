package com.busaisp.android.ui.rails

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.busaisp.android.data.repository.RailsRepository
import com.busaisp.android.data.repository.RailsResult
import com.busaisp.android.domain.model.RailLine
import com.busaisp.android.domain.model.RailOperator
import com.busaisp.android.domain.model.RailStatusType
import com.busaisp.android.domain.model.RailsData
import com.busaisp.android.domain.model.RailsSummary
import com.busaisp.android.ui.theme.BusaiSPTheme
import org.junit.Rule
import org.junit.Test

class RailsScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private class FakeRailsRepository : RailsRepository {
        override suspend fun getRailsStatus(): RailsResult {
            val line = RailLine("1", "Linha 1 - Azul", "1", "Azul", "#003399", RailOperator.METRO, RailStatusType.NORMAL, "Operação Normal", null, "Agora")
            val summary = RailsSummary(1, 1, 0, "16:50", "Direto dos Trens")
            return RailsResult.Success(RailsData(listOf(line), summary))
        }
    }

    @Test
    fun rendersRailsStatusScreenCorrectly() {
        val viewModel = RailsViewModel(FakeRailsRepository())

        composeRule.setContent {
            BusaiSPTheme {
                RailsScreen(viewModel = viewModel)
            }
        }

        composeRule.onNodeWithText("Direto dos Trilhos").assertExists()
        composeRule.onNodeWithText("Linha 1 - Azul").assertExists()
        composeRule.onNodeWithText("Operação Normal").assertExists()
    }
}
