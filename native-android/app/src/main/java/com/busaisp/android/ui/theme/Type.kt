package com.busaisp.android.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.busaisp.android.R

val IBMPlexSans = FontFamily(
    Font(R.font.ibm_plex_sans_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_sans_medium, FontWeight.Medium),
    Font(R.font.ibm_plex_sans_semibold, FontWeight.SemiBold)
)

val IBMPlexMono = FontFamily(
    Font(R.font.ibm_plex_mono_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_mono_medium, FontWeight.Medium)
)

// Estilo dedicado para ETAs/contadores/códigos de linha — evoca painéis reais
// de ponto de ônibus/estação, não é decorativo.
val EtaCounterStyle = TextStyle(
    fontFamily = IBMPlexMono,
    fontWeight = FontWeight.Medium,
    fontSize = 20.sp
)

val AppTypography = Typography(
    bodyLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Normal, fontSize = 14.sp),
    titleLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    titleMedium = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.SemiBold, fontSize = 18.sp),
    labelLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Medium, fontSize = 14.sp)
)
