package com.busaisp.android.ui.map.components

import androidx.compose.animation.animateContentSize
import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.Linha

@Composable
fun VehicleDetailSheet(
    linha: Linha?,
    vehicleCount: Int,
    isStale: Boolean,
    modifier: Modifier = Modifier
) {
    var expanded by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(topStart = 20.dp, topEnd = 20.dp))
            .clickable { expanded = !expanded }
            .animateContentSize(animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy))
            .padding(16.dp)
    ) {
        Box(
            modifier = Modifier
                .width(40.dp)
                .height(4.dp)
                .align(Alignment.CenterHorizontally)
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f), RoundedCornerShape(2.dp))
        )
        if (linha == null) {
            Text(
                text = "Busque uma linha para ver os ônibus reais no mapa",
                modifier = Modifier.padding(top = 12.dp)
            )
        } else if (expanded) {
            Text(text = linha.letreiro, modifier = Modifier.padding(top = 12.dp))
            Text(text = "${linha.terminalPrincipal} / ${linha.terminalSecundario}")
            Text(text = "$vehicleCount ônibus ao vivo" + if (isStale) " — desatualizado" else "")
        } else {
            Text(
                text = "${linha.letreiro} · $vehicleCount ônibus" + if (isStale) " · desatualizado" else "",
                modifier = Modifier.padding(top = 12.dp)
            )
        }
    }
}
