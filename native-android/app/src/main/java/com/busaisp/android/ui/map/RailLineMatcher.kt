package com.busaisp.android.ui.map

import java.text.Normalizer

// A SPTrans Olho Vivo (api/onibus?tipo=linhas, usada pela busca do mapa) só
// conhece ônibus — não existe posição de trem/metrô em tempo real pra
// mostrar no mapa. Buscar uma linha de trilho aqui não deveria voltar
// resultados de ônibus confusos (linhas cujo terminal só cita "METRÔ X" por
// coincidência) nem silêncio; deveria reconhecer a busca e apontar pra
// Trilhos, que mostra status real. Não depende de rede — é uma lista
// estática das 13 linhas reais de Metrô/CPTM de SP.
private data class RailLineRef(val displayName: String, val keywords: List<String>)

private val RAIL_LINES = listOf(
    RailLineRef("1-Azul", listOf("1-azul", "azul", "linha 1")),
    RailLineRef("2-Verde", listOf("2-verde", "verde", "linha 2")),
    RailLineRef("3-Vermelha", listOf("3-vermelha", "vermelha", "linha 3")),
    RailLineRef("4-Amarela", listOf("4-amarela", "amarela", "linha 4")),
    RailLineRef("5-Lilás", listOf("5-lilas", "lilas", "linha 5")),
    RailLineRef("15-Prata", listOf("15-prata", "prata", "linha 15")),
    RailLineRef("7-Rubi", listOf("7-rubi", "rubi", "linha 7")),
    RailLineRef("8-Diamante", listOf("8-diamante", "diamante", "linha 8")),
    RailLineRef("9-Esmeralda", listOf("9-esmeralda", "esmeralda", "linha 9")),
    RailLineRef("10-Turquesa", listOf("10-turquesa", "turquesa", "linha 10")),
    RailLineRef("11-Coral", listOf("11-coral", "coral", "linha 11")),
    RailLineRef("12-Safira", listOf("12-safira", "safira", "linha 12")),
    RailLineRef("13-Jade", listOf("13-jade", "jade", "linha 13"))
)

private val GENERIC_RAIL_TERMS = listOf("metro", "metrô", "cptm", "trem", "trilho")

private fun normalize(text: String): String =
    Normalizer.normalize(text.lowercase(), Normalizer.Form.NFD)
        .replace(Regex("\\p{Mn}+"), "")
        .trim()

/**
 * Se a busca claramente se refere a uma linha de Metrô/CPTM, retorna um nome
 * pra exibir (ex.: "1-Azul"); senão null. Deliberadamente conservador — só
 * combina nome/cor por extenso ou termos genéricos de trilho, nunca um
 * número isolado (que colidiria com códigos reais de linha de ônibus, ex.
 * buscar "13" não deveria sequestrar a busca de uma linha de ônibus 13xx).
 */
fun matchRailLine(query: String): String? {
    val normalized = normalize(query)
    if (normalized.length < 3) return null

    RAIL_LINES.forEach { line ->
        if (line.keywords.any { normalized.contains(it) }) return line.displayName
    }
    if (GENERIC_RAIL_TERMS.any { normalized.contains(it) }) return "Metrô/CPTM"
    return null
}
