package com.busaisp.android.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.data.repository.TrafficRepository
import com.busaisp.android.data.repository.TrafficResult
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.TrafficHeatmapData
import com.busaisp.android.domain.model.VehiclesResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// Se um ciclo de polling falhar mas ainda houver posições recentes, elas
// continuam visíveis por até esse tempo com indicação de "desatualizado",
// depois somem — nunca ficam "andando" com dado velho.
private const val STALE_GRACE_MS = 90_000L

@HiltViewModel
class MapViewModel @Inject constructor(
    private val busRepository: BusRepository,
    private val lineSearchRepository: LineSearchRepository,
    private val locationClient: LocationClient,
    private val trafficRepository: TrafficRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MapUiState>(MapUiState.Idle)
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    private val _lineSearchResults = MutableStateFlow<List<Linha>>(emptyList())
    val lineSearchResults: StateFlow<List<Linha>> = _lineSearchResults.asStateFlow()

    private val _userLocation = MutableStateFlow<LocationClient.Position?>(null)
    val userLocation: StateFlow<LocationClient.Position?> = _userLocation.asStateFlow()

    private val _isHeatmapVisible = MutableStateFlow(false)
    val isHeatmapVisible: StateFlow<Boolean> = _isHeatmapVisible.asStateFlow()

    private val _heatmapData = MutableStateFlow<TrafficHeatmapData?>(null)
    val heatmapData: StateFlow<TrafficHeatmapData?> = _heatmapData.asStateFlow()

    private val _isLoadingHeatmap = MutableStateFlow(false)
    val isLoadingHeatmap: StateFlow<Boolean> = _isLoadingHeatmap.asStateFlow()

    private var locationJob: Job? = null
    private var vehiclePollingJob: Job? = null
    private var heatmapJob: Job? = null

    fun toggleTrafficHeatmap() {
        val next = !_isHeatmapVisible.value
        _isHeatmapVisible.value = next
        if (next && _heatmapData.value == null) {
            refreshTrafficHeatmap()
        }
    }

    fun refreshTrafficHeatmap() {
        heatmapJob?.cancel()
        heatmapJob = viewModelScope.launch {
            _isLoadingHeatmap.value = true
            val loc = _userLocation.value
            val lat = loc?.lat ?: -23.55
            val lng = loc?.lng ?: -46.63
            when (val result = trafficRepository.getTrafficHeatmap(lat, lng)) {
                is TrafficResult.Success -> _heatmapData.value = result.data
                is TrafficResult.Failure -> { /* Mantém dado anterior se houver */ }
            }
            _isLoadingHeatmap.value = false
        }
    }

    fun onLineSelected(linha: Linha) {
        vehiclePollingJob?.cancel()
        _uiState.value = MapUiState.Loading
        vehiclePollingJob = viewModelScope.launch {
            busRepository.observeVehicles(linha).collect { result ->
                _uiState.value = when (result) {
                    is VehiclesResult.Success -> MapUiState.WithVehicles(
                        linha = linha,
                        vehicles = result.vehicles,
                        lastUpdatedEpochMs = result.fetchedAtEpochMs
                    )
                    is VehiclesResult.Failure -> {
                        val current = _uiState.value
                        if (current is MapUiState.WithVehicles &&
                            System.currentTimeMillis() - current.lastUpdatedEpochMs < STALE_GRACE_MS
                        ) {
                            current.copy(isStale = true)
                        } else {
                            MapUiState.Error(result.message)
                        }
                    }
                }
            }
        }
    }

    private val _recenterTrigger = MutableStateFlow(0)
    val recenterTrigger: StateFlow<Int> = _recenterTrigger.asStateFlow()

    fun recenterOnUser() {
        _recenterTrigger.value += 1
    }

    fun onLocationPermissionGranted() {
        recenterOnUser()
        if (locationJob?.isActive == true) return
        locationJob = viewModelScope.launch {
            locationClient.observeLocation().collect { position ->
                _userLocation.value = position
            }
        }
    }

    fun onSearchQueryChanged(query: String) {
        if (query.length < 2) {
            _lineSearchResults.value = emptyList()
            return
        }
        viewModelScope.launch {
            _lineSearchResults.value = lineSearchRepository.searchLinhas(query)
        }
    }
}
