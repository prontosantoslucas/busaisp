package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.routesearch.components.AddressField
import com.busaisp.android.ui.routesearch.components.TimeModeSelector

@Composable
fun RouteSearchScreen(
    viewModel: RouteSearchViewModel = hiltViewModel(),
    onRouteCalculated: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val originSuggestions by viewModel.originSuggestions.collectAsState()
    val destinationSuggestions by viewModel.destinationSuggestions.collectAsState()
    val timeMode by viewModel.timeMode.collectAsStateWithLifecycle()

    var originQuery by remember { mutableStateOf("") }
    var destinationQuery by remember { mutableStateOf("") }

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
