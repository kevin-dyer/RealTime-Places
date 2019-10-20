
export const SELECT_CHECKIN = 'SELECT_CHECKIN'
export const UPDATE_NEARBY_CHECKINS = 'UPDATE_NEARBY_CHECKINS'
export const UPDATE_LIKE_COUNT = 'UPDATE_LIKE_COUNT'

export const selectCheckin = (selectedCheckin) => ({
	type: SELECT_CHECKIN,
	selectedCheckin
})

export const updateNearbyCheckins = (nearbyCheckins) => ({
	type: UPDATE_NEARBY_CHECKINS,
	nearbyCheckins
})

export const updateLikeCount = (checkinId, liked) => ({
	type: UPDATE_LIKE_COUNT,
	checkinId,
	liked
})