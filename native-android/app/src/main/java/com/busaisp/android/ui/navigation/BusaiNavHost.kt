package com.busaisp.android.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Route
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.busaisp.android.ui.favorites.FavoritesScreen
import com.busaisp.android.ui.map.MapScreen
import com.busaisp.android.ui.routesearch.RouteDetailScreen
import com.busaisp.android.ui.routesearch.RouteResultsScreen
import com.busaisp.android.ui.routesearch.RouteSearchScreen
import com.busaisp.android.ui.routesearch.RouteSearchViewModel

object BusaiDestinations {
    const val MAP = "map"
    const val ROUTE_SEARCH = "route_search"
    const val FAVORITES = "favorites"
    const val ROUTE_RESULTS = "route_results"
    const val ROUTE_DETAIL = "route_detail/{planId}"
    fun routeDetail(planId: String) = "route_detail/$planId"
    const val ACTIVE_NAVIGATION = "active_navigation/{planId}"
    fun activeNavigation(planId: String) = "active_navigation/$planId"
}

private data class BottomTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

private val BOTTOM_TABS = listOf(
    BottomTab(BusaiDestinations.MAP, "Mapa", Icons.Filled.Map),
    BottomTab(BusaiDestinations.ROUTE_SEARCH, "Rotas", Icons.Filled.Route),
    BottomTab(BusaiDestinations.FAVORITES, "Favoritos", Icons.Filled.Star)
)

@Composable
fun BusaiNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            // A barra só faz sentido nas telas de topo (Mapa/Rotas/Favoritos) — a tela de
            // resultados fica "dentro" da aba Rotas, sem a barra por cima.
            if (currentRoute == BusaiDestinations.MAP || currentRoute == BusaiDestinations.ROUTE_SEARCH || currentRoute == BusaiDestinations.FAVORITES) {
                NavigationBar {
                    BOTTOM_TABS.forEach { tab ->
                        NavigationBarItem(
                            selected = backStackEntry?.destination?.hierarchy?.any { it.route == tab.route } == true,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { androidx.compose.material3.Text(tab.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BusaiDestinations.MAP,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BusaiDestinations.MAP) {
                MapScreen()
            }
            composable(BusaiDestinations.ROUTE_SEARCH) {
                RouteSearchScreen(
                    onRouteCalculated = { navController.navigate(BusaiDestinations.ROUTE_RESULTS) }
                )
            }
            composable(BusaiDestinations.FAVORITES) {
                FavoritesScreen()
            }
            composable(BusaiDestinations.ROUTE_RESULTS) {
                val searchBackStackEntry = remember(it) {
                    navController.getBackStackEntry(BusaiDestinations.ROUTE_SEARCH)
                }
                val sharedViewModel: RouteSearchViewModel = hiltViewModel(searchBackStackEntry)
                RouteResultsScreen(
                    viewModel = sharedViewModel,
                    onBack = { navController.popBackStack() },
                    onPlanSelected = { planId -> navController.navigate(BusaiDestinations.routeDetail(planId)) }
                )
            }
            composable(
                BusaiDestinations.ROUTE_DETAIL,
                arguments = listOf(androidx.navigation.navArgument("planId") { type = androidx.navigation.NavType.StringType })
            ) {
                val searchBackStackEntry = remember(it) {
                    navController.getBackStackEntry(BusaiDestinations.ROUTE_SEARCH)
                }
                val sharedViewModel: RouteSearchViewModel = hiltViewModel(searchBackStackEntry)
                val planId = it.arguments?.getString("planId").orEmpty()
                RouteDetailScreen(
                    planId = planId,
                    viewModel = sharedViewModel,
                    onBack = { navController.popBackStack() },
                    onIniciarPercurso = { navController.navigate(BusaiDestinations.activeNavigation(it)) }
                )
            }
            composable(
                BusaiDestinations.ACTIVE_NAVIGATION,
                arguments = listOf(androidx.navigation.navArgument("planId") { type = androidx.navigation.NavType.StringType })
            ) { backStackEntry ->
                val planId = backStackEntry.arguments?.getString("planId").orEmpty()
                val searchBackStackEntry = remember(backStackEntry) {
                    navController.getBackStackEntry(BusaiDestinations.ROUTE_SEARCH)
                }
                val sharedViewModel: com.busaisp.android.ui.routesearch.RouteSearchViewModel = hiltViewModel(searchBackStackEntry)
                val state = sharedViewModel.uiState.collectAsStateWithLifecycle().value
                val plan = (state as? com.busaisp.android.ui.routesearch.RouteSearchUiState.Results)
                    ?.result?.let { listOf(it.primaryRoute) + it.alternatives }
                    ?.firstOrNull { it.id == planId }
                if (plan != null) {
                    com.busaisp.android.ui.activenav.ActiveNavigationScreen(
                        plan = plan,
                        onEncerrar = { navController.popBackStack() }
                    )
                } else {
                    androidx.compose.foundation.layout.Column(modifier = Modifier.fillMaxSize()) {
                        androidx.compose.material3.IconButton(onClick = { navController.popBackStack() }) {
                            androidx.compose.material3.Icon(
                                Icons.Filled.ArrowBack,
                                contentDescription = "Voltar"
                            )
                        }
                        androidx.compose.material3.Text(
                            "Rota não encontrada",
                            modifier = Modifier.padding(16.dp)
                        )
                    }
                }
            }
        }
    }
}
