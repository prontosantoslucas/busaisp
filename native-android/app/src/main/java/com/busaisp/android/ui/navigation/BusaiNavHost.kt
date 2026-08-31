package com.busaisp.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.busaisp.android.ui.map.MapScreen

object BusaiDestinations {
    const val MAP = "map"
}

@Composable
fun BusaiNavHost() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = BusaiDestinations.MAP) {
        composable(BusaiDestinations.MAP) {
            MapScreen()
        }
    }
}
