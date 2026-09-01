package com.busaisp.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

// `primary` NÃO é AppColors.LiveAmber de propósito: âmbar está reservado só
// pra dado de GPS ao vivo (ver comentário em Color.kt). Como primary pinta
// botão/foco de campo/indicador de seleção em toda tela do Material, usar
// LiveAmber ali vazava esse significado pra lugares sem GPS nenhum (Notícias,
// Configurações, Navegação Ativa). Em vez de inventar uma cor nova, reusa o
// par de neutros de alto contraste que já define a identidade "painel de
// estação real" do app — o primary vira uma cor "tinta" (ink), não uma cor
// de marca colorida.
private val DarkColors = darkColorScheme(
    background = AppColors.BackgroundDark,
    surface = AppColors.SurfaceDark,
    primary = AppColors.SurfaceLight,
    onPrimary = AppColors.BackgroundDark,
    onBackground = AppColors.SurfaceLight,
    onSurface = AppColors.SurfaceLight
)

private val LightColors = lightColorScheme(
    background = AppColors.BackgroundLight,
    surface = AppColors.SurfaceLight,
    primary = AppColors.BackgroundDark,
    onPrimary = AppColors.SurfaceLight,
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
