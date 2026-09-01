package com.busaisp.android.data.repository

import com.busaisp.android.data.network.TrafficApi
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory

class TrafficRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: TrafficRepository

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()

        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(TrafficApi::class.java)

        repository = NetworkTrafficRepository(api)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `getTrafficHeatmap calcula hotspots com incidentes reais da API`() = runTest {
        val json = """
        {
          "success": true,
          "data": {
            "incidents": [
              {
                "id": "inc-1",
                "type": "ACCIDENT",
                "title": "Acidente grave na Marginal Tietê",
                "description": "Bloqueio de 2 faixas",
                "street": "Marginal Tietê",
                "neighborhood": "Santana",
                "lat": -23.5186,
                "lng": -46.6264,
                "severity": "CRITICAL",
                "delaySeconds": 900
              }
            ],
            "summary": {
              "total": 1,
              "accidents": 1,
              "police": 0,
              "construction": 0,
              "jams": 0,
              "hazards": 0
            }
          }
        }
        """.trimIndent()

        server.enqueue(MockResponse().setResponseCode(200).setBody(json))

        val result = repository.getTrafficHeatmap()
        assertTrue(result is TrafficResult.Success)

        val success = result as TrafficResult.Success
        assertTrue(success.data.hotspots.isNotEmpty())

        val tiete = success.data.hotspots.first { it.id == "corridor-tiete-bandeiras" }
        assertEquals(TrafficHotspotStatus.CRITICO, tiete.status)
        assertEquals(15, tiete.delayMinutes) // 900s / 60
    }

    @Test
    fun `getTrafficHeatmap retorna Failure em erro de conexao`() = runTest {
        server.enqueue(MockResponse().setResponseCode(500).setBody("""{"success":false,"error":"Erro"}"""))

        val result = repository.getTrafficHeatmap()
        assertTrue(result is TrafficResult.Failure)
    }
}
