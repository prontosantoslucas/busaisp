package com.busaisp.android.data.repository

import com.busaisp.android.data.network.NewsApi
import com.busaisp.android.data.network.NewsItemDto
import com.busaisp.android.domain.model.NewsBadge
import com.busaisp.android.domain.model.NewsItem
import com.busaisp.android.domain.model.NewsSourceType
import javax.inject.Inject
import javax.inject.Singleton

sealed interface NewsResult {
    data class Success(val items: List<NewsItem>) : NewsResult
    data class Failure(val message: String) : NewsResult
}

interface NewsRepository {
    suspend fun getNews(): NewsResult
}

@Singleton
class NetworkNewsRepository @Inject constructor(
    private val api: NewsApi
) : NewsRepository {

    override suspend fun getNews(): NewsResult {
        return try {
            val response = api.getNews()
            val itemsDto = response.data
            if (response.success && itemsDto != null) {
                val items = itemsDto.map { it.toDomain() }
                NewsResult.Success(items)
            } else {
                NewsResult.Failure(response.error ?: "Não foi possível carregar as notícias.")
            }
        } catch (e: Exception) {
            NewsResult.Failure("Falha de conexão ao carregar notícias: ${e.localizedMessage ?: "Erro de rede"}")
        }
    }
}

private fun NewsItemDto.toDomain(): NewsItem {
    val sourceTypeEnum = runCatching { NewsSourceType.valueOf(sourceType.uppercase()) }
        .getOrDefault(NewsSourceType.INFORMATIVOS)

    return NewsItem(
        id = id,
        sourceType = sourceTypeEnum,
        title = title,
        subtitle = subtitle,
        description = description,
        fullContent = fullContent,
        timestamp = timestamp,
        badge = NewsBadge(
            label = badge.label,
            bg = badge.bg,
            text = badge.text,
            border = badge.border
        ),
        source = source,
        categoryTag = categoryTag
    )
}
