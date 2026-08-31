package com.busaisp.android.ui.map.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.Linha

@Composable
fun LineSearchBar(
    query: String,
    results: List<Linha>,
    onQueryChanged: (String) -> Unit,
    onLineSelected: (Linha) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
            .padding(8.dp)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChanged,
            placeholder = { Text("Buscar linha (ex: 1703)") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = if (results.isNotEmpty()) 8.dp else 0.dp)
        )
        if (results.isNotEmpty()) {
            LazyColumn {
                items(results, key = { it.codigo }) { linha ->
                    Text(
                        text = "${linha.letreiro} — ${linha.terminalPrincipal} / ${linha.terminalSecundario}",
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onLineSelected(linha) }
                            .padding(vertical = 10.dp)
                    )
                }
            }
        }
    }
}
