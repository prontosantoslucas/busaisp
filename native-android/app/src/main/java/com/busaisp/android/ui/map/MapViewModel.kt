package com.busaisp.android.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.domain.interpolatePosition
import com.busaisp.android.domain.model.Linha
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
    private val lineSearchRepository: LineSearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<MapUiState>(MapUiState.Idle)
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    private val _lineSearchResults = MutableStateFlow<List<Linha>>(emptyList())
    val lineSearchResults: StateFlow<List<Linha>> = _lineSearchResults.asStateFlow()

    // Melhoria auto-iniciada (fora do texto literal da tarefa): guarda o job do
    // polling em andamento para poder cancelá-lo ao trocar de linha. Sem isso,
    // selecionar uma linha nova antes do polling anterior "morrer" sozinho deixa
    // duas coletas concorrentes escrevendo em _uiState, e a mais lenta pode
    // sobrescrever o estado com dados da linha ANTIGA depois que a nova já foi
    // selecionada (ver teste "trocar de linha antes do polling anterior terminar...").
    private var vehiclePollingJob: Job? = null

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

    fun onSearchQueryChanged(query: String) {
        if (query.length < 2) {
            _lineSearchResults.value = emptyList()
            return
        }
        viewModelScope.launch {
            _lineSearchResults.value = lineSearchRepository.searchLinhas(query)
        }
    }

    fun interpolatedPosition(vehicleLat: Double, vehicleLng: Double, headingDegrees: Double?, speedKmh: Double?, lastUpdateEpochMs: Long) =
        interpolatePosition(
            com.busaisp.android.domain.model.Vehicle(
                prefix = "", lat = vehicleLat, lng = vehicleLng,
                headingDegrees = headingDegrees, speedKmh = speedKmh,
                lastUpdateEpochMs = lastUpdateEpochMs, accessible = false
            ),
            nowEpochMs = System.currentTimeMillis()
        )
}
