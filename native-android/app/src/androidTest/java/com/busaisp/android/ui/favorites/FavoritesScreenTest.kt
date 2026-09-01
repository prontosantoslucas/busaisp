package com.busaisp.android.ui.favorites

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.busaisp.android.data.favorites.FavoriteRepository
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.ui.routesearch.RouteSearchViewModel
import com.busaisp.android.ui.theme.BusaiSPTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test

class FavoritesScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private class FakeFavoriteRepository(initial: List<Favorite> = emptyList()) : FavoriteRepository {
        private val state = MutableStateFlow(initial)
        override fun observeFavorites(): Flow<List<Favorite>> = state
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

    private class FakeRouteRepository : RouteRepository {
        override suspend fun calculateRoute(origin: RouteLocation, destination: RouteLocation, timeMode: RouteTimeMode): RouteRepositoryResult =
            RouteRepositoryResult.Failure("Não usado")
        override suspend fun searchAddresses(query: String): List<RouteLocation> = emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation(): Flow<LocationClient.Position> = emptyFlow()
    }

    @Test
    fun rendersWithoutThrowing() {
        val favoritesViewModel = FavoritesViewModel(FakeFavoriteRepository())
        val routeSearchViewModel = RouteSearchViewModel(FakeRouteRepository(), FakeLocationClient())

        composeRule.setContent {
            BusaiSPTheme {
                FavoritesScreen(
                    viewModel = favoritesViewModel,
                    routeSearchViewModel = routeSearchViewModel
                )
            }
        }

        composeRule.onNodeWithText("Meus Endereços").assertExists()
        composeRule.onNodeWithText("Casa").assertExists()
        composeRule.onNodeWithText("Trabalho").assertExists()
        composeRule.onNodeWithText("Rotas favoritas").assertExists()
    }

    @Test
    fun displaysSavedFavoritesCorrectly() {
        val home = Favorite(FavoriteType.ENDERECO, "home", "Av. Paulista, 1000", "Casa", -23.56, -46.65)
        val route = Favorite(FavoriteType.LINHA, "1001", "1703-10 Jd. Fontális", "Rota")
        val favoritesViewModel = FavoritesViewModel(FakeFavoriteRepository(listOf(home, route)))
        val routeSearchViewModel = RouteSearchViewModel(FakeRouteRepository(), FakeLocationClient())

        composeRule.setContent {
            BusaiSPTheme {
                FavoritesScreen(
                    viewModel = favoritesViewModel,
                    routeSearchViewModel = routeSearchViewModel
                )
            }
        }

        composeRule.onNodeWithText("Av. Paulista, 1000").assertExists()
        composeRule.onNodeWithText("1703-10 Jd. Fontális").assertExists()
    }
}
