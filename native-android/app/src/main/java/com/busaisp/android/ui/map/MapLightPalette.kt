package com.busaisp.android.ui.map

import androidx.compose.ui.graphics.Color
import com.busaisp.android.ui.theme.AppColors

enum class MapLayerRole {
    NONE, BACKGROUND, RASTER_HIDDEN, WATER, PARK, LANDUSE_NEUTRAL, BUILDING,
    ROAD_CASING, ROAD_HIGHWAY, ROAD_ARTERIAL, ROAD_MINOR, ROAD_RAIL, BOUNDARY,
    LABEL_HIGH, LABEL_LOW
}

private val HIGH_EMPHASIS_LABEL_IDS = setOf(
    "label_country_1", "label_country_2", "label_country_3",
    "label_city_capital", "label_city", "label_state"
)

private val LOW_EMPHASIS_LABEL_IDS = setOf(
    "label_town", "label_village", "label_other", "airport",
    "poi_r20", "poi_r7", "poi_r1", "poi_transit",
    "highway-name-major", "highway-name-minor", "highway-name-path",
    "waterway_line_label", "water_name_point_label", "water_name_line_label"
)

private val LANDUSE_NEUTRAL_FILL_IDS = setOf(
    "landuse_residential", "landcover_ice", "landuse_pitch", "landuse_track",
    "landuse_cemetery", "landuse_hospital", "landuse_school", "landcover_sand",
    "aeroway_fill"
)

/**
 * Classifica cada camada do estilo "Liberty" (OpenFreeMap/OSM Liberty) num papel
 * semântico. IDs conferidos contra a versão real do estilo
 * (https://tiles.openfreemap.org/styles/liberty, 111 camadas em 2026-09-01) —
 * não são um esquema genérico, casam exatamente com esse provedor.
 * Ordem dos testes importa: sufixos/tiers mais específicos são checados antes
 * de fallbacks amplos (ex.: "_casing" antes de "rail"/"minor").
 */
fun classifyMapLayerRole(layerId: String): MapLayerRole = when {
    layerId == "background" -> MapLayerRole.BACKGROUND
    layerId == "natural_earth" -> MapLayerRole.RASTER_HIDDEN
    layerId == "water" || (layerId.startsWith("waterway_") && !layerId.endsWith("_label")) -> MapLayerRole.WATER
    layerId == "park" || layerId == "park_outline" ||
        layerId == "landcover_wood" || layerId == "landcover_grass" -> MapLayerRole.PARK
    layerId in LANDUSE_NEUTRAL_FILL_IDS -> MapLayerRole.LANDUSE_NEUTRAL
    layerId == "building" || layerId == "building-3d" -> MapLayerRole.BUILDING
    layerId.endsWith("_casing") -> MapLayerRole.ROAD_CASING
    layerId.contains("rail") -> MapLayerRole.ROAD_RAIL
    layerId.contains("motorway") || layerId.contains("trunk_primary") || layerId == "aeroway_runway" ->
        MapLayerRole.ROAD_HIGHWAY
    layerId.contains("secondary_tertiary") || layerId == "aeroway_taxiway" -> MapLayerRole.ROAD_ARTERIAL
    layerId.contains("minor") || layerId.contains("street") || layerId.contains("service_track") ||
        layerId.contains("link") || layerId.contains("path_pedestrian") -> MapLayerRole.ROAD_MINOR
    layerId.startsWith("boundary") -> MapLayerRole.BOUNDARY
    layerId in HIGH_EMPHASIS_LABEL_IDS -> MapLayerRole.LABEL_HIGH
    layerId in LOW_EMPHASIS_LABEL_IDS -> MapLayerRole.LABEL_LOW
    else -> MapLayerRole.NONE
}

// Redesign 2026-09-01 (azul claro + branco): ao contrário da tentativa anterior
// (reskin dark-first de toda camada, revertida por destoar do resto do app),
// este é um toque leve — só água e parques recebem um tom derivado do azul de
// marca (AppColors.UserLocationBlue) e do verde já existente
// (AppColors.OnRouteEmerald), como um wash translúcido sobre o estilo "Liberty"
// original. Vias, prédios, texto e fundo ficam com a aparência nativa do
// provedor — legibilidade testada, sem inventar uma paleta nova pra eles.
object MapPalette {
    val Water = AppColors.UserLocationBlue.copy(alpha = 0.18f)
    val Park = AppColors.OnRouteEmerald.copy(alpha = 0.18f)
}

fun colorForMapLayerRole(role: MapLayerRole): Color? = when (role) {
    MapLayerRole.WATER -> MapPalette.Water
    MapLayerRole.PARK -> MapPalette.Park
    else -> null
}
