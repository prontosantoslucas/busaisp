package com.busaisp.android.ui.favorites

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.StarBorder
import androidx.compose.material.icons.filled.Work
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.ui.routesearch.RouteSearchViewModel
import com.busaisp.android.ui.routesearch.components.AddressField
import com.busaisp.android.ui.theme.AppColors

@Composable
fun FavoritesScreen(
    viewModel: FavoritesViewModel = hiltViewModel(),
    routeSearchViewModel: RouteSearchViewModel = hiltViewModel()
) {
    val home by viewModel.homeAddress.collectAsStateWithLifecycle()
    val work by viewModel.workAddress.collectAsStateWithLifecycle()
    val routeFavorites by viewModel.routeFavorites.collectAsStateWithLifecycle()
    val suggestions by routeSearchViewModel.originSuggestions.collectAsStateWithLifecycle()

    var editingSlot by remember { mutableStateOf<String?>(null) }
    var query by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Meus Endereços", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))

        AddressSlotCard(
            label = "Casa",
            icon = Icons.Filled.Home,
            value = home?.title,
            onClick = { editingSlot = "home"; query = "" }
        )
        Spacer(modifier = Modifier.height(8.dp))
        AddressSlotCard(
            label = "Trabalho",
            icon = Icons.Filled.Work,
            value = work?.title,
            onClick = { editingSlot = "work"; query = "" }
        )

        if (editingSlot != null) {
            Spacer(modifier = Modifier.height(12.dp))
            AddressField(
                label = if (editingSlot == "home") "Buscar endereço de Casa" else "Buscar endereço do Trabalho",
                query = query,
                suggestions = suggestions,
                onQueryChanged = { query = it; routeSearchViewModel.onOriginChanged(it) },
                onSuggestionSelected = { location: RouteLocation ->
                    if (editingSlot == "home") {
                        viewModel.saveHomeAddress(location.name, location.lat, location.lng)
                    } else {
                        viewModel.saveWorkAddress(location.name, location.lat, location.lng)
                    }
                    editingSlot = null
                }
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("Rotas Favoritas", style = MaterialTheme.typography.titleMedium)
        Spacer(modifier = Modifier.height(10.dp))

        if (routeFavorites.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        imageVector = Icons.Filled.StarBorder,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.35f),
                        modifier = Modifier.size(36.dp)
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Nenhuma rota favoritada ainda",
                        style = MaterialTheme.typography.titleSmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                    )
                    Text(
                        text = "Ao calcular uma rota, toque na estrela para salvá-la aqui e acessá-la rapidamente.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f),
                        modifier = Modifier.padding(top = 4.dp),
                        lineHeight = 16.sp
                    )
                }
            }
        } else {
            LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                items(routeFavorites, key = { it.type.name + it.refCode }) { favorite ->
                    FavoriteRow(favorite = favorite, onRemove = { viewModel.removeFavorite(favorite) })
                }
            }
        }
    }
}

@Composable
private fun AddressSlotCard(
    label: String,
    icon: ImageVector,
    value: String?,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.08f), CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.size(20.dp)
            )
        }
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.labelLarge,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = value ?: "Toque para definir endereço",
                style = MaterialTheme.typography.bodyMedium,
                color = if (value != null) MaterialTheme.colorScheme.onSurface.copy(alpha = 0.8f)
                        else AppColors.LiveAmber
            )
        }
    }
}

@Composable
private fun FavoriteRow(favorite: Favorite, onRemove: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(14.dp))
            .padding(horizontal = 14.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = favorite.title,
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Medium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = "Rota salva",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.55f)
            )
        }
        IconButton(onClick = onRemove) {
            Icon(
                Icons.Filled.Close,
                contentDescription = "Remover ${favorite.title} dos favoritos",
                tint = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
            )
        }
    }
}
