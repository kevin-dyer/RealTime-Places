import {
	UPDATE_USER_DATA
} from '../actions/login'

const initialState = {
	userData: {}
}

export default function login(state=initialState, action={}) {
	switch(action.type) {
		case UPDATE_USER_DATA:
			console.log("UPDATE_USER_DATA reducer called. action: ", action)
			return {
				...state,
				userData: action.userData
			}
		default:
			return state
	}
}