package com.busaisp.android.ui.map

import android.Manifest
import android.content.pm.PackageManager
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.core.content.ContextCompat
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.map.components.FloatingPillButton
import com.busaisp.android.ui.map.components.LineSearchBar
import com.busaisp.android.ui.map.components.VehicleDetailSheet

@Composable
fun MapScreen(
    viewModel: MapViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val searchResults by viewModel.lineSearchResults.collectAsState()
    val userLocation by viewModel.userLocation.collectAsStateWithLifecycle()
    var query by remember { mutableStateOf("") }
    val context = LocalContext.current

    val permissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted -> if (granted) viewModel.onLocationPermissionGranted() }

    val vehicles: List<Vehicle> = (uiState as? MapUiState.WithVehicles)?.vehicles ?: emptyList()

    Box(modifier = Modifier.fillMaxSize()) {
        LiveBusMap(
            vehicles = vehicles,
            userLocation = userLocation,
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

        FloatingPillButton(
            icon = Icons.Filled.MyLocation,
            contentDescription = "Localização atual",
            onClick = {
                val hasPermission = ContextCompat.checkSelfPermission(
                    context, Manifest.permission.ACCESS_FINE_LOCATION
                ) == PackageManager.PERMISSION_GRANTED
                if (hasPermission) {
                    viewModel.onLocationPermissionGranted()
                } else {
                    permissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
                }
            },
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
        )

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
