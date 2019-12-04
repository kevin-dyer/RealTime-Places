
export const UPDATE_AUTOCOMPLETE_SEARCH = 'UPDATE_AUTOCOMPLETE_SEARCH'
export const TOGGLE_FULL_SCREEN = 'TOGGLE_FULL_SCREEN'

export const updateAutocompleteSearch = (searchText) => {
	return {
		type: UPDATE_AUTOCOMPLETE_SEARCH,
		searchText
	}
}

export const toggleFullScreen = (fullScreen, index) => {
	return {
		type: TOGGLE_FULL_SCREEN,
		fullScreen,
		index
	}
}