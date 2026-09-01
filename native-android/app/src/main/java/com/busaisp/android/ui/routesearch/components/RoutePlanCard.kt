package com.busaisp.android.ui.routesearch.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.busaisp.android.domain.model.RoutePlan
import com.busaisp.android.ui.routesearch.formatDurationMinutes
import com.busaisp.android.ui.theme.AppColors
import com.busaisp.android.ui.theme.EtaCounterStyle
import com.busaisp.android.ui.theme.LineColors

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
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(
                    text = formatDurationMinutes(plan.totalDurationMinutes),
                    style = EtaCounterStyle,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.width(8.dp))
                val railBadgeColor = LineColors.MetroLinha1Azul
                val busBadgeColor = AppColors.LiveAmber
                val badgeColor = if (plan.isRail) railBadgeColor else busBadgeColor
                Box(
                    modifier = Modifier
                        .background(
                            badgeColor.copy(alpha = 0.15f),
                            RoundedCornerShape(6.dp)
                        )
                        .padding(horizontal = 8.dp, vertical = 2.dp)
                ) {
                    Text(
                        text = if (plan.isRail) "Metrô / CPTM" else "SPTrans",
                        fontSize = 11.sp,
                        fontWeight = FontWeight.Bold,
                        color = badgeColor
                    )
                }
            }

            if (onToggleFavorite != null) {
                IconButton(onClick = onToggleFavorite) {
                    if (isFavorited) {
                        Icon(
                            imageVector = Icons.Filled.Star,
                            contentDescription = "Desfavoritar rota",
                            tint = AppColors.LiveAmber
                        )
                    } else {
                        Icon(
                            imageVector = Icons.Outlined.StarBorder,
                            contentDescription = "Favoritar rota",
                            tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(4.dp))

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = "${plan.departureHour} → ${plan.arrivalHour}",
                style = EtaCounterStyle.copy(fontSize = 14.sp),
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.85f)
            )
            Text(
                text = if (plan.transferCount == 0) "Direto" else "${plan.transferCount} ${if (plan.transferCount == 1) "baldeação" else "baldeações"}",
                fontSize = 13.sp,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        Text(
            text = "${plan.farePrice} · trânsito ${plan.trafficStatus.lowercase()}",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f)
        )

        if (plan.arrivalTimeUnreachable) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Não é possível chegar no horário desejado saindo agora",
                color = MaterialTheme.colorScheme.error,
                fontSize = 12.sp,
                fontWeight = FontWeight.Medium
            )
        }

        if (plan.isRail) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = "Trecho de trilho: horário programado, não GPS ao vivo",
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                fontSize = 11.sp
            )
        }
    }
}
