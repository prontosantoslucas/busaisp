package com.busaisp.android.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class RouteLocationDto(
    val name: String,
    val addressDetails: String? = null,
    val lat: Double,
    val lng: Double
)

@JsonClass(generateAdapter = true)
data class StopPointDto(
    val name: String,
    val lat: Double,
    val lng: Double
)

@JsonClass(generateAdapter = true)
data class RouteStepDto(
    val type: String,
    val instruction: String,
    val durationMinutes: Double,
    val distanceMeters: Double,
    val busLine: String? = null,
    val busDestination: String? = null,
    val boardStopName: String? = null,
    val alightStopName: String? = null,
    val stopCount: Int? = null,
    val intermediateStops: List<StopPointDto>? = null,
    val nextBusEtaMinutes: Double? = null,
    val departureEtas: List<Double>? = null,
    val accuracyLevel: String? = null
)

@JsonClass(generateAdapter = true)
data class PolylineDto(
    val walkToStop: List<List<Double>>,
    val transit: List<List<Double>>,
    val walkToDest: List<List<Double>>
)

@JsonClass(generateAdapter = true)
data class RoutePlanDto(
    val id: String,
    val origin: RouteLocationDto,
    val destination: RouteLocationDto,
    val totalDurationMinutes: Double,
    val totalDistanceMeters: Double,
    val totalWalkDistanceMeters: Double,
    val totalWalkDurationMinutes: Double,
    val totalEstimatedSteps: Int,
    val departureHour: String,
    val arrivalHour: String,
    val transferCount: Int,
    val nextBusEtaMinutes: Double,
    val departureEtas: List<Double>,
    val departureSuggestion: String,
    val farePrice: String,
    val fareType: String,
    val carbonGrams: Double,
    val accuracyLevel: String,
    val lastTelemetryText: String,
    val trafficStatus: String,
    val trafficDelayMinutes: Double,
    val mode: String? = null,
    val arrivalTimeUnreachable: Boolean? = null,
    val recommendedLine: LinhaDto,
    val polyline: PolylineDto,
    val steps: List<RouteStepDto>
)

@JsonClass(generateAdapter = true)
data class RouteSearchResultDto(
    val primaryRoute: RoutePlanDto,
    val alternatives: List<RoutePlanDto>
)

@JsonClass(generateAdapter = true)
data class RouteSearchResponseDto(
    val success: Boolean,
    val data: RouteSearchResultDto? = null,
    val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AddressSuggestionsResponseDto(
    val success: Boolean,
    val data: List<RouteLocationDto> = emptyList(),
    val error: String? = null
)
