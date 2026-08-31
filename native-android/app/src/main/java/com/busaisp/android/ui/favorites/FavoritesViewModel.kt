package com.busaisp.android.ui.favorites

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.favorites.FavoriteRepository
import com.busaisp.android.domain.model.FAVORITE_HOME_REF_CODE
import com.busaisp.android.domain.model.FAVORITE_WORK_REF_CODE
import com.busaisp.android.domain.model.Favorite
import com.busaisp.android.domain.model.FavoriteType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class FavoritesViewModel @Inject constructor(
    private val favoriteRepository: FavoriteRepository
) : ViewModel() {

    val favorites: StateFlow<List<Favorite>> = favoriteRepository.observeFavorites()
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    val homeAddress: StateFlow<Favorite?> = favoriteRepository.observeFavorites()
        .map { list -> list.firstOrNull { it.type == FavoriteType.ENDERECO && it.refCode == FAVORITE_HOME_REF_CODE } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val workAddress: StateFlow<Favorite?> = favoriteRepository.observeFavorites()
        .map { list -> list.firstOrNull { it.type == FavoriteType.ENDERECO && it.refCode == FAVORITE_WORK_REF_CODE } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, null)

    val routeFavorites: StateFlow<List<Favorite>> = favoriteRepository.observeFavorites()
        .map { list -> list.filter { it.type == FavoriteType.LINHA } }
        .stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    fun toggleFavorite(favorite: Favorite) {
        viewModelScope.launch { favoriteRepository.toggleFavorite(favorite) }
    }

    fun saveHomeAddress(title: String, lat: Double, lng: Double) {
        viewModelScope.launch {
            favoriteRepository.saveAddressFavorite(Favorite(FavoriteType.ENDERECO, FAVORITE_HOME_REF_CODE, title, "Casa", lat, lng))
        }
    }

    fun saveWorkAddress(title: String, lat: Double, lng: Double) {
        viewModelScope.launch {
            favoriteRepository.saveAddressFavorite(Favorite(FavoriteType.ENDERECO, FAVORITE_WORK_REF_CODE, title, "Trabalho", lat, lng))
        }
    }

    fun removeFavorite(favorite: Favorite) {
        viewModelScope.launch { favoriteRepository.removeFavorite(favorite.type, favorite.refCode) }
    }
}
