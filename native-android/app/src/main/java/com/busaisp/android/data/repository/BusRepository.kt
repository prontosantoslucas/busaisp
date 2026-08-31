package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.VeiculoDto
import com.busaisp.android.domain.model.Linha
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.domain.model.VehiclesResult
import kotlinx.coroutines.currentCoroutineContext
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.isActive
import retrofit2.HttpException
import java.io.IOException
import java.time.Instant
import javax.inject.Inject

interface BusRepository {
    fun observeVehicles(linha: Linha): Flow<VehiclesResult>
}

// Intervalo real replicado do app web (src/app/page.tsx: setInterval(loadVeiculos, 25000)).
private const val POLL_INTERVAL_MS = 25_000L

class BusRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : BusRepository {

    override fun observeVehicles(linha: Linha): Flow<VehiclesResult> = flow {
        while (currentCoroutineContext().isActive) {
            emit(fetchOnce(linha))
            delay(POLL_INTERVAL_MS)
        }
    }

    private suspend fun fetchOnce(linha: Linha): VehiclesResult {
        return try {
            val response = api.getPosicaoLinha(codigo = linha.codigo, letreiro = linha.letreiro)
            val posicao = response.data
            if (response.success && posicao != null) {
                VehiclesResult.Success(
                    vehicles = posicao.vs.map { it.toDomain() },
                    fetchedAtEpochMs = System.currentTimeMillis()
                )
            } else {
                VehiclesResult.Failure(response.error ?: "Falha ao carregar posições dos ônibus")
            }
        } catch (e: IOException) {
            VehiclesResult.Failure(e.message ?: "Falha de conexão")
        } catch (e: HttpException) {
            VehiclesResult.Failure("Erro do servidor: ${e.code()}")
        }
    }
}

private fun VeiculoDto.toDomain(): Vehicle = Vehicle(
    prefix = p,
    lat = py,
    lng = px,
    headingDegrees = heading,
    speedKmh = speed,
    lastUpdateEpochMs = runCatching { Instant.parse(ta).toEpochMilli() }.getOrDefault(System.currentTimeMillis()),
    accessible = a
)
