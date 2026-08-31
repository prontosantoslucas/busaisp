package com.busaisp.android.data.remote

import com.busaisp.android.data.remote.dto.AddressSuggestionsResponseDto
import com.busaisp.android.data.remote.dto.LinhasResponseDto
import com.busaisp.android.data.remote.dto.PosicaoResponseDto
import com.busaisp.android.data.remote.dto.RouteSearchResponseDto
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

    @GET("api/rotas")
    suspend fun getRoutes(
        @Query("origLat") origLat: Double? = null,
        @Query("origLng") origLng: Double? = null,
        @Query("origem") origem: String? = null,
        @Query("destLat") destLat: Double? = null,
        @Query("destLng") destLng: Double? = null,
        @Query("destino") destino: String? = null,
        @Query("partidaMinutos") partidaMinutos: Int? = null,
        @Query("chegadaHorario") chegadaHorario: String? = null
    ): RouteSearchResponseDto

    @GET("api/rotas")
    suspend fun getAddressSuggestions(
        @Query("tipo") tipo: String = "sugestoes",
        @Query("q") query: String
    ): AddressSuggestionsResponseDto
}
