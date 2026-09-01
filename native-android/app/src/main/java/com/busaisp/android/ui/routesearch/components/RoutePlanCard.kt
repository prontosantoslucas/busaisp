package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.outlined.StarBorder
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.busaisp.android.domain.model.RoutePlan

@Composable
fun RoutePlanCard(
    plan: RoutePlan,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isFavorited: Boolean = false,
    onToggleFavorite: (() -> Unit)? = null
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(16.dp))
            .clickable(onClick = onClick)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "${plan.totalDurationMinutes} min" + if (plan.isRail) " · Metrô/CPTM" else "",
                style = MaterialTheme.typography.titleMedium
            )
            if (onToggleFavorite != null) {
                IconButton(onClick = onToggleFavorite) {
                    if (isFavorited) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = "Desfavoritar rota",
                            tint = MaterialTheme.colorScheme.primary
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Outlined.StarBorder,
                            contentDescription = "Favoritar rota"
                        )
                    }
                }
            }
        }
        Text(text = "${plan.departureHour} → ${plan.arrivalHour} · ${plan.transferCount} baldeações")
        Text(text = "${plan.farePrice} · trânsito ${plan.trafficStatus.lowercase()}")
        if (plan.arrivalTimeUnreachable) {
            Text(
                text = "Não é possível chegar no horário desejado saindo agora",
                color = MaterialTheme.colorScheme.error
            )
        }
        if (plan.isRail) {
            Text(
                text = "Trecho de trilho: horário programado, não GPS ao vivo",
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}
