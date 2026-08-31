package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.VehiclesResult
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.first
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

class BusRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: BusRepository
    private val linha = Linha(
        codigo = 1001,
        letreiro = "1703-10",
        tipoLinha = 10,
        terminalPrincipal = "JD. FONTALIS",
        terminalSecundario = "SHOPPING CENTER NORTE"
    )

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
        val api = retrofit.create(BusaiApiService::class.java)
        repository = BusRepositoryImpl(api)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `observeVehicles emite Success com os veiculos reais da resposta`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """
                {
                  "success": true,
                  "data": {
                    "hr": "14:32",
                    "vs": [
                      {"p":"21045","a":true,"ta":"2026-08-31T14:32:00Z","py":-23.5123,"px":-46.6234,"heading":90.0,"speed":24.5}
                    ]
                  },
                  "isMock": false
                }
                """.trimIndent()
            )
        )

        val result = repository.observeVehicles(linha).first()

        assertTrue(result is VehiclesResult.Success)
        val success = result as VehiclesResult.Success
        assertEquals(1, success.vehicles.size)
        assertEquals("21045", success.vehicles.first().prefix)
        assertEquals(-23.5123, success.vehicles.first().lat, 0.0001)
    }

    @Test
    fun `observeVehicles emite Failure quando o servidor responde com erro HTTP`() = runTest {
        server.enqueue(
            MockResponse().setResponseCode(500).setBody(
                """{"success": false, "error": "Erro interno ao processar requisição SPTrans"}"""
            )
        )

        val result = repository.observeVehicles(linha).first()

        assertTrue(result is VehiclesResult.Failure)
    }

    @Test
    fun `observeVehicles emite Failure quando a resposta HTTP 200 indica falha de negocio`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """{"success": false, "error": "Falha ao processar requisição SPTrans"}"""
            )
        )

        val result = repository.observeVehicles(linha).first()

        assertTrue(result is VehiclesResult.Failure)
    }

    @Test
    fun `observeVehicles emite Failure em vez de crashar quando o payload vem malformado`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """
                {
                  "success": true,
                  "data": {
                    "hr": "14:32",
                    "vs": [
                      {"a":true,"ta":"2026-08-31T14:32:00Z","py":-23.5123,"px":-46.6234}
                    ]
                  },
                  "isMock": false
                }
                """.trimIndent()
            )
        )

        val result = repository.observeVehicles(linha).first()

        assertTrue(result is VehiclesResult.Failure)
    }
}
