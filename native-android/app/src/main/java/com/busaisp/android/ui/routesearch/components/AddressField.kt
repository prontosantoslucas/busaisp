package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RouteLocation

@Composable
fun AddressField(
    label: String,
    query: String,
    suggestions: List<RouteLocation>,
    onQueryChanged: (String) -> Unit,
    onSuggestionSelected: (RouteLocation) -> Unit,
    onUseCurrentLocation: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChanged,
            label = { Text(label) },
            modifier = Modifier.fillMaxWidth()
        )
        if (onUseCurrentLocation != null) {
            TextButton(onClick = onUseCurrentLocation) {
                Text("Usar minha localização atual")
            }
        }
        if (suggestions.isNotEmpty()) {
            LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                // Índice incluído na key: duas sugestões com mesmo nome/lat/lng
                // (dado plausível vindo do backend) derrubariam o LazyColumn.
                items(suggestions.withIndex().toList(), key = { (index, s) -> "$index-${s.name}-${s.lat}-${s.lng}" }) { (_, suggestion) ->
                    Text(
                        text = suggestion.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSuggestionSelected(suggestion) }
                            .padding(vertical = 10.dp)
                    )
                }
            }
        }
    }
}
