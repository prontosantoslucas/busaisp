# Android Nativo — Navegação Ativa Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. **Processo mais rápido (pedido explícito do usuário):** um único revisor combinado (conformidade + qualidade) por task em vez de dois separados; tasks acopladas em lote.

**Goal:** Detecção real de embarque/desvio de rota, avisos de voz reais (TextToSpeech), e um Foreground Service com notificação persistente — ativados por um botão "Iniciar percurso" na tela de detalhe de rota do sub-projeto #2.

**Architecture:** Mesmo padrão dos sub-projetos #1/#2. Reaproveita `BusRepository`/`LocationClient` (sub-projeto #1) sem modificá-los.

**Tech Stack:** Sem dependências novas — `android.speech.tts.TextToSpeech` e `android.app.Service`/`NotificationCompat` já vêm no SDK Android padrão.

---

## Task 1: Modelar polyline e linha recomendada no RoutePlan + matemática de distância

**Por que isto é necessário agora**: o sub-projeto #2 deliberadamente deixou
`polyline` e `recommendedLine` fora de `RoutePlanDto`/`RoutePlan` (YAGNI —
UI de busca/resultado não precisava). Detecção de desvio de rota precisa da
polyline real; detecção de embarque precisa saber qual linha rastrear. Isto
NÃO é reverter aquela decisão — era a decisão certa na hora, e continua
sendo demonstrado por este exato momento em que a necessidade real apareceu.

**Files:**
- Modify: `native-android/app/src/main/java/com/busaisp/android/data/remote/dto/RouteDto.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/domain/model/Route.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/data/repository/RouteRepository.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/data/repository/LineSearchRepository.kt` (elevar visibilidade de `LinhaDto.toDomain()`)
- Modify: `native-android/app/src/main/java/com/busaisp/android/domain/GeoInterpolation.kt`
- Modify (fixtures existentes que vão quebrar): `RouteRepositoryTest.kt`, `RouteSearchViewModelTest.kt`, `RouteSearchScreenTest.kt` (androidTest)
- Test: `native-android/app/src/test/java/com/busaisp/android/domain/GeoInterpolationTest.kt`

- [ ] **Step 1: Elevar `LinhaDto.toDomain()` de `private` para `internal` em `LineSearchRepository.kt`**

Em `data/repository/LineSearchRepository.kt`, trocar:
```kotlin
private fun LinhaDto.toDomain(): Linha = Linha(
```
por:
```kotlin
internal fun LinhaDto.toDomain(): Linha = Linha(
```
(só a palavra-chave de visibilidade muda — resto do corpo da função
permanece idêntico). Isso permite reaproveitar essa função em
`RouteRepository.kt` sem duplicar a lógica de mapeamento.

- [ ] **Step 2: Adicionar `PolylineDto` e os campos novos a `RoutePlanDto`, em `RouteDto.kt`**

Adicionar antes de `RoutePlanDto`:
```kotlin
@JsonClass(generateAdapter = true)
data class PolylineDto(
    val walkToStop: List<List<Double>>,
    val transit: List<List<Double>>,
    val walkToDest: List<List<Double>>
)
```

Em `RoutePlanDto`, adicionar 2 campos novos (no fim da lista de parâmetros,
antes de `steps`):
```kotlin
    val recommendedLine: LinhaDto,
    val polyline: PolylineDto,
```
(precisa do import `com.busaisp.android.data.remote.dto.LinhaDto` — já
existe no mesmo pacote `data.remote.dto`, então nem precisa de import
explícito, `LinhaDto` já está visível).

- [ ] **Step 3: Escrever os testes de matemática de polilinha primeiro (falha esperada)**

Adicionar ao fim de `GeoInterpolationTest.kt` (arquivo já existe do
sub-projeto #1 — só adicionar, não recriar):
```kotlin
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
```
(precisa de `import org.junit.Assert.assertTrue` além do que já existe no
arquivo)

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.domain.GeoInterpolationTest"`
Expected: FAIL — `getDistanceMeters`/`distanceToPolylineMeters` ainda não existem.

- [ ] **Step 4: Implementar a matemática de distância em `GeoInterpolation.kt`**

Adicionar ao fim do arquivo (a fórmula é uma tradução fiel e literal de
`src/lib/geoUtils.ts` do app web — não é aproximação nova):
```kotlin
// Fórmula de haversine — distância real em metros entre dois pontos na
// superfície da Terra. Tradução fiel de getDistanceMeters em
// src/lib/geoUtils.ts do app web.
fun getDistanceMeters(lat1: Double, lng1: Double, lat2: Double, lng2: Double): Double {
    val earthRadius = 6_371_000.0
    val phi1 = Math.toRadians(lat1)
    val phi2 = Math.toRadians(lat2)
    val deltaPhi = Math.toRadians(lat2 - lat1)
    val deltaLambda = Math.toRadians(lng2 - lng1)

    val a = sin(deltaPhi / 2) * sin(deltaPhi / 2) +
        cos(phi1) * cos(phi2) * sin(deltaLambda / 2) * sin(deltaLambda / 2)
    val c = 2 * atan2(sqrt(a), sqrt(1 - a))

    return earthRadius * c
}

// Distância aproximada (metros) de um ponto até o segmento AB, via projeção
// equirretangular local ancorada em A. Tradução fiel de
// distancePointToSegmentMeters em src/lib/geoUtils.ts.
private fun distancePointToSegmentMeters(point: GeoPoint, a: GeoPoint, b: GeoPoint): Double {
    val latRad = Math.toRadians(a.lat)
    val metersPerDegLat = 111_320.0
    val metersPerDegLng = 111_320.0 * cos(latRad)

    fun toXY(p: GeoPoint): Pair<Double, Double> =
        (p.lng - a.lng) * metersPerDegLng to (p.lat - a.lat) * metersPerDegLat

    val (pX, pY) = toXY(point)
    val (bX, bY) = toXY(b)

    val lengthSq = bX * bX + bY * bY
    if (lengthSq == 0.0) {
        return kotlin.math.hypot(pX, pY)
    }

    var t = (pX * bX + pY * bY) / lengthSq
    t = t.coerceIn(0.0, 1.0)

    val projX = t * bX
    val projY = t * bY

    return kotlin.math.hypot(pX - projX, pY - projY)
}

// Distância real (metros) de um ponto até a polilinha inteira — o mínimo
// entre todos os segmentos. Usada pra detectar desvio real de rota
// (distância ao trajeto planejado), nunca um estado inventado.
fun distanceToPolylineMeters(point: GeoPoint, polyline: List<GeoPoint>): Double {
    if (polyline.isEmpty()) return Double.POSITIVE_INFINITY
    if (polyline.size == 1) {
        return getDistanceMeters(point.lat, point.lng, polyline[0].lat, polyline[0].lng)
    }

    var min = Double.POSITIVE_INFINITY
    for (i in 0 until polyline.size - 1) {
        val d = distancePointToSegmentMeters(point, polyline[i], polyline[i + 1])
        if (d < min) min = d
    }
    return min
}
```
(precisa dos imports `kotlin.math.sin`, `kotlin.math.cos`, `kotlin.math.atan2`,
`kotlin.math.sqrt` no topo do arquivo — conferir quais já existem lá do
sub-projeto #1 e adicionar só os que faltam)

- [ ] **Step 5: Rodar os testes de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.domain.GeoInterpolationTest"`
Expected: `BUILD SUCCESSFUL`, todos os testes (os 2 antigos + os 5 novos) passando.

- [ ] **Step 6: Adicionar `RoutePolyline` e os campos novos a `RoutePlan`, em `domain/model/Route.kt`**

Adicionar antes de `data class RoutePlan`:
```kotlin
data class RoutePolyline(
    val walkToStop: List<GeoPoint>,
    val transit: List<GeoPoint>,
    val walkToDest: List<GeoPoint>
)
```
(precisa do import `com.busaisp.android.domain.GeoPoint` — `GeoPoint` já
existe em `domain/GeoInterpolation.kt` do sub-projeto #1)

Em `RoutePlan`, adicionar 2 campos novos (mesma posição relativa que no
DTO):
```kotlin
    val recommendedLine: Linha,
    val polyline: RoutePolyline,
```

- [ ] **Step 7: Atualizar o mapeamento em `RouteRepository.kt`**

Em `RoutePlanDto.toDomain()`, adicionar as 2 linhas novas (a função
`LinhaDto.toDomain()` já é `internal` desde o Step 1, então já está
acessível aqui sem import extra já que está no mesmo pacote
`data.repository`):
```kotlin
    recommendedLine = recommendedLine.toDomain(),
    polyline = polyline.toDomain(),
```
E adicionar a função de mapeamento da polyline (perto das outras funções
`toDomain()` privadas no fim do arquivo):
```kotlin
private fun PolylineDto.toDomain() = RoutePolyline(
    walkToStop = walkToStop.map { GeoPoint(it[0], it[1]) },
    transit = transit.map { GeoPoint(it[0], it[1]) },
    walkToDest = walkToDest.map { GeoPoint(it[0], it[1]) }
)
```
(precisa dos imports `com.busaisp.android.data.remote.dto.PolylineDto`,
`com.busaisp.android.domain.GeoPoint`, `com.busaisp.android.domain.model.RoutePolyline`)

- [ ] **Step 8: Atualizar as 3 fixtures de teste que vão quebrar**

Em `RouteRepositoryTest.kt`, dentro de `realRouteJson`, adicionar ao objeto
`primaryRoute` (antes de `"steps"`):
```json
              "recommendedLine": {"cl":1001,"lc":false,"lt":"1703","tl":10,"sl":1,"tp":"JD. FONTALIS","ts":"SHOPPING CENTER NORTE"},
              "polyline": {
                "walkToStop": [[-23.55,-46.63],[-23.5505,-46.6305]],
                "transit": [[-23.5505,-46.6305],[-23.52,-46.65]],
                "walkToDest": [[-23.52,-46.65],[-23.521,-46.651]]
              },
```

Em `RouteSearchViewModelTest.kt` e em `RouteSearchScreenTest.kt`
(androidTest), o `fakePlan`/`RoutePlan(...)` construído diretamente em
Kotlin (não via JSON) precisa dos 2 campos novos. Adicionar, usando os
mesmos valores de exemplo:
```kotlin
        recommendedLine = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE"),
        polyline = RoutePolyline(
            walkToStop = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.5505, -46.6305)),
            transit = listOf(GeoPoint(-23.5505, -46.6305), GeoPoint(-23.52, -46.65)),
            walkToDest = listOf(GeoPoint(-23.52, -46.65), GeoPoint(-23.521, -46.651))
        ),
```
(adicionar os imports necessários — `Linha` já deve estar importado em
`RouteSearchViewModelTest.kt`; `RoutePolyline`/`GeoPoint` são novos imports
em ambos os arquivos)

- [ ] **Step 9: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`, zero regressão (29 testes de antes + 5 novos de matemática = 34).

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/remote/dto/RouteDto.kt native-android/app/src/main/java/com/busaisp/android/domain/model/Route.kt native-android/app/src/main/java/com/busaisp/android/data/repository/RouteRepository.kt native-android/app/src/main/java/com/busaisp/android/data/repository/LineSearchRepository.kt native-android/app/src/main/java/com/busaisp/android/domain/GeoInterpolation.kt native-android/app/src/test/java/com/busaisp/android/domain/GeoInterpolationTest.kt native-android/app/src/test/java/com/busaisp/android/ui/routesearch/RouteSearchViewModelTest.kt native-android/app/src/androidTest/java/com/busaisp/android/ui/routesearch/RouteSearchScreenTest.kt
git commit -m "feat(native-android): modela polyline/linha recomendada e porta matematica de distancia real"
```

---

## Task 2: VoiceService (TextToSpeech real)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/service/VoiceService.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/di/VoiceModule.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/service/VoiceMessagesTest.kt`

**Nota de escopo**: o motor de TTS real (`android.speech.tts.TextToSpeech`)
não é testável em JVM pura (precisa do dispositivo) — mesma categoria de
`FusedLocationClient` no sub-projeto #1. A lógica de DEBOUNCE (não repetir a
mesma frase em menos de 30s) e o TEXTO das mensagens são puros e testáveis;
extraídos para funções/estruturas separadas do wrapper de TTS em si, pra
poder testar de verdade o que dá pra testar.

- [ ] **Step 1: Escrever o teste da lógica de debounce/mensagens primeiro**

`service/VoiceMessagesTest.kt`:
```kotlin
package com.busaisp.android.service

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceMessagesTest {

    @Test
    fun `mensagem de embarque usa o texto real esperado`() {
        val message = boardingMessage(lineDisplay = "1703-10", destination = "Shopping Center Norte", vehicleWord = "ônibus")
        assertEquals("Embarque no ônibus linha 1703-10 com destino a Shopping Center Norte.", message)
    }

    @Test
    fun `mensagem de baldeacao usa o texto real esperado`() {
        val message = transferMessage("Desça na próxima e pegue a linha 875L-10.")
        assertEquals("Desembarque e faça baldeação. Desça na próxima e pegue a linha 875L-10.", message)
    }

    @Test
    fun `mensagem de desvio de rota usa o texto real esperado`() {
        assertEquals("Atenção: você parece ter saído do trajeto planejado.", offRouteMessage())
    }

    @Test
    fun `debounce bloqueia repetir a mesma frase antes de 30 segundos`() {
        val debouncer = SpeechDebouncer()
        val nowMs = 0L

        val firstAllowed = debouncer.shouldSpeak("mensagem X", nowMs)
        val secondAllowed = debouncer.shouldSpeak("mensagem X", nowMs + 10_000L)

        assertTrue(firstAllowed)
        assertFalse(secondAllowed)
    }

    @Test
    fun `debounce libera a mesma frase depois de 30 segundos`() {
        val debouncer = SpeechDebouncer()

        debouncer.shouldSpeak("mensagem X", 0L)
        val allowedAgain = debouncer.shouldSpeak("mensagem X", 30_001L)

        assertTrue(allowedAgain)
    }

    @Test
    fun `debounce nao bloqueia frases diferentes`() {
        val debouncer = SpeechDebouncer()

        debouncer.shouldSpeak("mensagem X", 0L)
        val allowedDifferent = debouncer.shouldSpeak("mensagem Y", 1_000L)

        assertTrue(allowedDifferent)
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.service.VoiceMessagesTest"`
Expected: FAIL — funções/classe ainda não existem.

- [ ] **Step 3: Implementar**

`service/VoiceService.kt`:
```kotlin
package com.busaisp.android.service

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.TextToSpeech.QUEUE_ADD
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

// Tradução fiel das mensagens reais de src/lib/voiceService.ts do app web —
// mesmo texto, mesmo debounce de 30s.
fun boardingMessage(lineDisplay: String, destination: String, vehicleWord: String = "ônibus"): String =
    "Embarque no $vehicleWord linha $lineDisplay com destino a $destination."

fun transferMessage(instructions: String): String =
    "Desembarque e faça baldeação. $instructions"

fun offRouteMessage(): String =
    "Atenção: você parece ter saído do trajeto planejado."

private const val DEBOUNCE_MS = 30_000L

// Lógica pura de "não repetir a mesma frase antes de 30s" — extraída do
// motor de TTS em si pra poder ser testada em JVM pura.
class SpeechDebouncer {
    private val lastSpokenAtMs = mutableMapOf<String, Long>()

    fun shouldSpeak(message: String, nowMs: Long): Boolean {
        val last = lastSpokenAtMs[message]
        if (last != null && nowMs - last < DEBOUNCE_MS) return false
        lastSpokenAtMs[message] = nowMs
        return true
    }
}

@Singleton
class VoiceService @Inject constructor(
    context: Context
) {
    private val debouncer = SpeechDebouncer()
    private var isMuted = false
    private var tts: TextToSpeech? = null

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("pt", "BR")
            }
        }
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
    }

    private fun speak(message: String) {
        if (isMuted) return
        if (!debouncer.shouldSpeak(message, System.currentTimeMillis())) return
        tts?.speak(message, QUEUE_ADD, null, message.hashCode().toString())
    }

    fun announceBoarding(lineDisplay: String, destination: String, vehicleWord: String = "ônibus") {
        speak(boardingMessage(lineDisplay, destination, vehicleWord))
    }

    fun announceTransfer(instructions: String) {
        speak(transferMessage(instructions))
    }

    fun announceOffRoute() {
        speak(offRouteMessage())
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.service.VoiceMessagesTest"`
Expected: `BUILD SUCCESSFUL`, 6 testes passando.

- [ ] **Step 5: Registrar no Hilt**

`di/VoiceModule.kt`:
```kotlin
package com.busaisp.android.di

import android.content.Context
import com.busaisp.android.service.VoiceService
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object VoiceModule {

    @Provides
    @Singleton
    fun provideVoiceService(@ApplicationContext context: Context): VoiceService = VoiceService(context)
}
```

- [ ] **Step 6: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/service/VoiceService.kt native-android/app/src/main/java/com/busaisp/android/di/VoiceModule.kt native-android/app/src/test/java/com/busaisp/android/service/
git commit -m "feat(native-android): VoiceService via TextToSpeech real com debounce testado (TDD)"
```

---

## Task 3: ActiveNavigationViewModel — detecção real de embarque/desvio (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/activenav/ActiveNavigationViewModel.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/activenav/ActiveNavigationUiState.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/activenav/ActiveNavigationViewModelTest.kt`

- [ ] **Step 1: Escrever o teste primeiro**

`ui/activenav/ActiveNavigationViewModelTest.kt`:
```kotlin
package com.busaisp.android.ui.activenav

import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.domain.GeoPoint
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RoutePolyline
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.service.VoiceService
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.emptyFlow
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test
import org.mockito.kotlin.mock

@OptIn(ExperimentalCoroutinesApi::class)
class ActiveNavigationViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private val transitPolyline = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.56, -46.64))

    private val plan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem", null, -23.55, -46.63),
        destination = RouteLocation("Destino", null, -23.56, -46.64),
        totalDurationMinutes = 20,
        transferCount = 0,
        departureHour = "10:00",
        arrivalHour = "10:20",
        farePrice = "R$ 4,40",
        trafficStatus = "FLUINDO",
        isRail = false,
        arrivalTimeUnreachable = false,
        accuracyLevel = RouteAccuracy.HIGH,
        recommendedLine = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE"),
        polyline = RoutePolyline(emptyList(), transitPolyline, emptyList()),
        steps = emptyList()
    )

    private fun locationFlowOf(lat: Double, lng: Double) = flowOf(LocationClient.Position(lat, lng))

    private class FixedBusRepository(private val vehicles: List<Vehicle>) : BusRepository {
        override fun observeVehicles(linha: Linha) = flowOf(VehiclesResult.Success(vehicles, 0L))
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `usuario perto de um veiculo real da linha e considerado embarcado`() = runTest {
        val nearVehicle = Vehicle("21045", -23.55, -46.63, null, null, 0L, true)
        val locationClient = object : LocationClient {
            override fun observeLocation() = locationFlowOf(-23.55, -46.63)
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(nearVehicle)), locationClient, mock<VoiceService>()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.hasBoarded)
    }

    @Test
    fun `usuario longe de qualquer veiculo real nao e considerado embarcado`() = runTest {
        val farVehicle = Vehicle("21045", -23.70, -46.80, null, null, 0L, true)
        val locationClient = object : LocationClient {
            override fun observeLocation() = locationFlowOf(-23.55, -46.63)
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(farVehicle)), locationClient, mock<VoiceService>()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.uiState.value.hasBoarded)
    }

    @Test
    fun `apos embarcar usuario longe da polyline real e marcado fora da rota`() = runTest {
        val nearVehicle = Vehicle("21045", -23.55, -46.63, null, null, 0L, true)
        var callCount = 0
        val locationClient = object : LocationClient {
            override fun observeLocation() = kotlinx.coroutines.flow.flow {
                // Primeira posição: perto do veículo (embarca). Segunda: longe da polyline.
                emit(LocationClient.Position(-23.55, -46.63))
                emit(LocationClient.Position(-23.80, -46.90))
            }
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(nearVehicle)), locationClient, mock<VoiceService>()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.hasBoarded)
        assertTrue(viewModel.uiState.value.isOffRoute)
    }
}
```

**Nota**: este teste usa `org.mockito.kotlin.mock` pra criar um `VoiceService`
fake sem precisar construir um de verdade (que exigiria `Context`/TTS real).
Se `mockito-kotlin` não for uma dependência do projeto ainda, adicionar ao
`libs.versions.toml`/`app/build.gradle.kts` como `testImplementation`
(procurar a versão estável mais recente real — não adivinhar um número).
Alternativa, se preferir não adicionar dependência nova: criar uma classe
fake mínima abrindo `VoiceService` pra herança, ou um wrapper de interface
`interface Announcer { fun announceBoarding(...); ... }` que `VoiceService`
implementa — julgamento de quem implementar, mas documentar a escolha.

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.activenav.ActiveNavigationViewModelTest"`
Expected: FAIL — classes ainda não existem.

- [ ] **Step 3: Implementar**

`ui/activenav/ActiveNavigationUiState.kt`:
```kotlin
package com.busaisp.android.ui.activenav

data class ActiveNavigationUiState(
    val hasBoarded: Boolean = false,
    val isOffRoute: Boolean = false,
    val lineDisplay: String = "",
    val destinationName: String = ""
)
```

`ui/activenav/ActiveNavigationViewModel.kt`:
```kotlin
package com.busaisp.android.ui.activenav

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.domain.distanceToPolylineMeters
import com.busaisp.android.domain.GeoPoint
import com.busaisp.android.domain.getDistanceMeters
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.service.VoiceService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

// Limiares reais, idênticos ao app web (src/app/page.tsx): 45m pra
// considerar embarcado num veículo real da linha, 250m de distância da
// polyline planejada pra considerar desvio de rota.
private const val BOARDING_PROXIMITY_METERS = 45.0
private const val OFF_ROUTE_THRESHOLD_METERS = 250.0

@HiltViewModel
class ActiveNavigationViewModel @Inject constructor(
    private val busRepository: BusRepository,
    private val locationClient: LocationClient,
    private val voiceService: VoiceService
) : ViewModel() {

    private val _uiState = MutableStateFlow(ActiveNavigationUiState())
    val uiState: StateFlow<ActiveNavigationUiState> = _uiState.asStateFlow()

    private var trackingJob: Job? = null

    fun start(plan: RoutePlan) {
        if (trackingJob?.isActive == true) return

        _uiState.value = ActiveNavigationUiState(
            lineDisplay = if (plan.isRail) plan.recommendedLine.letreiro else "${plan.recommendedLine.letreiro}-${plan.recommendedLine.tipoLinha}",
            destinationName = plan.destination.name
        )

        trackingJob = viewModelScope.launch {
            combine(
                busRepository.observeVehicles(plan.recommendedLine),
                locationClient.observeLocation()
            ) { vehiclesResult, position ->
                Pair(vehiclesResult, position)
            }.collect { (vehiclesResult, position) ->
                val vehicles = (vehiclesResult as? VehiclesResult.Success)?.vehicles ?: emptyList()
                val userPoint = GeoPoint(position.lat, position.lng)

                val current = _uiState.value
                var hasBoarded = current.hasBoarded

                if (!hasBoarded) {
                    val nearVehicle = vehicles.any {
                        getDistanceMeters(userPoint.lat, userPoint.lng, it.lat, it.lng) < BOARDING_PROXIMITY_METERS
                    }
                    if (nearVehicle) {
                        hasBoarded = true
                        voiceService.announceBoarding(current.lineDisplay, current.destinationName, if (plan.isRail) "trem" else "ônibus")
                    }
                }

                var isOffRoute = current.isOffRoute
                if (hasBoarded && plan.polyline.transit.isNotEmpty()) {
                    val distance = distanceToPolylineMeters(userPoint, plan.polyline.transit)
                    val nowOffRoute = distance > OFF_ROUTE_THRESHOLD_METERS
                    if (nowOffRoute && !isOffRoute) {
                        voiceService.announceOffRoute()
                    }
                    isOffRoute = nowOffRoute
                }

                _uiState.value = current.copy(hasBoarded = hasBoarded, isOffRoute = isOffRoute)
            }
        }
    }

    fun stop() {
        trackingJob?.cancel()
        trackingJob = null
        _uiState.value = ActiveNavigationUiState()
    }
}
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.activenav.ActiveNavigationViewModelTest"`
Expected: `BUILD SUCCESSFUL`, 3 testes passando.

- [ ] **Step 5: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/activenav/ native-android/app/src/test/java/com/busaisp/android/ui/activenav/
git commit -m "feat(native-android): ActiveNavigationViewModel com deteccao real de embarque/desvio (TDD)"
```

---

## Task 4: Foreground Service com notificação persistente

**Escopo deliberado (YAGNI, documentar se ajustar)**: o Service mostra uma
notificação FIXA ("Navegação ativa — toque para voltar ao app") enquanto o
percurso está em andamento — não atualiza o texto a cada tick de GPS. O
status ao vivo (embarcado/fora da rota) fica na tela do app
(`ActiveNavigationScreen`, Task 5), que é o que a maioria dos apps reais
também faz (notificação = "viagem em andamento", detalhe ao vivo = no app).
Atualizar o texto da notificação em tempo real exigiria um Service vinculado
(bound) e é complexidade real não justificada pelo escopo deste sub-projeto.

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/service/ActiveNavigationForegroundService.kt`
- Modify: `native-android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Adicionar permissões e declarar o serviço no manifest**

Em `AndroidManifest.xml`, adicionar dentro de `<manifest>` (junto das
permissões já existentes do sub-projeto #1):
```xml
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```
Dentro de `<application>`, adicionar (irmão de `<activity>`):
```xml
        <service
            android:name=".service.ActiveNavigationForegroundService"
            android:foregroundServiceType="location"
            android:exported="false" />
```

- [ ] **Step 2: Implementar o Service**

`service/ActiveNavigationForegroundService.kt`:
```kotlin
package com.busaisp.android.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.busaisp.android.MainActivity

private const val CHANNEL_ID = "active_navigation_channel"
private const val NOTIFICATION_ID = 1001

class ActiveNavigationForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        createNotificationChannelIfNeeded()
        startForeground(NOTIFICATION_ID, buildNotification())
        // Não usa START_STICKY: se o processo morrer, o percurso é
        // reconstruído do zero pelo usuário reabrindo o app — não há estado
        // real pra restaurar automaticamente hoje, então prometer
        // reinicialização automática seria enganoso.
        return START_NOT_STICKY
    }

    override fun onDestroy() {
        super.onDestroy()
    }

    private fun buildNotification(): Notification {
        val openAppIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openAppIntent,
            PendingIntent.FLAG_IMMUTABLE
        )
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Percurso em andamento")
            .setContentText("Toque para voltar ao BusaÍ SP")
            .setSmallIcon(android.R.drawable.ic_menu_directions)
            .setOngoing(true)
            .setContentIntent(pendingIntent)
            .build()
    }

    private fun createNotificationChannelIfNeeded() {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Navegação ativa",
            NotificationManager.IMPORTANCE_LOW
        )
        manager.createNotificationChannel(channel)
    }

    companion object {
        fun start(context: Context) {
            val intent = Intent(context, ActiveNavigationForegroundService::class.java)
            context.startForegroundService(intent)
        }

        fun stop(context: Context) {
            context.stopService(Intent(context, ActiveNavigationForegroundService::class.java))
        }
    }
}
```

- [ ] **Step 3: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`. Sem
emulador neste ambiente, não dá pra confirmar visualmente a notificação
aparecendo — documentar isso honestamente no commit, mesma disciplina já
usada pros testes instrumentados.

```bash
git add native-android/app/src/main/AndroidManifest.xml native-android/app/src/main/java/com/busaisp/android/service/ActiveNavigationForegroundService.kt
git commit -m "feat(native-android): Foreground Service com notificacao persistente real durante percurso"
```

---

## Task 5: Tela de Navegação Ativa e wiring do botão "Iniciar percurso"

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/activenav/ActiveNavigationScreen.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteDetailScreen.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt`

- [ ] **Step 1: Tela de navegação ativa**

`ui/activenav/ActiveNavigationScreen.kt`:
```kotlin
package com.busaisp.android.ui.activenav

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Alignment
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.service.ActiveNavigationForegroundService
import com.busaisp.android.ui.map.LiveBusMap
import com.busaisp.android.ui.theme.AppColors

@Composable
fun ActiveNavigationScreen(
    plan: RoutePlan,
    viewModel: ActiveNavigationViewModel = hiltViewModel(),
    onEncerrar: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val context = LocalContext.current

    LaunchedEffect(plan.id) {
        viewModel.start(plan)
    }

    DisposableEffect(Unit) {
        ActiveNavigationForegroundService.start(context)
        onDispose {
            viewModel.stop()
            ActiveNavigationForegroundService.stop(context)
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        LiveBusMap(vehicles = emptyList(), userLocation = null, modifier = Modifier.fillMaxSize())

        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
                .padding(16.dp)
        ) {
            val statusText = when {
                uiState.isOffRoute -> "Fora da rota planejada"
                uiState.hasBoarded -> "A bordo — ${uiState.lineDisplay}"
                else -> "Aguardando embarque — ${uiState.lineDisplay}"
            }
            val statusColor = when {
                uiState.isOffRoute -> AppColors.OffRouteRed
                uiState.hasBoarded -> AppColors.OnRouteEmerald
                else -> AppColors.LiveAmber
            }
            Text(text = statusText, color = statusColor, style = MaterialTheme.typography.titleMedium)
            Text(text = "Destino: ${uiState.destinationName}")
            Button(onClick = onEncerrar, modifier = Modifier.padding(top = 12.dp)) {
                Text("Encerrar percurso")
            }
        }
    }
}
```

**Nota deliberada**: `LiveBusMap` é chamado aqui com `vehicles = emptyList()`
— reaproveita o composable de mapa do sub-projeto #1 só como pano de fundo
visual por enquanto (não plota os veículos da linha ativa nem a posição real
do usuário nesta tela ainda). Isso é uma simplificação real de escopo, não
um placeholder disfarçado: o status textual (embarcado/fora da rota) já
usa dado 100% real via `ActiveNavigationViewModel`; só a representação
visual no mapa desta tela específica fica pra um ajuste futuro. Documentar
isso no commit.

- [ ] **Step 2: Adicionar destino de navegação e botão "Iniciar percurso"**

Em `BusaiNavHost.kt`, adicionar em `BusaiDestinations`:
```kotlin
    const val ACTIVE_NAVIGATION = "active_navigation/{planId}"
    fun activeNavigation(planId: String) = "active_navigation/$planId"
```
E adicionar um novo bloco `composable(...)` (mesmo padrão de
`ROUTE_DETAIL`, resolvendo o `RouteSearchViewModel` compartilhado a partir
do backstack de `ROUTE_SEARCH` pra achar o `RoutePlan` pelo `planId`):
```kotlin
            composable(
                BusaiDestinations.ACTIVE_NAVIGATION,
                arguments = listOf(androidx.navigation.navArgument("planId") { type = androidx.navigation.NavType.StringType })
            ) { backStackEntry ->
                val planId = backStackEntry.arguments?.getString("planId").orEmpty()
                val searchBackStackEntry = remember(backStackEntry) {
                    navController.getBackStackEntry(BusaiDestinations.ROUTE_SEARCH)
                }
                val sharedViewModel: com.busaisp.android.ui.routesearch.RouteSearchViewModel = hiltViewModel(searchBackStackEntry)
                val state = sharedViewModel.uiState.collectAsStateWithLifecycle().value
                val plan = (state as? com.busaisp.android.ui.routesearch.RouteSearchUiState.Results)
                    ?.result?.let { listOf(it.primaryRoute) + it.alternatives }
                    ?.firstOrNull { it.id == planId }
                if (plan != null) {
                    com.busaisp.android.ui.activenav.ActiveNavigationScreen(
                        plan = plan,
                        onEncerrar = { navController.popBackStack() }
                    )
                }
            }
```
(precisa do import `androidx.lifecycle.compose.collectAsStateWithLifecycle`
se ainda não estiver no arquivo)

Em `RouteDetailScreen.kt`, adicionar um botão "Iniciar percurso" (perto do
botão de voltar existente, usando o mesmo `plan` já resolvido no corpo da
função) que chama um novo parâmetro `onIniciarPercurso: (planId: String) -> Unit`,
e no `BusaiNavHost.kt`'s `composable(BusaiDestinations.ROUTE_DETAIL) { ... }`
(já existente, do sub-projeto #2), passar
`onIniciarPercurso = { navController.navigate(BusaiDestinations.activeNavigation(it)) }`.

- [ ] **Step 3: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/activenav/ActiveNavigationScreen.kt native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteDetailScreen.kt native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt
git commit -m "feat(native-android): tela de navegacao ativa e botao iniciar percurso"
```

---

## Task 6: Revisão holística e fechamento do sub-projeto

Não é uma task de código — é o passo de revisão final (mesmo processo dos
sub-projetos #1/#2): reler o diff inteiro do sub-projeto #3 de uma vez só,
traçar o fluxo real do usuário (detalhe de rota → iniciar percurso →
embarque real detectado → desvio real detectado → avisos de voz reais →
notificação persistente real → encerrar), e confirmar que as peças
construídas isoladamente em cada task estão genuinamente conectadas.

Depois da revisão holística: enviar a branch pro GitHub e abrir PR contra
`master` (branch anterior no histórico: `worktree-native-android-route-search`,
sub-projeto #2), atualizando `HANDOFF.md` com o novo estado.

---

## Autorevisão do plano

- **Cobertura da spec**: matemática de distância real + polyline modelada
  (Task 1), voz real (Task 2), detecção real de embarque/desvio (Task 3),
  Foreground Service real (Task 4), tela + wiring (Task 5) — toda a seção
  "Entra" do spec tem task correspondente.
- **Placeholders**: nenhum "TBD". As duas simplificações deliberadas (Service
  com notificação fixa em vez de atualização ao vivo; `LiveBusMap` na tela
  de navegação ativa sem veículos/usuário plotados ainda) estão documentadas
  com razão explícita.
- **Consistência de tipos**: `RoutePlan.recommendedLine`/`polyline` usados
  com os mesmos nomes em Tasks 1, 3, 5 — conferido contra a definição da
  Task 1.
- **Risco identificado nesta autorevisão**: a Task 1 quebra 3 arquivos de
  teste já existentes e revisados dos sub-projetos #1/#2 (campos novos
  obrigatórios em `RoutePlan`/`RoutePlanDto`). Isso está explicitado no
  próprio texto da Task 1 (Step 8), não é uma surpresa escondida — mas quem
  implementar deve rodar a suíte de teste completa (34 testes esperados
  depois da Task 1) antes de seguir pra Task 2, não só o arquivo novo.
