package com.busaisp.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// Redesign 2026-09-01: tema único, sempre claro (a alternância automática com
// o tema do sistema foi removida a pedido do usuário — era parte do que fazia
// o mapa escuro isolado "destoar" do resto do app antes). `primary` é
// AppColors.UserLocationBlue, já existente no app (hoje usado pro ponto de
// localização do usuário no mapa) — reusado como acento de marca em vez de
// inventar um azul novo. Âmbar (LiveAmber) continua fora daqui, reservado só
// pra dado de GPS ao vivo de verdade (ver comentário em Color.kt).
private val AppLightColors = lightColorScheme(
    background = AppColors.BackgroundLight,
    surface = AppColors.SurfaceLight,
    primary = AppColors.UserLocationBlue,
    onPrimary = AppColors.SurfaceLight,
    onBackground = AppColors.BackgroundDark,
    onSurface = AppColors.BackgroundDark,
    error = AppColors.OffRouteRed,
    onError = AppColors.SurfaceLight
)

@Composable
fun BusaiSPTheme(
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = AppLightColors,
        typography = AppTypography,
        content = content
    )
}
