package com.busaisp.android.ui.settings

import androidx.compose.foundation.background
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@Composable
fun SettingsScreen() {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Sobre o BusaÍ SP", style = MaterialTheme.typography.titleLarge, modifier = Modifier.padding(bottom = 16.dp))

        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
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
