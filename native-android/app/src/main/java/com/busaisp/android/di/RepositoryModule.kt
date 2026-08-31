package com.busaisp.android.di

import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.BusRepositoryImpl
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.data.repository.LineSearchRepositoryImpl
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryImpl
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

    @Binds
    @Singleton
    abstract fun bindLineSearchRepository(impl: LineSearchRepositoryImpl): LineSearchRepository

    @Binds
    @Singleton
    abstract fun bindRouteRepository(impl: RouteRepositoryImpl): RouteRepository
}
