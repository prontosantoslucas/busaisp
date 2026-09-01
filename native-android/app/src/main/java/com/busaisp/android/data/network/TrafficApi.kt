package com.busaisp.android.data.network

import com.squareup.moshi.JsonClass
import retrofit2.http.GET
import retrofit2.http.Query

@JsonClass(generateAdapter = true)
data class TrafficIncidentDto(
    val id: String,
    val type: String,
    val subtype: String? = null,
    val title: String,
    val description: String,
    val street: String,
    val neighborhood: String,
    val lat: Double,
    val lng: Double,
    val severity: String,
    val delaySeconds: Int? = null,
    val source: String? = null,
    val updatedAt: String? = null
)

@JsonClass(generateAdapter = true)
data class TrafficIncidentsSummaryDto(
    val total: Int = 0,
    val accidents: Int = 0,
    val police: Int = 0,
    val construction: Int = 0,
    val jams: Int = 0,
    val hazards: Int = 0
)

@JsonClass(generateAdapter = true)
data class TrafficIncidentsDataDto(
    val incidents: List<TrafficIncidentDto> = emptyList(),
    val summary: TrafficIncidentsSummaryDto = TrafficIncidentsSummaryDto(),
    val lastUpdated: String? = null
)

@JsonClass(generateAdapter = true)
data class TrafficApiResponseDto(
    val success: Boolean,
    val data: TrafficIncidentsDataDto?,
    val error: String? = null,
    val timestamp: String? = null
)

interface TrafficApi {
    @GET("api/transito/incidentes")
    suspend fun getTrafficIncidents(
        @Query("lat") lat: Double = -23.55,
        @Query("lng") lng: Double = -46.63,
        @Query("radius") radius: Double = 25.0
    ): TrafficApiResponseDto
}
