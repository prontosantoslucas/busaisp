package com.busaisp.android.ui.news

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import com.busaisp.android.data.repository.NewsRepository
import com.busaisp.android.data.repository.NewsResult
import com.busaisp.android.domain.model.NewsBadge
import com.busaisp.android.domain.model.NewsItem
import com.busaisp.android.domain.model.NewsSourceType
import com.busaisp.android.ui.theme.BusaiSPTheme
import org.junit.Rule
import org.junit.Test

class NewsScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private class FakeNewsRepository : NewsRepository {
        override suspend fun getNews(): NewsResult {
            val item = NewsItem(
                id = "1",
                sourceType = NewsSourceType.INFORMATIVOS,
                title = "Domingão Tarifa Zero",
                subtitle = "Gratuidade aos domingos",
                description = "Ônibus gratuitos na capital.",
                fullContent = "Conteúdo detalhado",
                timestamp = "Hoje",
                badge = NewsBadge("TARIFA ZERO", "#000", "#FFF", "#FFF"),
                source = "SPTrans",
                categoryTag = "Tarifas"
            )
            return NewsResult.Success(listOf(item))
        }
    }

    @Test
    fun rendersNewsScreenCorrectly() {
        val viewModel = NewsViewModel(FakeNewsRepository())

        composeRule.setContent {
            BusaiSPTheme {
                NewsScreen(viewModel = viewModel)
            }
        }

        composeRule.onNodeWithText("Avisos & Notícias").assertExists()
        composeRule.onNodeWithText("Domingão Tarifa Zero").assertExists()
        composeRule.onNodeWithText("Todas").assertExists()
    }
}
