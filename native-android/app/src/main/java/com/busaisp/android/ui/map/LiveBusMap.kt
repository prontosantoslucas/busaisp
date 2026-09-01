package com.busaisp.android.ui.map

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.busaisp.android.data.location.LocationClient
import com.busaisp.android.domain.interpolatePosition
import com.busaisp.android.domain.model.TrafficHeatmapData
import com.busaisp.android.domain.model.TrafficHotspotStatus
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.theme.AppColors
import kotlinx.coroutines.delay
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
import org.maplibre.android.camera.CameraUpdateFactory
import org.maplibre.android.geometry.LatLng
import org.maplibre.android.maps.MapLibreMap
import org.maplibre.android.maps.MapView
import org.maplibre.android.maps.Style
import org.maplibre.android.style.expressions.Expression.get
import org.maplibre.android.style.layers.BackgroundLayer
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.FillExtrusionLayer
import org.maplibre.android.style.layers.FillLayer
import org.maplibre.android.style.layers.LineLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.layers.RasterLayer
import org.maplibre.android.style.layers.SymbolLayer
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.android.geometry.LatLngBounds
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.Point

@Composable
fun LiveBusMap(
    vehicles: List<Vehicle>,
    userLocation: LocationClient.Position?,
    modifier: Modifier = Modifier,
    heatmapData: TrafficHeatmapData? = null,
    isHeatmapVisible: Boolean = false,
    recenterTrigger: Int = 0,
    darkTheme: Boolean = false
) {
    val context = LocalContext.current
    var mapLibreMap by remember { mutableStateOf<MapLibreMap?>(null) }

    var hasCenteredOnUser by remember { mutableStateOf(false) }

    val mapView = remember {
        MapLibre.getInstance(context)
        MapView(context)
    }

    DisposableEffect(mapView) {
        mapView.onStart()
        mapView.onResume()
        mapView.getMapAsync { map ->
            map.cameraPosition = CameraPosition.Builder()
                .target(LatLng(SAO_PAULO_INITIAL_LAT, SAO_PAULO_INITIAL_LNG))
                .zoom(SAO_PAULO_INITIAL_ZOOM)
                .build()
            map.setStyle(Style.Builder().fromUri(OPEN_FREE_MAP_LIBERTY_STYLE_URL)) { style ->
                // Paleta aplicada pelo LaunchedEffect(mapLibreMap, darkTheme) abaixo,
                // assim que mapLibreMap deixa de ser null — não precisa duplicar aqui.

                // Camada do Mapa de Calor (Halos e Núcleos de Congestionamento)
                style.addSource(GeoJsonSource(HEATMAP_SOURCE_ID, FeatureCollection.fromFeatures(emptyList())))
                style.addLayer(
                    CircleLayer(HEATMAP_OUTER_LAYER_ID, HEATMAP_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(32f),
                        PropertyFactory.circleColor(get("outerColor")),
                        PropertyFactory.circleOpacity(0.40f),
                        PropertyFactory.circleBlur(0.75f)
                    )
                )
                style.addLayer(
                    CircleLayer(HEATMAP_INNER_LAYER_ID, HEATMAP_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(14f),
                        PropertyFactory.circleColor(get("innerColor")),
                        PropertyFactory.circleOpacity(0.85f),
                        PropertyFactory.circleStrokeWidth(2f),
                        PropertyFactory.circleStrokeColor(AppColors.SurfaceLight.toArgb())
                    )
                )

                // Camada dos Ônibus da SPTrans
                style.addSource(GeoJsonSource(BUS_SOURCE_ID, FeatureCollection.fromFeatures(emptyList())))
                style.addLayer(
                    CircleLayer(BUS_LAYER_ID, BUS_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(7f),
                        PropertyFactory.circleColor(AppColors.LiveAmber.toArgb()),
                        PropertyFactory.circleStrokeWidth(2f),
                        PropertyFactory.circleStrokeColor(AppColors.BackgroundDark.toArgb())
                    )
                )

                // Camada de Localização do Usuário
                style.addSource(GeoJsonSource(USER_SOURCE_ID, FeatureCollection.fromFeatures(emptyList())))
                style.addLayer(
                    CircleLayer(USER_LAYER_ID, USER_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(9f),
                        PropertyFactory.circleColor(AppColors.UserLocationBlue.toArgb()),
                        PropertyFactory.circleStrokeWidth(3f),
                        PropertyFactory.circleStrokeColor(AppColors.SurfaceLight.toArgb())
                    )
                )
                mapLibreMap = map
            }
        }
        onDispose {
            mapView.onPause()
            mapView.onStop()
            mapView.onDestroy()
        }
    }

    LaunchedEffect(mapLibreMap, vehicles) {
        if (vehicles.isEmpty()) {
            updateBusSource(mapLibreMap, vehicles, System.currentTimeMillis())
            return@LaunchedEffect
        }

        // Ajuste inteligente de enquadramento da câmera nos veículos da linha
        val map = mapLibreMap
        if (map != null && vehicles.isNotEmpty()) {
            if (vehicles.size == 1) {
                map.easeCamera(
                    CameraUpdateFactory.newLatLngZoom(LatLng(vehicles[0].lat, vehicles[0].lng), 14.5),
                    1000
                )
            } else {
                val boundsBuilder = LatLngBounds.Builder()
                vehicles.forEach { v ->
                    boundsBuilder.include(LatLng(v.lat, v.lng))
                }
                try {
                    map.easeCamera(
                        CameraUpdateFactory.newLatLngBounds(boundsBuilder.build(), 120),
                        1200
                    )
                } catch (_: Exception) {
                    map.easeCamera(
                        CameraUpdateFactory.newLatLngZoom(LatLng(vehicles[0].lat, vehicles[0].lng), 14.5),
                        1000
                    )
                }
            }
        }

        while (true) {
            updateBusSource(mapLibreMap, vehicles, System.currentTimeMillis())
            delay(BUS_INTERPOLATION_TICK_MS)
        }
    }

    // Reaplica a paleta sempre que o tema resolvido mudar (troca manual nas
    // Configurações, ou o tema do sistema mudando com SISTEMA selecionado) —
    // não só na primeira carga do estilo.
    LaunchedEffect(mapLibreMap, darkTheme) {
        val style = mapLibreMap?.style ?: return@LaunchedEffect
        applyMapPalette(style, darkTheme)
    }

    DisposableEffect(mapLibreMap, userLocation) {
        updateUserSource(mapLibreMap, userLocation)
        onDispose { }
    }

    DisposableEffect(mapLibreMap, isHeatmapVisible, heatmapData) {
        updateHeatmapSource(mapLibreMap, isHeatmapVisible, heatmapData)
        onDispose { }
    }

    // Recentralizar na localização do usuário (tanto inicial quanto ao clicar no botão)
    LaunchedEffect(mapLibreMap, userLocation, recenterTrigger) {
        val map = mapLibreMap ?: return@LaunchedEffect
        val location = userLocation ?: return@LaunchedEffect
        if (recenterTrigger == 0 && hasCenteredOnUser) return@LaunchedEffect
        hasCenteredOnUser = true
        map.easeCamera(
            CameraUpdateFactory.newLatLngZoom(LatLng(location.lat, location.lng), USER_LOCATION_FOCUS_ZOOM),
            USER_LOCATION_EASE_DURATION_MS
        )
    }

    AndroidView(factory = { mapView }, modifier = modifier.fillMaxSize())
}

// Claro: toque leve, só água/parques (ver MapColorPalette.kt). Escuro: recolore
// tudo (fundo, vias por hierarquia, prédios, texto). Qualquer camada sem cor
// definida (colorForMapLayerRole retorna null) fica com a aparência nativa do
// provedor "Liberty", propositalmente.
private fun applyMapPalette(style: Style, darkTheme: Boolean) {
    style.layers.forEach { layer ->
        val role = classifyMapLayerRole(layer.id)
        if (role == MapLayerRole.RASTER_HIDDEN) {
            // Só escondida no escuro (evita um retalho colorido do raster de
            // baixo zoom por baixo das camadas escuras); no claro fica nativa.
            if (darkTheme) (layer as? RasterLayer)?.setProperties(PropertyFactory.rasterOpacity(0f))
            return@forEach
        }
        val argb = colorForMapLayerRole(role, darkTheme)?.toArgb() ?: return@forEach
        when (role) {
            MapLayerRole.BACKGROUND -> (layer as? BackgroundLayer)?.setProperties(
                PropertyFactory.backgroundColor(argb)
            )
            MapLayerRole.LABEL_HIGH, MapLayerRole.LABEL_LOW -> (layer as? SymbolLayer)?.setProperties(
                PropertyFactory.textColor(argb),
                PropertyFactory.textHaloColor(darkLabelHalo.toArgb())
            )
            else -> when (layer) {
                is FillLayer -> layer.setProperties(PropertyFactory.fillColor(argb))
                is LineLayer -> layer.setProperties(PropertyFactory.lineColor(argb))
                is FillExtrusionLayer -> layer.setProperties(PropertyFactory.fillExtrusionColor(argb))
                else -> Unit
            }
        }
    }
}

private fun updateHeatmapSource(map: MapLibreMap?, isVisible: Boolean, data: TrafficHeatmapData?) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(HEATMAP_SOURCE_ID) ?: return
    if (!isVisible || data == null) {
        source.setGeoJson(FeatureCollection.fromFeatures(emptyList()))
        return
    }

    val features = data.hotspots.map { hotspot ->
        val (outerHex, innerHex) = when (hotspot.status) {
            TrafficHotspotStatus.CRITICO -> "#991B1B" to "#DC2626"
            TrafficHotspotStatus.INTENSO -> "#C2410C" to "#EA580C"
            TrafficHotspotStatus.MODERADO -> "#D97706" to "#F59E0B"
            TrafficHotspotStatus.FLUINDO -> "#047857" to "#10B981"
        }
        val outerColor = android.graphics.Color.parseColor(outerHex)
        val innerColor = android.graphics.Color.parseColor(innerHex)

        Feature.fromGeometry(Point.fromLngLat(hotspot.lng, hotspot.lat)).apply {
            addStringProperty("outerColor", String.format("#%06X", 0xFFFFFF and outerColor))
            addStringProperty("innerColor", String.format("#%06X", 0xFFFFFF and innerColor))
            addStringProperty("name", hotspot.name)
            addNumberProperty("delay", hotspot.delayMinutes)
        }
    }
    source.setGeoJson(FeatureCollection.fromFeatures(features))
}

private fun updateBusSource(map: MapLibreMap?, vehicles: List<Vehicle>, nowEpochMs: Long) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(BUS_SOURCE_ID) ?: return
    val features = vehicles.map { vehicle ->
        val position = interpolatePosition(vehicle, nowEpochMs)
        Feature.fromGeometry(Point.fromLngLat(position.lng, position.lat)).apply {
            addStringProperty("prefix", vehicle.prefix)
        }
    }
    source.setGeoJson(FeatureCollection.fromFeatures(features))
}

private fun updateUserSource(map: MapLibreMap?, position: LocationClient.Position?) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(USER_SOURCE_ID) ?: return
    source.setGeoJson(
        if (position != null) {
            FeatureCollection.fromFeature(Feature.fromGeometry(Point.fromLngLat(position.lng, position.lat)))
        } else {
            FeatureCollection.fromFeatures(emptyList())
        }
    )
}
