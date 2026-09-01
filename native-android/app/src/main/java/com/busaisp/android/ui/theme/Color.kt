package com.busaisp.android.ui.theme

import androidx.compose.ui.graphics.Color

// Cores oficiais das linhas de Metrô/CPTM de São Paulo — a identidade visual
// do app nasce do sistema de transporte real, não de uma paleta de marca genérica.
object LineColors {
    val MetroLinha1Azul = Color(0xFF0459A4)
    val MetroLinha2Verde = Color(0xFF00854B)
    val MetroLinha3Vermelha = Color(0xFFEB0027)
    val MetroLinha4Amarela = Color(0xFFFFD40E)
    val MetroLinha5Lilas = Color(0xFF9B45A6)
    val MetroLinha15Prata = Color(0xFF989A9C)
    val CptmLinha7Rubi = Color(0xFF9D5116)
    val CptmLinha8Diamante = Color(0xFF8A8D8F)
    val CptmLinha9Esmeralda = Color(0xFF008074)
    val CptmLinha10Turquesa = Color(0xFF00A0A6)
    val CptmLinha11Coral = Color(0xFFF06D06)
    val CptmLinha12Safira = Color(0xFF003DA5)
    val CptmLinha13Jade = Color(0xFF8DC63F)
}

// Base neutra dark-first (preto quase-preto, nunca puro) + contraparte clara
// em off-white quente. Âmbar mantém a convenção já validada no app web:
// "âmbar = dado de GPS ao vivo".
object AppColors {
    val BackgroundDark = Color(0xFF0B0A14)
    val SurfaceDark = Color(0xFF161520)
    val BackgroundLight = Color(0xFFFAF7F2)
    val SurfaceLight = Color(0xFFFFFFFF)

    val LiveAmber = Color(0xFFF5A623)
    val OnRouteEmerald = Color(0xFF10B981)
    val OffRouteRed = Color(0xFFEF4444)
    val NoDataGray = Color(0xFF6B7280)

    val UserLocationBlue = Color(0xFF3B82F6)
}
