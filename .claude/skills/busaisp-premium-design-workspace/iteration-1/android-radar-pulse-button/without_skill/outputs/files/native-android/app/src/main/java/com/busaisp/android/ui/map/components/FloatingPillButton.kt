package com.busaisp.android.ui.map.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.composed
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/**
 * Botão flutuante circular usado nos controles do mapa ao vivo.
 *
 * Quando [showRadarPulse] é `true`, exibe um efeito de "radar" — anéis
 * concêntricos que se expandem e desaparecem em loop atrás do botão — para
 * chamar atenção para ações contínuas/"ao vivo" (ex.: localização atual).
 */
@Composable
fun FloatingPillButton(
    icon: ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    containerColor: Color = MaterialTheme.colorScheme.surface,
    contentColor: Color = MaterialTheme.colorScheme.onSurface,
    showRadarPulse: Boolean = false,
    radarPulseColor: Color = contentColor
) {
    val pulseModifier = if (showRadarPulse) {
        Modifier.radarPulse(color = radarPulseColor)
    } else {
        Modifier
    }

    Icon(
        imageVector = icon,
        contentDescription = contentDescription,
        modifier = modifier
            .then(pulseModifier)
            .background(containerColor, CircleShape)
            .clickable(onClick = onClick)
            .padding(14.dp),
        tint = contentColor
    )
}

/**
 * Desenha de 1 a 3 anéis de radar que se expandem para fora do botão e
 * desvanecem, em loop contínuo — como um "ping" de sonar. O desenho não
 * altera o tamanho/medida do componente (é pintado fora dos limites do
 * layout), então não afeta o alinhamento dos outros controles flutuantes.
 */
private fun Modifier.radarPulse(
    color: Color,
    ringCount: Int = 3,
    durationMillis: Int = 1800,
    maxExpansion: Float = 1.9f,
    strokeWidth: Dp = 1.5.dp,
    maxAlpha: Float = 0.45f
): Modifier = composed {
    val infiniteTransition = rememberInfiniteTransition(label = "radarPulseTransition")
    val progress by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 1f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = durationMillis, easing = LinearEasing),
            repeatMode = RepeatMode.Restart
        ),
        label = "radarPulseProgress"
    )

    this.drawBehind {
        val baseRadius = size.minDimension / 2f
        val maxRadius = baseRadius * maxExpansion
        val strokeWidthPx = strokeWidth.toPx()

        repeat(ringCount) { index ->
            val phase = (progress + index.toFloat() / ringCount) % 1f
            val radius = baseRadius + phase * (maxRadius - baseRadius)
            val alpha = (1f - phase) * maxAlpha
            if (alpha > 0.01f) {
                drawCircle(
                    color = color,
                    radius = radius,
                    alpha = alpha,
                    style = Stroke(width = strokeWidthPx)
                )
            }
        }
    }
}
