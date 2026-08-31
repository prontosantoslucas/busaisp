package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt

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

// Fórmula de haversine — distância real em metros entre dois pontos na
// superfície da Terra. Tradução fiel de getDistanceMeters em
// src/lib/geoUtils.ts do app web.
fun getDistanceMeters(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
    val earthRadius = 6_371_000.0
    val phi1 = Math.toRadians(lat1)
    val phi2 = Math.toRadians(lat2)
    val deltaPhi = Math.toRadians(lat2 - lat1)
    val deltaLambda = Math.toRadians(lng2 - lng1)

    val a = sin(deltaPhi / 2) * sin(deltaPhi / 2) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2) * sin(deltaLambda / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earthRadius * c
}

// Distância aproximada (metros) de um ponto até o segmento AB, via projeção
// equirretangular local ancorada em A. Tradução fiel de
// distancePointToSegmentMeters em src/lib/geoUtils.ts.
private fun distancePointToSegmentMeters(point: GeoPoint, a: GeoPoint, b: GeoPoint): Double {
    val latRad = Math.toRadians(a.lat)
    val metersPerDegLat = 111_320.0
    val metersPerDegLng = 111_320.0 * cos(latRad)

    fun toXY(p: GeoPoint): Pair<Double, Double> =
        (p.lng - a.lng) * metersPerDegLng to (p.lat - a.lat) * metersPerDegLat

    val (pX, pY) = toXY(point)
    val (bX, bY) = toXY(b)

    val lengthSq = bX * bX + bY * bY
    if (lengthSq == 0.0) {
        return kotlin.math.hypot(pX, pY)
    }

    var t = (pX * bX + pY * bY) / lengthSq
    t = t.coerceIn(0.0, 1.0)

    val projX = t * bX
    val projY = t * bY

    return kotlin.math.hypot(pX - projX, pY - projY)
}

// Distância real (metros) de um ponto até a polilinha inteira — o mínimo
// entre todos os segmentos. Usada pra detectar desvio real de rota
// (distância ao trajeto planejado), nunca um estado inventado.
fun distanceToPolylineMeters(point: GeoPoint, polyline: List<GeoPoint>): Double {
    if (polyline.isEmpty()) return Double.POSITIVE_INFINITY
    if (polyline.size == 1) {
        return getDistanceMeters(point.lat, point.lng, polyline[0].lat, polyline[0].lng)
    }

    var min = Double.POSITIVE_INFINITY
    for (i in 0 until polyline.size - 1) {
        val d = distancePointToSegmentMeters(point, polyline[i], polyline[i + 1])
        if (d < min) min = d
    }
    return min
}
