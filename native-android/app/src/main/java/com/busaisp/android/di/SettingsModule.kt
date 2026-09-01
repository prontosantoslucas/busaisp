package com.busaisp.android.di

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.preferencesDataStore
import com.busaisp.android.data.settings.DataStoreThemePreferenceRepository
import com.busaisp.android.data.settings.ThemePreferenceRepository
import dagger.Binds
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Qualifier
import javax.inject.Singleton

// Qualifica o DataStore<Preferences> de configurações pra não colidir com o
// binding sem qualificador já usado por FavoritesModule (Hilt não permite dois
// provedores do mesmo tipo sem qualificador).
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class SettingsDataStore

private val Context.settingsDataStore by preferencesDataStore(name = "settings")

@Module
@InstallIn(SingletonComponent::class)
object SettingsDataStoreModule {
    @Provides
    @Singleton
    @SettingsDataStore
    fun provideSettingsDataStore(@ApplicationContext context: Context): DataStore<Preferences> =
        context.settingsDataStore
}

@Module
@InstallIn(SingletonComponent::class)
abstract class SettingsRepositoryModule {
    @Binds
    @Singleton
    abstract fun bindThemePreferenceRepository(
        impl: DataStoreThemePreferenceRepository
    ): ThemePreferenceRepository
}
