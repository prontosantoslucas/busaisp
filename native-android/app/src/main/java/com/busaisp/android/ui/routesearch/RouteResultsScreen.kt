package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.routesearch.components.RoutePlanCard
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.ui.favorites.FavoritesViewModel

@Composable
fun RouteResultsScreen(
    viewModel: RouteSearchViewModel = hiltViewModel(),
    favoritesViewModel: FavoritesViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onPlanSelected: (planId: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val favorites by favoritesViewModel.favorites.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        IconButton(onClick = onBack) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
        }

        when (val state = uiState) {
            is RouteSearchUiState.Results -> {
                val allPlans: List<RoutePlan> = listOf(state.result.primaryRoute) + state.result.alternatives
                LazyColumn(
                    modifier = Modifier.fillMaxSize().padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(allPlans, key = { it.id }) { plan ->
                        val isFavorited = favorites.any {
                            it.type == FavoriteType.LINHA && it.refCode == plan.recommendedLine.codigo.toString()
                        }
                        RoutePlanCard(
                            plan = plan,
                            onClick = { onPlanSelected(plan.id) },
                            isFavorited = isFavorited,
                            onToggleFavorite = {
                                favoritesViewModel.toggleFavorite(
                                    Favorite(
                                        type = FavoriteType.LINHA,
                                        refCode = plan.recommendedLine.codigo.toString(),
                                        title = "${plan.recommendedLine.letreiro} ${plan.destination.name}",
                                        label = "Rota"
                                    )
                                )
                            }
                        )
                    }
                }
            }
            is RouteSearchUiState.Error -> Text(state.message, modifier = Modifier.padding(16.dp))
            else -> Text("Nenhum resultado ainda", modifier = Modifier.padding(16.dp))
        }
    }
}
