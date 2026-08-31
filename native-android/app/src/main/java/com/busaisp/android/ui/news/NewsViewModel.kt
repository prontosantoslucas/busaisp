package com.busaisp.android.ui.news

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.busaisp.android.data.repository.NewsRepository
import com.busaisp.android.data.repository.NewsResult
import com.busaisp.android.domain.model.NewsItem
import com.busaisp.android.domain.model.NewsSourceType
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface NewsUiState {
    object Loading : NewsUiState
    data class Success(val items: List<NewsItem>) : NewsUiState
    data class Error(val message: String) : NewsUiState
}

@HiltViewModel
class NewsViewModel @Inject constructor(
    private val repository: NewsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<NewsUiState>(NewsUiState.Loading)
    val uiState: StateFlow<NewsUiState> = _uiState.asStateFlow()

    private val _selectedFilter = MutableStateFlow(NewsSourceType.ALL)
    val selectedFilter: StateFlow<NewsSourceType> = _selectedFilter.asStateFlow()

    private val _selectedNewsItem = MutableStateFlow<NewsItem?>(null)
    val selectedNewsItem: StateFlow<NewsItem?> = _selectedNewsItem.asStateFlow()

    val filteredNews: StateFlow<List<NewsItem>> = combine(_uiState, _selectedFilter) { state, filter ->
        if (state is NewsUiState.Success) {
            if (filter == NewsSourceType.ALL) {
                state.items
            } else {
                state.items.filter { it.sourceType == filter }
            }
        } else {
            emptyList()
        }
    }.stateIn(viewModelScope, SharingStarted.Eagerly, emptyList())

    init {
        loadNews()
    }

    fun refresh() {
        loadNews()
    }

    fun setFilter(filter: NewsSourceType) {
        _selectedFilter.value = filter
    }

    fun openNewsDetail(item: NewsItem) {
        _selectedNewsItem.value = item
    }

    fun closeNewsDetail() {
        _selectedNewsItem.value = null
    }

    private fun loadNews() {
        viewModelScope.launch {
            _uiState.value = NewsUiState.Loading
            when (val result = repository.getNews()) {
                is NewsResult.Success -> _uiState.value = NewsUiState.Success(result.items)
                is NewsResult.Failure -> _uiState.value = NewsUiState.Error(result.message)
            }
        }
    }
}
