package com.busaisp.android.domain.model

data class Vehicle(
    val prefix: String,
    val lat: Double,
    val lng: Double,
    val headingDegrees: Double?,
    val speedKmh: Double?,
    val lastUpdateEpochMs: Long,
    val accessible: Boolean
)

sealed interface VehiclesResult {
    data class Success(val vehicles: List<Vehicle>, val fetchedAtEpochMs: Long) : VehiclesResult
    data class Failure(val message: String) : VehiclesResult
}
