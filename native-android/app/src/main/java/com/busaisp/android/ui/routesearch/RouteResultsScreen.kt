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
import androidx.compose.material3.MaterialTheme
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

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape

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
            is RouteSearchUiState.Loading -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    repeat(3) {
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp)
                                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
                                .padding(16.dp)
                        ) {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(width = 90.dp, height = 20.dp)
                                            .background(
                                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
                                                RoundedCornerShape(4.dp)
                                            )
                                    )
                                    Box(
                                        modifier = Modifier
                                            .size(width = 60.dp, height = 18.dp)
                                            .background(
                                                MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f),
                                                RoundedCornerShape(4.dp)
                                            )
                                    )
                                }
                                Box(
                                    modifier = Modifier
                                        .size(width = 180.dp, height = 14.dp)
                                        .background(
                                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f),
                                            RoundedCornerShape(4.dp)
                                        )
                                )
                                Box(
                                    modifier = Modifier
                                        .size(width = 120.dp, height = 14.dp)
                                        .background(
                                            MaterialTheme.colorScheme.onSurface.copy(alpha = 0.06f),
                                            RoundedCornerShape(4.dp)
                                        )
                                )
                            }
                        }
                    }
                }
            }
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
