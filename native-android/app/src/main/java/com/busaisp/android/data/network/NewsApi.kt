package com.busaisp.android.data.network

import com.squareup.moshi.JsonClass
import retrofit2.http.GET

@JsonClass(generateAdapter = true)
data class NewsBadgeDto(
    val label: String,
    val bg: String,
    val text: String,
    val border: String
)

@JsonClass(generateAdapter = true)
data class NewsItemDto(
    val id: String,
    val sourceType: String,
    val title: String,
    val subtitle: String?,
    val description: String,
    val fullContent: String?,
    val timestamp: String,
    val badge: NewsBadgeDto,
    val source: String,
    val categoryTag: String
)

@JsonClass(generateAdapter = true)
data class NewsResponseDto(
    val success: Boolean,
    val data: List<NewsItemDto>?,
    val total: Int?,
    val error: String?,
    val timestamp: String?
)

interface NewsApi {
    @GET("api/noticias")
    suspend fun getNews(): NewsResponseDto
}
