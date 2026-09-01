package com.busaisp.android.ui.map

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.LocalFireDepartment
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.map.components.FloatingPillButton
import com.busaisp.android.ui.map.components.LineSearchBar
import com.busaisp.android.ui.map.components.VehicleDetailSheet
import com.busaisp.android.ui.theme.AppColors

@Composable
fun MapScreen(
    viewModel: MapViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val searchResults by viewModel.lineSearchResults.collectAsStateWithLifecycle()
    val userLocation by viewModel.userLocation.collectAsStateWithLifecycle()
    val isHeatmapVisible by viewModel.isHeatmapVisible.collectAsStateWithLifecycle()
    val heatmapData by viewModel.heatmapData.collectAsStateWithLifecycle()
    val isLoadingHeatmap by viewModel.isLoadingHeatmap.collectAsStateWithLifecycle()

    var query by remember { mutableStateOf("") }
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        if (granted) {
            viewModel.onLocationPermissionGranted()
        }
    }

    val vehicles: List<Vehicle> = (uiState as? MapUiState.WithVehicles)?.vehicles ?: emptyList()

    Box(modifier = Modifier.fillMaxSize()) {
        LiveBusMap(
            vehicles = vehicles,
            userLocation = userLocation,
            heatmapData = heatmapData,
            isHeatmapVisible = isHeatmapVisible,
            modifier = Modifier.fillMaxSize()
        )

        LineSearchBar(
            query = query,
            results = searchResults,
            onQueryChanged = {
                query = it
                viewModel.onSearchQueryChanged(it)
            },
            onLineSelected = {
                query = it.letreiro
                viewModel.onLineSelected(it)
            },
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(16.dp)
        )

        // Banner informativo do Radar de Calor quando ativo
        if (isHeatmapVisible && heatmapData != null) {
            val status = heatmapData?.cityStatus ?: TrafficHotspotStatus.FLUINDO
            val (statusText, statusColor) = when (status) {
                TrafficHotspotStatus.CRITICO -> "Trânsito Crítico em SP" to Color(0xFFEF4444)
                TrafficHotspotStatus.INTENSO -> "Trânsito Intenso em SP" to Color(0xFFF97316)
                TrafficHotspotStatus.MODERADO -> "Trânsito Moderado" to Color(0xFFF59E0B)
                TrafficHotspotStatus.FLUINDO -> "Trânsito Fluindo Bem" to Color(0xFF10B981)
            }

            Box(
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 80.dp)
                    .background(AppColors.SurfaceDark.copy(alpha = 0.92f), RoundedCornerShape(20.dp))
                    .padding(horizontal = 16.dp, vertical = 8.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .background(statusColor, RoundedCornerShape(5.dp))
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = "$statusText (${heatmapData?.totalCongestionKm} km) · ${heatmapData?.lastUpdated}",
                        color = AppColors.SurfaceLight,
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }

        // Controles flutuantes na lateral direita inferior (acima da barra de informações)
        Column(
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(bottom = 90.dp, end = 16.dp),
            horizontalAlignment = Alignment.End
        ) {
            // Botão Radar de Calor de Congestionamento
            FloatingPillButton(
                icon = Icons.Filled.LocalFireDepartment,
                contentDescription = if (isHeatmapVisible) "Ocultar radar de trânsito" else "Exibir radar de trânsito",
                containerColor = if (isHeatmapVisible) Color(0xFFEF4444) else MaterialTheme.colorScheme.surface,
                contentColor = if (isHeatmapVisible) Color.White else Color(0xFFEF4444),
                onClick = { viewModel.toggleTrafficHeatmap() }
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Botão Localização Atual — pulso de radar contínuo reforça que é
            // uma ação "ao vivo", na mesma cor do ponto do usuário no mapa.
            FloatingPillButton(
                icon = Icons.Filled.MyLocation,
                contentDescription = "Localização atual",
                showRadarPulse = true,
                radarPulseColor = AppColors.UserLocationBlue,
                onClick = {
                    val hasPermission = ContextCompat.checkSelfPermission(
                        context, Manifest.permission.ACCESS_FINE_LOCATION
                    ) == PackageManager.PERMISSION_GRANTED
                    if (hasPermission) {
                        viewModel.onLocationPermissionGranted()
                    } else {
                        permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                    }
                }
            )
        }

        if (uiState is MapUiState.Error) {
            Text(
                text = (uiState as MapUiState.Error).message,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 100.dp)
            )
        }

        VehicleDetailSheet(
            linha = (uiState as? MapUiState.WithVehicles)?.linha,
            vehicleCount = vehicles.size,
            isStale = (uiState as? MapUiState.WithVehicles)?.isStale ?: false,
            modifier = Modifier.align(Alignment.BottomStart)
        )
    }
}
