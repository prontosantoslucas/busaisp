package com.busaisp.android.data.repository

import com.busaisp.android.data.network.RailsApi
import com.busaisp.android.domain.model.RailOperator
import com.busaisp.android.domain.model.RailStatusType
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

class RailsRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: RailsRepository

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()

        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(RailsApi::class.java)

        repository = NetworkRailsRepository(api)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `getRailsStatus mapeia resposta de sucesso com dados reais de linhas`() = runTest {
        val json = """
        {
          "success": true,
          "data": {
            "lines": [
              {
                "id": "1",
                "name": "Linha 1 - Azul",
                "number": "1",
                "colorName": "Azul",
                "hexColor": "#003399",
                "operator": "METRO",
                "status": "NORMAL",
                "statusText": "Operação Normal",
                "description": "Circulação nos intervalos regulares.",
                "updatedAt": "Agora"
              },
              {
                "id": "4",
                "name": "Linha 4 - Amarela",
                "number": "4",
                "colorName": "Amarela",
                "hexColor": "#FFF000",
                "operator": "VIAQUATRO",
                "status": "VELOCIDADE_REDUZIDA",
                "statusText": "Velocidade Reduzida",
                "description": "Ocorrência técnica na via.",
                "updatedAt": "16:40"
              }
            ],
            "summary": {
              "total": 2,
              "normal": 1,
              "withIssues": 1,
              "lastChecked": "16:50",
              "source": "Direto dos Trens"
            }
          }
        }
        """.trimIndent()

        server.enqueue(MockResponse().setResponseCode(200).setBody(json))

        val result = repository.getRailsStatus()
        assertTrue(result is RailsResult.Success)

        val success = result as RailsResult.Success
        assertEquals(2, success.data.lines.size)
        assertEquals("Linha 1 - Azul", success.data.lines[0].name)
        assertEquals(RailOperator.METRO, success.data.lines[0].operator)
        assertEquals(RailStatusType.NORMAL, success.data.lines[0].status)

        assertEquals("Linha 4 - Amarela", success.data.lines[1].name)
        assertEquals(RailOperator.VIAQUATRO, success.data.lines[1].operator)
        assertEquals(RailStatusType.VELOCIDADE_REDUZIDA, success.data.lines[1].status)

        assertEquals(2, success.data.summary.total)
        assertEquals(1, success.data.summary.withIssues)
    }

    @Test
    fun `getRailsStatus retorna Failure em caso de erro 500 do servidor`() = runTest {
        server.enqueue(MockResponse().setResponseCode(500).setBody("""{"success":false,"error":"Falha interna"}"""))

        val result = repository.getRailsStatus()
        assertTrue(result is RailsResult.Failure)
    }
}
