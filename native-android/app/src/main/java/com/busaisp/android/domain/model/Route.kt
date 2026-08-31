package com.busaisp.android.domain.model

data class RouteLocation(
    val name: String,
    val addressDetails: String?,
    val lat: Double,
    val lng: Double
)

enum class RouteStepType { WALK, BUS, RAIL, DESTINATION, UNKNOWN }

enum class RouteAccuracy { HIGH, MEDIUM, ESTIMATED, UNKNOWN }

data class RouteStep(
    val type: RouteStepType,
    val instruction: String,
    val durationMinutes: Int,
    val distanceMeters: Int,
    val busLine: String?,
    val busDestination: String?,
    val boardStopName: String?,
    val alightStopName: String?,
    val stopCount: Int?,
    val nextBusEtaMinutes: Int?,
    val accuracyLevel: RouteAccuracy
)

data class RoutePlan(
    val id: String,
    val origin: RouteLocation,
    val destination: RouteLocation,
    val totalDurationMinutes: Int,
    val transferCount: Int,
    val departureHour: String,
    val arrivalHour: String,
    val farePrice: String,
    val trafficStatus: String,
    val isRail: Boolean,
    val arrivalTimeUnreachable: Boolean,
    val accuracyLevel: RouteAccuracy,
    val steps: List<RouteStep>
)

data class RouteSearchResult(
    val primaryRoute: RoutePlan,
    val alternatives: List<RoutePlan>
)

// Conversão honesta de string solta (vinda do backend) para enum — nunca
// lança exceção em valor inesperado, cai em UNKNOWN em vez de crashar.
fun parseRouteStepType(raw: String): RouteStepType =
    runCatching { RouteStepType.valueOf(raw) }.getOrDefault(RouteStepType.UNKNOWN)

fun parseRouteAccuracy(raw: String?): RouteAccuracy =
    raw?.let { runCatching { RouteAccuracy.valueOf(it) }.getOrDefault(RouteAccuracy.UNKNOWN) }
        ?: RouteAccuracy.UNKNOWN
