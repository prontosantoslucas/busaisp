package com.busaisp.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    background = AppColors.BackgroundDark,
    surface = AppColors.SurfaceDark,
    primary = AppColors.LiveAmber,
    onBackground = AppColors.SurfaceLight,
    onSurface = AppColors.SurfaceLight
)

private val LightColors = lightColorScheme(
    background = AppColors.BackgroundLight,
    surface = AppColors.SurfaceLight,
    primary = AppColors.LiveAmber,
    onBackground = AppColors.BackgroundDark,
    onSurface = AppColors.BackgroundDark
)

@Composable
fun BusaiSPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        content = content
    )
}
