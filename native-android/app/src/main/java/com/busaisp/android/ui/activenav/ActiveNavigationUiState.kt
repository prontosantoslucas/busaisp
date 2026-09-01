package com.busaisp.android.ui.activenav

data class ActiveNavigationUiState(
    val hasBoarded: Boolean = false,
    val isOffRoute: Boolean = false,
    val lineDisplay: String = "",
    val destinationName: String = ""
)
