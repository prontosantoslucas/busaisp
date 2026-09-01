package com.busaisp.android.ui.rails

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccessTime
import androidx.compose.material.icons.filled.Block
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.HelpOutline
import androidx.compose.material.icons.filled.Nightlight
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.RailLine
import com.busaisp.android.domain.model.RailStatusType
import com.busaisp.android.domain.model.RailsData
import com.busaisp.android.ui.theme.AppColors

@Composable
fun RailsScreen(
    viewModel: RailsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(bottom = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Direto dos Trilhos", style = MaterialTheme.typography.titleLarge)
            IconButton(onClick = viewModel::refresh) {
                Icon(Icons.Filled.Refresh, contentDescription = "Atualizar status dos trilhos")
            }
        }

        when (val state = uiState) {
            is RailsUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is RailsUiState.Error -> {
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
            is RailsUiState.Success -> {
                RailsContent(data = state.data)
            }
        }
    }
}

@Composable
private fun RailsContent(data: RailsData) {
    LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        item {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
                    .padding(12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Resumo das Linhas", style = MaterialTheme.typography.titleMedium)
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .background(AppColors.OnRouteEmerald, CircleShape)
                        )
                        Text(
                            text = " Atualizado às ${data.summary.lastChecked} · ${data.summary.source}",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.65f)
                        )
                    }
                }
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        "${data.summary.normal} normais",
                        color = AppColors.OnRouteEmerald,
                        style = MaterialTheme.typography.labelLarge
                    )
                    if (data.summary.withIssues > 0) {
                        Text(
                            " · ${data.summary.withIssues} atenção",
                            color = AppColors.LiveAmber,
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                }
            }
        }

        items(data.lines, key = { it.id }) { line ->
            RailLineCard(line = line)
        }
    }
}

@Composable
private fun RailLineCard(line: RailLine) {
    val parsedColor = runCatching {
        val clean = line.hexColor.removePrefix("#")
        val full = if (clean.length == 6) "FF$clean" else clean
        Color(full.toLong(16))
    }.getOrDefault(MaterialTheme.colorScheme.primary)

    val isLightColor = (0.299 * parsedColor.red + 0.587 * parsedColor.green + 0.114 * parsedColor.blue) > 0.65
    val numberTextColor = if (isLightColor) Color.Black else Color.White

    val (statusColor, statusIcon) = when (line.status) {
        RailStatusType.NORMAL -> AppColors.OnRouteEmerald to Icons.Filled.CheckCircle
        RailStatusType.VELOCIDADE_REDUZIDA -> AppColors.LiveAmber to Icons.Filled.AccessTime
        RailStatusType.OPERACAO_PARCIAL -> Color(0xFFEA580C) to Icons.Filled.Warning
        RailStatusType.PARALISADA -> AppColors.OffRouteRed to Icons.Filled.Block
        RailStatusType.ENCERRADA -> AppColors.NoDataGray to Icons.Filled.Nightlight
        RailStatusType.DESCONHECIDO -> AppColors.NoDataGray to Icons.Filled.HelpOutline
    }

    val isNormal = line.status == RailStatusType.NORMAL

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(32.dp)
                        .clip(CircleShape)
                        .background(parsedColor),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = line.number,
                        color = numberTextColor,
                        style = MaterialTheme.typography.titleMedium
                    )
                }
                Column(modifier = Modifier.padding(start = 10.dp)) {
                    Text(line.name, style = MaterialTheme.typography.titleMedium)
                    Text(line.operator.name, style = MaterialTheme.typography.bodySmall)
                }
            }

            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = statusIcon,
                    contentDescription = line.statusText,
                    tint = statusColor,
                    modifier = Modifier.size(18.dp)
                )
                Text(
                    text = line.statusText,
                    color = statusColor,
                    style = MaterialTheme.typography.labelLarge,
                    modifier = Modifier.padding(start = 6.dp)
                )
            }
        }

        if (!line.description.isNullOrEmpty() && !isNormal) {
            Text(
                text = line.description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f),
                modifier = Modifier.padding(top = 8.dp)
            )
        }
    }
}
