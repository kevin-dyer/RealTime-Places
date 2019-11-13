import {
	UPDATE_AUTOCOMPLETE_SEARCH
} from '../actions/search'


const initialState = {
	searchText: ''
}

export default function search(state=initialState, action={}) {
	switch(action.type) {
		case UPDATE_AUTOCOMPLETE_SEARCH:
			return {
				...state,
				searchText: action.searchText
			}
		default:
			return state
	}
}