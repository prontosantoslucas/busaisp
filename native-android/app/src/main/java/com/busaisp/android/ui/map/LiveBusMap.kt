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
import org.maplibre.android.style.layers.CircleLayer
import org.maplibre.android.style.layers.PropertyFactory
import org.maplibre.android.style.sources.GeoJsonSource
import org.maplibre.geojson.Feature
import org.maplibre.geojson.FeatureCollection
import org.maplibre.geojson.Point

@Composable
fun LiveBusMap(
    vehicles: List<Vehicle>,
    userLocation: LocationClient.Position?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var mapLibreMap by remember { mutableStateOf<MapLibreMap?>(null) }

    // Garante que a câmera só é recentralizada automaticamente na primeira posição
    // real de GPS recebida (transição null -> não-null), não a cada atualização —
    // senão o mapa "briga" com o usuário toda vez que ele tenta panorâmicar/explorar
    // depois de já ter sido centralizado uma vez.
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
                style.addSource(GeoJsonSource(BUS_SOURCE_ID, FeatureCollection.fromFeatures(emptyList())))
                style.addLayer(
                    CircleLayer(BUS_LAYER_ID, BUS_SOURCE_ID).withProperties(
                        PropertyFactory.circleRadius(7f),
                        PropertyFactory.circleColor(AppColors.LiveAmber.toArgb()),
                        PropertyFactory.circleStrokeWidth(2f),
                        PropertyFactory.circleStrokeColor(AppColors.BackgroundDark.toArgb())
                    )
                )
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

    // Recalcula a posição interpolada (ver domain/GeoInterpolation.kt) em um ciclo
    // curto para que os ônibus se movam continuamente no mapa entre pings reais de
    // GPS, em vez de "teleportar" a cada 25s quando um novo resultado de polling
    // chega. Relançado sempre que `vehicles` muda (novo poll), o que naturalmente
    // reinicia a interpolação a partir dos dados mais recentes em vez de continuar
    // extrapolando de uma base cada vez mais velha.
    LaunchedEffect(mapLibreMap, vehicles) {
        if (vehicles.isEmpty()) {
            updateBusSource(mapLibreMap, vehicles, System.currentTimeMillis())
            return@LaunchedEffect
        }
        while (true) {
            updateBusSource(mapLibreMap, vehicles, System.currentTimeMillis())
            delay(BUS_INTERPOLATION_TICK_MS)
        }
    }

    DisposableEffect(mapLibreMap, userLocation) {
        updateUserSource(mapLibreMap, userLocation)
        onDispose { }
    }

    // "Localização atual": centraliza a câmera assim que a primeira posição real de
    // GPS chega (null -> não-null). Não faz "follow me" contínuo — ver `hasCenteredOnUser`.
    //
    // TODO (limitação conhecida, análoga ao TODO de permissão permanentemente negada em
    // MapScreen): como MapViewModel.onLocationPermissionGranted() é idempotente, tocar o
    // botão de novo depois que o usuário já centralizou e panorâmicou para outro lugar não
    // necessariamente produz uma nova posição distinguível aqui, então não recentraliza.
    // Fazer "recentralizar a cada toque" exigiria propagar um evento explícito de
    // recentralização do botão até o mapa — fica para uma tarefa futura.
    LaunchedEffect(mapLibreMap, userLocation) {
        val map = mapLibreMap ?: return@LaunchedEffect
        val location = userLocation ?: return@LaunchedEffect
        if (hasCenteredOnUser) return@LaunchedEffect
        hasCenteredOnUser = true
        map.easeCamera(
            CameraUpdateFactory.newLatLngZoom(LatLng(location.lat, location.lng), USER_LOCATION_FOCUS_ZOOM),
            USER_LOCATION_EASE_DURATION_MS
        )
    }

    AndroidView(factory = { mapView }, modifier = modifier.fillMaxSize())
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
