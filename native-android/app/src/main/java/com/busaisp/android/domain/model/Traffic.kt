package com.busaisp.android.domain.model

enum class TrafficHotspotStatus {
    FLUINDO,
    MODERADO,
    INTENSO,
    CRITICO
}

data class TrafficHotspotReason(
    val type: String,
    val title: String,
    val description: String,
    val delayMinutes: Int
)

data class TrafficCorridorHotspot(
    val id: String,
    val name: String,
    val corridor: String,
    val neighborhood: String,
    val lat: Double,
    val lng: Double,
    val radiusMeters: Double,
    val status: TrafficHotspotStatus,
    val delayMinutes: Int,
    val avgSpeedKmh: Int,
    val normalSpeedKmh: Int,
    val reasons: List<TrafficHotspotReason>
)

data class TrafficHeatmapData(
    val hotspots: List<TrafficCorridorHotspot>,
    val cityStatus: TrafficHotspotStatus,
    val totalCongestionKm: Int,
    val lastUpdated: String
)

data class TrafficIncident(
    val id: String,
    val type: String,
    val title: String,
    val description: String,
    val street: String,
    val neighborhood: String,
    val lat: Double,
    val lng: Double,
    val severity: String,
    val delaySeconds: Int?
)
