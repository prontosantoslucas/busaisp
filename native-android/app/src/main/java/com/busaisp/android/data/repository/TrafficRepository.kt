package com.busaisp.android.data.repository

import com.busaisp.android.data.network.TrafficApi
import com.busaisp.android.data.network.TrafficIncidentDto
import com.busaisp.android.domain.model.TrafficCorridorHotspot
import com.busaisp.android.domain.model.TrafficHeatmapData
import com.busaisp.android.domain.model.TrafficHotspotReason
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.busaisp.android.domain.model.TrafficIncident
import java.util.Calendar
import java.util.TimeZone
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.roundToInt
import kotlin.math.sin
import kotlin.math.sqrt

sealed interface TrafficResult {
    data class Success(val data: TrafficHeatmapData) : TrafficResult
    data class Failure(val message: String) : TrafficResult
}

interface TrafficRepository {
    suspend fun getTrafficHeatmap(lat: Double = -23.55, lng: Double = -46.63): TrafficResult
}

private data class StructuralCorridor(
    val id: String,
    val name: String,
    val corridor: String,
    val neighborhood: String,
    val lat: Double,
    val lng: Double,
    val radiusMeters: Double,
    val normalSpeedKmh: Int,
    val isPeakHeavy: Boolean
)

private val SP_CORRIDORS = listOf(
    StructuralCorridor("corridor-tiete-bandeiras", "Marginal Tietê (Pte. das Bandeiras)", "Marginal Tietê (Sentido Castelo/Ayrton Senna)", "Santana / Bom Retiro", -23.5186, -46.6264, 600.0, 70, true),
    StructuralCorridor("corridor-tiete-piqueri", "Marginal Tietê (Pte. do Piqueri)", "Marginal Tietê (Pista Expressa e Local)", "Lapa / Freguesia do Ó", -23.5090, -46.6890, 650.0, 70, true),
    StructuralCorridor("corridor-pinheiros-pinheiros", "Marginal Pinheiros (Pte. Cidade Universitária)", "Marginal Pinheiros (Sentido Interlagos)", "Pinheiros / Butantã", -23.5600, -46.7020, 600.0, 70, true),
    StructuralCorridor("corridor-pinheiros-estaiada", "Marginal Pinheiros (Pte. Estaiada)", "Marginal Pinheiros (Sentido Castelo Branco)", "Brooklin / Morumbi", -23.6120, -46.6990, 600.0, 70, true),
    StructuralCorridor("corridor-paulista-masp", "Avenida Paulista (Masp / Augusta)", "Av. Paulista (Ambos os Sentidos)", "Bela Vista / Cerqueira César", -23.5615, -46.6559, 500.0, 40, true),
    StructuralCorridor("corridor-23-de-maio", "Avenida 23 de Maio (Corredor Norte-Sul)", "Av. 23 de Maio (Sentido Aeroporto / Centro)", "Paraíso / Vila Mariana", -23.5780, -46.6430, 550.0, 60, true),
    StructuralCorridor("corridor-bandeirantes-aeroporto", "Avenida dos Bandeirantes (Aeroporto Congonhas)", "Av. dos Bandeirantes (Sentido Marginal / Imigrantes)", "Campo Belo / Moema", -23.6060, -46.6680, 550.0, 50, true),
    StructuralCorridor("corridor-radial-leste-tatuape", "Radial Leste (Viaduto Pery Ronchetti)", "Radial Leste (Sentido Bairro / Centro)", "Tatuapé / Belém", -23.5380, -46.5750, 600.0, 60, true),
    StructuralCorridor("corridor-reboucas-faria-lima", "Avenida Rebouças x Faria Lima", "Av. Rebouças (Sentido Centro / Bairro)", "Pinheiros / Jardins", -23.5680, -46.6840, 500.0, 45, true),
    StructuralCorridor("corridor-cruzeiro-do-sul-santana", "Avenida Cruzeiro do Sul (Terminal Santana)", "Av. Cruzeiro do Sul (Sentido Centro)", "Santana / Carandiru", -23.5080, -46.6250, 450.0, 50, true),
    StructuralCorridor("corridor-av-do-estado-mercadao", "Avenida do Estado (Pq. Dom Pedro)", "Av. do Estado (Sentido ABC / Marginal)", "Centro / Brás", -23.5450, -46.6280, 500.0, 50, false),
    StructuralCorridor("corridor-santo-amaro", "Avenida Santo Amaro (Vila Olímpia)", "Av. Santo Amaro (Corredor de Ônibus)", "Moema / Itaim Bibi", -23.5970, -46.6770, 450.0, 40, true),
    StructuralCorridor("corridor-teotonio-vilela", "Avenida Senador Teotônio Vilela", "Av. Sen. Teotônio Vilela (Sentido Centro)", "Interlagos / Socorro", -23.7050, -46.6890, 550.0, 50, false),
    StructuralCorridor("corridor-inajar-freguesia", "Avenida Inajar de Souza", "Av. Inajar de Souza (Sentido Bairro / Ponte Freguesia)", "Freguesia do Ó / Brasilândia", -23.4860, -46.6900, 500.0, 50, false)
)

@Singleton
class NetworkTrafficRepository @Inject constructor(
    private val api: TrafficApi
) : TrafficRepository {

    override suspend fun getTrafficHeatmap(lat: Double, lng: Double): TrafficResult {
        return try {
            val response = api.getTrafficIncidents(lat, lng)
            val rawIncidents = response.data?.incidents ?: emptyList()
            val incidents = rawIncidents.map { it.toDomain() }

            val heatmap = computeHeatmap(incidents)
            TrafficResult.Success(heatmap)
        } catch (e: Exception) {
            TrafficResult.Failure("Não foi possível carregar o radar de trânsito: ${e.localizedMessage ?: "Erro de rede"}")
        }
    }

    private fun computeHeatmap(incidents: List<TrafficIncident>): TrafficHeatmapData {
        val cal = Calendar.getInstance(TimeZone.getTimeZone("America/Sao_Paulo"))
        val dayOfWeek = cal.get(Calendar.DAY_OF_WEEK)
        val isWeekday = dayOfWeek != Calendar.SUNDAY && dayOfWeek != Calendar.SATURDAY
        val totalMinutes = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE)

        val isMorningPeak = isWeekday && totalMinutes in (7 * 60 + 30)..(9 * 60 + 30)
        val isEveningPeak = isWeekday && totalMinutes in (17 * 60 + 30)..(20 * 60)
        val isPeak = isMorningPeak || isEveningPeak

        var totalCongestionScore = 0

        val hotspots = SP_CORRIDORS.map { corridor ->
            val nearby = incidents.filter { inc ->
                distanceMeters(corridor.lat, corridor.lng, inc.lat, inc.lng) <= corridor.radiusMeters + 300
            }

            val reasons = mutableListOf<TrafficHotspotReason>()
            var corridorDelay = 0
            var hasCritical = false
            var hasHigh = false

            nearby.forEach { inc ->
                val delay = when {
                    inc.delaySeconds != null && inc.delaySeconds > 0 -> (inc.delaySeconds / 60)
                    inc.severity == "CRITICAL" -> 12
                    inc.severity == "HIGH" || inc.type == "ACCIDENT" -> 7
                    inc.severity == "MEDIUM" || inc.type == "CONSTRUCTION" -> 4
                    else -> 2
                }

                if (inc.severity == "CRITICAL") hasCritical = true
                if (inc.severity == "HIGH") hasHigh = true

                corridorDelay += delay
                reasons.add(
                    TrafficHotspotReason(
                        type = inc.type,
                        title = inc.title,
                        description = inc.description.ifEmpty { "Interferência viária na pista" },
                        delayMinutes = delay
                    )
                )
            }

            if (reasons.isEmpty()) {
                if (isPeak && corridor.isPeakHeavy) {
                    val peakDelay = if (isEveningPeak) 8 else 6
                    corridorDelay += peakDelay
                    reasons.add(
                        TrafficHotspotReason(
                            type = "RUSH_HOUR",
                            title = "Horário de Pico",
                            description = "Alto volume de veículos e retenção nos acessos às pontes e viadutos.",
                            delayMinutes = peakDelay
                        )
                    )
                } else {
                    reasons.add(
                        TrafficHotspotReason(
                            type = "NORMAL",
                            title = "Fluxo Normal",
                            description = "Pistas expressa e local fluindo normalmente.",
                            delayMinutes = 0
                        )
                    )
                }
            }

            val status = when {
                hasCritical || corridorDelay >= 12 -> TrafficHotspotStatus.CRITICO
                hasHigh || corridorDelay >= 6 -> TrafficHotspotStatus.INTENSO
                corridorDelay >= 3 -> TrafficHotspotStatus.MODERADO
                else -> TrafficHotspotStatus.FLUINDO
            }

            val avgSpeed = when (status) {
                TrafficHotspotStatus.CRITICO -> (corridor.normalSpeedKmh * 0.25).roundToInt()
                TrafficHotspotStatus.INTENSO -> (corridor.normalSpeedKmh * 0.45).roundToInt()
                TrafficHotspotStatus.MODERADO -> (corridor.normalSpeedKmh * 0.70).roundToInt()
                TrafficHotspotStatus.FLUINDO -> corridor.normalSpeedKmh
            }

            totalCongestionScore += corridorDelay

            TrafficCorridorHotspot(
                id = corridor.id,
                name = corridor.name,
                corridor = corridor.corridor,
                neighborhood = corridor.neighborhood,
                lat = corridor.lat,
                lng = corridor.lng,
                radiusMeters = corridor.radiusMeters,
                status = status,
                delayMinutes = corridorDelay,
                avgSpeedKmh = avgSpeed,
                normalSpeedKmh = corridor.normalSpeedKmh,
                reasons = reasons
            )
        }

        val cityStatus = when {
            totalCongestionScore >= 50 -> TrafficHotspotStatus.INTENSO
            totalCongestionScore >= 20 -> TrafficHotspotStatus.MODERADO
            else -> TrafficHotspotStatus.FLUINDO
        }

        val timeStr = String.format("%02d:%02d", cal.get(Calendar.HOUR_OF_DAY), cal.get(Calendar.MINUTE))

        return TrafficHeatmapData(
            hotspots = hotspots,
            cityStatus = cityStatus,
            totalCongestionKm = totalCongestionScore * 4,
            lastUpdated = timeStr
        )
    }

    private fun distanceMeters(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371000.0
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2) * sin(dLat / 2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2) * sin(dLon / 2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return r * c
    }
}

private fun TrafficIncidentDto.toDomain() = TrafficIncident(
    id = id,
    type = type,
    title = title,
    description = description,
    street = street,
    neighborhood = neighborhood,
    lat = lat,
    lng = lng,
    severity = severity,
    delaySeconds = delaySeconds
)
