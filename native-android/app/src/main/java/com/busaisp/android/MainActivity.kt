package com.busaisp.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.busaisp.android.ui.navigation.BusaiNavHost
import com.busaisp.android.ui.theme.BusaiSPTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BusaiSPTheme {
                BusaiNavHost()
            }
        }
    }
}
