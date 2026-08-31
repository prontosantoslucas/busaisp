package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import org.junit.Assert.assertEquals
import org.junit.Test

class GeoInterpolationTest {

    @Test
    fun `sem heading ou velocidade retorna a posicao original`() {
        val vehicle = Vehicle(
            prefix = "1", lat = -23.5, lng = -46.6,
            headingDegrees = null, speedKmh = null,
            lastUpdateEpochMs = 0L, accessible = false
        )

        val result = interpolatePosition(vehicle, nowEpochMs = 10_000L)

        assertEquals(-23.5, result.lat, 0.00001)
        assertEquals(-46.6, result.lng, 0.00001)
    }

    @Test
    fun `com heading e velocidade a posicao se desloca na direcao esperada`() {
        // Rumo 90 graus (leste), 36 km/h = 10 m/s, 10 segundos = 100 metros
        val vehicle = Vehicle(
            prefix = "1", lat = -23.5, lng = -46.6,
            headingDegrees = 90.0, speedKmh = 36.0,
            lastUpdateEpochMs = 0L, accessible = false
        )

        val result = interpolatePosition(vehicle, nowEpochMs = 10_000L)

        // Deslocamento para leste aumenta a longitude, latitude quase inalterada
        assertEquals(-23.5, result.lat, 0.001)
        assert(result.lng > -46.6)
    }
}
