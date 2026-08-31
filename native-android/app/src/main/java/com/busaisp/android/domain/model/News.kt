package com.busaisp.android.domain.model

enum class NewsSourceType {
    ALL,
    TRANSITO,
    TRILHOS,
    SPTRANS,
    INFORMATIVOS
}

data class NewsBadge(
    val label: String,
    val bg: String,
    val text: String,
    val border: String
)

data class NewsItem(
    val id: String,
    val sourceType: NewsSourceType,
    val title: String,
    val subtitle: String?,
    val description: String,
    val fullContent: String?,
    val timestamp: String,
    val badge: NewsBadge,
    val source: String,
    val categoryTag: String
)
