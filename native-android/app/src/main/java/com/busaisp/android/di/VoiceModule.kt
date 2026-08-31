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
