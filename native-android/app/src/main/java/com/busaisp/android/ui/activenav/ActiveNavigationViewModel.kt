package com.busaisp.android.ui.activenav

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.domain.distanceToPolylineMeters
import com.busaisp.android.domain.GeoPoint
import com.busaisp.android.domain.getDistanceMeters
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.service.VoiceAnnouncer
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.Job
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import javax.inject.Inject

// Limiares reais, idênticos ao app web (src/app/page.tsx): 45m pra
// considerar embarcado num veículo real da linha, 250m de distância da
// polyline planejada pra considerar desvio de rota.
private const val BOARDING_PROXIMITY_METERS = 45.0
private const val OFF_ROUTE_THRESHOLD_METERS = 250.0

@HiltViewModel
class ActiveNavigationViewModel @Inject constructor(
    private val busRepository: BusRepository,
    private val locationClient: LocationClient,
    private val voiceService: VoiceAnnouncer
) : ViewModel() {

    private val _uiState = MutableStateFlow(ActiveNavigationUiState())
    val uiState: StateFlow<ActiveNavigationUiState> = _uiState.asStateFlow()

    private var trackingJob: Job? = null

    fun start(plan: RoutePlan) {
        if (trackingJob?.isActive == true) return

        _uiState.value = ActiveNavigationUiState(
            lineDisplay = if (plan.isRail) plan.recommendedLine.letreiro else "${plan.recommendedLine.letreiro}-${plan.recommendedLine.tipoLinha}",
            destinationName = plan.destination.name
        )

        trackingJob = viewModelScope.launch {
            combine(
                busRepository.observeVehicles(plan.recommendedLine),
                locationClient.observeLocation()
            ) { vehiclesResult, position ->
                Pair(vehiclesResult, position)
            }.collect { (vehiclesResult, position) ->
                val vehicles = (vehiclesResult as? VehiclesResult.Success)?.vehicles ?: emptyList()
                val userPoint = GeoPoint(position.lat, position.lng)

                val current = _uiState.value
                var hasBoarded = current.hasBoarded

                if (!hasBoarded) {
                    val nearVehicle = vehicles.any {
                        getDistanceMeters(userPoint.lat, userPoint.lng, it.lat, it.lng) < BOARDING_PROXIMITY_METERS
                    }
                    if (nearVehicle) {
                        hasBoarded = true
                        voiceService.announceBoarding(current.lineDisplay, current.destinationName, if (plan.isRail) "trem" else "ônibus")
                    }
                }

                var isOffRoute = current.isOffRoute
                if (hasBoarded && plan.polyline.transit.isNotEmpty()) {
                    val distance = distanceToPolylineMeters(userPoint, plan.polyline.transit)
                    val nowOffRoute = distance > OFF_ROUTE_THRESHOLD_METERS
                    if (nowOffRoute && !isOffRoute) {
                        voiceService.announceOffRoute()
                    }
                    isOffRoute = nowOffRoute
                }

                _uiState.value = current.copy(hasBoarded = hasBoarded, isOffRoute = isOffRoute)
            }
        }
    }

    fun stop() {
        trackingJob?.cancel()
        trackingJob = null
        _uiState.value = ActiveNavigationUiState()
    }
}
