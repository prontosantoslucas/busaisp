package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
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

    @Test
    fun `getDistanceMeters calcula a distancia real entre dois pontos conhecidos`() {
        // Praça da Sé a Av. Paulista/MASP — distância real de referência ~3.9km
        val distance = getDistanceMeters(-23.5505, -46.6333, -23.5614, -46.6558)
        assertTrue(distance in 2500.0..3500.0)
    }

    @Test
    fun `getDistanceMeters retorna zero para o mesmo ponto`() {
        assertEquals(0.0, getDistanceMeters(-23.55, -46.63, -23.55, -46.63), 0.001)
    }

    @Test
    fun `distanceToPolylineMeters retorna quase zero para um ponto sobre a propria polilinha`() {
        val polyline = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.551, -46.631))
        // Ponto no meio exato do segmento
        val midpoint = GeoPoint(-23.5505, -46.6305)

        val distance = distanceToPolylineMeters(midpoint, polyline)

        assertTrue(distance < 5.0)
    }

    @Test
    fun `distanceToPolylineMeters retorna a distancia real para um ponto longe da polilinha`() {
        val polyline = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.551, -46.631))
        val farPoint = GeoPoint(-23.60, -46.70)

        val distance = distanceToPolylineMeters(farPoint, polyline)

        assertTrue(distance > 5000.0)
    }

    @Test
    fun `distanceToPolylineMeters com polilinha de um unico ponto usa distancia direta`() {
        val polyline = listOf(GeoPoint(-23.55, -46.63))
        val point = GeoPoint(-23.55, -46.6301)

        val distance = distanceToPolylineMeters(point, polyline)
        val expected = getDistanceMeters(-23.55, -46.6301, -23.55, -46.63)

        assertEquals(expected, distance, 1.0)
    }
}
