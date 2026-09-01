package com.busaisp.android.ui.map

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class RailLineMatcherTest {

    @Test
    fun `reconhece nome de cor por extenso, com ou sem acento`() {
        assertEquals("1-Azul", matchRailLine("azul"))
        assertEquals("5-Lilás", matchRailLine("lilas"))
        assertEquals("5-Lilás", matchRailLine("lilás"))
        assertEquals("9-Esmeralda", matchRailLine("Esmeralda"))
    }

    @Test
    fun `reconhece formato numero-cor`() {
        assertEquals("4-Amarela", matchRailLine("4-amarela"))
        assertEquals("13-Jade", matchRailLine("13-jade"))
    }

    @Test
    fun `reconhece termos genericos de trilho sem linha especifica`() {
        assertEquals("Metrô/CPTM", matchRailLine("metro"))
        assertEquals("Metrô/CPTM", matchRailLine("metrô"))
        assertEquals("Metrô/CPTM", matchRailLine("cptm"))
        assertEquals("Metrô/CPTM", matchRailLine("trem"))
    }

    @Test
    fun `numero isolado nao combina, pra nao sequestrar busca de linha de onibus`() {
        assertNull(matchRailLine("13"))
        assertNull(matchRailLine("1703"))
        assertNull(matchRailLine("875A"))
    }

    @Test
    fun `busca curta demais ou sem relacao nao combina`() {
        assertNull(matchRailLine("a"))
        assertNull(matchRailLine("jd fontalis"))
    }
}
