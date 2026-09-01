package com.busaisp.android.ui.news

import com.busaisp.android.data.repository.NewsRepository
import com.busaisp.android.data.repository.NewsResult
import com.busaisp.android.domain.model.NewsBadge
import com.busaisp.android.domain.model.NewsItem
import com.busaisp.android.domain.model.NewsSourceType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class NewsViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private class FakeNewsRepository(var result: NewsResult) : NewsRepository {
        override suspend fun getNews(): NewsResult = result
    }

    private val item1 = NewsItem(
        id = "1",
        sourceType = NewsSourceType.INFORMATIVOS,
        title = "Domingão Tarifa Zero",
        subtitle = "Aos domingos",
        description = "Gratuidade",
        fullContent = "Conteúdo",
        timestamp = "Hoje",
        badge = NewsBadge("TARIFA ZERO", "#000", "#FFF", "#FFF"),
        source = "SPTrans",
        categoryTag = "Tarifas"
    )

    private val item2 = NewsItem(
        id = "2",
        sourceType = NewsSourceType.TRILHOS,
        title = "Ocorrência Linha 3",
        subtitle = "Velocidade Reduzida",
        description = "Falha técnica",
        fullContent = "Conteúdo",
        timestamp = "16:00",
        badge = NewsBadge("METRÔ", "#000", "#FFF", "#FFF"),
        source = "Metrô",
        categoryTag = "Operação"
    )

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `filteredNews retorna todas as noticias quando filtro e ALL`() = runTest {
        val repository = FakeNewsRepository(NewsResult.Success(listOf(item1, item2)))
        val viewModel = NewsViewModel(repository)
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(2, viewModel.filteredNews.value.size)
    }

    @Test
    fun `filteredNews filtra corretamente por categoria`() = runTest {
        val repository = FakeNewsRepository(NewsResult.Success(listOf(item1, item2)))
        val viewModel = NewsViewModel(repository)
        dispatcher.scheduler.advanceUntilIdle()

        viewModel.setFilter(NewsSourceType.TRILHOS)
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(1, viewModel.filteredNews.value.size)
        assertEquals("Ocorrência Linha 3", viewModel.filteredNews.value.first().title)
    }

    @Test
    fun `openNewsDetail e closeNewsDetail controlam a noticia selecionada`() = runTest {
        val repository = FakeNewsRepository(NewsResult.Success(listOf(item1)))
        val viewModel = NewsViewModel(repository)
        dispatcher.scheduler.advanceUntilIdle()

        viewModel.openNewsDetail(item1)
        assertEquals(item1, viewModel.selectedNewsItem.value)

        viewModel.closeNewsDetail()
        assertNull(viewModel.selectedNewsItem.value)
    }
}
