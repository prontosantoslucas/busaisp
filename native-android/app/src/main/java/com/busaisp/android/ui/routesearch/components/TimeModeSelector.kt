package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.data.repository.RouteTimeMode

@Composable
fun TimeModeSelector(
    selected: RouteTimeMode,
    onModeSelected: (RouteTimeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(modifier = modifier.padding(vertical = 8.dp)) {
        FilterChip(
            selected = selected is RouteTimeMode.Now,
            onClick = { onModeSelected(RouteTimeMode.Now) },
            label = { Text("Agora") }
        )
        FilterChip(
            selected = selected is RouteTimeMode.DepartIn,
            onClick = { onModeSelected(RouteTimeMode.DepartIn(15)) },
            label = { Text("Partir em 15 min") }
        )
        FilterChip(
            selected = selected is RouteTimeMode.ArriveBy,
            onClick = { onModeSelected(RouteTimeMode.ArriveBy("18:00")) },
            label = { Text("Chegar até 18:00") }
        )
    }
}
