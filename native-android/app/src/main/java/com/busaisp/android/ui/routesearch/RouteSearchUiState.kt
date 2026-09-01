package com.busaisp.android.ui.routesearch

import com.busaisp.android.domain.model.RouteSearchResult

sealed interface RouteSearchUiState {
    data object Idle : RouteSearchUiState
    data object Loading : RouteSearchUiState
    data class Results(val result: RouteSearchResult) : RouteSearchUiState
    data class Error(val message: String) : RouteSearchUiState
}
