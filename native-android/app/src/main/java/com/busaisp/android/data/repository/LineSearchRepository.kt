package com.busaisp.android.data.repository

import com.busaisp.android.data.remote.BusaiApiService
import com.busaisp.android.data.remote.dto.LinhaDto
import com.busaisp.android.domain.model.Linha
import com.squareup.moshi.JsonDataException
import kotlinx.coroutines.CancellationException
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject

interface LineSearchRepository {
    suspend fun searchLinhas(query: String): List<Linha>
}

class LineSearchRepositoryImpl @Inject constructor(
    private val api: BusaiApiService
) : LineSearchRepository {

    // Falhas de qualquer tipo (rede, HTTP, payload malformado, ou success:false do backend)
    // viram lista vazia — o ViewModel que consumir isto não consegue hoje distinguir
    // "sem resultados" de "busca falhou". Se isso virar um problema real de UX, considerar
    // um tipo de retorno tipo Result/sealed class aqui, no estilo de VehiclesResult.
    override suspend fun searchLinhas(query: String): List<Linha> {
        return try {
            val response = api.getLinhas(query = query)
            if (!response.success) return emptyList()
            response.data.map { it.toDomain() }
        } catch (e: CancellationException) {
            // Nunca engolir cancelamento: deixa a coroutine encerrar normalmente.
            throw e
        } catch (e: IOException) {
            emptyList()
        } catch (e: HttpException) {
            emptyList()
        } catch (e: JsonDataException) {
            // Resposta 200 com payload em formato inesperado (campo obrigatório ausente/nulo).
            emptyList()
        } catch (e: Exception) {
            // Rede de segurança: qualquer outra falha degrada para "sem resultados" em vez de crashar.
            emptyList()
        }
    }
}

private fun LinhaDto.toDomain(): Linha = Linha(
    codigo = cl,
    letreiro = lt,
    tipoLinha = tl,
    terminalPrincipal = tp,
    terminalSecundario = ts
)
