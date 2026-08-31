package com.busaisp.android.domain.model

data class Linha(
    val codigo: Int,
    val letreiro: String,
    val tipoLinha: Int,
    val terminalPrincipal: String,
    val terminalSecundario: String
)
