package com.busaisp.android.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LinhaDto(
    val cl: Int,
    val lc: Boolean,
    val lt: String,
    val tl: Int,
    val sl: Int,
    val tp: String,
    val ts: String
)

@JsonClass(generateAdapter = true)
data class LinhasResponseDto(
    val success: Boolean,
    val data: List<LinhaDto> = emptyList(),
    val isMock: Boolean = false,
    val error: String? = null
)
