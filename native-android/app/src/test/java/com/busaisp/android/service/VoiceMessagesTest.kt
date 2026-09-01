package com.busaisp.android.service

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class VoiceMessagesTest {

    @Test
    fun `mensagem de embarque usa o texto real esperado`() {
        val message = boardingMessage(lineDisplay = "1703-10", destination = "Shopping Center Norte", vehicleWord = "ônibus")
        assertEquals("Embarque no ônibus linha 1703-10 com destino a Shopping Center Norte.", message)
    }

    @Test
    fun `mensagem de baldeacao usa o texto real esperado`() {
        val message = transferMessage("Desça na próxima e pegue a linha 875L-10.")
        assertEquals("Desembarque e faça baldeação. Desça na próxima e pegue a linha 875L-10.", message)
    }

    @Test
    fun `mensagem de desvio de rota usa o texto real esperado`() {
        assertEquals("Atenção: você parece ter saído do trajeto planejado.", offRouteMessage())
    }

    @Test
    fun `debounce bloqueia repetir a mesma frase antes de 30 segundos`() {
        val debouncer = SpeechDebouncer()
        val nowMs = 0L

        val firstAllowed = debouncer.shouldSpeak("mensagem X", nowMs)
        val secondAllowed = debouncer.shouldSpeak("mensagem X", nowMs + 10_000L)

        assertTrue(firstAllowed)
        assertFalse(secondAllowed)
    }

    @Test
    fun `debounce libera a mesma frase depois de 30 segundos`() {
        val debouncer = SpeechDebouncer()

        debouncer.shouldSpeak("mensagem X", 0L)
        val allowedAgain = debouncer.shouldSpeak("mensagem X", 30_001L)

        assertTrue(allowedAgain)
    }

    @Test
    fun `debounce nao bloqueia frases diferentes`() {
        val debouncer = SpeechDebouncer()

        debouncer.shouldSpeak("mensagem X", 0L)
        val allowedDifferent = debouncer.shouldSpeak("mensagem Y", 1_000L)

        assertTrue(allowedDifferent)
    }
}
