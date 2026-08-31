package com.busaisp.android.data.remote

import com.busaisp.android.data.remote.dto.LinhasResponseDto
import com.busaisp.android.data.remote.dto.PosicaoResponseDto
import retrofit2.http.GET
import retrofit2.http.Query

interface BusaiApiService {

    @GET("api/onibus")
    suspend fun getPosicaoLinha(
        @Query("tipo") tipo: String = "posicao",
        @Query("codigo") codigo: Int,
        @Query("letreiro") letreiro: String
    ): PosicaoResponseDto

    @GET("api/onibus")
    suspend fun getLinhas(
        @Query("tipo") tipo: String = "linhas",
        @Query("q") query: String
    ): LinhasResponseDto
}
