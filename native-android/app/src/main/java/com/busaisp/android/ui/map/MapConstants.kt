package com.busaisp.android.ui.map

// OpenFreeMap: tiles vetoriais gratuitos, sem API key, sem conta —
// https://openfreemap.org/quick_start/
const val OPEN_FREE_MAP_LIBERTY_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty"

const val BUS_SOURCE_ID = "bus-vehicles-source"
const val BUS_LAYER_ID = "bus-vehicles-layer"
const val USER_SOURCE_ID = "user-location-source"
const val USER_LAYER_ID = "user-location-layer"
const val HEATMAP_SOURCE_ID = "traffic-heatmap-source"
const val HEATMAP_OUTER_LAYER_ID = "traffic-heatmap-outer-layer"
const val HEATMAP_INNER_LAYER_ID = "traffic-heatmap-inner-layer"

// Centro aproximado de São Paulo, usado como câmera inicial antes de qualquer GPS/linha.
const val SAO_PAULO_INITIAL_LAT = -23.5505
const val SAO_PAULO_INITIAL_LNG = -46.6333
const val SAO_PAULO_INITIAL_ZOOM = 12.0

// Intervalo de recálculo da posição interpolada dos ônibus entre pings de GPS
// (ver domain/GeoInterpolation.kt) — 250ms para deslizamento contínuo estilo Uber/Waze.
const val BUS_INTERPOLATION_TICK_MS = 250L

// Zoom e duração da animação de câmera ao centralizar na localização do usuário
// (botão "Localização atual") — mais próximo que o zoom inicial da cidade, para
// mostrar o usuário e seu entorno imediato.
const val USER_LOCATION_FOCUS_ZOOM = 16.0
const val USER_LOCATION_EASE_DURATION_MS = 1_000
