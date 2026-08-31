package com.busaisp.android.domain.model

enum class FavoriteType { LINHA, ENDERECO }

data class Favorite(
    val type: FavoriteType,
    val refCode: String,
    val title: String,
    val label: String?,
    val lat: Double? = null,
    val lng: Double? = null
)

const val FAVORITE_HOME_REF_CODE = "home"
const val FAVORITE_WORK_REF_CODE = "work"
