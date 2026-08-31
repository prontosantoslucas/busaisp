package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.RouteLocationDto
import com.busaisp.android.data.remote.dto.RoutePlanDto
import com.busaisp.android.data.remote.dto.RouteStepDto
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.domain.model.RouteSearchResult
import com.busaisp.android.domain.model.RouteStep
import com.busaisp.android.domain.model.parseRouteAccuracy
import com.busaisp.android.domain.model.parseRouteStepType
import com.squareup.moshi.JsonDataException
import kotlinx.coroutines.CancellationException
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import kotlin.math.roundToInt

sealed interface RouteTimeMode {
    data object Now : RouteTimeMode
    data class DepartIn(val minutes: Int) : RouteTimeMode
    data class ArriveBy(val time: String) : RouteTimeMode
}

sealed interface RouteRepositoryResult {
    data class Success(val data: RouteSearchResult) : RouteRepositoryResult
    data class Failure(val message: String) : RouteRepositoryResult
}

interface RouteRepository {
    suspend fun calculateRoute(
        origin: RouteLocation,
        destination: RouteLocation,
        timeMode: RouteTimeMode
    ): RouteRepositoryResult

    suspend fun searchAddresses(query: String): List<RouteLocation>
}

class RouteRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : RouteRepository {

    override suspend fun calculateRoute(
        origin: RouteLocation,
        destination: RouteLocation,
        timeMode: RouteTimeMode
    ): RouteRepositoryResult {
        return try {
            val response = api.getRoutes(
                origLat = origin.lat,
                origLng = origin.lng,
                origem = origin.name,
                destLat = destination.lat,
                destLng = destination.lng,
                destino = destination.name,
                partidaMinutos = (timeMode as? RouteTimeMode.DepartIn)?.minutes
                    ?: if (timeMode is RouteTimeMode.Now) 0 else null,
                chegadaHorario = (timeMode as? RouteTimeMode.ArriveBy)?.time
            )
            val data = response.data
            if (response.success && data != null) {
                RouteRepositoryResult.Success(
                    RouteSearchResult(
                        primaryRoute = data.primaryRoute.toDomain(),
                        alternatives = data.alternatives.map { it.toDomain() }
                    )
                )
            } else {
                RouteRepositoryResult.Failure(response.error ?: "Nenhuma rota encontrada")
            }
        } catch (e: CancellationException) {
            // Nunca engolir cancelamento: deixa a coroutine encerrar normalmente.
            throw e
        } catch (e: IOException) {
            RouteRepositoryResult.Failure(e.message ?: "Falha de conexão")
        } catch (e: HttpException) {
            RouteRepositoryResult.Failure("Erro do servidor: ${e.code()}")
        } catch (e: JsonDataException) {
            // Resposta 200 com payload em formato inesperado (campo obrigatório ausente/nulo).
            RouteRepositoryResult.Failure(e.message ?: "Resposta inesperada do servidor")
        } catch (e: Exception) {
            // Rede de segurança: qualquer outra falha vira Failure em vez de crashar.
            RouteRepositoryResult.Failure(e.message ?: "Falha inesperada ao calcular rota")
        }
    }

    // Falhas de qualquer tipo (rede, HTTP, payload malformado, ou
    // success:false do backend) viram lista vazia — mesmo tradeoff aceito em
    // LineSearchRepository.searchLinhas: o chamador não distingue "sem
    // resultados" de "busca falhou" hoje.
    override suspend fun searchAddresses(query: String): List<RouteLocation> {
        return try {
            val response = api.getAddressSuggestions(query = query)
            if (!response.success) return emptyList()
            response.data.map { it.toDomain() }
        } catch (e: CancellationException) {
            throw e
        } catch (e: IOException) {
            emptyList()
        } catch (e: HttpException) {
            emptyList()
        } catch (e: JsonDataException) {
            emptyList()
        } catch (e: Exception) {
            emptyList()
        }
    }
}

private fun RouteLocationDto.toDomain() = RouteLocation(name, addressDetails, lat, lng)

private fun RouteStepDto.toDomain() = RouteStep(
    type = parseRouteStepType(type),
    instruction = instruction,
    durationMinutes = durationMinutes.roundToInt(),
    distanceMeters = distanceMeters.toInt(),
    busLine = busLine,
    busDestination = busDestination,
    boardStopName = boardStopName,
    alightStopName = alightStopName,
    stopCount = stopCount,
    nextBusEtaMinutes = nextBusEtaMinutes?.roundToInt(),
    accuracyLevel = parseRouteAccuracy(accuracyLevel)
)

private fun RoutePlanDto.toDomain() = RoutePlan(
    id = id,
    origin = origin.toDomain(),
    destination = destination.toDomain(),
    totalDurationMinutes = totalDurationMinutes.roundToInt(),
    transferCount = transferCount,
    departureHour = departureHour,
    arrivalHour = arrivalHour,
    farePrice = farePrice,
    trafficStatus = trafficStatus,
    isRail = mode == "RAIL",
    arrivalTimeUnreachable = arrivalTimeUnreachable ?: false,
    accuracyLevel = parseRouteAccuracy(accuracyLevel),
    steps = steps.map { it.toDomain() }
)
