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

// Modo claro (padrão, redesign 2026-09-01): toque leve, não um recolorir
// total — só água e parques recebem um wash translúcido derivado do azul/
// verde já existentes. Vias, prédios e texto ficam com a aparência nativa do
// provedor "Liberty", legibilidade já testada.
private object MapPaletteLight {
    val Water = AppColors.UserLocationBlue.copy(alpha = 0.18f)
    val Park = AppColors.OnRouteEmerald.copy(alpha = 0.18f)
}

// Modo escuro: aqui sim um recolorir completo, igual toda a aplicação nesse
// modo (ver Theme.kt AppDarkColors) — a versão anterior desse reskin foi
// revertida por destoar de um app que era Material claro no resto; agora que
// claro/escuro mudam juntos em todas as telas, o mapa escuro completo deixa
// de ser o problema. Tons sobem em luminância conforme a hierarquia (vias
// principais mais claras que locais, rótulos importantes mais claros que
// secundários); âmbar segue reservado só pra GPS ao vivo, nunca usado aqui.
private object MapPaletteDark {
    val Background = AppColors.BackgroundDark
    val Water = Color(0xFF102233)
    val Park = Color(0xFF13291D)
    val LandFill = Color(0xFF14131F)
    val Building = Color(0xFF1B1926)
    val RoadCasing = Color(0xFF08070D)
    val RoadHighway = Color(0xFFE8E6F0)
    val RoadArterial = Color(0xFFB9B6C9)
    val RoadMinor = Color(0xFF7A7791)
    val RoadRail = Color(0xFF5B5870)
    val Boundary = Color(0xFF3A3750)
    val LabelHigh = AppColors.SurfaceLight
    val LabelLow = Color(0xFF9C99AE)
    val LabelHalo = AppColors.BackgroundDark
}

/** Cor do halo/contorno de texto no modo escuro — null no claro (usa o halo padrão do provedor). */
val darkLabelHalo: Color get() = MapPaletteDark.LabelHalo

fun colorForMapLayerRole(role: MapLayerRole, darkTheme: Boolean): Color? =
    if (darkTheme) colorForDarkRole(role) else colorForLightRole(role)

private fun colorForLightRole(role: MapLayerRole): Color? = when (role) {
    MapLayerRole.WATER -> MapPaletteLight.Water
    MapLayerRole.PARK -> MapPaletteLight.Park
    else -> null
}

private fun colorForDarkRole(role: MapLayerRole): Color? = when (role) {
    MapLayerRole.BACKGROUND -> MapPaletteDark.Background
    MapLayerRole.WATER -> MapPaletteDark.Water
    MapLayerRole.PARK -> MapPaletteDark.Park
    MapLayerRole.LANDUSE_NEUTRAL -> MapPaletteDark.LandFill
    MapLayerRole.BUILDING -> MapPaletteDark.Building
    MapLayerRole.ROAD_CASING -> MapPaletteDark.RoadCasing
    MapLayerRole.ROAD_HIGHWAY -> MapPaletteDark.RoadHighway
    MapLayerRole.ROAD_ARTERIAL -> MapPaletteDark.RoadArterial
    MapLayerRole.ROAD_MINOR -> MapPaletteDark.RoadMinor
    MapLayerRole.ROAD_RAIL -> MapPaletteDark.RoadRail
    MapLayerRole.BOUNDARY -> MapPaletteDark.Boundary
    MapLayerRole.LABEL_HIGH -> MapPaletteDark.LabelHigh
    MapLayerRole.LABEL_LOW -> MapPaletteDark.LabelLow
    MapLayerRole.NONE, MapLayerRole.RASTER_HIDDEN -> null
}
