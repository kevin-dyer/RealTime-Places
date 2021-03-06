import {
	SELECT_CHECKIN,
	UPDATE_NEARBY_CHECKINS,
	UPDATE_LIKE_COUNT,
	UPDATE_REGION,
	DELETE_CHECKIN
} from '../actions/checkins'


const initialState = {
	selectedCheckin: undefined,
	// nearbyCheckins: []
	nearbyCheckins: new Map(),
	region: undefined
}

export default function checkins(state=initialState, action={}) {
	switch(action.type) {
		case SELECT_CHECKIN:
		console.log("SELECT_CHECKIN reducer called. action.selectedCheckin: ", action.selectedCheckin)
			return {
				...state,
				selectedCheckin: state.selectedCheckin === action.selectedCheckin ? undefined : action.selectedCheckin
			}

		case UPDATE_NEARBY_CHECKINS:
			//TODO: change nearbyCheckins into a Map
			//		Only add checkins, do not remove
			// NOTE: may need to optimize this to clear nearbyCheckins as list grows
			const nextCheckins = new Map(state.nearbyCheckins)
			action.nearbyCheckins.forEach((checkin, index) => {
				const key = checkin.docKey || checkin.photo_reference

				// if (!!key && !nextCheckins.has(key)) {
				// 	nextCheckins.set(key, checkin)
				// } else {
				// 	console.error("checkin key not found. checkin: ", checkin)
				// }
				nextCheckins.set(key, checkin)
			})

			return {
				...state,
				nearbyCheckins: nextCheckins
			}

		case UPDATE_LIKE_COUNT: {
			console.log("UPDATE_LIKE_COUNT reducer. action: ", action)
			const nextCheckins = new Map(state.nearbyCheckins)
			const checkinToUpdate = state.nearbyCheckins.find(checkin => {
				return checkin.id === action.checkinId
			})
			const key = checkinToUpdate.docKey
			nextCheckins.set(key, {
				...checkinToUpdate,
				likeCount: action.liked
					? (checkinToUpdate.likeCount || 0) + 1
					: checkinToUpdate.likeCount - 1
			})
			return {
				...state,
				nearbyCheckins: nextCheckins
			}
		}

		case UPDATE_REGION:
			return {
				...state,
				region: action.region
			}

		case DELETE_CHECKIN: {
			const nextCheckins = new Map(state.nearbyCheckins)
			nextCheckins.delete(action.docKey)
			return {
				...state,
				nearbyCheckins: nextCheckins
			}
		}

		default:
			return state
	}
}