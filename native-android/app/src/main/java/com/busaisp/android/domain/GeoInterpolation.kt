package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

data class GeoPoint(val lat: Double, val lng: Double)

private const val EARTH_RADIUS_METERS = 6_371_000.0

// Projeta a posição do veículo com base em heading/velocidade desde a última
// atualização real de GPS — evita que o ônibus "teleporte" entre pings,
// criando movimento contínuo no mapa (fórmula de ponto de destino em
// grande círculo, não é uma aproximação inventada).
//
// Atenção: esta função não limita o tempo decorrido — um `elapsedSeconds` muito
// grande (dado muito antigo) pode projetar o veículo para uma posição implausível.
// Quem chama é responsável por só passar dados dentro de uma janela razoável (ver,
// por exemplo, a lógica de isStale/expiração de MapViewModel.onLineSelected).
fun interpolatePosition(vehicle: Vehicle, nowEpochMs: Long): GeoPoint {
    val heading = vehicle.headingDegrees
    val speed = vehicle.speedKmh
    if (heading == null || speed == null || speed <= 0.0) {
        return GeoPoint(vehicle.lat, vehicle.lng)
    }

    val elapsedSeconds = (nowEpochMs - vehicle.lastUpdateEpochMs) / 1000.0
    if (elapsedSeconds <= 0.0) {
        return GeoPoint(vehicle.lat, vehicle.lng)
    }

    val distanceMeters = (speed * 1000.0 / 3600.0) * elapsedSeconds
    val headingRad = Math.toRadians(heading)
    val latRad = Math.toRadians(vehicle.lat)
    val angularDistance = distanceMeters / EARTH_RADIUS_METERS

    val newLatRad = asin(
        sin(latRad) * cos(angularDistance) + cos(latRad) * sin(angularDistance) * cos(headingRad)
    )
    val newLngRad = Math.toRadians(vehicle.lng) + atan2(
        sin(headingRad) * sin(angularDistance) * cos(latRad),
        cos(angularDistance) - sin(latRad) * sin(newLatRad)
    )

    return GeoPoint(Math.toDegrees(newLatRad), Math.toDegrees(newLngRad))
}
