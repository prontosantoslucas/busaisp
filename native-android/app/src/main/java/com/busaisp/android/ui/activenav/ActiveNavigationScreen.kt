package com.busaisp.android.ui.activenav

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
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
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.service.ActiveNavigationForegroundService
import com.busaisp.android.ui.map.LiveBusMap
import com.busaisp.android.ui.theme.AppColors

// Estado local da permissão de localização, checada nesta própria tela.
// ACCESS_FINE_LOCATION é obrigatória em runtime (minSdk 24+) pra
// LocationClient.observeLocation() não lançar SecurityException — ver
// contrato documentado em FusedLocationClient (data/location/LocationClient.kt).
// Diferente do MapScreen (onde o GPS é opcional pro mapa funcionar), aqui a
// permissão é indispensável: sem ela não existe rastreamento de percurso.
private enum class LocationPermissionStatus { CHECKING, GRANTED, DENIED }

private fun hasFineLocationPermission(context: android.content.Context): Boolean =
    ContextCompat.checkSelfPermission(
        context, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED

@Composable
fun ActiveNavigationScreen(
    plan: RoutePlan,
    viewModel: ActiveNavigationViewModel = hiltViewModel(),
    onEncerrar: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    var locationPermissionStatus by remember {
        mutableStateOf(
            if (hasFineLocationPermission(context)) LocationPermissionStatus.GRANTED
            else LocationPermissionStatus.CHECKING
        )
    }

    val locationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { granted ->
        locationPermissionStatus =
            if (granted) LocationPermissionStatus.GRANTED else LocationPermissionStatus.DENIED
    }

    LaunchedEffect(Unit) {
        if (locationPermissionStatus == LocationPermissionStatus.CHECKING) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }

    // POST_NOTIFICATIONS é uma permissão de runtime perigosa a partir do
    // Android 13 (API 33/TIRAMISU). Já está declarada no manifest (Tarefa 4),
    // mas isso só evita crash — sem essa solicitação em runtime, a notificação
    // persistente do ActiveNavigationForegroundService simplesmente não
    // aparece em API 33+ (o serviço continua rodando, só fica invisível pro
    // usuário). Mesmo padrão do MapScreen.kt pra ACCESS_FINE_LOCATION.
    val notificationPermissionLauncher = rememberLauncherForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { _ ->
        // Negada ou concedida, o percurso segue: o rastreamento de viagem não
        // depende da notificação ser visível. Se negada, a degradação é
        // honesta (serviço roda sem notificação visível), não um crash nem
        // dado falso.
    }

    // O rastreamento de verdade (LocationClient.observeLocation() dentro do
    // ViewModel) e o Foreground Service só começam quando a permissão de
    // localização está confirmadamente concedida — nunca antes. Chamar
    // viewModel.start(plan) sem isso derruba o app com SecurityException
    // (fusedClient.requestLocationUpdates exige ACCESS_FINE_LOCATION em
    // runtime). E não faz sentido subir a notificação persistente do serviço
    // pra uma viagem que não está sendo rastreada de verdade.
    DisposableEffect(plan.id, locationPermissionStatus) {
        val isTracking = locationPermissionStatus == LocationPermissionStatus.GRANTED
        if (isTracking) {
            viewModel.start(plan)
            ActiveNavigationForegroundService.start(context)
        }
        onDispose {
            if (isTracking) {
                viewModel.stop()
                ActiveNavigationForegroundService.stop(context)
            }
        }
    }

    DisposableEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            val hasNotificationPermission = ContextCompat.checkSelfPermission(
                context, Manifest.permission.POST_NOTIFICATIONS
            ) == PackageManager.PERMISSION_GRANTED
            if (!hasNotificationPermission) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }
        onDispose { }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        if (locationPermissionStatus == LocationPermissionStatus.DENIED) {
            // Degradação honesta: sem permissão de localização não existe
            // rastreamento possível. Nada de tela em branco nem de simular
            // progresso — o usuário precisa entender por que a viagem não
            // está sendo acompanhada e ter como voltar.
            Column(
                modifier = Modifier
                    .align(Alignment.Center)
                    .padding(24.dp)
            ) {
                Text(
                    text = "Permissão de localização necessária",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "Para acompanhar seu percurso em tempo real, o app precisa de acesso à sua localização. " +
                        "Sem essa permissão não é possível saber quando você embarcou ou se desviou da rota.",
                    modifier = Modifier.padding(top = 8.dp)
                )
                Button(onClick = onEncerrar, modifier = Modifier.padding(top = 16.dp)) {
                    Text("Voltar")
                }
            }
            return@Box
        }

        LiveBusMap(vehicles = emptyList(), userLocation = null, modifier = Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                .padding(16.dp)
        ) {
            if (locationPermissionStatus == LocationPermissionStatus.CHECKING) {
                Text(
                    text = "Verificando permissão de localização…",
                    style = MaterialTheme.typography.titleMedium
                )
            } else {
                val statusText = when {
                    uiState.isOffRoute -> "Fora da rota planejada"
                    uiState.hasBoarded -> "A bordo — ${uiState.lineDisplay}"
                    else -> "Aguardando embarque — ${uiState.lineDisplay}"
                }
                val statusColor = when {
                    uiState.isOffRoute -> AppColors.OffRouteRed
                    uiState.hasBoarded -> AppColors.OnRouteEmerald
                    else -> AppColors.LiveAmber
                }
                Text(text = statusText, color = statusColor, style = MaterialTheme.typography.titleMedium)
                Text(text = "Destino: ${uiState.destinationName}")
            }
            Button(onClick = onEncerrar, modifier = Modifier.padding(top = 12.dp)) {
                Text("Encerrar percurso")
            }
        }
    }
}
