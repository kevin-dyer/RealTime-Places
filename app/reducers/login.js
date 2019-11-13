import {
	UPDATE_USER_DATA,
	TRACK_FLAGGED,
	TRACK_LIKED
} from '../actions/login'

const initialState = {
	userData: {
		flagged: [],
		liked: []
	}
}

export default function login(state=initialState, action={}) {
	switch(action.type) {
		case UPDATE_USER_DATA:
			// console.log("UPDATE_USER_DATA reducer called. action: ", action)
			return {
				...state,
				userData: action.userData
			}

		case TRACK_FLAGGED: {
			const checkinIndex = state.userData.flagged.findIndex(checkinId =>
				checkinId === action.checkinId
			)
			let nextFlagged = [...state.userData.flagged]

			if (checkinIndex > -1 ) {
				nextFlagged.push(action.checkinId)
			}

			return {
				...state,
				userData: {
					...state.userData,
					flagged: nextFlagged
				}
			}
		}

		case TRACK_LIKED: {
			const checkinIndex = state.userData.liked.findIndex(checkinId =>
				checkinId === action.checkinId
			)
			let nextLiked = [...state.userData.liked]

			if (checkinIndex > -1 ) {
				nextLiked.push(action.checkinId)
			}

			return {
				...state,
				userData: {
					...state.userData,
					liked: nextLiked
				}
			}
		}

		default:
			return state
	}
}