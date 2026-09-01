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
