package com.busaisp.android.ui.map

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.viewinterop.AndroidView
import com.busaisp.android.domain.model.Vehicle
import com.busaisp.android.ui.theme.AppColors
import org.maplibre.android.MapLibre
import org.maplibre.android.camera.CameraPosition
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

data class LocationClientPosition(val lat: Double, val lng: Double)

@Composable
fun LiveBusMap(
    vehicles: List<Vehicle>,
    userLocation: LocationClientPosition?,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var mapLibreMap by remember { mutableStateOf<MapLibreMap?>(null) }

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
                        PropertyFactory.circleStrokeColor(0xFFFFFFFF.toInt())
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

    DisposableEffect(mapLibreMap, vehicles) {
        updateBusSource(mapLibreMap, vehicles)
        onDispose { }
    }

    DisposableEffect(mapLibreMap, userLocation) {
        updateUserSource(mapLibreMap, userLocation)
        onDispose { }
    }

    AndroidView(factory = { mapView }, modifier = modifier.fillMaxSize())
}

private fun updateBusSource(map: MapLibreMap?, vehicles: List<Vehicle>) {
    val style = map?.style ?: return
    val source = style.getSourceAs<GeoJsonSource>(BUS_SOURCE_ID) ?: return
    val features = vehicles.map { vehicle ->
        Feature.fromGeometry(Point.fromLngLat(vehicle.lng, vehicle.lat)).apply {
            addStringProperty("prefix", vehicle.prefix)
        }
    }
    source.setGeoJson(FeatureCollection.fromFeatures(features))
}

private fun updateUserSource(map: MapLibreMap?, position: LocationClientPosition?) {
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
