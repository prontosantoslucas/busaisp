package com.busaisp.android.ui.settings

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.theme.ThemeMode
import com.busaisp.android.ui.theme.ThemeViewModel

@Composable
fun SettingsScreen(themeViewModel: ThemeViewModel = hiltViewModel()) {
    val themeMode by themeViewModel.themeMode.collectAsStateWithLifecycle()

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Sobre o BusaÍ SP", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            item {
                ThemeModeCard(current = themeMode, onSelect = themeViewModel::setThemeMode)
            }

            item {
                SettingsCard(
                    title = "BusaÍ SP — Mobilidade Urbana Nativa",
                    subtitle = "Versão 0.1.0 (Android Nativo)",
                    description = "Aplicativo de transporte público e mobilidade urbana em São Paulo desenvolvido em Kotlin + Jetpack Compose."
                )
            }

            item {
                SettingsCard(
                    title = "Fontes Oficiais de Dados",
                    subtitle = "Integração Direta em Tempo Real",
                    description = "• Ônibus e GPS ao Vivo: SPTrans Olho Vivo API\n• Metrô e CPTM: Direto dos Trens / feeds oficiais\n• Mapas e Rotas: OpenStreetMap, MapLibre GL e OSRM"
                )
            }

            item {
                SettingsCard(
                    title = "Privacidade e Armazenamento Local",
                    subtitle = "Sem Login / Sem Rastreamento em Nuvem",
                    description = "Seus endereços favoritados (Casa, Trabalho) e linhas salvas são armazenados exclusivamente na memória local do seu dispositivo via Android DataStore."
                )
            }

            item {
                SettingsCard(
                    title = "Princípio de Honestidade de Dados",
                    subtitle = "Transparência de Informação",
                    description = "O BusaÍ SP nunca fabrica dados de horários ou posições. Quando um ônibus não possui GPS ativo ou um trecho de metrô opera sob grade programada, isso é explicitamente informado na tela."
                )
            }
        }
    }
}

@Composable
private fun ThemeModeCard(current: ThemeMode, onSelect: (ThemeMode) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Text(text = "Aparência", style = MaterialTheme.typography.titleMedium)
        Text(
            text = "Sistema segue o tema claro/escuro do celular automaticamente",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(top = 2.dp, bottom = 10.dp)
        )
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ThemeModeOption("Sistema", ThemeMode.SISTEMA, current, onSelect, Modifier.weight(1f))
            ThemeModeOption("Claro", ThemeMode.CLARO, current, onSelect, Modifier.weight(1f))
            ThemeModeOption("Escuro", ThemeMode.ESCURO, current, onSelect, Modifier.weight(1f))
        }
    }
}

@Composable
private fun ThemeModeOption(
    label: String,
    mode: ThemeMode,
    current: ThemeMode,
    onSelect: (ThemeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    val selected = mode == current
    Column(
        modifier = modifier
            .background(
                if (selected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.background,
                RoundedCornerShape(10.dp)
            )
            .clickable { onSelect(mode) }
            .padding(vertical = 10.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.labelLarge,
            color = if (selected) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
private fun SettingsCard(title: String, subtitle: String, description: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .padding(14.dp)
    ) {
        Text(text = title, style = MaterialTheme.typography.titleMedium)
        Text(
            text = subtitle,
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
            modifier = Modifier.padding(top = 2.dp, bottom = 6.dp)
        )
        Text(text = description, style = MaterialTheme.typography.bodyMedium)
    }
}
