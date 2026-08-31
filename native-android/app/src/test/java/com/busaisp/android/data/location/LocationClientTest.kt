package com.busaisp.android.data.location

import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Test

class LocationClientTest {

    private class FakeLocationClient(private val lat: Double, private val lng: Double) : LocationClient {
        override fun observeLocation() = flowOf(LocationClient.Position(lat, lng))
    }

    @Test
    fun `observeLocation expoe a posicao real recebida`() = runTest {
        val client: LocationClient = FakeLocationClient(-23.55, -46.63)

        val position = client.observeLocation().first()

        assertEquals(-23.55, position.lat, 0.0001)
        assertEquals(-46.63, position.lng, 0.0001)
    }
}
