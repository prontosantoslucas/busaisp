# Android Nativo — Fundação + Mapa ao Vivo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar um app Android nativo novo (Kotlin + Jetpack Compose) com uma tela de Mapa ao Vivo funcional — ônibus reais da SPTrans em movimento, localização do usuário via GPS, busca mínima de linha — estabelecendo a fundação (projeto, tema, arquitetura, testes, CI) para os próximos sub-projetos da migração.

**Architecture:** App de módulo único em camadas (`data` / `domain` / `ui` / `di`), consumindo o backend Next.js já existente (`https://busaisp.vercel.app/api/*`) via Retrofit — zero lógica de roteamento/GTFS reescrita em Kotlin. ViewModels expõem `StateFlow`; Hilt cuida de injeção de dependência; MapLibre GL Native renderiza o mapa em GPU com tiles gratuitos do OpenFreeMap (sem API key).

**Tech Stack:** Kotlin 2.3.20, Jetpack Compose (BOM 2026.04.01), MapLibre Android SDK 11.8.0, Retrofit 3.0.0 + Moshi 1.15.1, Hilt 2.57.2, `play-services-location` 21.3.0, JUnit4 + MockWebServer 4.12.0 + `kotlinx-coroutines-test` + Compose UI testing.

> **Nota sobre versões:** todas as versões acima foram checadas contra fontes reais (Maven Central, changelogs oficiais) no momento em que este plano foi escrito. Se alguma falhar ao resolver durante o Task 1 (ex.: patch mais novo publicado depois), suba para o próximo patch compatível e documente no commit — não é motivo para travar o plano, é o tipo de ajuste normal de dependência.

> **Nota sobre o comportamento real do mapa:** a API da SPTrans (e o app web atual) não têm um feed "todos os ônibus da cidade" — `/api/onibus?tipo=posicao` exige um código de linha. Por isso este sub-projeto inclui uma busca mínima de linha (Task 10) só para selecionar uma linha e ver os veículos reais dela no mapa — não é a tela de busca/resultados completa do sub-projeto #2.

---

## Task 1: Projeto Android — scaffolding e primeiro build

**Files:**
- Create: `native-android/settings.gradle.kts`
- Create: `native-android/build.gradle.kts`
- Create: `native-android/gradle/libs.versions.toml`
- Create: `native-android/app/build.gradle.kts`
- Create: `native-android/app/src/main/AndroidManifest.xml`
- Create: `native-android/app/src/main/java/com/busaisp/android/MainActivity.kt`
- Create: `native-android/app/src/main/res/values/strings.xml`
- Create: `native-android/gradle.properties`

- [ ] **Step 1: Criar `settings.gradle.kts`**

```kotlin
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        maven("https://central.sonatype.com/repository/maven-snapshots/")
    }
}

rootProject.name = "BusaiSPNative"
include(":app")
```

- [ ] **Step 2: Criar `gradle/libs.versions.toml`**

```toml
[versions]
agp = "9.1.1"
kotlin = "2.3.20"
composeBom = "2026.04.01"
hilt = "2.57.2"
retrofit = "3.0.0"
moshi = "1.15.1"
okhttp = "4.12.0"
coroutines = "1.9.0"
playServicesLocation = "21.3.0"
maplibre = "11.8.0"
navigationCompose = "2.8.5"
lifecycle = "2.9.0"
junit = "4.13.2"

[libraries]
androidx-core-ktx = { module = "androidx.core:core-ktx", version = "1.15.0" }
androidx-lifecycle-runtime-ktx = { module = "androidx.lifecycle:lifecycle-runtime-ktx", version.ref = "lifecycle" }
androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycle" }
androidx-activity-compose = { module = "androidx.activity:activity-compose", version = "1.9.3" }
compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
compose-ui = { module = "androidx.compose.ui:ui" }
compose-ui-graphics = { module = "androidx.compose.ui:ui-graphics" }
compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
compose-material3 = { module = "androidx.compose.material3:material3" }
compose-ui-test-junit4 = { module = "androidx.compose.ui:ui-test-junit4" }
compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
navigation-compose = { module = "androidx.navigation:navigation-compose", version.ref = "navigationCompose" }
hilt-android = { module = "com.google.dagger:hilt-android", version.ref = "hilt" }
hilt-compiler = { module = "com.google.dagger:hilt-compiler", version.ref = "hilt" }
hilt-navigation-compose = { module = "androidx.hilt:hilt-navigation-compose", version = "1.2.0" }
retrofit-core = { module = "com.squareup.retrofit2:retrofit", version.ref = "retrofit" }
retrofit-converter-moshi = { module = "com.squareup.retrofit2:converter-moshi", version.ref = "retrofit" }
moshi-kotlin = { module = "com.squareup.moshi:moshi-kotlin", version.ref = "moshi" }
okhttp-logging-interceptor = { module = "com.squareup.okhttp3:logging-interceptor", version.ref = "okhttp" }
kotlinx-coroutines-android = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-android", version.ref = "coroutines" }
play-services-location = { module = "com.google.android.gms:play-services-location", version.ref = "playServicesLocation" }
maplibre-android-sdk = { module = "org.maplibre.gl:android-sdk", version.ref = "maplibre" }
junit = { module = "junit:junit", version.ref = "junit" }
kotlinx-coroutines-test = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-test", version.ref = "coroutines" }
mockwebserver = { module = "com.squareup.okhttp3:mockwebserver", version.ref = "okhttp" }
androidx-test-ext-junit = { module = "androidx.test.ext:junit", version = "1.2.1" }
androidx-espresso-core = { module = "androidx.test.espresso:espresso-core", version = "3.6.1" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
hilt-android-gradle = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ksp = { id = "com.google.devtools.ksp", version = "2.3.20-2.0.4" }
```

- [ ] **Step 3: Criar `build.gradle.kts` raiz**

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.hilt.android.gradle) apply false
    alias(libs.plugins.ksp) apply false
}
```

- [ ] **Step 4: Criar `gradle.properties`**

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
kotlin.code.style=official
android.nonTransitiveRClass=true
```

- [ ] **Step 5: Criar `app/build.gradle.kts`**

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt.android.gradle)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.busaisp.android"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.busaisp.android"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

dependencies {
    implementation(platform(libs.compose.bom))
    androidTestImplementation(platform(libs.compose.bom))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.graphics)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.navigation.compose)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    implementation(libs.hilt.android)
    implementation(libs.hilt.navigation.compose)
    ksp(libs.hilt.compiler)

    implementation(libs.retrofit.core)
    implementation(libs.retrofit.converter.moshi)
    implementation(libs.moshi.kotlin)
    implementation(libs.okhttp.logging.interceptor)
    implementation(libs.kotlinx.coroutines.android)

    implementation(libs.play.services.location)
    implementation(libs.maplibre.android.sdk)

    testImplementation(libs.junit)
    testImplementation(libs.kotlinx.coroutines.test)
    testImplementation(libs.mockwebserver)

    androidTestImplementation(libs.androidx.test.ext.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(libs.compose.ui.test.junit4)
}
```

- [ ] **Step 6: Criar `app/src/main/AndroidManifest.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:name=".BusaiApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:theme="@style/Theme.BusaiSP">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/Theme.BusaiSP">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

- [ ] **Step 7: Criar `app/src/main/res/values/strings.xml` e `app/src/main/res/values/themes.xml`**

`app/src/main/res/values/strings.xml`:
```xml
<resources>
    <string name="app_name">BusaÍ SP</string>
</resources>
```

`app/src/main/res/values/themes.xml`:
```xml
<resources>
    <style name="Theme.BusaiSP" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
```

- [ ] **Step 8: Criar `MainActivity.kt` mínimo (placeholder de build, será substituído no Task 12)**

`app/src/main/java/com/busaisp/android/MainActivity.kt`:
```kotlin
package com.busaisp.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text("BusaÍ SP — fundação em construção")
        }
    }
}
```

`app/src/main/java/com/busaisp/android/BusaiApplication.kt`:
```kotlin
package com.busaisp.android

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class BusaiApplication : Application()
```

- [ ] **Step 9: Rodar o primeiro build e confirmar sucesso**

Run: `cd native-android && ./gradlew assembleDebug` (no Windows: `.\gradlew.bat assembleDebug`; se o wrapper ainda não existir, gerar antes com `gradle wrapper --gradle-version 9.3.0`)
Expected: `BUILD SUCCESSFUL`. Se falhar por versão de dependência não resolvida, ajustar o patch da lib específica em `libs.versions.toml` e rodar de novo — não seguir para o próximo task com o build quebrado.

- [ ] **Step 10: Commit**

```bash
git add native-android/
git commit -m "feat(native-android): scaffolding do projeto Android nativo (Kotlin/Compose)"
```

---

## Task 2: Design tokens — cores, tipografia e tema

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/theme/Color.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/theme/Type.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/theme/Theme.kt`
- Create: `native-android/app/src/main/res/font/` (arquivos de fonte, ver Step 2)

- [ ] **Step 1: Criar `Color.kt` com as cores oficiais de linha (Metrô/CPTM) e a base neutra**

`ui/theme/Color.kt`:
```kotlin
package com.busaisp.android.ui.theme

import androidx.compose.ui.graphics.Color

// Cores oficiais das linhas de Metrô/CPTM de São Paulo — a identidade visual
// do app nasce do sistema de transporte real, não de uma paleta de marca genérica.
object LineColors {
    val MetroLinha1Azul = Color(0xFF0459A4)
    val MetroLinha2Verde = Color(0xFF00854B)
    val MetroLinha3Vermelha = Color(0xFFEB0027)
    val MetroLinha4Amarela = Color(0xFFFFD40E)
    val MetroLinha5Lilas = Color(0xFF9B45A6)
    val MetroLinha15Prata = Color(0xFF989A9C)
    val CptmLinha7Rubi = Color(0xFF9D5116)
    val CptmLinha8Diamante = Color(0xFF8A8D8F)
    val CptmLinha9Esmeralda = Color(0xFF008074)
    val CptmLinha10Turquesa = Color(0xFF00A0A6)
    val CptmLinha11Coral = Color(0xFFF06D06)
    val CptmLinha12Safira = Color(0xFF003DA5)
    val CptmLinha13Jade = Color(0xFF8DC63F)
}

// Base neutra dark-first (preto quase-preto, nunca puro) + contraparte clara
// em off-white quente. Âmbar mantém a convenção já validada no app web:
// "âmbar = dado de GPS ao vivo".
object AppColors {
    val BackgroundDark = Color(0xFF0B0A14)
    val SurfaceDark = Color(0xFF161520)
    val BackgroundLight = Color(0xFFFAF7F2)
    val SurfaceLight = Color(0xFFFFFFFF)

    val LiveAmber = Color(0xFFF5A623)
    val OnRouteEmerald = Color(0xFF10B981)
    val OffRouteRed = Color(0xFFEF4444)
    val NoDataGray = Color(0xFF6B7280)

    val UserLocationBlue = Color(0xFF3B82F6)
}
```

- [ ] **Step 2: Baixar as fontes IBM Plex Sans e IBM Plex Mono (SIL Open Font License, gratuitas)**

Baixar de `https://fonts.google.com/specimen/IBM+Plex+Sans` e
`https://fonts.google.com/specimen/IBM+Plex+Mono` (botão "Download family").
Extrair e copiar exatamente estes arquivos para `app/src/main/res/font/`,
renomeando para minúsculas/underscore (regra do Android para nomes de recurso):

- `ibm_plex_sans_regular.ttf`
- `ibm_plex_sans_medium.ttf`
- `ibm_plex_sans_semibold.ttf`
- `ibm_plex_mono_regular.ttf`
- `ibm_plex_mono_medium.ttf`

- [ ] **Step 3: Criar `Type.kt` referenciando as fontes reais**

`ui/theme/Type.kt`:
```kotlin
package com.busaisp.android.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import com.busaisp.android.R

val IBMPlexSans = FontFamily(
    Font(R.font.ibm_plex_sans_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_sans_medium, FontWeight.Medium),
    Font(R.font.ibm_plex_sans_semibold, FontWeight.SemiBold)
)

val IBMPlexMono = FontFamily(
    Font(R.font.ibm_plex_mono_regular, FontWeight.Normal),
    Font(R.font.ibm_plex_mono_medium, FontWeight.Medium)
)

// Estilo dedicado para ETAs/contadores/códigos de linha — evoca painéis reais
// de ponto de ônibus/estação, não é decorativo.
val EtaCounterStyle = TextStyle(
    fontFamily = IBMPlexMono,
    fontWeight = FontWeight.Medium,
    fontSize = 20.sp
)

val AppTypography = Typography(
    bodyLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Normal, fontSize = 16.sp),
    bodyMedium = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Normal, fontSize = 14.sp),
    titleLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.SemiBold, fontSize = 22.sp),
    titleMedium = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.SemiBold, fontSize = 18.sp),
    labelLarge = TextStyle(fontFamily = IBMPlexSans, fontWeight = FontWeight.Medium, fontSize = 14.sp)
)
```

- [ ] **Step 4: Criar `Theme.kt` com suporte claro/escuro**

`ui/theme/Theme.kt`:
```kotlin
package com.busaisp.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val DarkColors = darkColorScheme(
    background = AppColors.BackgroundDark,
    surface = AppColors.SurfaceDark,
    primary = AppColors.LiveAmber,
    onBackground = AppColors.SurfaceLight,
    onSurface = AppColors.SurfaceLight
)

private val LightColors = lightColorScheme(
    background = AppColors.BackgroundLight,
    surface = AppColors.SurfaceLight,
    primary = AppColors.LiveAmber,
    onBackground = AppColors.BackgroundDark,
    onSurface = AppColors.BackgroundDark
)

@Composable
fun BusaiSPTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (darkTheme) DarkColors else LightColors
    MaterialTheme(
        colorScheme = colors,
        typography = AppTypography,
        content = content
    )
}
```

- [ ] **Step 5: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/theme/ native-android/app/src/main/res/font/
git commit -m "feat(native-android): tema visual (cores das linhas reais, IBM Plex, dark/light)"
```

---

## Task 3: Camada de rede — DTOs e serviço Retrofit

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/remote/dto/VeiculoDto.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/remote/dto/LinhaDto.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/remote/BusaiApiService.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/di/NetworkModule.kt`

Os campos abaixo replicam exatamente `SPTransVeiculo`/`SPTransLinha`/`SPTransPosicaoLinha`
de `src/types/sptrans.ts` no repositório web — não são inventados.

- [ ] **Step 1: Criar os DTOs**

`data/remote/dto/VeiculoDto.kt`:
```kotlin
package com.busaisp.android.data.remote.dto

import com.squareup.moshi.Json
import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class VeiculoDto(
    val p: String,
    val a: Boolean,
    val ta: String,
    val py: Double,
    val px: Double,
    val heading: Double? = null,
    val speed: Double? = null,
    val destination: String? = null,
    val direction: Int? = null
)

@JsonClass(generateAdapter = true)
data class PosicaoLinhaDto(
    val hr: String,
    val vs: List<VeiculoDto>
)

@JsonClass(generateAdapter = true)
data class PosicaoResponseDto(
    val success: Boolean,
    val data: PosicaoLinhaDto?,
    val isMock: Boolean = false,
    val error: String? = null
)
```

`data/remote/dto/LinhaDto.kt`:
```kotlin
package com.busaisp.android.data.remote.dto

import com.squareup.moshi.JsonClass

@JsonClass(generateAdapter = true)
data class LinhaDto(
    val cl: Int,
    val lc: Boolean,
    val lt: String,
    val tl: Int,
    val sl: Int,
    val tp: String,
    val ts: String
)

@JsonClass(generateAdapter = true)
data class LinhasResponseDto(
    val success: Boolean,
    val data: List<LinhaDto> = emptyList(),
    val isMock: Boolean = false,
    val error: String? = null
)
```

- [ ] **Step 2: Criar a interface Retrofit**

`data/remote/BusaiApiService.kt`:
```kotlin
package com.busaisp.android.data.remote

import com.busaisp.android.data.remote.dto.LinhasResponseDto
import com.busaisp.android.data.remote.dto.PosicaoResponseDto
import retrofit2.http.GET
import retrofit2.http.Query

interface BusaiApiService {

    @GET("api/onibus")
    suspend fun getPosicaoLinha(
        @Query("tipo") tipo: String = "posicao",
        @Query("codigo") codigo: Int,
        @Query("letreiro") letreiro: String
    ): PosicaoResponseDto

    @GET("api/onibus")
    suspend fun getLinhas(
        @Query("tipo") tipo: String = "linhas",
        @Query("q") query: String
    ): LinhasResponseDto
}
```

- [ ] **Step 3: Criar o módulo Hilt de rede**

`di/NetworkModule.kt`:
```kotlin
package com.busaisp.android.di

import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import javax.inject.Singleton

private const val BASE_URL = "https://busaisp.vercel.app/"

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {

    @Provides
    @Singleton
    fun provideMoshi(): Moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()

    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient = OkHttpClient.Builder()
        .addInterceptor(HttpLoggingInterceptor().apply { level = HttpLoggingInterceptor.Level.BASIC })
        .build()

    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient, moshi: Moshi): Retrofit = Retrofit.Builder()
        .baseUrl(BASE_URL)
        .client(client)
        .addConverterFactory(MoshiConverterFactory.create(moshi))
        .build()

    @Provides
    @Singleton
    fun provideBusaiApiService(retrofit: Retrofit): BusaiApiService =
        retrofit.create(BusaiApiService::class.java)
}
```

- [ ] **Step 4: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/remote/ native-android/app/src/main/java/com/busaisp/android/di/NetworkModule.kt
git commit -m "feat(native-android): DTOs e serviço Retrofit consumindo /api/onibus real"
```

---

## Task 4: BusRepository — polling real de veículos (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/repository/BusRepository.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/Linha.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/Vehicle.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/repository/BusRepositoryTest.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/di/NetworkModule.kt` (adicionar binding)

- [ ] **Step 1: Criar os modelos de domínio**

`domain/model/Linha.kt`:
```kotlin
package com.busaisp.android.domain.model

data class Linha(
    val codigo: Int,
    val letreiro: String,
    val tipoLinha: Int,
    val terminalPrincipal: String,
    val terminalSecundario: String
)
```

`domain/model/Vehicle.kt`:
```kotlin
package com.busaisp.android.domain.model

data class Vehicle(
    val prefix: String,
    val lat: Double,
    val lng: Double,
    val headingDegrees: Double?,
    val speedKmh: Double?,
    val lastUpdateEpochMs: Long,
    val accessible: Boolean
)

sealed interface VehiclesResult {
    data class Success(val vehicles: List<Vehicle>, val fetchedAtEpochMs: Long) : VehiclesResult
    data class Failure(val message: String) : VehiclesResult
}
```

- [ ] **Step 2: Escrever o teste que falha primeiro**

`data/repository/BusRepositoryTest.kt`:
```kotlin
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
    fun `observeVehicles emite Failure quando a resposta indica falha`() = runTest {
        server.enqueue(
            MockResponse().setResponseCode(500).setBody(
                """{"success": false, "error": "Erro interno ao processar requisição SPTrans"}"""
            )
        )

        val result = repository.observeVehicles(linha).first()

        assertTrue(result is VehiclesResult.Failure)
    }
}
```

- [ ] **Step 3: Rodar o teste e confirmar que falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.BusRepositoryTest"`
Expected: FAIL com `Unresolved reference: BusRepositoryImpl` (a classe ainda não existe).

- [ ] **Step 4: Implementar `BusRepository`**

`data/repository/BusRepository.kt`:
```kotlin
package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.VeiculoDto
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.isActive
import retrofit2.HttpException
import java.io.IOException
import java.time.Instant
import javax.inject.Inject

interface BusRepository {
    fun observeVehicles(linha: Linha): Flow<VehiclesResult>
}

// Intervalo real replicado do app web (src/app/page.tsx: setInterval(loadVeiculos, 25000)).
private const val POLL_INTERVAL_MS = 25_000L

class BusRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : BusRepository {

    override fun observeVehicles(linha: Linha): Flow<VehiclesResult> = flow {
        while (currentCoroutineContext().isActive) {
            emit(fetchOnce(linha))
            delay(POLL_INTERVAL_MS)
        }
    }

    private suspend fun fetchOnce(linha: Linha): VehiclesResult {
        return try {
            val response = api.getPosicaoLinha(codigo = linha.codigo, letreiro = linha.letreiro)
            val posicao = response.data
            if (response.success && posicao != null) {
                VehiclesResult.Success(
                    vehicles = posicao.vs.map { it.toDomain() },
                    fetchedAtEpochMs = System.currentTimeMillis()
                )
            } else {
                VehiclesResult.Failure(response.error ?: "Falha ao carregar posições dos ônibus")
            }
        } catch (e: IOException) {
            VehiclesResult.Failure(e.message ?: "Falha de conexão")
        } catch (e: HttpException) {
            VehiclesResult.Failure("Erro do servidor: ${e.code()}")
        }
    }
}

private fun VeiculoDto.toDomain(): Vehicle = Vehicle(
    prefix = p,
    lat = py,
    lng = px,
    headingDegrees = heading,
    speedKmh = speed,
    lastUpdateEpochMs = runCatching { Instant.parse(ta).toEpochMilli() }.getOrDefault(System.currentTimeMillis()),
    accessible = a
)
```

- [ ] **Step 5: Rodar o teste de novo e confirmar que passa**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.BusRepositoryTest"`
Expected: `BUILD SUCCESSFUL`, 2 testes passando.

- [ ] **Step 6: Registrar o binding no Hilt**

Adicionar ao final de `di/NetworkModule.kt` (ou criar `di/RepositoryModule.kt` — mais correto por responsabilidade):

`di/RepositoryModule.kt`:
```kotlin
package com.busaisp.android.di

import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.BusRepositoryImpl
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {

    @Binds
    @Singleton
    abstract fun bindBusRepository(impl: BusRepositoryImpl): BusRepository
}
```

- [ ] **Step 7: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/repository/ native-android/app/src/main/java/com/busaisp/android/domain/model/ native-android/app/src/test/ native-android/app/src/main/java/com/busaisp/android/di/RepositoryModule.kt
git commit -m "feat(native-android): BusRepository com polling real (TDD, MockWebServer)"
```

---

## Task 5: LineSearchRepository — busca mínima de linha (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/repository/LineSearchRepository.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/repository/LineSearchRepositoryTest.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/di/RepositoryModule.kt`

- [ ] **Step 1: Escrever o teste que falha primeiro**

`data/repository/LineSearchRepositoryTest.kt`:
```kotlin
package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.test.runTest
import okhttp3.mockwebserver.MockResponse
import okhttp3.mockwebserver.MockWebServer
import org.junit.After
import org.junit.Assert.assertEquals
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
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.LineSearchRepositoryTest"`
Expected: FAIL com `Unresolved reference: LineSearchRepositoryImpl`.

- [ ] **Step 3: Implementar**

`data/repository/LineSearchRepository.kt`:
```kotlin
package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.LinhaDto
import com.busaisp.android.domain.model.Linha
import javax.inject.Inject

interface LineSearchRepository {
    suspend fun searchLinhas(query: String): List<Linha>
}

class LineSearchRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : LineSearchRepository {
    override suspend fun searchLinhas(query: String): List<Linha> {
        val response = api.getLinhas(query = query)
        if (!response.success) return emptyList()
        return response.data.map { it.toDomain() }
    }
}

private fun LinhaDto.toDomain(): Linha = Linha(
    codigo = cl,
    letreiro = lt,
    tipoLinha = tl,
    terminalPrincipal = tp,
    terminalSecundario = ts
)
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.repository.LineSearchRepositoryTest"`
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Registrar binding no Hilt**

Adicionar em `di/RepositoryModule.kt`:
```kotlin
    @Binds
    @Singleton
    abstract fun bindLineSearchRepository(impl: LineSearchRepositoryImpl): LineSearchRepository
```
(mais o import `com.busaisp.android.data.repository.LineSearchRepositoryImpl` e `LineSearchRepository` no topo do arquivo)

- [ ] **Step 6: Commit**

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/repository/LineSearchRepository.kt native-android/app/src/test/java/com/busaisp/android/data/repository/LineSearchRepositoryTest.kt native-android/app/src/main/java/com/busaisp/android/di/RepositoryModule.kt
git commit -m "feat(native-android): busca minima de linha (TDD, MockWebServer)"
```

---

## Task 6: MapViewModel — interpolação de posição e orquestração (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/GeoInterpolation.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/MapViewModel.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/MapUiState.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/domain/GeoInterpolationTest.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/map/MapViewModelTest.kt`

- [ ] **Step 1: Escrever o teste da função de interpolação (falha primeiro)**

`domain/GeoInterpolationTest.kt`:
```kotlin
package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import org.junit.Assert.assertEquals
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
}
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.domain.GeoInterpolationTest"`
Expected: FAIL com `Unresolved reference: interpolatePosition`.

- [ ] **Step 3: Implementar a interpolação (fórmula real de ponto de destino em grande círculo)**

`domain/GeoInterpolation.kt`:
```kotlin
package com.busaisp.android.domain

import com.busaisp.android.domain.model.Vehicle
import kotlin.math.asin
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin

data class GeoPoint(val lat: Double, val lng: Double)

private const val EARTH_RADIUS_METERS = 6_371_000.0

// Projeta a posição do veículo com base em heading/velocidade desde a última
// atualização real de GPS — evita que o ônibus "teleporte" entre pings,
// criando movimento contínuo no mapa (fórmula de ponto de destino em
// grande círculo, não é uma aproximação inventada).
fun interpolatePosition(vehicle: Vehicle, nowEpochMs: Long): GeoPoint {
    val heading = vehicle.headingDegrees
    val speed = vehicle.speedKmh
    if (heading == null || speed == null || speed <= 0.0) {
        return GeoPoint(vehicle.lat, vehicle.lng)
    }

    val elapsedSeconds = (nowEpochMs - vehicle.lastUpdateEpochMs) / 1000.0
    if (elapsedSeconds <= 0.0) {
        return GeoPoint(vehicle.lat, vehicle.lng)
    }

    val distanceMeters = (speed * 1000.0 / 3600.0) * elapsedSeconds
    val headingRad = Math.toRadians(heading)
    val latRad = Math.toRadians(vehicle.lat)
    val angularDistance = distanceMeters / EARTH_RADIUS_METERS

    val newLatRad = asin(
        sin(latRad) * cos(angularDistance) + cos(latRad) * sin(angularDistance) * cos(headingRad)
    )
    val newLngRad = Math.toRadians(vehicle.lng) + atan2(
        sin(headingRad) * sin(angularDistance) * cos(latRad),
        cos(angularDistance) - sin(latRad) * sin(newLatRad)
    )

    return GeoPoint(Math.toDegrees(newLatRad), Math.toDegrees(newLngRad))
}
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.domain.GeoInterpolationTest"`
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Escrever o teste do MapViewModel (falha primeiro)**

`ui/map/MapViewModelTest.kt`:
```kotlin
package com.busaisp.android.ui.map

import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
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
class MapViewModelTest {

    private val dispatcher = StandardTestDispatcher()
    private val linha = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE")

    private class FakeBusRepository(private val result: VehiclesResult) : BusRepository {
        override fun observeVehicles(linha: Linha) = flowOf(result)
    }

    private class FakeLineSearchRepository : LineSearchRepository {
        override suspend fun searchLinhas(query: String): List<Linha> = emptyList()
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `ao selecionar uma linha o estado passa a ter os veiculos reais`() = runTest {
        val vehicle = Vehicle("21045", -23.5, -46.6, 90.0, 24.5, 0L, true)
        val busRepository = FakeBusRepository(VehiclesResult.Success(listOf(vehicle), 0L))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.WithVehicles)
        assertEquals(1, (state as MapUiState.WithVehicles).vehicles.size)
    }

    @Test
    fun `falha de rede resulta em estado de erro honesto`() = runTest {
        val busRepository = FakeBusRepository(VehiclesResult.Failure("Falha de conexão"))
        val viewModel = MapViewModel(busRepository, FakeLineSearchRepository())

        viewModel.onLineSelected(linha)
        dispatcher.scheduler.advanceUntilIdle()

        val state = viewModel.uiState.value
        assertTrue(state is MapUiState.Error)
        assertEquals("Falha de conexão", (state as MapUiState.Error).message)
    }
}
```

- [ ] **Step 6: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.map.MapViewModelTest"`
Expected: FAIL — `MapViewModel`/`MapUiState` ainda não existem.

- [ ] **Step 7: Implementar `MapUiState` e `MapViewModel`**

`ui/map/MapUiState.kt`:
```kotlin
package com.busaisp.android.ui.map

import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle

sealed interface MapUiState {
    data object Idle : MapUiState
    data object Loading : MapUiState
    data class WithVehicles(
        val linha: Linha,
        val vehicles: List<Vehicle>,
        val lastUpdatedEpochMs: Long,
        val isStale: Boolean = false
    ) : MapUiState
    data class Error(val message: String) : MapUiState
}
```

`ui/map/MapViewModel.kt`:
```kotlin
package com.busaisp.android.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.domain.interpolatePosition
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.VehiclesResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// Se um ciclo de polling falhar mas ainda houver posições recentes, elas
// continuam visíveis por até esse tempo com indicação de "desatualizado",
// depois somem — nunca ficam "andando" com dado velho.
private const val STALE_GRACE_MS = 90_000L

@HiltViewModel
class MapViewModel @Inject constructor(
    private val busRepository: BusRepository,
    private val lineSearchRepository: LineSearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MapUiState>(MapUiState.Idle)
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    private val _lineSearchResults = MutableStateFlow<List<Linha>>(emptyList())
    val lineSearchResults: StateFlow<List<Linha>> = _lineSearchResults.asStateFlow()

    fun onLineSelected(linha: Linha) {
        _uiState.value = MapUiState.Loading
        viewModelScope.launch {
            busRepository.observeVehicles(linha).collect { result ->
                _uiState.value = when (result) {
                    is VehiclesResult.Success -> MapUiState.WithVehicles(
                        linha = linha,
                        vehicles = result.vehicles,
                        lastUpdatedEpochMs = result.fetchedAtEpochMs
                    )
                    is VehiclesResult.Failure -> {
                        val current = _uiState.value
                        if (current is MapUiState.WithVehicles &&
                            System.currentTimeMillis() - current.lastUpdatedEpochMs < STALE_GRACE_MS
                        ) {
                            current.copy(isStale = true)
                        } else {
                            MapUiState.Error(result.message)
                        }
                    }
                }
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        if (query.length < 2) {
            _lineSearchResults.value = emptyList()
            return
        }
        viewModelScope.launch {
            _lineSearchResults.value = lineSearchRepository.searchLinhas(query)
        }
    }

    fun interpolatedPosition(vehicleLat: Double, vehicleLng: Double, headingDegrees: Double?, speedKmh: Double?, lastUpdateEpochMs: Long) =
        interpolatePosition(
            com.busaisp.android.domain.model.Vehicle(
                prefix = "", lat = vehicleLat, lng = vehicleLng,
                headingDegrees = headingDegrees, speedKmh = speedKmh,
                lastUpdateEpochMs = lastUpdateEpochMs, accessible = false
            ),
            nowEpochMs = System.currentTimeMillis()
        )
}
```

- [ ] **Step 8: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.ui.map.MapViewModelTest"`
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 9: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/domain/ native-android/app/src/main/java/com/busaisp/android/ui/map/ native-android/app/src/test/java/com/busaisp/android/domain/ native-android/app/src/test/java/com/busaisp/android/ui/map/
git commit -m "feat(native-android): MapViewModel com interpolacao de posicao e estado de erro honesto (TDD)"
```

---

## Task 7: Localização do usuário (FusedLocationProviderClient)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/data/location/LocationClient.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/di/LocationModule.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/location/LocationClientTest.kt`

> Testar diretamente `FusedLocationProviderClient` requer instrumentação (roda
> no dispositivo/emulador, não em JVM pura) — por isso este componente expõe
> uma interface fina e o teste unitário cobre o contrato (fake), não o
> `FusedLocationProviderClient` real. A cobertura real de "permissão negada"
> fica no teste de UI do Task 9.

- [ ] **Step 1: Escrever o teste do contrato (falha primeiro)**

`data/location/LocationClientTest.kt`:
```kotlin
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
```

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.location.LocationClientTest"`
Expected: FAIL — `LocationClient` ainda não existe.

- [ ] **Step 3: Implementar `LocationClient`**

`data/location/LocationClient.kt`:
```kotlin
package com.busaisp.android.data.location

import android.annotation.SuppressLint
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject

interface LocationClient {
    data class Position(val lat: Double, val lng: Double)
    fun observeLocation(): Flow<Position>
}

class FusedLocationClient @Inject constructor(
    private val fusedClient: FusedLocationProviderClient
) : LocationClient {

    @SuppressLint("MissingPermission") // checagem de permissão é feita na camada de UI (Task 9) antes de chamar isto
    override fun observeLocation(): Flow<LocationClient.Position> = callbackFlow {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5_000L).build()
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(LocationClient.Position(it.latitude, it.longitude)) }
            }
        }
        fusedClient.requestLocationUpdates(request, callback, null)
        awaitClose { fusedClient.removeLocationUpdates(callback) }
    }
}
```

- [ ] **Step 4: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.location.LocationClientTest"`
Expected: `BUILD SUCCESSFUL`.

- [ ] **Step 5: Registrar no Hilt**

`di/LocationModule.kt`:
```kotlin
package com.busaisp.android.di

import android.content.Context
import com.busaisp.android.data.location.FusedLocationClient
import com.busaisp.android.data.location.LocationClient
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object LocationModule {

    @Provides
    @Singleton
    fun provideFusedLocationProviderClient(@ApplicationContext context: Context): FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)

    @Provides
    @Singleton
    fun provideLocationClient(fusedLocationClient: FusedLocationClient): LocationClient = fusedLocationClient
}
```

- [ ] **Step 6: Build e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/data/location/ native-android/app/src/main/java/com/busaisp/android/di/LocationModule.kt native-android/app/src/test/java/com/busaisp/android/data/location/
git commit -m "feat(native-android): LocationClient via FusedLocationProviderClient"
```

---

## Task 8: Tela de Mapa ao Vivo — MapLibre em Compose

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/LiveBusMap.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/MapConstants.kt`

- [ ] **Step 1: Criar as constantes do mapa (fonte de tiles, ids de camada)**

`ui/map/MapConstants.kt`:
```kotlin
package com.busaisp.android.ui.map

// OpenFreeMap: tiles vetoriais gratuitos, sem API key, sem conta —
// https://openfreemap.org/quick_start/
const val OPEN_FREE_MAP_LIBERTY_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"

const val BUS_SOURCE_ID = "bus-vehicles-source"
const val BUS_LAYER_ID = "bus-vehicles-layer"
const val USER_SOURCE_ID = "user-location-source"
const val USER_LAYER_ID = "user-location-layer"

// Centro aproximado de São Paulo, usado como câmera inicial antes de qualquer GPS/linha.
const val SAO_PAULO_INITIAL_LAT = -23.5505
const val SAO_PAULO_INITIAL_LNG = -46.6333
const val SAO_PAULO_INITIAL_ZOOM = 12.0
```

- [ ] **Step 2: Implementar o Composable do mapa**

`ui/map/LiveBusMap.kt`:
```kotlin
package com.busaisp.android.ui.map

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.theme.AppColors
import kotlinx.coroutines.launch
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.Style
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.Point

@Composable
fun LiveBusMap(
    vehicles: List<Vehicle>,
    userLocation: LocationClientPosition?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var mapLibreMap by remember { mutableStateOf<MapLibreMap?>(null) }

    val mapView = remember {
        MapLibre.getInstance(context)
        MapView(context)
    }

    DisposableEffect(mapView) {
        mapView.onStart()
        mapView.onResume()
        mapView.getMapAsync { map ->
            map.cameraPosition = CameraPosition.Builder()
                .target(LatLng(SAO_PAULO_INITIAL_LAT, SAO_PAULO_INITIAL_LNG))
                .zoom(SAO_PAULO_INITIAL_ZOOM)
                .build()
            map.setStyle(Style.Builder().fromUri(OPEN_FREE_MAP_LIBERTY_STYLE_URL)) { style ->
                style.addSource(GeoJsonSource(BUS_SOURCE_ID))
                style.addLayer(
                    CircleLayer(BUS_LAYER_ID, BUS_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(7f),
                        PropertyFactory.circleColor(AppColors.LiveAmber.toArgb()),
                        PropertyFactory.circleStrokeWidth(2f),
                        PropertyFactory.circleStrokeColor(AppColors.BackgroundDark.toArgb())
                    )
                )
                style.addSource(GeoJsonSource(USER_SOURCE_ID))
                style.addLayer(
                    CircleLayer(USER_LAYER_ID, USER_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(9f),
                        PropertyFactory.circleColor(AppColors.UserLocationBlue.toArgb()),
                        PropertyFactory.circleStrokeWidth(3f),
                        PropertyFactory.circleStrokeColor(0xFFFFFFFF.toInt())
                    )
                )
                mapLibreMap = map
            }
        }
        onDispose {
            mapView.onPause()
            mapView.onStop()
            mapView.onDestroy()
        }
    }

    DisposableEffect(mapLibreMap, vehicles) {
        updateBusSource(mapLibreMap, vehicles)
        onDispose { }
    }

    DisposableEffect(mapLibreMap, userLocation) {
        updateUserSource(mapLibreMap, userLocation)
        onDispose { }
    }

    AndroidView(factory = { mapView }, modifier = modifier.fillMaxSize())
}

data class LocationClientPosition(val lat: Double, val lng: Double)

private fun updateBusSource(map: MapLibreMap?, vehicles: List<Vehicle>) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(BUS_SOURCE_ID) ?: return
    val features = vehicles.map { vehicle ->
        Feature.fromGeometry(Point.fromLngLat(vehicle.lng, vehicle.lat)).apply {
            addStringProperty("prefix", vehicle.prefix)
        }
    }
    source.setGeoJson(FeatureCollection.fromFeatures(features))
}

private fun updateUserSource(map: MapLibreMap?, position: LocationClientPosition?) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(USER_SOURCE_ID) ?: return
    source.setGeoJson(
        if (position != null) {
            FeatureCollection.fromFeature(Feature.fromGeometry(Point.fromLngLat(position.lng, position.lat)))
        } else {
            FeatureCollection.fromFeatures(emptyList())
        }
    )
}
```

- [ ] **Step 3: Build e confirmar sucesso**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`. Se `toArgb()` não resolver, adicionar
`import androidx.compose.ui.graphics.toArgb`.

- [ ] **Step 4: Commit**

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/map/LiveBusMap.kt native-android/app/src/main/java/com/busaisp/android/ui/map/MapConstants.kt
git commit -m "feat(native-android): mapa MapLibre com onibus reais e localizacao do usuario"
```

---

## Task 9: Tela de Mapa — controles flutuantes, busca de linha e painel de detalhes

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/MapScreen.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/components/FloatingPillButton.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/components/LineSearchBar.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/map/components/VehicleDetailSheet.kt`

- [ ] **Step 1: Criar o botão flutuante em pílula (controle reutilizável)**

`ui/map/components/FloatingPillButton.kt`:
```kotlin
package com.busaisp.android.ui.map.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp

@Composable
fun FloatingPillButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Icon(
        imageVector = icon,
        contentDescription = contentDescription,
        modifier = modifier
            .background(MaterialTheme.colorScheme.surface, CircleShape)
            .clickable(onClick = onClick)
            .padding(14.dp),
        tint = MaterialTheme.colorScheme.onSurface
    )
}
```

- [ ] **Step 2: Criar a busca mínima de linha**

`ui/map/components/LineSearchBar.kt`:
```kotlin
package com.busaisp.android.ui.map.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.Linha

@Composable
fun LineSearchBar(
    query: String,
    results: List<Linha>,
    onQueryChanged: (String) -> Unit,
    onLineSelected: (Linha) -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
            .padding(8.dp)
    ) {
        OutlinedTextField(
            value = query,
            onValueChange = onQueryChanged,
            placeholder = { Text("Buscar linha (ex: 1703)") },
            modifier = Modifier
                .fillMaxWidth()
                .padding(bottom = if (results.isNotEmpty()) 8.dp else 0.dp)
        )
        if (results.isNotEmpty()) {
            LazyColumn {
                items(results, key = { it.codigo }) { linha ->
                    Text(
                        text = "${linha.letreiro} — ${linha.terminalPrincipal} / ${linha.terminalSecundario}",
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 10.dp)
                    )
                }
            }
        }
    }
}
```

Nota: o `clickable` do item de resultado é conectado no Step 4 (`MapScreen.kt`), aqui o
foco é o layout. Ajustar `Text` do item para receber `Modifier.clickable { onLineSelected(linha) }`
já nesta implementação:

Substituir o `Text` do item de resultado por:
```kotlin
                    Text(
                        text = "${linha.letreiro} — ${linha.terminalPrincipal} / ${linha.terminalSecundario}",
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { onLineSelected(linha) }
                            .padding(vertical = 10.dp)
                    )
```
(adicionar `import androidx.compose.foundation.clickable`)

- [ ] **Step 3: Criar o painel de detalhes recolhível (bottom sheet mínimo)**

`ui/map/components/VehicleDetailSheet.kt`:
```kotlin
package com.busaisp.android.ui.map.components

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.Linha

@Composable
fun VehicleDetailSheet(
    linha: Linha?,
    vehicleCount: Int,
    isStale: Boolean,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
            .clickable { expanded = !expanded }
            .animateContentSize(animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy))
            .padding(16.dp)
    ) {
        Box(
            modifier = Modifier
                .width(40.dp)
                .height(4.dp)
                .align(Alignment.CenterHorizontally)
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), RoundedCornerShape(2.dp))
        )
        if (linha == null) {
            Text(
                text = "Busque uma linha para ver os ônibus reais no mapa",
                modifier = Modifier.padding(top = 12.dp)
            )
        } else if (expanded) {
            Text(text = linha.letreiro, modifier = Modifier.padding(top = 12.dp))
            Text(text = "${linha.terminalPrincipal} / ${linha.terminalSecundario}")
            Text(text = "$vehicleCount ônibus ao vivo" + if (isStale) " — desatualizado" else "")
        } else {
            Text(
                text = "${linha.letreiro} · $vehicleCount ônibus" + if (isStale) " · desatualizado" else "",
                modifier = Modifier.padding(top = 12.dp)
            )
        }
    }
}
```

- [ ] **Step 4: Montar a tela completa**

`ui/map/MapScreen.kt`:
```kotlin
package com.busaisp.android.ui.map

import androidx.compose.foundation.layout.Alignment
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.MyLocation
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.map.components.FloatingPillButton
import com.busaisp.android.ui.map.components.LineSearchBar
import com.busaisp.android.ui.map.components.VehicleDetailSheet

@Composable
fun MapScreen(
    viewModel: MapViewModel = hiltViewModel(),
    onRequestLocation: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val searchResults by viewModel.lineSearchResults.collectAsState()
    var query by remember { mutableStateOf("") }

    val vehicles: List<Vehicle> = (uiState as? MapUiState.WithVehicles)?.vehicles ?: emptyList()

    Box(modifier = Modifier.fillMaxSize()) {
        LiveBusMap(
            vehicles = vehicles,
            userLocation = null,
            modifier = Modifier.fillMaxSize()
        )

        LineSearchBar(
            query = query,
            results = searchResults,
            onQueryChanged = {
                query = it
                viewModel.onSearchQueryChanged(it)
            },
            onLineSelected = {
                query = it.letreiro
                viewModel.onLineSelected(it)
            },
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(16.dp)
        )

        FloatingPillButton(
            icon = Icons.Filled.MyLocation,
            contentDescription = "Localização atual",
            onClick = onRequestLocation,
            modifier = Modifier
                .align(Alignment.BottomEnd)
                .padding(24.dp)
        )

        if (uiState is MapUiState.Error) {
            Text(
                text = (uiState as MapUiState.Error).message,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier
                    .align(Alignment.TopCenter)
                    .padding(top = 100.dp)
            )
        }

        VehicleDetailSheet(
            linha = (uiState as? MapUiState.WithVehicles)?.linha,
            vehicleCount = vehicles.size,
            isStale = (uiState as? MapUiState.WithVehicles)?.isStale ?: false,
            modifier = Modifier.align(Alignment.BottomStart)
        )
    }
}
```

- [ ] **Step 5: Build e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/map/
git commit -m "feat(native-android): tela de Mapa ao Vivo completa (busca, controles, painel)"
```

---

## Task 10: Navegação — shell do app e wiring do MainActivity

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/MainActivity.kt`

- [ ] **Step 1: Criar o NavHost (uma única rota por enquanto, pronta para os próximos sub-projetos)**

`ui/navigation/BusaiNavHost.kt`:
```kotlin
package com.busaisp.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.busaisp.android.ui.map.MapScreen

object BusaiDestinations {
    const val MAP = "map"
}

@Composable
fun BusaiNavHost(onRequestLocation: () -> Unit) {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = BusaiDestinations.MAP) {
        composable(BusaiDestinations.MAP) {
            MapScreen(onRequestLocation = onRequestLocation)
        }
    }
}
```

- [ ] **Step 2: Atualizar `MainActivity` para pedir permissão de localização e montar o shell**

`MainActivity.kt`:
```kotlin
package com.busaisp.android

import android.Manifest
import android.content.pm.PackageManager
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import com.busaisp.android.ui.navigation.BusaiNavHost
import com.busaisp.android.ui.theme.BusaiSPTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { /* resultado tratado via hasLocationPermission() no próximo recompose */ }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BusaiSPTheme {
                BusaiNavHost(onRequestLocation = ::requestLocationPermission)
            }
        }
    }

    private fun requestLocationPermission() {
        val granted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) ==
            PackageManager.PERMISSION_GRANTED
        if (!granted) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        }
    }
}
```

- [ ] **Step 3: Build, instalar num emulador/dispositivo (se disponível) e commit**

Run: `.\gradlew.bat assembleDebug` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/navigation/ native-android/app/src/main/java/com/busaisp/android/MainActivity.kt
git commit -m "feat(native-android): shell de navegacao e permissao de localizacao"
```

---

## Task 11: Testes de UI reais da tela de Mapa (mesmo espírito do LiveMap.test.tsx)

**Files:**
- Test: `native-android/app/src/androidTest/java/com/busaisp/android/ui/map/MapScreenTest.kt`

- [ ] **Step 1: Escrever o teste de UI que monta a tela de verdade e clica nos controles**

`androidTest/java/com/busaisp/android/ui/map/MapScreenTest.kt`:
```kotlin
package com.busaisp.android.ui.map

import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.performTextInput
import com.busaisp.android.ui.theme.BusaiSPTheme
import org.junit.Rule
import org.junit.Test

// Mesmo espírito do LiveMap.test.tsx da versão web: monta o componente real
// (não um mock testando a si mesmo) e interage de verdade com os controles —
// pega bug de wiring quebrado (botão sem handler, tela que não renderiza).
class MapScreenTest {

    @get:Rule
    val composeRule = createComposeRule()

    @Test
    fun rendersWithoutThrowingAndLocateButtonIsClickable() {
        var locationRequested = false

        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(onRequestLocation = { locationRequested = true })
            }
        }

        composeRule.onNodeWithContentDescription("Localização atual").performClick()

        assert(locationRequested)
    }

    @Test
    fun typingInSearchFieldUpdatesTheQuery() {
        composeRule.setContent {
            BusaiSPTheme {
                MapScreen(onRequestLocation = {})
            }
        }

        composeRule.onNodeWithText("Buscar linha (ex: 1703)").performTextInput("1703")

        composeRule.onNodeWithText("1703").assertExists()
    }
}
```

- [ ] **Step 2: Rodar num emulador/dispositivo conectado**

Run: `.\gradlew.bat connectedDebugAndroidTest`
Expected: `BUILD SUCCESSFUL`, 2 testes passando. (Requer emulador/dispositivo Android
conectado — se não houver nenhum disponível neste ambiente, documentar isso
explicitamente no commit e deixar para rodar no CI do Task 12, não pular
silenciosamente.)

- [ ] **Step 3: Commit**

```bash
git add native-android/app/src/androidTest/
git commit -m "test(native-android): teste de UI real da MapScreen (clique nos controles)"
```

---

## Task 12: CI — GitHub Actions

**Files:**
- Create: `.github/workflows/native-android-ci.yml`

- [ ] **Step 1: Criar o workflow**

`.github/workflows/native-android-ci.yml`:
```yaml
name: Native Android CI

on:
  push:
    paths:
      - 'native-android/**'
      - '.github/workflows/native-android-ci.yml'
  pull_request:
    paths:
      - 'native-android/**'
      - '.github/workflows/native-android-ci.yml'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: native-android
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Grant execute permission to gradlew
        run: chmod +x gradlew
      - name: Run unit tests
        run: ./gradlew testDebugUnitTest
      - name: Assemble debug APK
        run: ./gradlew assembleDebug
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/native-android-ci.yml
git commit -m "ci(native-android): roda testes unitarios e build a cada push/PR"
```

---

## Autorevisão do plano (feita antes de entregar)

- **Cobertura da spec:** escopo (Task 1), arquitetura em camadas (Tasks 1-7),
  visual/tema (Task 2), mapa MapLibre + interpolação (Tasks 6, 8), fluxo de
  dados/erro honesto (Tasks 4, 6), testes em cada camada + CI (Tasks 4-7, 11,
  12) — todas as seções da spec têm task correspondente.
- **Placeholders:** nenhum "TBD"/"implementar depois" — os dois pontos que
  dependem de ação manual fora de código (baixar fontes no Task 2, emulador
  não disponível no Task 11) têm instrução exata e real, não vaga.
- **Consistência de tipos:** `Linha`/`Vehicle`/`VehiclesResult`/`MapUiState`
  usados com os mesmos nomes de campo em todos os tasks que os referenciam
  (`observeVehicles`, `searchLinhas`, `onLineSelected`, `onSearchQueryChanged`
  conferidos contra as assinaturas definidas nos Tasks 4-6).
- **Escopo:** este plano cobre só o sub-projeto #1. Busca completa de rota,
  navegação ativa, favoritos e telas secundárias ficam para os próximos
  planos, cada um com seu próprio ciclo spec → plano.
