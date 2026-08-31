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
