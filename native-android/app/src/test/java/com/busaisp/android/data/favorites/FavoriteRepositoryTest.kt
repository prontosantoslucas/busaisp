package com.busaisp.android.data.favorites

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
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
        dataStore.edit { it[stringPreferencesKey("favorites_json")] = "isto nao e json valido" }
        val repository = DataStoreFavoriteRepository(dataStore, moshi)

        val result = repository.observeFavorites().first()

        assertTrue(result.isEmpty())
    }
}
