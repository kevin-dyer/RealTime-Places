import {
	SELECT_CHECKIN,
	UPDATE_NEARBY_CHECKINS,
	UPDATE_LIKE_COUNT
} from '../actions/checkins'


const initialState = {
	selectedCheckin: undefined,
	nearbyCheckins: []
}

export default function checkins(state=initialState, action={}) {
	switch(action.type) {
		case SELECT_CHECKIN:
		console.log("SELECT_CHECKIN reducer called. action.selectedCheckin: ", action.selectedCheckin)
			return {
				...state,
				selectedCheckin: state.selectedCheckin === action.selectedCheckin
					? undefined
					: action.selectedCheckin
			}

		case UPDATE_NEARBY_CHECKINS:
			return {
				...state,
				nearbyCheckins: action.nearbyCheckins
			}

		case UPDATE_LIKE_COUNT:
			console.log("UPDATE_LIKE_COUNT reducer. action: ", action)
			return {
				...state,
				nearbyCheckins: state.nearbyCheckins.map(checkin => {
					if (checkin.id === action.checkinId) {
						return {
							...checkin,
							likeCount: action.liked
								? (checkin.likeCount || 0) + 1
								: checkin.likeCount - 1
						}
					}
					return checkin
				})
			}

		default:
			return state
	}
}