
export const UPDATE_AUTOCOMPLETE_SEARCH = 'UPDATE_AUTOCOMPLETE_SEARCH'

export const updateAutocompleteSearch = (searchText) => {
	return {
		type: UPDATE_AUTOCOMPLETE_SEARCH,
		searchText
	}
}