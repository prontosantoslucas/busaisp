package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.domain.model.RouteLocation
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

class RouteRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: RouteRepository
    private val origin = RouteLocation("Minha Localização", null, -23.55, -46.63)
    private val destination = RouteLocation("Rua Flor de Maio, 40", null, -23.52, -46.65)

    private val realRouteJson = """
        {
          "success": true,
          "data": {
            "primaryRoute": {
              "id": "r1",
              "origin": {"name":"Minha Localização","lat":-23.55,"lng":-46.63},
              "destination": {"name":"Rua Flor de Maio, 40","lat":-23.52,"lng":-46.65},
              "totalDurationMinutes": 42.0,
              "totalDistanceMeters": 8500.0,
              "totalWalkDistanceMeters": 400.0,
              "totalWalkDurationMinutes": 6.0,
              "totalEstimatedSteps": 550,
              "departureHour": "14:30",
              "arrivalHour": "15:12",
              "transferCount": 1,
              "nextBusEtaMinutes": 4.0,
              "departureEtas": [4.0, 18.0],
              "departureSuggestion": "Saia em 2 min",
              "farePrice": "R$ 4,40",
              "fareType": "BILHETE_UNICO",
              "carbonGrams": 320.0,
              "accuracyLevel": "HIGH",
              "lastTelemetryText": "GPS ao vivo",
              "trafficStatus": "FLUINDO",
              "trafficDelayMinutes": 0.0,
              "steps": [
                {"type":"WALK","instruction":"Caminhe até o ponto","durationMinutes":6.0,"distanceMeters":400.0},
                {"type":"BUS","instruction":"Pegue o 1703-10","durationMinutes":30.0,"distanceMeters":7500.0,"busLine":"1703-10","stopCount":12}
              ]
            },
            "alternatives": []
          }
        }
    """.trimIndent()

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
        repository = RouteRepositoryImpl(retrofit.create(BusaiApiService::class.java))
    }

    @After
    fun tearDown() = server.shutdown()

    @Test
    fun `calculateRoute retorna o resultado real com os passos corretos`() = runTest {
        server.enqueue(MockResponse().setBody(realRouteJson))

        val result = repository.calculateRoute(origin, destination, RouteTimeMode.Now)

        assertTrue(result is RouteRepositoryResult.Success)
        val success = result as RouteRepositoryResult.Success
        assertEquals(42, success.data.primaryRoute.totalDurationMinutes)
        assertEquals(2, success.data.primaryRoute.steps.size)
        assertEquals("1703-10", success.data.primaryRoute.steps[1].busLine)
    }

    @Test
    fun `calculateRoute com modo ARRIVE_BY envia chegadaHorario na query`() = runTest {
        server.enqueue(MockResponse().setBody(realRouteJson))

        repository.calculateRoute(origin, destination, RouteTimeMode.ArriveBy("18:00"))

        val recorded = server.takeRequest()
        assertTrue(recorded.path?.contains("chegadaHorario=18%3A00") == true)
    }

    @Test
    fun `calculateRoute retorna Failure quando o servidor responde com erro HTTP`() = runTest {
        server.enqueue(MockResponse().setResponseCode(500))

        val result = repository.calculateRoute(origin, destination, RouteTimeMode.Now)

        assertTrue(result is RouteRepositoryResult.Failure)
    }

    @Test
    fun `calculateRoute retorna Failure quando o payload vem malformado em vez de crashar`() = runTest {
        server.enqueue(MockResponse().setBody("""{"success": true, "data": {"primaryRoute": {}}}"""))

        val result = repository.calculateRoute(origin, destination, RouteTimeMode.Now)

        assertTrue(result is RouteRepositoryResult.Failure)
    }

    @Test
    fun `searchAddresses retorna as sugestoes reais`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """{"success": true, "data": [{"name":"Av. Paulista, 1000","lat":-23.56,"lng":-46.65}]}"""
            )
        )

        val suggestions = repository.searchAddresses("Av. Paulista")

        assertEquals(1, suggestions.size)
        assertEquals("Av. Paulista, 1000", suggestions.first().name)
    }
}
