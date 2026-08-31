package com.busaisp.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class VeiculoDto(
    val p: String,
    val a: Boolean,
    val ta: String,
    val py: Double,
    val px: Double,
    val heading: Double? = null,
    val speed: Double? = null,
    val destination: String? = null,
    val direction: Int? = null
)

@JsonClass(generateAdapter = true)
data class PosicaoLinhaDto(
    val hr: String,
    val vs: List<VeiculoDto>
)

@JsonClass(generateAdapter = true)
data class PosicaoResponseDto(
    val success: Boolean,
    val data: PosicaoLinhaDto?,
    val isMock: Boolean = false,
    val error: String? = null
)
