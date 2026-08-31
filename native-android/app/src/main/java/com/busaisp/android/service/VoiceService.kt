package com.busaisp.android.service

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.TextToSpeech.QUEUE_ADD
import dagger.hilt.android.qualifiers.ApplicationContext
import java.util.Locale
import javax.inject.Inject
import javax.inject.Singleton

// Tradução fiel das mensagens reais de src/lib/voiceService.ts do app web —
// mesmo texto, mesmo debounce de 30s.
fun boardingMessage(lineDisplay: String, destination: String, vehicleWord: String = "ônibus"): String =
    "Embarque no $vehicleWord linha $lineDisplay com destino a $destination."

fun transferMessage(instructions: String): String =
    "Desembarque e faça baldeação. $instructions"

fun offRouteMessage(): String =
    "Atenção: você parece ter saído do trajeto planejado."

private const val DEBOUNCE_MS = 30_000L

// Lógica pura de "não repetir a mesma frase antes de 30s" — extraída do
// motor de TTS em si pra poder ser testada em JVM pura.
class SpeechDebouncer {
    private val lastSpokenAtMs = mutableMapOf<String, Long>()

    fun shouldSpeak(message: String, nowMs: Long): Boolean {
        val last = lastSpokenAtMs[message]
        if (last != null && nowMs - last < DEBOUNCE_MS) return false
        lastSpokenAtMs[message] = nowMs
        return true
    }
}

// Extraída pra permitir fakes em teste JVM puro: VoiceService de verdade
// cria um android.speech.tts.TextToSpeech real no seu init {}, que não
// roda fora do Android (sem Robolectric neste projeto).
interface VoiceAnnouncer {
    fun announceBoarding(lineDisplay: String, destination: String, vehicleWord: String = "ônibus")
    fun announceTransfer(instructions: String)
    fun announceOffRoute()
}

@Singleton
class VoiceService @Inject constructor(
    @ApplicationContext context: Context
) : VoiceAnnouncer {
    private val debouncer = SpeechDebouncer()
    private var isMuted = false
    private var tts: TextToSpeech? = null

    init {
        tts = TextToSpeech(context.applicationContext) { status ->
            if (status == TextToSpeech.SUCCESS) {
                tts?.language = Locale("pt", "BR")
            }
        }
    }

    fun setMuted(muted: Boolean) {
        isMuted = muted
    }

    private fun speak(message: String) {
        if (isMuted) return
        if (!debouncer.shouldSpeak(message, System.currentTimeMillis())) return
        tts?.speak(message, QUEUE_ADD, null, message.hashCode().toString())
    }

    override fun announceBoarding(lineDisplay: String, destination: String, vehicleWord: String) {
        speak(boardingMessage(lineDisplay, destination, vehicleWord))
    }

    override fun announceTransfer(instructions: String) {
        speak(transferMessage(instructions))
    }

    override fun announceOffRoute() {
        speak(offRouteMessage())
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
    }
}
