# Android Nativo — Favoritos e Personalização Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. **Processo mais rápido (pedido do usuário):** um revisor combinado (conformidade + qualidade) por task; tasks acopladas em lote.

**Goal:** Favoritos locais (sem nuvem) — favoritar rota, Casa/Trabalho editáveis, 3ª aba de navegação, atalhos de endereço na busca.

**Architecture:** `FavoriteRepository` local via Android DataStore Preferences (chave única, lista serializada com Moshi — já é dependência do projeto). Mesmo padrão de TDD/Hilt/`StateFlow`/erro honesto dos sub-projetos anteriores.

**Tech Stack:** 1 dependência nova: `androidx.datastore:datastore-preferences` (verificar a versão estável real mais recente ao implementar, não adivinhar).

---

## Task 1: FavoriteRepository local via DataStore (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/domain/model/Favorite.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/data/favorites/FavoriteRepository.kt`
- Create: `native-android/app/src/main/java/com/busaisp/android/di/FavoritesModule.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/data/favorites/FavoriteRepositoryTest.kt`
- Modify: `native-android/gradle/libs.versions.toml`, `native-android/app/build.gradle.kts` (adicionar `androidx.datastore:datastore-preferences`)

- [ ] **Step 1: Adicionar a dependência do DataStore**

Em `libs.versions.toml`, seção `[versions]`: `datastore = "1.1.1"` (ou a
versão estável real mais recente, se essa não resolver — conferir antes de
seguir, mesmo processo de ajuste real usado no resto deste plano). Seção
`[libraries]`: `androidx-datastore-preferences = { module = "androidx.datastore:datastore-preferences", version.ref = "datastore" }`.
Em `app/build.gradle.kts`, dependências: `implementation(libs.androidx.datastore.preferences)`.

- [ ] **Step 2: Modelo de domínio**

`domain/model/Favorite.kt`:
```kotlin
package com.busaisp.android.domain.model

enum class FavoriteType { LINHA, ENDERECO }

data class Favorite(
    val type: FavoriteType,
    val refCode: String,
    val title: String,
    val label: String?,
    val lat: Double? = null,
    val lng: Double? = null
)

const val FAVORITE_HOME_REF_CODE = "home"
const val FAVORITE_WORK_REF_CODE = "work"
```

- [ ] **Step 3: Escrever o teste primeiro (falha esperada)**

`data/favorites/FavoriteRepositoryTest.kt`:
```kotlin
package com.busaisp.android.data.favorites

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import com.squareup.moshi.Moshi
import com.squareup.moshi.kotlin.reflect.KotlinJsonAdapterFactory
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.test.UnconfinedTestDispatcher
import kotlinx.coroutines.test.runTest
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.rules.TemporaryFolder

class FavoriteRepositoryTest {

    @get:Rule
    val tmpFolder = TemporaryFolder()

    private fun buildRepository(): FavoriteRepository {
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val dataStore: DataStore<Preferences> = PreferenceDataStoreFactory.create(
            scope = kotlinx.coroutines.CoroutineScope(UnconfinedTestDispatcher()),
            produceFile = { tmpFolder.newFile("test_favorites_${System.nanoTime()}.preferences_pb") }
        )
        return DataStoreFavoriteRepository(dataStore, moshi)
    }

    @Test
    fun `toggleFavorite adiciona um favorito real e observeFavorites reflete`() = runTest {
        val repository = buildRepository()
        val favorite = Favorite(FavoriteType.LINHA, "1001", "1703-10 Centro", "Rota")

        repository.toggleFavorite(favorite)

        assertEquals(listOf(favorite), repository.observeFavorites().first())
    }

    @Test
    fun `toggleFavorite chamado de novo com o mesmo favorito remove ele`() = runTest {
        val repository = buildRepository()
        val favorite = Favorite(FavoriteType.LINHA, "1001", "1703-10 Centro", "Rota")

        repository.toggleFavorite(favorite)
        repository.toggleFavorite(favorite)

        assertTrue(repository.observeFavorites().first().isEmpty())
    }

    @Test
    fun `saveAddressFavorite substitui o endereco anterior do mesmo refCode`() = runTest {
        val repository = buildRepository()
        val oldHome = Favorite(FavoriteType.ENDERECO, "home", "Rua Antiga, 1", "Casa", -23.0, -46.0)
        val newHome = Favorite(FavoriteType.ENDERECO, "home", "Rua Nova, 2", "Casa", -23.1, -46.1)

        repository.saveAddressFavorite(oldHome)
        repository.saveAddressFavorite(newHome)

        val result = repository.observeFavorites().first()
        assertEquals(1, result.size)
        assertEquals(newHome, result.first())
    }

    @Test
    fun `removeFavorite remove pelo tipo e refCode reais`() = runTest {
        val repository = buildRepository()
        val favorite = Favorite(FavoriteType.LINHA, "1001", "1703-10 Centro", "Rota")
        repository.toggleFavorite(favorite)

        repository.removeFavorite(FavoriteType.LINHA, "1001")

        assertTrue(repository.observeFavorites().first().isEmpty())
    }

    @Test
    fun `payload corrompido no DataStore nao crasha observeFavorites, retorna lista vazia`() = runTest {
        val moshi = Moshi.Builder().add(KotlinJsonAdapterFactory()).build()
        val dataStore: DataStore<Preferences> = PreferenceDataStoreFactory.create(
            scope = kotlinx.coroutines.CoroutineScope(UnconfinedTestDispatcher()),
            produceFile = { tmpFolder.newFile("corrupt_${System.nanoTime()}.preferences_pb") }
        )
        dataStore.edit { it[androidx.datastore.preferences.core.stringPreferencesKey("favorites_json")] = "isto nao e json valido" }
        val repository = DataStoreFavoriteRepository(dataStore, moshi)

        val result = repository.observeFavorites().first()

        assertTrue(result.isEmpty())
    }
}
```
(precisa de `import androidx.datastore.preferences.core.edit` no teste do
payload corrompido)

- [ ] **Step 2: Rodar e confirmar falha**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.favorites.FavoriteRepositoryTest"`
Expected: FAIL — `DataStoreFavoriteRepository`/`FavoriteRepository` ainda não existem.

- [ ] **Step 4: Implementar**

`data/favorites/FavoriteRepository.kt`:
```kotlin
package com.busaisp.android.data.favorites

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import com.squareup.moshi.JsonClass
import com.squareup.moshi.Moshi
import com.squareup.moshi.Types
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val FAVORITES_KEY = stringPreferencesKey("favorites_json")

interface FavoriteRepository {
    fun observeFavorites(): Flow<List<Favorite>>
    suspend fun toggleFavorite(favorite: Favorite)
    suspend fun saveAddressFavorite(favorite: Favorite)
    suspend fun removeFavorite(type: FavoriteType, refCode: String)
}

@JsonClass(generateAdapter = true)
data class FavoriteJson(
    val type: String,
    val refCode: String,
    val title: String,
    val label: String?,
    val lat: Double?,
    val lng: Double?
)

@Singleton
class DataStoreFavoriteRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
    private val moshi: Moshi
) : FavoriteRepository {

    private val listType = Types.newParameterizedType(List::class.java, FavoriteJson::class.java)
    private val adapter = moshi.adapter<List<FavoriteJson>>(listType)

    override fun observeFavorites(): Flow<List<Favorite>> =
        dataStore.data.map { prefs -> readList(prefs).map { it.toDomain() } }

    override suspend fun toggleFavorite(favorite: Favorite) {
        dataStore.edit { prefs ->
            val current = readList(prefs)
            val exists = current.any { it.type == favorite.type.name && it.refCode == favorite.refCode }
            val updated = if (exists) {
                current.filterNot { it.type == favorite.type.name && it.refCode == favorite.refCode }
            } else {
                current + favorite.toJson()
            }
            prefs[FAVORITES_KEY] = adapter.toJson(updated)
        }
    }

    override suspend fun saveAddressFavorite(favorite: Favorite) {
        dataStore.edit { prefs ->
            val current = readList(prefs)
                .filterNot { it.type == favorite.type.name && it.refCode == favorite.refCode }
            prefs[FAVORITES_KEY] = adapter.toJson(current + favorite.toJson())
        }
    }

    override suspend fun removeFavorite(type: FavoriteType, refCode: String) {
        dataStore.edit { prefs ->
            val current = readList(prefs).filterNot { it.type == type.name && it.refCode == refCode }
            prefs[FAVORITES_KEY] = adapter.toJson(current)
        }
    }

    // Payload corrompido/inesperado nunca crasha — degrada pra lista vazia,
    // mesma disciplina de erro honesto do resto do projeto.
    private fun readList(prefs: Preferences): List<FavoriteJson> {
        val json = prefs[FAVORITES_KEY] ?: return emptyList()
        return runCatching { adapter.fromJson(json) }.getOrNull() ?: emptyList()
    }
}

private fun Favorite.toJson() = FavoriteJson(type.name, refCode, title, label, lat, lng)

private fun FavoriteJson.toDomain() = Favorite(
    type = runCatching { FavoriteType.valueOf(type) }.getOrDefault(FavoriteType.LINHA),
    refCode = refCode,
    title = title,
    label = label,
    lat = lat,
    lng = lng
)
```

`di/FavoritesModule.kt`:
```kotlin
package com.busaisp.android.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.busaisp.android.data.favorites.DataStoreFavoriteRepository
import com.busaisp.android.data.favorites.FavoriteRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

private val Context.favoritesDataStore by preferencesDataStore(name = "favorites")

@Module
@InstallIn(SingletonComponent::class)
object FavoritesDataStoreModule {
    @Provides
    @Singleton
    fun provideFavoritesDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        context.favoritesDataStore
}

@Module
@InstallIn(SingletonComponent::class)
abstract class FavoritesRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindFavoriteRepository(impl: DataStoreFavoriteRepository): FavoriteRepository
}
```

- [ ] **Step 5: Rodar de novo e confirmar sucesso**

Run: `.\gradlew.bat testDebugUnitTest --tests "com.busaisp.android.data.favorites.FavoriteRepositoryTest"`
Expected: `BUILD SUCCESSFUL`, 5 testes passando.

- [ ] **Step 6: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`, 45+5=50 testes.

```bash
git add native-android/app/src/main/java/com/busaisp/android/domain/model/Favorite.kt native-android/app/src/main/java/com/busaisp/android/data/favorites/ native-android/app/src/main/java/com/busaisp/android/di/FavoritesModule.kt native-android/app/src/test/java/com/busaisp/android/data/favorites/ native-android/gradle/libs.versions.toml native-android/app/build.gradle.kts
git commit -m "feat(native-android): FavoriteRepository local via DataStore (TDD)"
```

---

## Task 2: FavoritesViewModel (TDD)

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/favorites/FavoritesViewModel.kt`
- Test: `native-android/app/src/test/java/com/busaisp/android/ui/favorites/FavoritesViewModelTest.kt`

- [ ] **Step 1: Escrever o teste primeiro**

`ui/favorites/FavoritesViewModelTest.kt`:
```kotlin
package com.busaisp.android.ui.favorites

import com.busaisp.android.data.favorites.FavoriteRepository
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class FavoritesViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private class FakeFavoriteRepository(initial: List<Favorite> = emptyList()) : FavoriteRepository {
        private val state = MutableStateFlow(initial)
        override fun observeFavorites() = state
        override suspend fun toggleFavorite(favorite: Favorite) {
            state.value = if (state.value.any { it.type == favorite.type && it.refCode == favorite.refCode }) {
                state.value.filterNot { it.type == favorite.type && it.refCode == favorite.refCode }
            } else {
                state.value + favorite
            }
        }
        override suspend fun saveAddressFavorite(favorite: Favorite) {
            state.value = state.value.filterNot { it.type == favorite.type && it.refCode == favorite.refCode } + favorite
        }
        override suspend fun removeFavorite(type: FavoriteType, refCode: String) {
            state.value = state.value.filterNot { it.type == type && it.refCode == refCode }
        }
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `homeAddress reflete o favorito real de Casa salvo`() = runTest {
        val home = Favorite(FavoriteType.ENDERECO, "home", "Rua Real, 1", "Casa", -23.0, -46.0)
        val viewModel = FavoritesViewModel(FakeFavoriteRepository(listOf(home)))
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(home, viewModel.homeAddress.value)
    }

    @Test
    fun `homeAddress e nulo quando Casa nunca foi definida`() = runTest {
        val viewModel = FavoritesViewModel(FakeFavoriteRepository(emptyList()))
        dispatcher.scheduler.advanceUntilIdle()

        assertNull(viewModel.homeAddress.value)
    }

    @Test
    fun `isRouteFavorited reflete o estado real apos toggle`() = runTest {
        val repository = FakeFavoriteRepository(emptyList())
        val viewModel = FavoritesViewModel(repository)
        val favorite = Favorite(FavoriteType.LINHA, "1001", "1703-10 Centro", "Rota")

        viewModel.toggleFavorite(favorite)
        dispatcher.scheduler.advanceUntilIdle()

        assertEquals(listOf(favorite), viewModel.favorites.value)
    }
}
```

- [ ] **Step 2: Rodar e confirmar falha, depois implementar**

`ui/favorites/FavoritesViewModel.kt`:
```kotlin
package com.busaisp.android.ui.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.favorites.FavoriteRepository
import com.busaisp.android.domain.model.FAVORITE_HOME_REF_CODE
import com.busaisp.android.domain.model.FAVORITE_WORK_REF_CODE
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val favoriteRepository: FavoriteRepository
) : ViewModel() {

    val favorites: StateFlow<List<Favorite>> = favoriteRepository.observeFavorites()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    val homeAddress: StateFlow<Favorite?> = favorites
        .map { list -> list.firstOrNull { it.type == FavoriteType.ENDERECO && it.refCode == FAVORITE_HOME_REF_CODE } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val workAddress: StateFlow<Favorite?> = favorites
        .map { list -> list.firstOrNull { it.type == FavoriteType.ENDERECO && it.refCode == FAVORITE_WORK_REF_CODE } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), null)

    val routeFavorites: StateFlow<List<Favorite>> = favorites
        .map { list -> list.filter { it.type == FavoriteType.LINHA } }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), emptyList())

    fun toggleFavorite(favorite: Favorite) {
        viewModelScope.launch { favoriteRepository.toggleFavorite(favorite) }
    }

    fun saveHomeAddress(title: String, lat: Double, lng: Double) {
        viewModelScope.launch {
            favoriteRepository.saveAddressFavorite(Favorite(FavoriteType.ENDERECO, FAVORITE_HOME_REF_CODE, title, "Casa", lat, lng))
        }
    }

    fun saveWorkAddress(title: String, lat: Double, lng: Double) {
        viewModelScope.launch {
            favoriteRepository.saveAddressFavorite(Favorite(FavoriteType.ENDERECO, FAVORITE_WORK_REF_CODE, title, "Trabalho", lat, lng))
        }
    }

    fun removeFavorite(favorite: Favorite) {
        viewModelScope.launch { favoriteRepository.removeFavorite(favorite.type, favorite.refCode) }
    }
}
```

- [ ] **Step 3: Confirmar testes passando e build completo**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`, 50+3=53 testes.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/favorites/ native-android/app/src/test/java/com/busaisp/android/ui/favorites/
git commit -m "feat(native-android): FavoritesViewModel com Casa/Trabalho reais (TDD)"
```

---

## Task 3: Tela de Favoritos e 3ª aba de navegação

**Files:**
- Create: `native-android/app/src/main/java/com/busaisp/android/ui/favorites/FavoritesScreen.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt`

- [ ] **Step 1: Tela de Favoritos**

`ui/favorites/FavoritesScreen.kt`:
```kotlin
package com.busaisp.android.ui.favorites

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.ui.routesearch.RouteSearchViewModel
import com.busaisp.android.ui.routesearch.components.AddressField

@Composable
fun FavoritesScreen(
    viewModel: FavoritesViewModel = hiltViewModel(),
    routeSearchViewModel: RouteSearchViewModel = hiltViewModel()
) {
    val home by viewModel.homeAddress.collectAsStateWithLifecycle()
    val work by viewModel.workAddress.collectAsStateWithLifecycle()
    val routeFavorites by viewModel.routeFavorites.collectAsStateWithLifecycle()
    val suggestions by routeSearchViewModel.originSuggestions.collectAsStateWithLifecycle()

    var editingSlot by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Meus Endereços", style = MaterialTheme.typography.titleMedium)

        AddressSlotRow(
            label = "Casa",
            value = home?.title,
            onClick = { editingSlot = "home"; query = "" },
        )
        AddressSlotRow(
            label = "Trabalho",
            value = work?.title,
            onClick = { editingSlot = "work"; query = "" },
        )

        if (editingSlot != null) {
            AddressField(
                label = "Buscar endereço",
                query = query,
                suggestions = suggestions,
                onQueryChanged = { query = it; routeSearchViewModel.onOriginChanged(it) },
                onSuggestionSelected = { location: RouteLocation ->
                    if (editingSlot == "home") {
                        viewModel.saveHomeAddress(location.name, location.lat, location.lng)
                    } else {
                        viewModel.saveWorkAddress(location.name, location.lat, location.lng)
                    }
                    editingSlot = null
                }
            )
        }

        Text("Rotas favoritas", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 24.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(routeFavorites, key = { it.type.name + it.refCode }) { favorite ->
                FavoriteRow(favorite = favorite, onRemove = { viewModel.removeFavorite(favorite) })
            }
        }
    }
}

@Composable
private fun AddressSlotRow(label: String, value: String?, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp)
    ) {
        Text(text = label, style = MaterialTheme.typography.labelLarge)
        Text(text = value ?: "Definir endereço", modifier = Modifier.padding(start = 8.dp))
    }
}

@Composable
private fun FavoriteRow(favorite: Favorite, onRemove: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(text = favorite.title, modifier = Modifier.fillMaxWidth())
        IconButton(onClick = onRemove) {
            Icon(Icons.Filled.Close, contentDescription = "Remover ${favorite.title} dos favoritos")
        }
    }
}
```

**Nota real sobre o autocomplete de Casa/Trabalho**: reaproveita
`routeSearchViewModel.onOriginChanged`/`originSuggestions` (já existentes,
sub-projeto #2) só como motor de busca de endereço — não afeta o estado real
de busca de rota daquele ViewModel além do campo de sugestões, que é
resetado (`emptyList()`) pelo próprio `onOriginChanged` na próxima vez que a
tela de busca for aberta com uma query diferente. Isso evita duplicar a
lógica de autocomplete de endereço só pra esta tela.

- [ ] **Step 2: Adicionar a 3ª aba e o destino**

Em `BusaiNavHost.kt`: adicionar `FAVORITES = "favorites"` a
`BusaiDestinations`; adicionar `BottomTab(BusaiDestinations.FAVORITES, "Favoritos", Icons.Filled.Star)`
a `BOTTOM_TABS`; adicionar `composable(BusaiDestinations.FAVORITES) { FavoritesScreen() }`;
incluir `BusaiDestinations.FAVORITES` na condição que decide mostrar a barra
inferior (hoje só `MAP`/`ROUTE_SEARCH` — adicionar `FAVORITES` à lista).

- [ ] **Step 3: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/favorites/FavoritesScreen.kt native-android/app/src/main/java/com/busaisp/android/ui/navigation/BusaiNavHost.kt
git commit -m "feat(native-android): tela de Favoritos com Casa/Trabalho editaveis e 3a aba de navegacao"
```

---

## Task 4: Estrela de favoritar em resultados de rota + atalhos de Casa/Trabalho na busca

**Files:**
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/components/RoutePlanCard.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteResultsScreen.kt`
- Modify: `native-android/app/src/main/java/com/busaisp/android/ui/routesearch/RouteSearchScreen.kt`

- [ ] **Step 1: `RoutePlanCard` ganha estrela real de favoritar**

Adicionar parâmetros `isFavorited: Boolean` e `onToggleFavorite: () -> Unit`
a `RoutePlanCard`, e um `IconButton` (ícone de estrela preenchida/vazia
conforme `isFavorited`) posicionado no canto do card, chamando
`onToggleFavorite` ao tocar.

- [ ] **Step 2: `RouteResultsScreen` calcula o estado real de favorito por card**

Adicionar `favoritesViewModel: FavoritesViewModel = hiltViewModel()`
(escopo padrão da tela — não precisa ser compartilhado com `RouteSearchViewModel`,
já que só lê a lista de favoritos, que já é global via DataStore) como
parâmetro. Coletar `favoritesViewModel.favorites` e, pra cada `RoutePlanCard`,
calcular `isFavorited = favorites.any { it.type == FavoriteType.LINHA && it.refCode == plan.recommendedLine.codigo.toString() }`
e `onToggleFavorite = { favoritesViewModel.toggleFavorite(Favorite(FavoriteType.LINHA, plan.recommendedLine.codigo.toString(), "${plan.recommendedLine.letreiro} ${plan.destination.name}", "Rota")) }`
— mesma lógica real do app web (`page.tsx:405-414`), só traduzida.

- [ ] **Step 3: Atalhos de Casa/Trabalho na tela de busca**

Em `RouteSearchScreen.kt`, adicionar `favoritesViewModel: FavoritesViewModel = hiltViewModel()`,
coletar `homeAddress`/`workAddress`, e mostrar 2 `FilterChip`s (só se o
respectivo endereço existir) acima do campo de origem — tocar num chip chama
`viewModel.onOriginSelected(RouteLocation(home.title, null, home.lat!!, home.lng!!))`
diretamente (preenchendo o campo de origem com o endereço real salvo, sem
precisar digitar).

- [ ] **Step 4: Build completo e commit**

Run: `.\gradlew.bat assembleDebug testDebugUnitTest` — Expected: `BUILD SUCCESSFUL`.

```bash
git add native-android/app/src/main/java/com/busaisp/android/ui/routesearch/
git commit -m "feat(native-android): favoritar rota real na lista de resultados e atalhos de Casa/Trabalho"
```

---

## Task 5: Testes de UI e revisão holística de fechamento

**Files:**
- Test: `native-android/app/src/androidTest/java/com/busaisp/android/ui/favorites/FavoritesScreenTest.kt`

- [ ] **Step 1: Escrever testes reais de UI (mesmo padrão dos sub-projetos anteriores — fakes via parâmetro, sem Hilt-testing)**

Cobrir: tela renderiza sem lançar exceção; definir Casa via busca real
salva e reflete no slot; remover uma rota favorita da lista funciona.
Seguir exatamente o padrão de `RouteSearchScreenTest.kt` (fakes de
`FavoriteRepository`/`RouteRepository`/`LocationClient`, `viewModel =`
como override explícito).

- [ ] **Step 2: Tentar `connectedDebugAndroidTest` e documentar honestamente o resultado esperado de "sem dispositivo"**

Mesma disciplina de todas as tasks de teste de UI deste projeto.

- [ ] **Step 3: Commit dos testes**

```bash
git add native-android/app/src/androidTest/java/com/busaisp/android/ui/favorites/
git commit -m "test(native-android): testes de UI reais da tela de Favoritos"
```

- [ ] **Step 4: Revisão holística** — reler o diff inteiro do sub-projeto,
traçar o fluxo real (favoritar uma rota → aparece na aba Favoritos →
definir Casa/Trabalho → atalho aparece na busca → usar atalho preenche
origem real), rodar `.\gradlew.bat clean assembleDebug testDebugUnitTest`
do zero, e só então enviar a branch e abrir PR contra `master`, atualizando
`HANDOFF.md`.

---

## Autorevisão do plano

- **Cobertura da spec**: repositório local (Task 1), Casa/Trabalho editáveis
  + lista de rotas favoritas (Task 2/3), estrela nos resultados + atalhos na
  busca (Task 4) — toda a seção "Entra" do spec tem task correspondente.
- **Placeholders**: nenhum "TBD". A decisão de reaproveitar
  `RouteSearchViewModel.onOriginChanged` como motor de autocomplete dentro
  da tela de Favoritos está documentada com razão explícita (Task 3).
- **Consistência de tipos**: `Favorite`/`FavoriteType`/`FAVORITE_HOME_REF_CODE`/`FAVORITE_WORK_REF_CODE`
  usados com os mesmos nomes em todas as tasks que os referenciam.
- **Risco identificado**: Task 1 adiciona uma dependência nova
  (`datastore-preferences`) — se a versão pinada não resolver, é esperado
  ajustar (mesmo processo já usado em todo o resto do projeto), não motivo
  pra travar.
