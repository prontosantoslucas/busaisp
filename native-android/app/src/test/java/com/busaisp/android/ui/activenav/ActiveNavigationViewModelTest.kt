package com.busaisp.android.ui.activenav

import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.data.repository.BusRepository
import com.busaisp.android.domain.GeoPoint
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RoutePolyline
import com.busaisp.android.domain.model.RouteAccuracy
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.service.VoiceAnnouncer
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.flowOf
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.resetMain
import kotlinx.coroutines.test.runTest
import kotlinx.coroutines.test.setMain
import org.junit.After
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

@OptIn(ExperimentalCoroutinesApi::class)
class ActiveNavigationViewModelTest {

    private val dispatcher = StandardTestDispatcher()

    private val transitPolyline = listOf(GeoPoint(-23.55, -46.63), GeoPoint(-23.56, -46.64))

    private val plan = RoutePlan(
        id = "r1",
        origin = RouteLocation("Origem", null, -23.55, -46.63),
        destination = RouteLocation("Destino", null, -23.56, -46.64),
        totalDurationMinutes = 20,
        transferCount = 0,
        departureHour = "10:00",
        arrivalHour = "10:20",
        farePrice = "R$ 4,40",
        trafficStatus = "FLUINDO",
        isRail = false,
        arrivalTimeUnreachable = false,
        accuracyLevel = RouteAccuracy.HIGH,
        recommendedLine = Linha(1001, "1703-10", 10, "JD. FONTALIS", "SHOPPING CENTER NORTE"),
        polyline = RoutePolyline(emptyList(), transitPolyline, emptyList()),
        steps = emptyList()
    )

    private fun locationFlowOf(lat: Double, lng: Double) = flowOf(LocationClient.Position(lat, lng))

    private class FixedBusRepository(private val vehicles: List<Vehicle>) : BusRepository {
        override fun observeVehicles(linha: Linha) = flowOf(VehiclesResult.Success(vehicles, 0L))
    }

    // Fake escrito à mão em vez de mock de biblioteca: VoiceService de verdade
    // cria um android.speech.tts.TextToSpeech real no seu init {}, que não
    // roda em teste JVM puro (sem Robolectric neste projeto). A interface
    // VoiceAnnouncer existe justamente pra permitir este fake.
    private class FakeVoiceAnnouncer : VoiceAnnouncer {
        val boardingAnnouncements = mutableListOf<String>()
        val offRouteAnnouncementCount get() = offRouteCount
        private var offRouteCount = 0

        override fun announceBoarding(lineDisplay: String, destination: String, vehicleWord: String) {
            boardingAnnouncements.add("$lineDisplay|$destination|$vehicleWord")
        }
        override fun announceTransfer(instructions: String) { /* not exercised by these tests */ }
        override fun announceOffRoute() { offRouteCount++ }
    }

    @Before
    fun setUp() { Dispatchers.setMain(dispatcher) }

    @After
    fun tearDown() { Dispatchers.resetMain() }

    @Test
    fun `usuario perto de um veiculo real da linha e considerado embarcado`() = runTest {
        val nearVehicle = Vehicle("21045", -23.55, -46.63, null, null, 0L, true)
        val locationClient = object : LocationClient {
            override fun observeLocation() = locationFlowOf(-23.55, -46.63)
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(nearVehicle)), locationClient, FakeVoiceAnnouncer()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.hasBoarded)
    }

    @Test
    fun `usuario longe de qualquer veiculo real nao e considerado embarcado`() = runTest {
        val farVehicle = Vehicle("21045", -23.70, -46.80, null, null, 0L, true)
        val locationClient = object : LocationClient {
            override fun observeLocation() = locationFlowOf(-23.55, -46.63)
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(farVehicle)), locationClient, FakeVoiceAnnouncer()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertFalse(viewModel.uiState.value.hasBoarded)
    }

    @Test
    fun `apos embarcar usuario longe da polyline real e marcado fora da rota`() = runTest {
        val nearVehicle = Vehicle("21045", -23.55, -46.63, null, null, 0L, true)
        val locationClient = object : LocationClient {
            override fun observeLocation() = kotlinx.coroutines.flow.flow {
                // Primeira posição: perto do veículo (embarca). Segunda: longe da polyline.
                emit(LocationClient.Position(-23.55, -46.63))
                emit(LocationClient.Position(-23.80, -46.90))
            }
        }
        val viewModel = ActiveNavigationViewModel(
            FixedBusRepository(listOf(nearVehicle)), locationClient, FakeVoiceAnnouncer()
        )

        viewModel.start(plan)
        dispatcher.scheduler.advanceUntilIdle()

        assertTrue(viewModel.uiState.value.hasBoarded)
        assertTrue(viewModel.uiState.value.isOffRoute)
    }
}
