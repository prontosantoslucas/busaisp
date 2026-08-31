package com.busaisp.android.ui.routesearch

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.RouteRepository
import com.busaisp.android.data.repository.RouteRepositoryResult
import com.busaisp.android.data.repository.RouteTimeMode
import com.busaisp.android.domain.model.RouteLocation
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeoutOrNull
import javax.inject.Inject

// GPS pode nunca emitir (sem sinal, indoors, permissão revogada em segundo
// plano) — sem isso, .first() suspenderia para sempre e o botão "usar minha
// localização" pareceria simplesmente não fazer nada.
internal const val LOCATE_ORIGIN_TIMEOUT_MS = 15_000L

@HiltViewModel
class RouteSearchViewModel @Inject constructor(
    private val routeRepository: RouteRepository,
    private val locationClient: LocationClient
) : ViewModel() {

    private val _uiState = MutableStateFlow<RouteSearchUiState>(RouteSearchUiState.Idle)
    val uiState: StateFlow<RouteSearchUiState> = _uiState.asStateFlow()

    private val _originSuggestions = MutableStateFlow<List<RouteLocation>>(emptyList())
    val originSuggestions: StateFlow<List<RouteLocation>> = _originSuggestions.asStateFlow()

    private val _destinationSuggestions = MutableStateFlow<List<RouteLocation>>(emptyList())
    val destinationSuggestions: StateFlow<List<RouteLocation>> = _destinationSuggestions.asStateFlow()

    private val _timeMode = MutableStateFlow<RouteTimeMode>(RouteTimeMode.Now)
    val timeMode: StateFlow<RouteTimeMode> = _timeMode.asStateFlow()

    private var selectedOrigin: RouteLocation? = null
    private var selectedDestination: RouteLocation? = null

    // Melhoria auto-iniciada (fora do texto literal da tarefa): guarda o job da busca de
    // autocomplete em andamento para poder cancelá-lo a cada nova tecla digitada. Sem isso,
    // duas buscas concorrentes (uma por tecla, uma vez passado o limiar de 3 caracteres)
    // escrevem em _originSuggestions/_destinationSuggestions, e a mais lenta pode sobrescrever
    // sugestões novas com dado de uma busca ANTIGA depois que o usuário já digitou mais texto —
    // mesmo padrão de corrida que o code review pegou em MapViewModel.onLineSelected
    // (vehiclePollingJob). Ver os testes "digitar rapido no campo de origem/destino...".
    private var originSearchJob: Job? = null
    private var destinationSearchJob: Job? = null

    fun onOriginChanged(query: String) {
        selectedOrigin = null
        originSearchJob?.cancel()
        if (query.length < 3) {
            _originSuggestions.value = emptyList()
            return
        }
        originSearchJob = viewModelScope.launch {
            _originSuggestions.value = routeRepository.searchAddresses(query)
        }
    }

    fun onDestinationChanged(query: String) {
        selectedDestination = null
        destinationSearchJob?.cancel()
        if (query.length < 3) {
            _destinationSuggestions.value = emptyList()
            return
        }
        destinationSearchJob = viewModelScope.launch {
            _destinationSuggestions.value = routeRepository.searchAddresses(query)
        }
    }

    fun onOriginSelected(location: RouteLocation) {
        originSearchJob?.cancel()
        selectedOrigin = location
        _originSuggestions.value = emptyList()
    }

    fun onDestinationSelected(location: RouteLocation) {
        destinationSearchJob?.cancel()
        selectedDestination = location
        _destinationSuggestions.value = emptyList()
    }

    private var locateOriginJob: Job? = null

    fun useCurrentLocationAsOrigin() {
        if (locateOriginJob?.isActive == true) return
        locateOriginJob = viewModelScope.launch {
            val position = withTimeoutOrNull(LOCATE_ORIGIN_TIMEOUT_MS) {
                locationClient.observeLocation().first()
            }
            // TODO: se position for null (sem sinal de GPS dentro do timeout),
            // o campo de origem simplesmente não muda — não há hoje um canal de
            // feedback pro usuário saber que a tentativa falhou. Uma tarefa
            // futura de UI deve expor isso (ex: um estado de erro dedicado à
            // localização, separado do RouteSearchUiState usado pra rota).
            if (position != null) {
                onOriginSelected(RouteLocation("Minha Localização", "Localização atual pelo GPS", position.lat, position.lng))
            }
        }
    }

    fun onTimeModeChanged(mode: RouteTimeMode) {
        _timeMode.value = mode
    }

    fun calculateRoute() {
        val origin = selectedOrigin
        val destination = selectedDestination
        if (origin == null || destination == null) return

        _uiState.value = RouteSearchUiState.Loading
        viewModelScope.launch {
            when (val result = routeRepository.calculateRoute(origin, destination, _timeMode.value)) {
                is RouteRepositoryResult.Success -> _uiState.value = RouteSearchUiState.Results(result.data)
                is RouteRepositoryResult.Failure -> _uiState.value = RouteSearchUiState.Error(result.message)
            }
        }
    }
}
