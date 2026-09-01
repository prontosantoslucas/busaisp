package com.busaisp.android.data.settings

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.busaisp.android.di.SettingsDataStore
import com.busaisp.android.ui.theme.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

private val THEME_MODE_KEY = stringPreferencesKey("theme_mode")

interface ThemePreferenceRepository {
    fun observeThemeMode(): Flow<ThemeMode>
    suspend fun setThemeMode(mode: ThemeMode)
}

@Singleton
class DataStoreThemePreferenceRepository @Inject constructor(
    @SettingsDataStore private val dataStore: DataStore<Preferences>
) : ThemePreferenceRepository {

    override fun observeThemeMode(): Flow<ThemeMode> =
        dataStore.data.map { prefs ->
            // Valor corrompido/desconhecido nunca crasha — degrada pra SISTEMA,
            // mesma disciplina de erro honesto do resto do projeto.
            prefs[THEME_MODE_KEY]?.let { raw -> runCatching { ThemeMode.valueOf(raw) }.getOrNull() }
                ?: ThemeMode.SISTEMA
        }

    override suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { prefs -> prefs[THEME_MODE_KEY] = mode.name }
    }
}
