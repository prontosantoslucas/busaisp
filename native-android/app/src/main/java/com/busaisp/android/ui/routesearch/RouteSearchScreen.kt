package com.busaisp.android.ui.routesearch

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Button
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.ui.favorites.FavoritesViewModel
import com.busaisp.android.ui.routesearch.components.AddressField
import com.busaisp.android.ui.routesearch.components.TimeModeSelector

@Composable
fun RouteSearchScreen(
    viewModel: RouteSearchViewModel = hiltViewModel(),
    favoritesViewModel: FavoritesViewModel = hiltViewModel(),
    onRouteCalculated: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val originSuggestions by viewModel.originSuggestions.collectAsState()
    val destinationSuggestions by viewModel.destinationSuggestions.collectAsState()
    val timeMode by viewModel.timeMode.collectAsStateWithLifecycle()
    val home by favoritesViewModel.homeAddress.collectAsStateWithLifecycle()
    val work by favoritesViewModel.workAddress.collectAsStateWithLifecycle()

    var originQuery by remember { mutableStateOf("") }
    var destinationQuery by remember { mutableStateOf("") }
    val context = LocalContext.current

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            originQuery = "Minha Localização"
            viewModel.useCurrentLocationAsOrigin()
        }
    }

    // Preenche a origem com a localização atual assim que a tela abre — antes
    // exigia um toque manual em "Usar minha localização atual", diferente do
    // que apps de mobilidade (Uber/Waze) fazem por padrão. Só dispara uma vez
    // (LaunchedEffect(Unit)) e só se a origem ainda estiver vazia — não
    // sobrescreve Casa/Trabalho ou algo já digitado, nem repete ao voltar de
    // Resultados pra esta tela.
    LaunchedEffect(Unit) {
        if (originQuery.isNotBlank()) return@LaunchedEffect
        val hasPermission = ContextCompat.checkSelfPermission(
            context, Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
        if (hasPermission) {
            originQuery = "Minha Localização"
            viewModel.useCurrentLocationAsOrigin()
        } else {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    // O RouteSearchViewModel é compartilhado (escopado à rota ROUTE_SEARCH) e
    // sobrevive à navegação — ao voltar de RouteResultsScreen/RouteDetailScreen,
    // esta tela recompõe do zero com uiState já em Results. Sem a guarda abaixo,
    // o LaunchedEffect dispararia de novo na entrada da composição e navegaria
    // pra frente imediatamente, e o botão "voltar" nunca funcionaria depois da
    // primeira busca. Só navega quando o resultado passa a ser Results DURANTE
    // esta composição (uma busca nova de fato), não quando a tela já reabre assim.
    var alreadyHadResultOnEntry by remember { mutableStateOf(uiState is RouteSearchUiState.Results) }
    LaunchedEffect(uiState) {
        if (uiState is RouteSearchUiState.Results) {
            if (alreadyHadResultOnEntry) {
                alreadyHadResultOnEntry = false
            } else {
                onRouteCalculated()
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        if (home != null || work != null) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.padding(bottom = 8.dp)
            ) {
                home?.let { homeFav ->
                    if (homeFav.lat != null && homeFav.lng != null) {
                        AssistChip(
                            onClick = {
                                originQuery = homeFav.title
                                viewModel.onOriginSelected(RouteLocation(homeFav.title, null, homeFav.lat, homeFav.lng))
                            },
                            label = { Text("Casa") },
                            leadingIcon = { Icon(Icons.Filled.Home, contentDescription = "Casa") }
                        )
                    }
                }
                work?.let { workFav ->
                    if (workFav.lat != null && workFav.lng != null) {
                        AssistChip(
                            onClick = {
                                originQuery = workFav.title
                                viewModel.onOriginSelected(RouteLocation(workFav.title, null, workFav.lat, workFav.lng))
                            },
                            label = { Text("Trabalho") },
                            leadingIcon = { Icon(Icons.Filled.Work, contentDescription = "Trabalho") }
                        )
                    }
                }
            }
        }

        AddressField(
            label = "Origem",
            query = originQuery,
            suggestions = originSuggestions,
            onQueryChanged = { originQuery = it; viewModel.onOriginChanged(it) },
            onSuggestionSelected = { originQuery = it.name; viewModel.onOriginSelected(it) },
            onUseCurrentLocation = {
                originQuery = "Minha Localização"
                viewModel.useCurrentLocationAsOrigin()
            }
        )
        AddressField(
            label = "Destino",
            query = destinationQuery,
            suggestions = destinationSuggestions,
            onQueryChanged = { destinationQuery = it; viewModel.onDestinationChanged(it) },
            onSuggestionSelected = { destinationQuery = it.name; viewModel.onDestinationSelected(it) }
        )
        TimeModeSelector(selected = timeMode, onModeSelected = viewModel::onTimeModeChanged)
        Button(onClick = viewModel::calculateRoute) {
            Text("Buscar rota")
        }
        if (uiState is RouteSearchUiState.Error) {
            Text((uiState as RouteSearchUiState.Error).message)
        }
        if (uiState is RouteSearchUiState.Loading) {
            Text("Calculando rota real...")
        }
    }
}
