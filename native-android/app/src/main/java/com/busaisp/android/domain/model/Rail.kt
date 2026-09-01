package com.busaisp.android.domain.model

enum class RailOperator { METRO, CPTM, VIAQUATRO, VIAMOBILIDADE }

enum class RailStatusType {
    NORMAL,
    VELOCIDADE_REDUZIDA,
    OPERACAO_PARCIAL,
    PARALISADA,
    ENCERRADA,
    DESCONHECIDO
}

data class RailLine(
    val id: String,
    val name: String,
    val number: String,
    val colorName: String,
    val hexColor: String,
    val operator: RailOperator,
    val status: RailStatusType,
    val statusText: String,
    val description: String?,
    val updatedAt: String
)

data class RailsSummary(
    val total: Int,
    val normal: Int,
    val withIssues: Int,
    val lastChecked: String,
    val source: String
)

data class RailsData(
    val lines: List<RailLine>,
    val summary: RailsSummary
)
