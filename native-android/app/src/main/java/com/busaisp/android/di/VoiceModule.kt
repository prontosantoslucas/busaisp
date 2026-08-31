package com.busaisp.android.di

import com.busaisp.android.service.VoiceAnnouncer
import com.busaisp.android.service.VoiceService
import dagger.Binds
import dagger.Module
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
abstract class VoiceModule {

    @Binds
    @Singleton
    abstract fun bindVoiceAnnouncer(impl: VoiceService): VoiceAnnouncer
}
