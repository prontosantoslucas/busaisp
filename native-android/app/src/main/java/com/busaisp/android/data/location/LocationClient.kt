package com.busaisp.android.data.location

import android.annotation.SuppressLint
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.Priority
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject

interface LocationClient {
    data class Position(val lat: Double, val lng: Double)
    fun observeLocation(): Flow<Position>
}

class FusedLocationClient @Inject constructor(
    private val fusedClient: FusedLocationProviderClient
) : LocationClient {

    @SuppressLint("MissingPermission") // checagem de permissão é feita na camada de UI (Task 10) antes de chamar isto
    override fun observeLocation(): Flow<LocationClient.Position> = callbackFlow {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5_000L).build()
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(LocationClient.Position(it.latitude, it.longitude)) }
            }
        }
        fusedClient.requestLocationUpdates(request, callback, null)
        awaitClose { fusedClient.removeLocationUpdates(callback) }
    }
}
