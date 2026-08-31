package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.RouteStep
import com.busaisp.android.domain.model.RouteStepType

@Composable
fun RouteStepRow(step: RouteStep, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth().padding(vertical = 10.dp)) {
        Text(text = step.instruction, style = MaterialTheme.typography.bodyLarge)
        val detail = when (step.type) {
            RouteStepType.WALK -> "${step.durationMinutes} min caminhando"
            RouteStepType.BUS -> "Ônibus ${step.busLine ?: ""} · ${step.stopCount ?: 0} paradas"
            RouteStepType.RAIL -> "Trilho ${step.busLine ?: ""} · horário programado, não GPS ao vivo"
            RouteStepType.DESTINATION -> "Chegada ao destino"
            RouteStepType.UNKNOWN -> ""
        }
        Text(text = detail, style = MaterialTheme.typography.bodyMedium)
        // Honestidade sobre a origem do dado — nunca disfarçar horário
        // programado como GPS ao vivo (mesma regra do resto do projeto).
        if (step.accuracyLevel != RouteAccuracy.HIGH && step.type != RouteStepType.WALK) {
            Text(
                text = when (step.accuracyLevel) {
                    RouteAccuracy.MEDIUM -> "Baseado em histórico, não GPS ao vivo"
                    RouteAccuracy.ESTIMATED -> "Estimado — sem dado ao vivo disponível"
                    else -> ""
                },
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}
