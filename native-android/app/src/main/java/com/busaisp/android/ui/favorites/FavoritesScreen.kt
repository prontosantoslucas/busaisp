package com.busaisp.android.ui.favorites

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Close
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.RouteLocation
import com.busaisp.android.ui.routesearch.RouteSearchViewModel
import com.busaisp.android.ui.routesearch.components.AddressField

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

        AddressSlotRow(
            label = "Casa",
            value = home?.title,
            onClick = { editingSlot = "home"; query = "" },
        )
        AddressSlotRow(
            label = "Trabalho",
            value = work?.title,
            onClick = { editingSlot = "work"; query = "" },
        )

        if (editingSlot != null) {
            AddressField(
                label = "Buscar endereço",
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

        Text("Rotas favoritas", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 24.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(routeFavorites, key = { it.type.name + it.refCode }) { favorite ->
                FavoriteRow(favorite = favorite, onRemove = { viewModel.removeFavorite(favorite) })
            }
        }
    }
}

@Composable
private fun AddressSlotRow(label: String, value: String?, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = 12.dp)
    ) {
        Text(text = label, style = MaterialTheme.typography.labelLarge)
        Text(text = value ?: "Definir endereço", modifier = Modifier.padding(start = 8.dp))
    }
}

@Composable
private fun FavoriteRow(favorite: Favorite, onRemove: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .background(MaterialTheme.colorScheme.surface, RoundedCornerShape(12.dp))
            .padding(12.dp)
    ) {
        Text(text = favorite.title, modifier = Modifier.fillMaxWidth())
        IconButton(onClick = onRemove) {
            Icon(Icons.Filled.Close, contentDescription = "Remover ${favorite.title} dos favoritos")
        }
    }
}
