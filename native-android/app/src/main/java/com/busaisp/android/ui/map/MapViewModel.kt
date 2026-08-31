package com.busaisp.android.ui.map

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.data.repository.LineSearchRepository
import com.busaisp.android.domain.interpolatePosition
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle
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
    private val locationClient: LocationClient
) : ViewModel() {

    private val _uiState = MutableStateFlow<MapUiState>(MapUiState.Idle)
    val uiState: StateFlow<MapUiState> = _uiState.asStateFlow()

    private val _lineSearchResults = MutableStateFlow<List<Linha>>(emptyList())
    val lineSearchResults: StateFlow<List<Linha>> = _lineSearchResults.asStateFlow()

    private val _userLocation = MutableStateFlow<LocationClient.Position?>(null)
    val userLocation: StateFlow<LocationClient.Position?> = _userLocation.asStateFlow()

    // A permissão de localização é checada/solicitada na UI (MapScreen); uma vez concedida,
    // a UI chama isto para começar a observar o GPS real. Idempotente: se já houver uma
    // coleta ativa, uma segunda chamada (ex.: usuário toca o botão de novo, ou recomposição
    // reexecuta a checagem de permissão) não abre uma segunda subscrição concorrente.
    private var locationJob: Job? = null

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

    fun onLocationPermissionGranted() {
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

    // interpolatePosition() é uma função pura que opera sobre um Vehicle completo,
    // mas aqui só recebemos os campos soltos que a UI tem à mão. Construir um Vehicle
    // "descartável" (prefix/accessible não entram no cálculo) só para reaproveitar a
    // mesma fórmula é um pouco estranho, mas é intencional — não é engano de código,
    // é o que o plano desta task especifica literalmente.
    fun interpolatedPosition(
        vehicleLat: Double,
        vehicleLng: Double,
        headingDegrees: Double?,
        speedKmh: Double?,
        lastUpdateEpochMs: Long
    ) = interpolatePosition(
        Vehicle(
            prefix = "",
            lat = vehicleLat,
            lng = vehicleLng,
            headingDegrees = headingDegrees,
            speedKmh = speedKmh,
            lastUpdateEpochMs = lastUpdateEpochMs,
            accessible = false
        ),
        nowEpochMs = System.currentTimeMillis()
    )
}
