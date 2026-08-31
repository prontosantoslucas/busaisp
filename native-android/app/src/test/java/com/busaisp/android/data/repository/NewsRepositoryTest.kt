package com.busaisp.android.data.repository

import com.busaisp.android.data.network.NewsApi
import com.busaisp.android.domain.model.NewsSourceType
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

class NewsRepositoryTest {

    private lateinit var server: MockWebServer
    private lateinit var repository: NewsRepository

    @Before
    fun setUp() {
        server = MockWebServer()
        server.start()

        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val api = Retrofit.Builder()
            .baseUrl(server.url("/"))
            .addConverterFactory(MoshiConverterFactory.create(moshi))
            .build()
            .create(NewsApi::class.java)

        repository = NetworkNewsRepository(api)
    }

    @After
    fun tearDown() {
        server.shutdown()
    }

    @Test
    fun `getNews mapeia resposta de sucesso com lista de noticias reais`() = runTest {
        val json = """
        {
          "success": true,
          "data": [
            {
              "id": "guide-tarifa-zero",
              "sourceType": "INFORMATIVOS",
              "title": "Domingão Tarifa Zero",
              "subtitle": "Gratuidade aos domingos",
              "description": "Ônibus gratuitos na capital.",
              "fullContent": "Conteúdo completo da regra...",
              "timestamp": "Regra Permanente",
              "badge": {
                "label": "TARIFA ZERO",
                "bg": "rgba(16, 185, 129, 0.22)",
                "text": "#34D399",
                "border": "rgba(16, 185, 129, 0.5)"
              },
              "source": "SPTrans Oficial",
              "categoryTag": "Benefícios"
            }
          ],
          "total": 1
        }
        """.trimIndent()

        server.enqueue(MockResponse().setResponseCode(200).setBody(json))

        val result = repository.getNews()
        assertTrue(result is NewsResult.Success)

        val success = result as NewsResult.Success
        assertEquals(1, success.items.size)
        assertEquals("Domingão Tarifa Zero", success.items[0].title)
        assertEquals(NewsSourceType.INFORMATIVOS, success.items[0].sourceType)
        assertEquals("TARIFA ZERO", success.items[0].badge.label)
    }

    @Test
    fun `getNews retorna Failure em caso de erro 500`() = runTest {
        server.enqueue(MockResponse().setResponseCode(500).setBody("""{"success":false,"error":"Erro de servidor"}"""))

        val result = repository.getNews()
        assertTrue(result is NewsResult.Failure)
    }
}
