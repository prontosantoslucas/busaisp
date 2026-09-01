package com.busaisp.android.data.repository

import com.busaisp.android.data.network.RailLineDto
import com.busaisp.android.data.network.RailsApi
import com.busaisp.android.domain.model.RailLine
import com.busaisp.android.domain.model.RailOperator
import com.busaisp.android.domain.model.RailStatusType
import com.busaisp.android.domain.model.RailsData
import com.busaisp.android.domain.model.RailsSummary
import javax.inject.Inject
import javax.inject.Singleton

sealed interface RailsResult {
    data class Success(val data: RailsData) : RailsResult
    data class Failure(val message: String) : RailsResult
}

interface RailsRepository {
    suspend fun getRailsStatus(): RailsResult
}

@Singleton
class NetworkRailsRepository @Inject constructor(
    private val api: RailsApi
) : RailsRepository {

    override suspend fun getRailsStatus(): RailsResult {
        return try {
            val response = api.getRailsStatus()
            val dataDto = response.data
            if (response.success && dataDto != null) {
                val lines = dataDto.lines.map { it.toDomain() }
                val summary = RailsSummary(
                    total = dataDto.summary.total,
                    normal = dataDto.summary.normal,
                    withIssues = dataDto.summary.withIssues,
                    lastChecked = dataDto.summary.lastChecked.ifEmpty { dataDto.lastChecked.orEmpty() },
                    source = dataDto.summary.source.ifEmpty { dataDto.source.orEmpty() }
                )
                RailsResult.Success(RailsData(lines, summary))
            } else {
                RailsResult.Failure(response.error ?: "Não foi possível obter o status dos trilhos.")
            }
        } catch (e: Exception) {
            RailsResult.Failure("Falha de conexão ao carregar status dos trilhos: ${e.localizedMessage ?: "Erro de rede"}")
        }
    }
}

private fun RailLineDto.toDomain(): RailLine {
    val operatorEnum = runCatching { RailOperator.valueOf(operator.uppercase()) }
        .getOrDefault(RailOperator.METRO)
    val statusEnum = runCatching { RailStatusType.valueOf(status.uppercase()) }
        .getOrDefault(RailStatusType.NORMAL)

    return RailLine(
        id = id,
        name = name,
        number = number,
        colorName = colorName,
        hexColor = hexColor,
        operator = operatorEnum,
        status = statusEnum,
        statusText = statusText,
        description = description,
        updatedAt = updatedAt
    )
}
