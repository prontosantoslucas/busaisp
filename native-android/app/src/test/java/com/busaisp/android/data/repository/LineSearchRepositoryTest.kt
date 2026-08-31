package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
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

class LineSearchRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: LineSearchRepository

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val retrofit = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
        repository = LineSearchRepositoryImpl(retrofit.create(BusaiApiService::class.java))
    }

    @After
    fun tearDown() = server.shutdown()

    @Test
    fun `searchLinhas retorna as linhas reais da resposta`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """
                {
                  "success": true,
                  "data": [
                    {"cl":1001,"lc":false,"lt":"1703","tl":10,"sl":1,"tp":"JD. FONTALIS","ts":"SHOPPING CENTER NORTE"}
                  ],
                  "isMock": false
                }
                """.trimIndent()
            )
        )

        val linhas = repository.searchLinhas("1703")

        assertEquals(1, linhas.size)
        assertEquals("1703", linhas.first().letreiro)
    }

    @Test
    fun `searchLinhas retorna lista vazia em vez de crashar quando o servidor falha`() = runTest {
        server.enqueue(
            MockResponse().setResponseCode(500).setBody(
                """{"success": false, "error": "Erro interno ao processar requisição SPTrans"}"""
            )
        )

        val linhas = repository.searchLinhas("1703")

        assertTrue(linhas.isEmpty())
    }

    @Test
    fun `searchLinhas retorna lista vazia em vez de crashar quando o payload vem malformado`() = runTest {
        server.enqueue(
            MockResponse().setBody(
                """
                {
                  "success": true,
                  "data": [
                    {"lc":false,"tl":10,"sl":1,"tp":"JD. FONTALIS","ts":"SHOPPING CENTER NORTE"}
                  ],
                  "isMock": false
                }
                """.trimIndent()
            )
        )

        val linhas = repository.searchLinhas("1703")

        assertTrue(linhas.isEmpty())
    }
}
