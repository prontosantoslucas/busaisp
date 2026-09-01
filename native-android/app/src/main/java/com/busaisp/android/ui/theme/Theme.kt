package com.busaisp.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

// Redesign 2026-09-01 (azul claro + branco): `primary` é AppColors.UserLocationBlue,
// já existente no app (usado pro ponto de localização do usuário no mapa) —
// reusado como acento de marca nos dois esquemas em vez de inventar uma cor
// nova. Âmbar (LiveAmber) fica fora daqui, reservado só pra dado de GPS ao
// vivo de verdade (ver comentário em Color.kt).
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

private val AppDarkColors = darkColorScheme(
    background = AppColors.BackgroundDark,
    surface = AppColors.SurfaceDark,
    primary = AppColors.UserLocationBlue,
    onPrimary = AppColors.SurfaceLight,
    onBackground = AppColors.SurfaceLight,
    onSurface = AppColors.SurfaceLight,
    error = AppColors.OffRouteRed,
    onError = AppColors.SurfaceLight
)

/**
 * Resolve o [ThemeMode] salvo pra um booleano de tema escuro: SISTEMA segue
 * [isSystemInDarkTheme], CLARO/ESCURO são explícitos e ignoram o sistema.
 */
@Composable
fun resolveDarkTheme(mode: ThemeMode): Boolean = when (mode) {
    ThemeMode.SISTEMA -> isSystemInDarkTheme()
    ThemeMode.CLARO -> false
    ThemeMode.ESCURO -> true
}

@Composable
fun BusaiSPTheme(
    themeViewModel: ThemeViewModel = hiltViewModel(),
    content: @Composable () -> Unit
) {
    val themeMode by themeViewModel.themeMode.collectAsStateWithLifecycle()
    val darkTheme = resolveDarkTheme(themeMode)

    MaterialTheme(
        colorScheme = if (darkTheme) AppDarkColors else AppLightColors,
        typography = AppTypography,
        content = content
    )
}
