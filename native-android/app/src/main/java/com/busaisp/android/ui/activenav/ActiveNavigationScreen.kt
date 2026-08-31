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

@Composable
fun ActiveNavigationScreen(
    plan: RoutePlan,
    viewModel: ActiveNavigationViewModel = hiltViewModel(),
    onEncerrar: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

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

    LaunchedEffect(plan.id) {
        viewModel.start(plan)
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
        ActiveNavigationForegroundService.start(context)
        onDispose {
            viewModel.stop()
            ActiveNavigationForegroundService.stop(context)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LiveBusMap(vehicles = emptyList(), userLocation = null, modifier = Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                .padding(16.dp)
        ) {
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
            Button(onClick = onEncerrar, modifier = Modifier.padding(top = 12.dp)) {
                Text("Encerrar percurso")
            }
        }
    }
}
