package com.busaisp.android.ui.routesearch

import org.junit.Assert.assertEquals
import org.junit.Test

class DurationFormatTest {

    @Test
    fun `abaixo de 60 minutos mostra so minutos`() {
        assertEquals("0 min", formatDurationMinutes(0))
        assertEquals("45 min", formatDurationMinutes(45))
        assertEquals("59 min", formatDurationMinutes(59))
    }

    @Test
    fun `exatamente 60 minutos ou multiplo mostra so horas`() {
        assertEquals("1h", formatDurationMinutes(60))
        assertEquals("2h", formatDurationMinutes(120))
    }

    @Test
    fun `acima de 60 minutos mostra horas e minutos`() {
        assertEquals("1h 30min", formatDurationMinutes(90))
        assertEquals("1h 20min", formatDurationMinutes(80))
        assertEquals("2h 5min", formatDurationMinutes(125))
    }
}
