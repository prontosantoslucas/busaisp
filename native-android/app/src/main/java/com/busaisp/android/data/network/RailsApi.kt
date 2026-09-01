package com.busaisp.android.data.network

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass
import retrofit2.http.GET

@JsonClass(generateAdapter = true)
data class RailLineDto(
    val id: String,
    val name: String,
    val number: String,
    val colorName: String,
    val hexColor: String,
    val operator: String,
    val status: String,
    val statusText: String,
    val description: String?,
    val updatedAt: String
)

@JsonClass(generateAdapter = true)
data class RailsSummaryDto(
    val total: Int,
    val normal: Int,
    val withIssues: Int,
    val lastChecked: String,
    val source: String
)

@JsonClass(generateAdapter = true)
data class RailsDataDto(
    val lines: List<RailLineDto>,
    val summary: RailsSummaryDto,
    val lastChecked: String?,
    val source: String?
)

@JsonClass(generateAdapter = true)
data class RailsStatusResponseDto(
    val success: Boolean,
    val data: RailsDataDto?,
    val error: String?,
    val timestamp: String?
)

interface RailsApi {
    @GET("api/trilhos/status")
    suspend fun getRailsStatus(): RailsStatusResponseDto
}
