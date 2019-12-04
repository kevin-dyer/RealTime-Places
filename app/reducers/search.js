import {
	UPDATE_AUTOCOMPLETE_SEARCH,
	TOGGLE_FULL_SCREEN
} from '../actions/search'


const initialState = {
	searchText: '',
	fullScreen: false,
	scrollToIndex: 0
}

export default function search(state=initialState, action={}) {
	switch(action.type) {
		case UPDATE_AUTOCOMPLETE_SEARCH:
			return {
				...state,
				searchText: action.searchText
			}

		case TOGGLE_FULL_SCREEN:
			return {
				...state,
				fullScreen: typeof(action.fullScreen) === 'boolean' ? action.fullScreen : !state.fullScreen,
				scrollToIndex: action.index
			}
		default:
			return state
	}
}