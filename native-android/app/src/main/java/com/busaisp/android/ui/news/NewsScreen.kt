package com.busaisp.android.ui.news

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.NewsItem
import com.busaisp.android.domain.model.NewsSourceType

@Composable
fun NewsScreen(
    viewModel: NewsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val selectedFilter by viewModel.selectedFilter.collectAsStateWithLifecycle()
    val filteredNews by viewModel.filteredNews.collectAsStateWithLifecycle()
    val selectedNewsItem by viewModel.selectedNewsItem.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Avisos & Notícias", style = MaterialTheme.typography.titleLarge)
            IconButton(onClick = viewModel::refresh) {
                Icon(Icons.Filled.Refresh, contentDescription = "Atualizar notícias")
            }
        }

        // Categorias de filtro
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState())
                .padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            NewsSourceType.values().forEach { filter ->
                val label = when (filter) {
                    NewsSourceType.ALL -> "Todas"
                    NewsSourceType.TRANSITO -> "Trânsito"
                    NewsSourceType.TRILHOS -> "Trilhos"
                    NewsSourceType.SPTRANS -> "SPTrans"
                    NewsSourceType.INFORMATIVOS -> "Guias"
                }
                FilterChip(
                    selected = selectedFilter == filter,
                    onClick = { viewModel.setFilter(filter) },
                    label = { Text(label) }
                )
            }
        }

        when (val state = uiState) {
            is NewsUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is NewsUiState.Error -> {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.Center,
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(state.message, style = MaterialTheme.typography.bodyLarge)
                    Button(onClick = viewModel::refresh, modifier = Modifier.padding(top = 16.dp)) {
                        Text("Tentar novamente")
                    }
                }
            }
            is NewsUiState.Success -> {
                if (filteredNews.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Nenhum aviso encontrado para esta categoria.")
                    }
                } else {
                    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        items(filteredNews, key = { it.id }) { item ->
                            NewsCard(item = item, onClick = { viewModel.openNewsDetail(item) })
                        }
                    }
                }
            }
        }
    }

    // Leitor detalhado de notícia
    selectedNewsItem?.let { item ->
        AlertDialog(
            onDismissRequest = viewModel::closeNewsDetail,
            title = { Text(item.title) },
            text = {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .verticalScroll(rememberScrollState())
                ) {
                    Text(
                        text = "${item.source} · ${item.timestamp}",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    Text(
                        text = item.fullContent ?: item.description,
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = viewModel::closeNewsDetail) {
                    Text("Fechar")
                }
            }
        )
    }
}

@Composable
private fun NewsCard(item: NewsItem, onClick: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = item.badge.label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                text = item.timestamp,
                style = MaterialTheme.typography.bodySmall
            )
        }

        Text(
            text = item.title,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(top = 6.dp)
        )

        if (!item.subtitle.isNullOrEmpty()) {
            Text(
                text = item.subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        Text(
            text = item.description,
            style = MaterialTheme.typography.bodySmall,
            modifier = Modifier.padding(top = 6.dp)
        )
    }
}
