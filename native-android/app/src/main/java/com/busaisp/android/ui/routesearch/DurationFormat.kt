package com.busaisp.android.ui.routesearch

/**
 * Formata minutos totais de viagem pra exibição — "45 min" abaixo de 1h,
 * "1h 20min" (ou só "2h" quando exato) a partir de 60min. Sem isto, uma
 * viagem de 90min aparecia como "90 min" cru em vez de "1h 30min".
 */
fun formatDurationMinutes(totalMinutes: Int): String {
    if (totalMinutes < 60) return "$totalMinutes min"
    val hours = totalMinutes / 60
    val minutes = totalMinutes % 60
    return if (minutes == 0) "${hours}h" else "${hours}h ${minutes}min"
}
