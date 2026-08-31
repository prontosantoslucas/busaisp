package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.routesearch.components.RouteStepRow

@Composable
fun RouteDetailScreen(
    planId: String,
    viewModel: RouteSearchViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize()) {
        IconButton(onClick = onBack) {
            Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
        }

        val state = uiState
        if (state !is RouteSearchUiState.Results) {
            Text("Resultado não disponível", modifier = Modifier.padding(16.dp))
            return
        }

        // planId chega como String pela navegação (não dá pra passar o RoutePlan
        // inteiro como argumento) — o plano de verdade é procurado no resultado
        // já calculado, que vive no RouteSearchViewModel compartilhado.
        val plan = (listOf(state.result.primaryRoute) + state.result.alternatives)
            .firstOrNull { it.id == planId }

        if (plan == null) {
            Text("Rota não encontrada", modifier = Modifier.padding(16.dp))
            return
        }

        // Índice incluído na key: dois passos estruturalmente idênticos em
        // sequência (ex.: duas caminhadas curtas seguidas) produziriam a mesma
        // "instruction + type" e derrubariam o LazyColumn (key duplicada não é
        // permitida).
        LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
            items(plan.steps.withIndex().toList(), key = { (index, step) -> "$index-${step.instruction}-${step.type}" }) { (_, step) ->
                RouteStepRow(step = step)
            }
        }
    }
}
