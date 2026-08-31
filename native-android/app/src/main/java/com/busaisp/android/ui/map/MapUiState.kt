package com.busaisp.android.ui.map

import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle

sealed interface MapUiState {
    data object Idle : MapUiState
    data object Loading : MapUiState
    data class WithVehicles(
        val linha: Linha,
        val vehicles: List<Vehicle>,
        val lastUpdatedEpochMs: Long,
        val isStale: Boolean = false
    ) : MapUiState
    data class Error(val message: String) : MapUiState
}
