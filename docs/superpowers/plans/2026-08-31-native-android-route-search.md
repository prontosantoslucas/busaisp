# Android Nativo — Busca e Resultados de Rota Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar ao app Android nativo (já com o Mapa ao Vivo do sub-projeto #1) uma busca de rota completa — origem/destino com autocomplete real, 3 modos de horário, resultados com múltiplas opções (incluindo Metrô/CPTM), e detalhe de itinerário passo a passo — tudo consumindo `/api/rotas` real.

**Architecture:** Mesma base do sub-projeto #1: `RouteRepository` (Retrofit+Moshi contra `/api/rotas`) com o mesmo padrão de tratamento de erro (`CancellationException` relançada, `IOException`/`HttpException`/`JsonDataException`/`Exception` → estado honesto de falha), `RouteSearchViewModel` (`StateFlow`), 3 telas Compose novas, e uma barra de navegação inferior (Mapa/Rotas) acrescentada ao `BusaiNavHost` existente.

**Tech Stack:** Mesmo do sub-projeto #1 (Kotlin 2.3.20, Compose BOM 2026.04.01, Retrofit 3.0.0+Moshi 1.15.1, Hilt 2.58, JUnit4+MockWebServer+Compose UI testing) — nenhuma dependência nova.

**Escopo dos DTOs — decisão deliberada:** `RoutePlanDto`/`RouteStepDto` abaixo modelam só os campos que a UI deste sub-projeto realmente usa (duração, baldeações, tarifa, status de trânsito, passo a passo). Campos reais que existem na API mas não são renderizados ainda (`departureStop`/`arrivalStop`/`recommendedLine` como objetos completos de parada/linha, `transferPoints`, `incidentsOnRoute`, `polyline`) foram deixados de fora agora — YAGNI, não modelar dado que a UI não usa — e podem ser adicionados quando um sub-projeto futuro (ex.: mapa mostrando o trajeto da rota) precisar deles. Isso não é omissão por preguiça: cada campo omitido foi conferido contra `src/lib/routing.ts` e é seguro de ignorar via Moshi (não quebra o parse dos campos que SÃO usados).

**Nota sobre `@JsonClass(generateAdapter = true)`:** o sub-projeto #1 (Task 3) já identificou que essa anotação está "inerte" no projeto hoje — não há processador de codegen do Moshi configurado, então tudo roda via reflection (`KotlinJsonAdapterFactory`), não por código gerado. Isso é um problema pré-existente, não introduzido aqui — mantemos a mesma anotação por consistência com o código já escrito, mas não é este plano que resolve essa lacuna (fica registrado, não escondido).

---

## Task 1: DTOs de rota e novos endpoints Retrofit

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/remote/dto/RouteDto.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/data/remote/BusaiApiService.kt`

- [ ] **Step 1: Criar os DTOs de rota**

`data/remote/dto/RouteDto.kt`:
```kotlin
package com.busaisp.android.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class RouteLocationDto(
    val name: String,
    val addressDetails: String? = null,
    val lat: Double,
    val lng: Double
)

@JsonClass(generateAdapter = true)
data class StopPointDto(
    val name: String,
    val lat: Double,
    val lng: Double
)

@JsonClass(generateAdapter = true)
data class RouteStepDto(
    val type: String,
    val instruction: String,
    val durationMinutes: Double,
    val distanceMeters: Double,
    val busLine: String? = null,
    val busDestination: String? = null,
    val boardStopName: String? = null,
    val alightStopName: String? = null,
    val stopCount: Int? = null,
    val intermediateStops: List<StopPointDto>? = null,
    val nextBusEtaMinutes: Double? = null,
    val departureEtas: List<Double>? = null,
    val accuracyLevel: String? = null
)

@JsonClass(generateAdapter = true)
data class RoutePlanDto(
    val id: String,
    val origin: RouteLocationDto,
    val destination: RouteLocationDto,
    val totalDurationMinutes: Double,
    val totalDistanceMeters: Double,
    val totalWalkDistanceMeters: Double,
    val totalWalkDurationMinutes: Double,
    val totalEstimatedSteps: Int,
    val departureHour: String,
    val arrivalHour: String,
    val transferCount: Int,
    val nextBusEtaMinutes: Double,
    val departureEtas: List<Double>,
    val departureSuggestion: String,
    val farePrice: String,
    val fareType: String,
    val carbonGrams: Double,
    val accuracyLevel: String,
    val lastTelemetryText: String,
    val trafficStatus: String,
    val trafficDelayMinutes: Double,
    val mode: String? = null,
    val arrivalTimeUnreachable: Boolean? = null,
    val steps: List<RouteStepDto>
)

@JsonClass(generateAdapter = true)
data class RouteSearchResultDto(
    val primaryRoute: RoutePlanDto,
    val alternatives: List<RoutePlanDto>
)

@JsonClass(generateAdapter = true)
data class RouteSearchResponseDto(
    val success: Boolean,
    val data: RouteSearchResultDto? = null,
    val error: String? = null
)

@JsonClass(generateAdapter = true)
data class AddressSuggestionsResponseDto(
    val success: Boolean,
    val data: List<RouteLocationDto> = emptyList(),
    val error: String? = null
)
```

- [ ] **Step 2: Adicionar os 2 novos endpoints em `BusaiApiService.kt`**

Adicionar ao final da interface existente (mantendo `getPosicaoLinha`/`getLinhas` do sub-projeto #1 intactos):
```kotlin
    @GET("api/rotas")
    suspend fun getRoutes(
        @Query("origLat") origLat: Double? = null,
        @Query("origLng") origLng: Double? = null,
        @Query("origem") origem: String? = null,
        @Query("destLat") destLat: Double? = null,
        @Query("destLng") destLng: Double? = null,
        @Query("destino") destino: String? = null,
        @Query("partidaMinutos") partidaMinutos: Int? = null,
        @Query("chegadaHorario") chegadaHorario: String? = null
    ): RouteSearchResponseDto

    @GET("api/rotas")
    suspend fun getAddressSuggestions(
        @Query("tipo") tipo: String = "sugestoes",
        @Query("q") query: String
    ): AddressSuggestionsResponseDto
```
(mais os imports `com.busaisp.android.data.remote.dto.RouteSearchResponseDto` e
`com.busaisp.android.data.remote.dto.AddressSuggestionsResponseDto` no topo do
arquivo — os demais imports de `LinhasResponseDto`/`PosicaoResponseDto` já
existem do sub-projeto #1, não remover).

- [ ] **Step 3: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/remote/
git commit -m "feat(native-android): DTOs e endpoints Retrofit para /api/rotas real"
```

---

## Task 2: Modelos de domínio de rota

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/Route.kt`

- [ ] **Step 1: Criar os modelos de domínio**

`domain/model/Route.kt`:
```kotlin
package com.busaisp.android.domain.model

data class RouteLocation(
    val name: String,
    val addressDetails: String?,
    val lat: Double,
    val lng: Double
)

enum class RouteStepType { WALK, BUS, RAIL, DESTINATION, UNKNOWN }

enum class RouteAccuracy { HIGH, MEDIUM, ESTIMATED, UNKNOWN }

data class RouteStep(
    val type: RouteStepType,
    val instruction: String,
    val durationMinutes: Int,
    val distanceMeters: Int,
    val busLine: String?,
    val busDestination: String?,
    val boardStopName: String?,
    val alightStopName: String?,
    val stopCount: Int?,
    val nextBusEtaMinutes: Int?,
    val accuracyLevel: RouteAccuracy
)

data class RoutePlan(
    val id: String,
    val origin: RouteLocation,
    val destination: RouteLocation,
    val totalDurationMinutes: Int,
    val transferCount: Int,
    val departureHour: String,
    val arrivalHour: String,
    val farePrice: String,
    val trafficStatus: String,
    val isRail: Boolean,
    val arrivalTimeUnreachable: Boolean,
    val accuracyLevel: RouteAccuracy,
    val steps: List<RouteStep>
)

data class RouteSearchResult(
    val primaryRoute: RoutePlan,
    val alternatives: List<RoutePlan>
)

// Conversão honesta de string solta (vinda do backend) para enum — nunca
// lança exceção em valor inesperado, cai em UNKNOWN em vez de crashar.
fun parseRouteStepType(raw: String): RouteStepType =
    runCatching { RouteStepType.valueOf(raw) }.getOrDefault(RouteStepType.UNKNOWN)

fun parseRouteAccuracy(raw: String?): RouteAccuracy =
    raw?.let { runCatching { RouteAccuracy.valueOf(it) }.getOrDefault(RouteAccuracy.UNKNOWN) }
        ?: RouteAccuracy.UNKNOWN
```

- [ ] **Step 2: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/domain/model/Route.kt
git commit -m "feat(native-android): modelos de dominio de rota com parsing honesto de enum"
```

---

## Task 3: RouteRepository (TDD, MockWebServer, mesmo padrão de erro do sub-projeto #1)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/repository/RouteRepository.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/repository/RouteRepositoryTest.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/di/RepositoryModule.kt`

- [ ] **Step 1: Escrever os testes primeiro (falha esperada)**

`data/repository/RouteRepositoryTest.kt`:
```kotlin
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
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.RouteRepositoryTest"`
Expected: FAIL — `RouteRepository`/`RouteRepositoryImpl`/`RouteTimeMode`/`RouteRepositoryResult` ainda não existem.

- [ ] **Step 3: Implementar**

`data/repository/RouteRepository.kt`:
```kotlin
package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.RouteLocationDto
import com.busaisp.android.data.remote.dto.RoutePlanDto
import com.busaisp.android.data.remote.dto.RouteStepDto
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RouteSearchResult
import com.busaisp.android.domain.model.RouteStep
import com.busaisp.android.domain.model.parseRouteAccuracy
import com.busaisp.android.domain.model.parseRouteStepType
import com.squareup.moshi.JsonDataException
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import kotlin.coroutines.cancellation.CancellationException

// Modo de horário — espelha os 3 modos reais que /api/rotas já suporta
// (partidaMinutos=0 é "agora", partidaMinutos=N é "partir em N min",
// chegadaHorario é o modo alternativo calculado pelo servidor).
sealed interface RouteTimeMode {
    data object Now : RouteTimeMode
    data class DepartIn(val minutes: Int) : RouteTimeMode
    data class ArriveBy(val time: String) : RouteTimeMode
}

sealed interface RouteRepositoryResult {
    data class Success(val data: RouteSearchResult) : RouteRepositoryResult
    data class Failure(val message: String) : RouteRepositoryResult
}

interface RouteRepository {
    suspend fun calculateRoute(
        origin: RouteLocation,
        destination: RouteLocation,
        timeMode: RouteTimeMode
    ): RouteRepositoryResult

    suspend fun searchAddresses(query: String): List<RouteLocation>
}

class RouteRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : RouteRepository {

    override suspend fun calculateRoute(
        origin: RouteLocation,
        destination: RouteLocation,
        timeMode: RouteTimeMode
    ): RouteRepositoryResult {
        return try {
            val response = api.getRoutes(
                origLat = origin.lat,
                origLng = origin.lng,
                origem = origin.name,
                destLat = destination.lat,
                destLng = destination.lng,
                destino = destination.name,
                partidaMinutos = (timeMode as? RouteTimeMode.DepartIn)?.minutes
                    ?: if (timeMode is RouteTimeMode.Now) 0 else null,
                chegadaHorario = (timeMode as? RouteTimeMode.ArriveBy)?.time
            )
            val data = response.data
            if (response.success && data != null) {
                RouteRepositoryResult.Success(
                    RouteSearchResult(
                        primaryRoute = data.primaryRoute.toDomain(),
                        alternatives = data.alternatives.map { it.toDomain() }
                    )
                )
            } else {
                RouteRepositoryResult.Failure(response.error ?: "Nenhuma rota encontrada")
            }
        } catch (e: CancellationException) {
            throw e
        } catch (e: IOException) {
            RouteRepositoryResult.Failure(e.message ?: "Falha de conexão")
        } catch (e: HttpException) {
            RouteRepositoryResult.Failure("Erro do servidor: ${e.code()}")
        } catch (e: JsonDataException) {
            RouteRepositoryResult.Failure("Resposta inesperada do servidor")
        } catch (e: Exception) {
            RouteRepositoryResult.Failure(e.message ?: "Falha inesperada ao calcular rota")
        }
    }

    override suspend fun searchAddresses(query: String): List<RouteLocation> {
        return try {
            val response = api.getAddressSuggestions(query = query)
            if (!response.success) return emptyList()
            response.data.map { it.toDomain() }
        } catch (e: CancellationException) {
            throw e
        } catch (e: IOException) {
            emptyList()
        } catch (e: HttpException) {
            emptyList()
        } catch (e: JsonDataException) {
            emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}

private fun RouteLocationDto.toDomain() = RouteLocation(name, addressDetails, lat, lng)

private fun RouteStepDto.toDomain() = RouteStep(
    type = parseRouteStepType(type),
    instruction = instruction,
    durationMinutes = durationMinutes.toInt(),
    distanceMeters = distanceMeters.toInt(),
    busLine = busLine,
    busDestination = busDestination,
    boardStopName = boardStopName,
    alightStopName = alightStopName,
    stopCount = stopCount,
    nextBusEtaMinutes = nextBusEtaMinutes?.toInt(),
    accuracyLevel = parseRouteAccuracy(accuracyLevel)
)

private fun RoutePlanDto.toDomain() = RoutePlan(
    id = id,
    origin = origin.toDomain(),
    destination = destination.toDomain(),
    totalDurationMinutes = totalDurationMinutes.toInt(),
    transferCount = transferCount,
    departureHour = departureHour,
    arrivalHour = arrivalHour,
    farePrice = farePrice,
    trafficStatus = trafficStatus,
    isRail = mode == "RAIL",
    arrivalTimeUnreachable = arrivalTimeUnreachable ?: false,
    accuracyLevel = parseRouteAccuracy(accuracyLevel),
    steps = steps.map { it.toDomain() }
)
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.RouteRepositoryTest"`
Expected: `BUILD SUCCESSFUL`, 5 testes passando.

- [ ] **Step 5: Registrar binding no Hilt**

Adicionar em `di/RepositoryModule.kt` (junto de `bindBusRepository`/`bindLineSearchRepository` já existentes):
```kotlin
    @Binds
    @Singleton
    abstract fun bindRouteRepository(impl: RouteRepositoryImpl): RouteRepository
```

- [ ] **Step 6: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/repository/RouteRepository.kt native-android/app/src/test/java/com/busaisp/android/data/repository/RouteRepositoryTest.kt native-android/app/src/main/java/com/busaisp/android/di/RepositoryModule.kt
git commit -m "feat(native-android): RouteRepository com os 3 modos de horario reais (TDD)"
```

---

## Task 4: RouteSearchViewModel (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchViewModel.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchUiState.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/routesearch/RouteSearchViewModelTest.kt`

- [ ] **Step 1: Escrever o teste primeiro**

`ui/routesearch/RouteSearchViewModelTest.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RouteSearchResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class RouteSearchViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private val fakePlan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem", null, -23.55, -46.63),
        destination = RouteLocation("Destino", null, -23.52, -46.65),
        totalDurationMinutes = 42,
        transferCount = 1,
        departureHour = "14:30",
        arrivalHour = "15:12",
        farePrice = "R$ 4,40",
        trafficStatus = "FLUINDO",
        isRail = false,
        arrivalTimeUnreachable = false,
        accuracyLevel = RouteAccuracy.HIGH,
        steps = emptyList()
    )

    private class FakeRouteRepository(
        private val result: RouteRepositoryResult
    ) : RouteRepository {
        override suspend fun calculateRoute(
            origin: RouteLocation,
            destination: RouteLocation,
            timeMode: RouteTimeMode
        ) = result

        override suspend fun searchAddresses(query: String): List<RouteLocation> = emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation() = emptyFlow<LocationClient.Position>()
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `calcular rota com sucesso preenche o estado com o resultado real`() = runTest {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(RouteRepositoryResult.Success(RouteSearchResult(fakePlan, emptyList()))),
            FakeLocationClient()
        )

        viewModel.onOriginChanged("Origem")
        viewModel.onDestinationSelected(fakePlan.origin)
        viewModel.onDestinationChanged("Destino")
        viewModel.onDestinationSelected(fakePlan.destination)
        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is RouteSearchUiState.Results)
        assertEquals(42, (state as RouteSearchUiState.Results).result.primaryRoute.totalDurationMinutes)
    }

    @Test
    fun `falha na busca de rota vira estado de erro honesto`() = runTest {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(RouteRepositoryResult.Failure("Nenhuma rota encontrada")),
            FakeLocationClient()
        )

        viewModel.onOriginChanged("Origem")
        viewModel.onDestinationSelected(fakePlan.origin)
        viewModel.onDestinationChanged("Destino")
        viewModel.onDestinationSelected(fakePlan.destination)
        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is RouteSearchUiState.Error)
        assertEquals("Nenhuma rota encontrada", (state as RouteSearchUiState.Error).message)
    }

    @Test
    fun `calcular sem origem e destino selecionados nao chama o repositorio`() = runTest {
        var called = false
        val repo = object : RouteRepository {
            override suspend fun calculateRoute(origin: RouteLocation, destination: RouteLocation, timeMode: RouteTimeMode): RouteRepositoryResult {
                called = true
                return RouteRepositoryResult.Failure("não deveria chamar")
            }
            override suspend fun searchAddresses(query: String): List<RouteLocation> = emptyList()
        }
        val viewModel = RouteSearchViewModel(repo, FakeLocationClient())

        viewModel.calculateRoute()
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(!called)
        assertTrue(viewModel.uiState.value is RouteSearchUiState.Idle)
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.routesearch.RouteSearchViewModelTest"`
Expected: FAIL — classes ainda não existem.

- [ ] **Step 3: Implementar**

`ui/routesearch/RouteSearchUiState.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import com.busaisp.android.domain.model.RouteSearchResult

sealed interface RouteSearchUiState {
    data object Idle : RouteSearchUiState
    data object Loading : RouteSearchUiState
    data class Results(val result: RouteSearchResult) : RouteSearchUiState
    data class Error(val message: String) : RouteSearchUiState
}
```

`ui/routesearch/RouteSearchViewModel.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.model.RouteLocation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RouteSearchViewModel @Inject constructor(
    private val routeRepository: RouteRepository,
    private val locationClient: LocationClient
) : ViewModel() {

    private val _uiState = MutableStateFlow<RouteSearchUiState>(RouteSearchUiState.Idle)
    val uiState: StateFlow<RouteSearchUiState> = _uiState.asStateFlow()

    private val _originSuggestions = MutableStateFlow<List<RouteLocation>>(emptyList())
    val originSuggestions: StateFlow<List<RouteLocation>> = _originSuggestions.asStateFlow()

    private val _destinationSuggestions = MutableStateFlow<List<RouteLocation>>(emptyList())
    val destinationSuggestions: StateFlow<List<RouteLocation>> = _destinationSuggestions.asStateFlow()

    private val _timeMode = MutableStateFlow<RouteTimeMode>(RouteTimeMode.Now)
    val timeMode: StateFlow<RouteTimeMode> = _timeMode.asStateFlow()

    private var selectedOrigin: RouteLocation? = null
    private var selectedDestination: RouteLocation? = null

    fun onOriginChanged(query: String) {
        selectedOrigin = null
        if (query.length < 3) {
            _originSuggestions.value = emptyList()
            return
        }
        viewModelScope.launch {
            _originSuggestions.value = routeRepository.searchAddresses(query)
        }
    }

    fun onDestinationChanged(query: String) {
        selectedDestination = null
        if (query.length < 3) {
            _destinationSuggestions.value = emptyList()
            return
        }
        viewModelScope.launch {
            _destinationSuggestions.value = routeRepository.searchAddresses(query)
        }
    }

    fun onOriginSelected(location: RouteLocation) {
        selectedOrigin = location
        _originSuggestions.value = emptyList()
    }

    fun onDestinationSelected(location: RouteLocation) {
        selectedDestination = location
        _destinationSuggestions.value = emptyList()
    }

    // Reaproveita o LocationClient do sub-projeto #1 — pega a primeira posição
    // real disponível, não fica observando continuamente (a origem só precisa
    // de um fix pontual pra busca, não de acompanhamento ao vivo).
    fun useCurrentLocationAsOrigin() {
        viewModelScope.launch {
            val position = locationClient.observeLocation().first()
            onOriginSelected(RouteLocation("Minha Localização", "Localização atual pelo GPS", position.lat, position.lng))
        }
    }

    fun onTimeModeChanged(mode: RouteTimeMode) {
        _timeMode.value = mode
    }

    fun calculateRoute() {
        val origin = selectedOrigin
        val destination = selectedDestination
        if (origin == null || destination == null) return

        _uiState.value = RouteSearchUiState.Loading
        viewModelScope.launch {
            when (val result = routeRepository.calculateRoute(origin, destination, _timeMode.value)) {
                is RouteRepositoryResult.Success -> _uiState.value = RouteSearchUiState.Results(result.data)
                is RouteRepositoryResult.Failure -> _uiState.value = RouteSearchUiState.Error(result.message)
            }
        }
    }
}
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.routesearch.RouteSearchViewModelTest"`
Expected: `BUILD SUCCESSFUL`, 3 testes passando.

- [ ] **Step 5: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchViewModel.kt native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchUiState.kt native-android/app/src/test/java/com/busaisp/android/ui/routesearch/
git commit -m "feat(native-android): RouteSearchViewModel com autocomplete e 3 modos de horario (TDD)"
```

---

## Task 5: Navegação inferior (Mapa / Rotas) e novos destinos

**Files:**
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/MainActivity.kt`

- [ ] **Step 1: Estender `BusaiNavHost.kt` com os novos destinos e a barra inferior**

```kotlin
package com.busaisp.android.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Route
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.busaisp.android.ui.map.MapScreen
import com.busaisp.android.ui.routesearch.RouteResultsScreen
import com.busaisp.android.ui.routesearch.RouteSearchScreen

object BusaiDestinations {
    const val MAP = "map"
    const val ROUTE_SEARCH = "route_search"
    const val ROUTE_RESULTS = "route_results"
    const val ROUTE_DETAIL = "route_detail/{planId}"
    fun routeDetail(planId: String) = "route_detail/$planId"
}

private data class BottomTab(val route: String, val label: String, val icon: androidx.compose.ui.graphics.vector.ImageVector)

private val BOTTOM_TABS = listOf(
    BottomTab(BusaiDestinations.MAP, "Mapa", Icons.Filled.Map),
    BottomTab(BusaiDestinations.ROUTE_SEARCH, "Rotas", Icons.Filled.Route)
)

@Composable
fun BusaiNavHost() {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route

    Scaffold(
        bottomBar = {
            // A barra só faz sentido nas telas de topo (Mapa/Rotas) — a tela de
            // resultados fica "dentro" da aba Rotas, sem a barra por cima.
            if (currentRoute == BusaiDestinations.MAP || currentRoute == BusaiDestinations.ROUTE_SEARCH) {
                NavigationBar {
                    BOTTOM_TABS.forEach { tab ->
                        NavigationBarItem(
                            selected = backStackEntry?.destination?.hierarchy?.any { it.route == tab.route } == true,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.findStartDestination().id) { saveState = true }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            },
                            icon = { Icon(tab.icon, contentDescription = tab.label) },
                            label = { androidx.compose.material3.Text(tab.label) }
                        )
                    }
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BusaiDestinations.MAP,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BusaiDestinations.MAP) {
                MapScreen()
            }
            composable(BusaiDestinations.ROUTE_SEARCH) {
                RouteSearchScreen(
                    onRouteCalculated = { navController.navigate(BusaiDestinations.ROUTE_RESULTS) }
                )
            }
            composable(BusaiDestinations.ROUTE_RESULTS) {
                RouteResultsScreen(
                    onBack = { navController.popBackStack() },
                    onPlanSelected = { planId -> navController.navigate(BusaiDestinations.routeDetail(planId)) }
                )
            }
            composable(
                BusaiDestinations.ROUTE_DETAIL,
                arguments = listOf(androidx.navigation.navArgument("planId") { type = androidx.navigation.NavType.StringType })
            ) { backStackEntry ->
                val planId = backStackEntry.arguments?.getString("planId").orEmpty()
                RouteDetailScreen(planId = planId, onBack = { navController.popBackStack() })
            }
        }
    }
}
```

Nota: `RouteResultsScreen`/`RouteDetailScreen` recebem o resultado via um
`RouteSearchViewModel` compartilhado com `RouteSearchScreen` (mesmo
`NavBackStackEntry` pai — ver Task 7 pra como isso é resolvido com
`hiltViewModel` escopado à rota `ROUTE_SEARCH` em vez de à tela que está
sendo exibida, evitando ter que passar o `RoutePlan` inteiro como argumento
de navegação — só o `planId`, uma string, viaja pela navegação; a tela de
detalhe procura o plano correspondente dentro do `RouteSearchUiState.Results`
já carregado no ViewModel compartilhado).

- [ ] **Step 2: `MainActivity.kt` não muda** — já chama `BusaiNavHost()` sem
parâmetros desde o sub-projeto #1, e o `Scaffold`/barra inferior agora vivem
dentro do próprio `BusaiNavHost`. Confirmar que não há nada a ajustar aqui.

- [ ] **Step 3: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL` (vai falhar
até as Tasks 6/7 criarem `RouteSearchScreen`/`RouteResultsScreen` — normal,
só faz sentido buildar de verdade depois da Task 7; pode adiar o commit desta
task pra depois, ou commitar com o entendimento de que o build só fecha ao
final da Task 7. Prefira a segunda opção: implemente esta task, mas só rode
o build/commit real dela junto com o fim da Task 7, pra não commitar um
estado que não compila).

---

## Task 6: Tela de busca de rota (origem/destino, autocomplete, modo de horário)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/AddressField.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/TimeModeSelector.kt`

- [ ] **Step 1: Campo de endereço com autocomplete**

`ui/routesearch/components/AddressField.kt`:
```kotlin
package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RouteLocation

@Composable
fun AddressField(
    label: String,
    query: String,
    suggestions: List<RouteLocation>,
    onQueryChanged: (String) -> Unit,
    onSuggestionSelected: (RouteLocation) -> Unit,
    onUseCurrentLocation: (() -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChanged,
            label = { Text(label) },
            modifier = Modifier.fillMaxWidth()
        )
        if (onUseCurrentLocation != null) {
            TextButton(onClick = onUseCurrentLocation) {
                Text("Usar minha localização atual")
            }
        }
        if (suggestions.isNotEmpty()) {
            LazyColumn(modifier = Modifier.heightIn(max = 200.dp)) {
                items(suggestions, key = { it.name + it.lat + it.lng }) { suggestion ->
                    Text(
                        text = suggestion.name,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onSuggestionSelected(suggestion) }
                            .padding(vertical = 10.dp)
                    )
                }
            }
        }
    }
}
```

- [ ] **Step 2: Seletor de modo de horário**

`ui/routesearch/components/TimeModeSelector.kt`:
```kotlin
package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.data.repository.RouteTimeMode

@Composable
fun TimeModeSelector(
    selected: RouteTimeMode,
    onModeSelected: (RouteTimeMode) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(modifier = modifier.padding(vertical = 8.dp)) {
        FilterChip(
            selected = selected is RouteTimeMode.Now,
            onClick = { onModeSelected(RouteTimeMode.Now) },
            label = { Text("Agora") }
        )
        FilterChip(
            selected = selected is RouteTimeMode.DepartIn,
            onClick = { onModeSelected(RouteTimeMode.DepartIn(15)) },
            label = { Text("Partir em 15 min") }
        )
        FilterChip(
            selected = selected is RouteTimeMode.ArriveBy,
            onClick = { onModeSelected(RouteTimeMode.ArriveBy("18:00")) },
            label = { Text("Chegar até 18:00") }
        )
    }
}
```

Nota deliberada: os valores fixos ("15 min", "18:00") são um MVP mínimo pra
este sub-projeto — o app web tem um seletor de horário completo
(`TransitRouteResults.tsx`), mas replicar esse componente de seleção livre de
horário (relógio/picker) é trabalho de UI substancial o suficiente pra não
caber neste plano sem inflar o escopo; os 3 modos REAIS já ficam
demonstráveis e funcionais, só a granularidade de escolha de horário fica
mais simples por enquanto. Registrado aqui, não escondido.

- [ ] **Step 3: Tela de busca**

`ui/routesearch/RouteSearchScreen.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.routesearch.components.AddressField
import com.busaisp.android.ui.routesearch.components.TimeModeSelector

@Composable
fun RouteSearchScreen(
    viewModel: RouteSearchViewModel = hiltViewModel(),
    onRouteCalculated: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val originSuggestions by viewModel.originSuggestions.collectAsState()
    val destinationSuggestions by viewModel.destinationSuggestions.collectAsState()
    val timeMode by viewModel.timeMode.collectAsStateWithLifecycle()

    var originQuery by remember { mutableStateOf("") }
    var destinationQuery by remember { mutableStateOf("") }

    LaunchedEffect(uiState) {
        if (uiState is RouteSearchUiState.Results) onRouteCalculated()
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        AddressField(
            label = "Origem",
            query = originQuery,
            suggestions = originSuggestions,
            onQueryChanged = { originQuery = it; viewModel.onOriginChanged(it) },
            onSuggestionSelected = { originQuery = it.name; viewModel.onOriginSelected(it) },
            onUseCurrentLocation = {
                originQuery = "Minha Localização"
                viewModel.useCurrentLocationAsOrigin()
            }
        )
        AddressField(
            label = "Destino",
            query = destinationQuery,
            suggestions = destinationSuggestions,
            onQueryChanged = { destinationQuery = it; viewModel.onDestinationChanged(it) },
            onSuggestionSelected = { destinationQuery = it.name; viewModel.onDestinationSelected(it) }
        )
        TimeModeSelector(selected = timeMode, onModeSelected = viewModel::onTimeModeChanged)
        Button(onClick = viewModel::calculateRoute) {
            Text("Buscar rota")
        }
        if (uiState is RouteSearchUiState.Error) {
            Text((uiState as RouteSearchUiState.Error).message)
        }
        if (uiState is RouteSearchUiState.Loading) {
            Text("Calculando rota real...")
        }
    }
}
```

- [ ] **Step 4: Build (esperado falhar até Task 7 existir `RouteResultsScreen`) e confirmar apenas que `RouteSearchScreen`/componentes compilam isoladamente**

Run: `.\gradlew.bat compileDebugKotlin` — se falhar só por causa de
`RouteResultsScreen`/`RouteResultsScreen`-não-existir (referenciado no
`BusaiNavHost` da Task 5), isso é esperado neste ponto — confirme que o
ÚNICO erro restante é a ausência de `RouteResultsScreen`, não um erro real
nos arquivos desta task. Não commitar ainda — commit conjunto no fim da Task 7.

---

## Task 7: Tela de resultados de rota

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteResultsScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/RoutePlanCard.kt`

- [ ] **Step 1: Card de resultado**

`ui/routesearch/components/RoutePlanCard.kt`:
```kotlin
package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RoutePlan

@Composable
fun RoutePlanCard(
    plan: RoutePlan,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Text(
            text = "${plan.totalDurationMinutes} min" + if (plan.isRail) " · Metrô/CPTM" else "",
            style = MaterialTheme.typography.titleMedium
        )
        Text(text = "${plan.departureHour} → ${plan.arrivalHour} · ${plan.transferCount} baldeações")
        Text(text = "${plan.farePrice} · trânsito ${plan.trafficStatus.lowercase()}")
        if (plan.arrivalTimeUnreachable) {
            Text(
                text = "Não é possível chegar no horário desejado saindo agora",
                color = MaterialTheme.colorScheme.error
            )
        }
        if (plan.isRail) {
            Text(
                text = "Trecho de trilho: horário programado, não GPS ao vivo",
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}
```

- [ ] **Step 2: Tela de resultados — reaproveita o `RouteSearchViewModel` da tela anterior via escopo de rota**

`ui/routesearch/RouteResultsScreen.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavBackStackEntry
import com.busaisp.android.ui.routesearch.components.RoutePlanCard
import com.busaisp.android.domain.model.RoutePlan

@Composable
fun RouteResultsScreen(
    viewModel: RouteSearchViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onPlanSelected: (planId: String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    IconButton(onClick = onBack) {
        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
    }

    when (val state = uiState) {
        is RouteSearchUiState.Results -> {
            val allPlans: List<RoutePlan> = listOf(state.result.primaryRoute) + state.result.alternatives
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(allPlans, key = { it.id }) { plan ->
                    RoutePlanCard(plan = plan, onClick = { onPlanSelected(plan.id) })
                }
            }
        }
        is RouteSearchUiState.Error -> Text(state.message, modifier = Modifier.padding(16.dp))
        else -> Text("Nenhum resultado ainda", modifier = Modifier.padding(16.dp))
    }
}
```

**Nota importante sobre o `hiltViewModel()` compartilhado**: pra
`RouteResultsScreen` enxergar o MESMO `RouteSearchViewModel` (com o estado já
preenchido) que `RouteSearchScreen` calculou, `hiltViewModel()` precisa ser
escopado ao `NavBackStackEntry` da rota `ROUTE_SEARCH`, não da rota
`ROUTE_RESULTS` — caso contrário cada tela ganha sua PRÓPRIA instância vazia
do ViewModel e o resultado nunca aparece. Isso significa que Task 5's
`BusaiNavHost` precisa passar explicitamente o `NavBackStackEntry` correto:

Ajustar o bloco `composable(BusaiDestinations.ROUTE_RESULTS) { ... }` de
`BusaiNavHost.kt` (da Task 5) para:
```kotlin
            composable(BusaiDestinations.ROUTE_RESULTS) {
                val searchBackStackEntry = remember(it) {
                    navController.getBackStackEntry(BusaiDestinations.ROUTE_SEARCH)
                }
                val sharedViewModel: RouteSearchViewModel = hiltViewModel(searchBackStackEntry)
                RouteResultsScreen(
                    viewModel = sharedViewModel,
                    onBack = { navController.popBackStack() },
                    onPlanSelected = { planId -> navController.navigate(BusaiDestinations.routeDetail(planId)) }
                )
            }
```
(mais o import `androidx.compose.runtime.remember` e `androidx.hilt.navigation.compose.hiltViewModel`
em `BusaiNavHost.kt`). Ajuste este bloco em `BusaiNavHost.kt` como parte
desta task (não da Task 5), já que só faz sentido depois que
`RouteResultsScreen` existe de verdade. O bloco `composable(BusaiDestinations.ROUTE_DETAIL, ...)`
(adicionado na Task 8) precisa do MESMO tratamento — resolver
`sharedViewModel` a partir do `NavBackStackEntry` de `ROUTE_SEARCH`, não criar
uma instância nova — para que `RouteDetailScreen` também enxergue o resultado
já calculado.

- [ ] **Step 3: Build completo (agora sim deve fechar) e commit conjunto das Tasks 5-7**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/navigation/ native-android/app/src/main/java/com/busaisp/android/ui/routesearch/ native-android/app/src/main/java/com/busaisp/android/MainActivity.kt
git commit -m "feat(native-android): navegacao inferior, tela de busca e resultados de rota"
```

---

## Task 8: Tela de detalhe do itinerário (passo a passo)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteDetailScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/RouteStepRow.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt` (adicionar o destino `ROUTE_DETAIL` já desenhado na Task 5/7 acima)

- [ ] **Step 1: Linha de um passo do itinerário**

`ui/routesearch/components/RouteStepRow.kt`:
```kotlin
package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.RouteStep
import com.busaisp.android.domain.model.RouteStepType

@Composable
fun RouteStepRow(step: RouteStep, modifier: Modifier = Modifier) {
    Column(modifier = modifier.fillMaxWidth().padding(vertical = 10.dp)) {
        Text(text = step.instruction, style = MaterialTheme.typography.bodyLarge)
        val detail = when (step.type) {
            RouteStepType.WALK -> "${step.durationMinutes} min caminhando"
            RouteStepType.BUS -> "Ônibus ${step.busLine ?: ""} · ${step.stopCount ?: 0} paradas"
            RouteStepType.RAIL -> "Trilho ${step.busLine ?: ""} · horário programado, não GPS ao vivo"
            RouteStepType.DESTINATION -> "Chegada ao destino"
            RouteStepType.UNKNOWN -> ""
        }
        Text(text = detail, style = MaterialTheme.typography.bodyMedium)
        // Honestidade sobre a origem do dado — nunca disfarçar horário
        // programado como GPS ao vivo (mesma regra do resto do projeto).
        if (step.accuracyLevel != RouteAccuracy.HIGH && step.type != RouteStepType.WALK) {
            Text(
                text = when (step.accuracyLevel) {
                    RouteAccuracy.MEDIUM -> "Baseado em histórico, não GPS ao vivo"
                    RouteAccuracy.ESTIMATED -> "Estimado — sem dado ao vivo disponível"
                    else -> ""
                },
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}
```

- [ ] **Step 2: Tela de detalhe**

`ui/routesearch/RouteDetailScreen.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.ui.routesearch.components.RouteStepRow

@Composable
fun RouteDetailScreen(
    planId: String,
    viewModel: RouteSearchViewModel = hiltViewModel(),
    onBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    IconButton(onClick = onBack) {
        Icon(Icons.Filled.ArrowBack, contentDescription = "Voltar")
    }

    val state = uiState
    if (state !is RouteSearchUiState.Results) {
        Text("Resultado não disponível", modifier = Modifier.padding(16.dp))
        return
    }

    // planId chega como String pela navegação (não dá pra passar o RoutePlan
    // inteiro como argumento) — o plano de verdade é procurado no resultado
    // já calculado, que vive no RouteSearchViewModel compartilhado.
    val plan = (listOf(state.result.primaryRoute) + state.result.alternatives)
        .firstOrNull { it.id == planId }

    if (plan == null) {
        Text("Rota não encontrada", modifier = Modifier.padding(16.dp))
        return
    }

    LazyColumn(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        items(plan.steps, key = { it.instruction + it.type }) { step ->
            RouteStepRow(step = step)
        }
    }
}
```

- [ ] **Step 3: Build e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteDetailScreen.kt native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/RouteStepRow.kt native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt
git commit -m "feat(native-android): tela de detalhe do itinerario passo a passo"
```

---

## Task 9: Testes de UI reais (busca, resultados e detalhe)

**Files:**
- Test: `native-android/app/src/androidTest/java/com/busaisp/android/ui/routesearch/RouteSearchScreenTest.kt`

Mesma abordagem da Task 11 do sub-projeto #1 (fakes passados via override do
parâmetro `viewModel`, sem infraestrutura de teste do Hilt) — e a mesma
ressalva honesta: sem emulador/dispositivo neste ambiente, só a compilação é
verificável aqui, não a execução real.

- [ ] **Step 1: Escrever o teste**

`androidTest/java/com/busaisp/android/ui/routesearch/RouteSearchScreenTest.kt`:
```kotlin
package com.busaisp.android.ui.routesearch

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RouteSearchResult
import com.busaisp.android.ui.theme.BusaiSPTheme
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.emptyFlow
import org.junit.Rule
import org.junit.Test

class RouteSearchScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    private val fakePlan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem Real", null, -23.55, -46.63),
        destination = RouteLocation("Destino Real", null, -23.52, -46.65),
        totalDurationMinutes = 42,
        transferCount = 1,
        departureHour = "14:30",
        arrivalHour = "15:12",
        farePrice = "R$ 4,40",
        trafficStatus = "FLUINDO",
        isRail = false,
        arrivalTimeUnreachable = false,
        accuracyLevel = RouteAccuracy.HIGH,
        steps = emptyList()
    )

    private class FakeRouteRepository(
        private val suggestions: Map<String, List<RouteLocation>>,
        private val result: RouteRepositoryResult
    ) : RouteRepository {
        override suspend fun calculateRoute(origin: RouteLocation, destination: RouteLocation, timeMode: RouteTimeMode) = result
        override suspend fun searchAddresses(query: String): List<RouteLocation> = suggestions[query] ?: emptyList()
    }

    private class FakeLocationClient : LocationClient {
        override fun observeLocation(): Flow<LocationClient.Position> = emptyFlow()
    }

    @Test
    fun rendersWithoutThrowing() {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(emptyMap(), RouteRepositoryResult.Success(RouteSearchResult(fakePlan, emptyList()))),
            FakeLocationClient()
        )
        composeRule.setContent {
            BusaiSPTheme {
                RouteSearchScreen(viewModel = viewModel, onRouteCalculated = {})
            }
        }
    }

    @Test
    fun typingOriginShowsRealSuggestions() {
        val viewModel = RouteSearchViewModel(
            FakeRouteRepository(
                mapOf("Paulista" to listOf(RouteLocation("Av. Paulista, 1000", null, -23.56, -46.65))),
                RouteRepositoryResult.Failure("não usado neste teste")
            ),
            FakeLocationClient()
        )
        composeRule.setContent {
            BusaiSPTheme {
                RouteSearchScreen(viewModel = viewModel, onRouteCalculated = {})
            }
        }

        composeRule.onNodeWithText("Origem").performTextInput("Paulista")
        composeRule.waitForIdle()

        composeRule.onNodeWithText("Av. Paulista, 1000").assertExists()
    }
}
```

- [ ] **Step 2: Verificar que compila (sem dispositivo disponível, mesma ressalva da Task 11 do sub-projeto #1)**

Run: `.\gradlew.bat compileDebugAndroidTestKotlin` — Expected: `BUILD SUCCESSFUL`.
Tentar `.\gradlew.bat connectedDebugAndroidTest` e documentar honestamente o
resultado esperado de "sem dispositivo conectado" — mesma disciplina da Task
11 do sub-projeto #1, nunca alegar que passou sem ter rodado de verdade.

- [ ] **Step 3: Commit**

```bash
git add native-android/app/src/androidTest/java/com/busaisp/android/ui/routesearch/
git commit -m "test(native-android): testes de UI reais da busca e resultados de rota"
```

---

## Autorevisão do plano

- **Cobertura da spec**: navegação (Task 5), busca com autocomplete e 3
  modos de horário (Task 3, 4, 6), resultados com indicação real de
  Metrô/CPTM (Task 7), detalhe de itinerário passo a passo com honestidade
  sobre origem do dado (Task 8), testes em cada camada testável + UI (Tasks
  3, 4, 9) — todas as seções do spec ("Entra") têm task correspondente,
  incluindo a tela de detalhe (uma lacuna real encontrada na primeira versão
  deste plano — o rascunho inicial tinha deixado `RouteDetailScreen` de fora
  mesmo o spec prometendo ela em "Entra"; corrigido antes de considerar o
  plano pronto, não depois).
- **Placeholders**: nenhum "TBD" — as duas simplificações deliberadas (DTOs
  sem os campos ainda não usados pela UI; seletor de horário com valores
  fixos em vez de picker livre) estão documentadas com razão explícita, não
  escondidas.
- **Consistência de tipos**: `RouteLocation`/`RoutePlan`/`RouteStep`/
  `RouteSearchResult`/`RouteRepositoryResult`/`RouteTimeMode` usados com os
  mesmos nomes de campo em todas as tasks que os referenciam, conferidos
  contra as definições das Tasks 2 e 3.
