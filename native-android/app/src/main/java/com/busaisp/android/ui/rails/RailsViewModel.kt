package com.busaisp.android.ui.rails

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.repository.RailsRepository
import com.busaisp.android.data.repository.RailsResult
import com.busaisp.android.domain.model.RailsData
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface RailsUiState {
    object Loading : RailsUiState
    data class Success(val data: RailsData) : RailsUiState
    data class Error(val message: String) : RailsUiState
}

@HiltViewModel
class RailsViewModel @Inject constructor(
    private val repository: RailsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<RailsUiState>(RailsUiState.Loading)
    val uiState: StateFlow<RailsUiState> = _uiState.asStateFlow()

    init {
        loadRailsStatus()
    }

    fun refresh() {
        loadRailsStatus()
    }

    private fun loadRailsStatus() {
        viewModelScope.launch {
            _uiState.value = RailsUiState.Loading
            when (val result = repository.getRailsStatus()) {
                is RailsResult.Success -> _uiState.value = RailsUiState.Success(result.data)
                is RailsResult.Failure -> _uiState.value = RailsUiState.Error(result.message)
            }
        }
    }
}
