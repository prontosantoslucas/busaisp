package com.busaisp.android.ui.favorites

import com.busaisp.android.data.favorites.FavoriteRepository
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
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
class FavoritesViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private class FakeFavoriteRepository(initial: List<Favorite> = emptyList()) : FavoriteRepository {
        private val state = MutableStateFlow(initial)
        override fun observeFavorites() = state
        override suspend fun toggleFavorite(favorite: Favorite) {
            state.value = if (state.value.any { it.type == favorite.type && it.refCode == favorite.refCode }) {
                state.value.filterNot { it.type == favorite.type && it.refCode == favorite.refCode }
            } else {
                state.value + favorite
            }
        }
        override suspend fun saveAddressFavorite(favorite: Favorite) {
            state.value = state.value.filterNot { it.type == favorite.type && it.refCode == favorite.refCode } + favorite
        }
        override suspend fun removeFavorite(type: FavoriteType, refCode: String) {
            state.value = state.value.filterNot { it.type == type && it.refCode == refCode }
        }
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `homeAddress reflete o favorito real de Casa salvo`() = runTest {
        val home = Favorite(FavoriteType.ENDERECO, "home", "Rua Real, 1", "Casa", -23.0, -46.0)
        val viewModel = FavoritesViewModel(FakeFavoriteRepository(listOf(home)))
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(home, viewModel.homeAddress.value)
    }

    @Test
    fun `homeAddress e nulo quando Casa nunca foi definida`() = runTest {
        val viewModel = FavoritesViewModel(FakeFavoriteRepository(emptyList()))
        dispatcher.scheduler.advanceUntilIdle()

        assertNull(viewModel.homeAddress.value)
    }

    @Test
    fun `isLoading comeca true e vira false assim que o DataStore emite, mesmo com lista vazia`() = runTest {
        // Repositorio real (DataStore) so emite depois da primeira leitura em
        // disco — antes disto, favorites/homeAddress ficavam em emptyList()/null
        // desde o inicio, indistinguivel de "carregou e nao tem nada". Este
        // teste garante que isLoading resolve pra false mesmo quando o
        // resultado real acaba sendo uma lista vazia (nao so quando ha dado).
        val viewModel = FavoritesViewModel(FakeFavoriteRepository(emptyList()))

        dispatcher.scheduler.advanceUntilIdle()

        assertFalse("isLoading deveria ser false apos o Flow emitir, mesmo com lista vazia", viewModel.isLoading.value)
        assertTrue(viewModel.favorites.value.isEmpty())
    }

    @Test
    fun `isRouteFavorited reflete o estado real apos toggle`() = runTest {
        val repository = FakeFavoriteRepository(emptyList())
        val viewModel = FavoritesViewModel(repository)
        val favorite = Favorite(FavoriteType.LINHA, "1001", "1703-10 Centro", "Rota")

        viewModel.toggleFavorite(favorite)
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(listOf(favorite), viewModel.favorites.value)
    }
}
