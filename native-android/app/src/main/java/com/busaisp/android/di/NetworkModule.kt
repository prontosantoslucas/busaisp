package com.busaisp.android.di

import com.busaisp.android.data.remote.BusaiApiService
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

    @Provides
    @Singleton
    fun provideRailsApi(retrofit: Retrofit): com.busaisp.android.data.network.RailsApi =
        retrofit.create(com.busaisp.android.data.network.RailsApi::class.java)

    @Provides
    @Singleton
    fun provideNewsApi(retrofit: Retrofit): com.busaisp.android.data.network.NewsApi =
        retrofit.create(com.busaisp.android.data.network.NewsApi::class.java)
}
