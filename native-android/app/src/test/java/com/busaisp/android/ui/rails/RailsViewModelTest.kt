package com.busaisp.android.ui.rails

import com.busaisp.android.data.repository.RailsRepository
import com.busaisp.android.data.repository.RailsResult
import com.busaisp.android.domain.model.RailLine
import com.busaisp.android.domain.model.RailOperator
import com.busaisp.android.domain.model.RailStatusType
import com.busaisp.android.domain.model.RailsData
import com.busaisp.android.domain.model.RailsSummary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
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
class RailsViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private class FakeRailsRepository(var result: RailsResult) : RailsRepository {
        override suspend fun getRailsStatus(): RailsResult = result
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `uiState emite Success quando repositorio retorna dados validos de trilhos`() = runTest {
        val line = RailLine("1", "Linha 1 - Azul", "1", "Azul", "#003399", RailOperator.METRO, RailStatusType.NORMAL, "Operação Normal", null, "Agora")
        val summary = RailsSummary(1, 1, 0, "16:50", "Direto dos Trens")
        val data = RailsData(listOf(line), summary)

        val repository = FakeRailsRepository(RailsResult.Success(data))
        val viewModel = RailsViewModel(repository)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is RailsUiState.Success)
        val success = viewModel.uiState.value as RailsUiState.Success
        assertEquals(1, success.data.lines.size)
        assertEquals("Linha 1 - Azul", success.data.lines[0].name)
    }

    @Test
    fun `uiState emite Error quando repositorio retorna Failure`() = runTest {
        val repository = FakeRailsRepository(RailsResult.Failure("Falha de rede"))
        val viewModel = RailsViewModel(repository)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value is RailsUiState.Error)
        val error = viewModel.uiState.value as RailsUiState.Error
        assertEquals("Falha de rede", error.message)
    }
}
