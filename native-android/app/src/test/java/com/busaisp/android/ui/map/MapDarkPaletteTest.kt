package com.busaisp.android.ui.map

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class MapDarkPaletteTest {

    @Test
    fun `background e raster de baixo zoom recebem papeis especiais`() {
        assertEquals(MapLayerRole.BACKGROUND, classifyMapLayerRole("background"))
        assertEquals(MapLayerRole.RASTER_HIDDEN, classifyMapLayerRole("natural_earth"))
    }

    @Test
    fun `agua e vias navegaveis viram WATER mas o rotulo da agua nao`() {
        assertEquals(MapLayerRole.WATER, classifyMapLayerRole("water"))
        assertEquals(MapLayerRole.WATER, classifyMapLayerRole("waterway_river"))
        assertEquals(MapLayerRole.WATER, classifyMapLayerRole("waterway_tunnel"))
        assertEquals(MapLayerRole.WATER, classifyMapLayerRole("waterway_other"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("waterway_line_label"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("water_name_point_label"))
    }

    @Test
    fun `parques e cobertura verde viram PARK`() {
        assertEquals(MapLayerRole.PARK, classifyMapLayerRole("park"))
        assertEquals(MapLayerRole.PARK, classifyMapLayerRole("park_outline"))
        assertEquals(MapLayerRole.PARK, classifyMapLayerRole("landcover_wood"))
        assertEquals(MapLayerRole.PARK, classifyMapLayerRole("landcover_grass"))
    }

    @Test
    fun `uso do solo neutro (residencial, escola, hospital, aeroporto) vira LANDUSE_NEUTRAL`() {
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_residential"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_school"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_hospital"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_cemetery"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_pitch"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landuse_track"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landcover_ice"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("landcover_sand"))
        assertEquals(MapLayerRole.LANDUSE_NEUTRAL, classifyMapLayerRole("aeroway_fill"))
    }

    @Test
    fun `predios 2D e 3D viram BUILDING`() {
        assertEquals(MapLayerRole.BUILDING, classifyMapLayerRole("building"))
        assertEquals(MapLayerRole.BUILDING, classifyMapLayerRole("building-3d"))
    }

    @Test
    fun `qualquer camada terminada em _casing vira ROAD_CASING independente do prefixo`() {
        assertEquals(MapLayerRole.ROAD_CASING, classifyMapLayerRole("road_motorway_casing"))
        assertEquals(MapLayerRole.ROAD_CASING, classifyMapLayerRole("tunnel_street_casing"))
        assertEquals(MapLayerRole.ROAD_CASING, classifyMapLayerRole("bridge_path_pedestrian_casing"))
        assertEquals(MapLayerRole.ROAD_CASING, classifyMapLayerRole("road_trunk_primary_casing"))
    }

    @Test
    fun `trilhos de metro e trem (major_rail, transit_rail, com ou sem hatching) viram ROAD_RAIL`() {
        assertEquals(MapLayerRole.ROAD_RAIL, classifyMapLayerRole("road_major_rail"))
        assertEquals(MapLayerRole.ROAD_RAIL, classifyMapLayerRole("road_major_rail_hatching"))
        assertEquals(MapLayerRole.ROAD_RAIL, classifyMapLayerRole("tunnel_transit_rail"))
        assertEquals(MapLayerRole.ROAD_RAIL, classifyMapLayerRole("bridge_transit_rail_hatching"))
    }

    @Test
    fun `hierarquia viaria principal (motorway, trunk, primary) vira ROAD_HIGHWAY`() {
        assertEquals(MapLayerRole.ROAD_HIGHWAY, classifyMapLayerRole("road_motorway"))
        assertEquals(MapLayerRole.ROAD_HIGHWAY, classifyMapLayerRole("road_motorway_link"))
        assertEquals(MapLayerRole.ROAD_HIGHWAY, classifyMapLayerRole("road_trunk_primary"))
        assertEquals(MapLayerRole.ROAD_HIGHWAY, classifyMapLayerRole("aeroway_runway"))
    }

    @Test
    fun `hierarquia secundaria (secondary, tertiary, taxiway) vira ROAD_ARTERIAL`() {
        assertEquals(MapLayerRole.ROAD_ARTERIAL, classifyMapLayerRole("road_secondary_tertiary"))
        assertEquals(MapLayerRole.ROAD_ARTERIAL, classifyMapLayerRole("aeroway_taxiway"))
    }

    @Test
    fun `vias locais, com nomenclatura minor OU street, viram ROAD_MINOR`() {
        assertEquals(MapLayerRole.ROAD_MINOR, classifyMapLayerRole("road_minor"))
        assertEquals(MapLayerRole.ROAD_MINOR, classifyMapLayerRole("bridge_street"))
        assertEquals(MapLayerRole.ROAD_MINOR, classifyMapLayerRole("road_service_track"))
        assertEquals(MapLayerRole.ROAD_MINOR, classifyMapLayerRole("road_link"))
        assertEquals(MapLayerRole.ROAD_MINOR, classifyMapLayerRole("road_path_pedestrian"))
    }

    @Test
    fun `fronteiras administrativas viram BOUNDARY`() {
        assertEquals(MapLayerRole.BOUNDARY, classifyMapLayerRole("boundary_2"))
        assertEquals(MapLayerRole.BOUNDARY, classifyMapLayerRole("boundary_3"))
        assertEquals(MapLayerRole.BOUNDARY, classifyMapLayerRole("boundary_disputed"))
    }

    @Test
    fun `rotulos de pais, capital e estado tem enfase alta`() {
        assertEquals(MapLayerRole.LABEL_HIGH, classifyMapLayerRole("label_country_1"))
        assertEquals(MapLayerRole.LABEL_HIGH, classifyMapLayerRole("label_city_capital"))
        assertEquals(MapLayerRole.LABEL_HIGH, classifyMapLayerRole("label_city"))
        assertEquals(MapLayerRole.LABEL_HIGH, classifyMapLayerRole("label_state"))
    }

    @Test
    fun `rotulos secundarios (poi, bairro, nome de via) tem enfase baixa`() {
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("label_town"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("label_village"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("poi_r20"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("poi_transit"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("highway-name-major"))
        assertEquals(MapLayerRole.LABEL_LOW, classifyMapLayerRole("airport"))
    }

    @Test
    fun `camadas baseadas em imagem (padroes, escudos, setas) nao tem papel, ficam inalteradas`() {
        assertEquals(MapLayerRole.NONE, classifyMapLayerRole("road_area_pattern"))
        assertEquals(MapLayerRole.NONE, classifyMapLayerRole("landcover_wetland"))
        assertEquals(MapLayerRole.NONE, classifyMapLayerRole("road_one_way_arrow"))
        assertEquals(MapLayerRole.NONE, classifyMapLayerRole("highway-shield-us-interstate"))
        assertEquals(MapLayerRole.NONE, classifyMapLayerRole("road_shield_us"))
    }

    @Test
    fun `todo papel de cor tem uma cor definida, exceto NONE e RASTER_HIDDEN`() {
        MapLayerRole.entries.forEach { role ->
            val color = colorForMapLayerRole(role)
            if (role == MapLayerRole.NONE || role == MapLayerRole.RASTER_HIDDEN) {
                assertNull("$role nao deveria ter cor (tratamento especial)", color)
            } else {
                assertEquals(
                    "cor de $role deve ser totalmente opaca",
                    255,
                    color?.alpha?.let { (it * 255).toInt() }
                )
            }
        }
    }
}
