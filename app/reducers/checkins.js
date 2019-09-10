import {
	SELECT_CHECKIN
} from '../actions/checkins'

const initialState = {
	selectedCheckin: undefined
}

export default function checkins(state=initialState, action={}) {
	switch(action.type) {
		case SELECT_CHECKIN:
			return {
				...state,
				selectedCheckin: action.selectedCheckin
			}
	}
}