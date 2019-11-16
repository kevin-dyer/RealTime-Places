
export const SELECT_CHECKIN = 'SELECT_CHECKIN'
export const UPDATE_NEARBY_CHECKINS = 'UPDATE_NEARBY_CHECKINS'
export const UPDATE_LIKE_COUNT = 'UPDATE_LIKE_COUNT'
export const UPDATE_REGION = 'UPDATE_REGION'
export const DELETE_CHECKIN = 'DELETE_CHECKIN'

export const categoryOptions = [
  {
    value: 'nature',
    title: 'Nature and Water',
    text: 'hiking, climbing, surfing, kayaking, swimming, fishing, beach activities, etc.'
  },
  {
    value: 'food',
    title: 'Food'
  },
  {
    value: 'animals',
    title: 'Animals'
  },
  {
    value: 'art',
    title: 'Art',
    text: 'museums, architecture and design, city attractions'
  },
  {
    value: 'crowds',
    title: 'Crowds',
    text: 'parking lots, lines and crowds'
  },
  {
    value: 'other',
    title: 'Fun and Other',
  },
]

export const selectCheckin = (selectedCheckin) => ({
	type: SELECT_CHECKIN,
	selectedCheckin
})

export const updateNearbyCheckins = (nearbyCheckins=[]) => ({
	type: UPDATE_NEARBY_CHECKINS,
	nearbyCheckins
})

export const updateLikeCount = (checkinId, liked) => ({
	type: UPDATE_LIKE_COUNT,
	checkinId,
	liked
})

export const getCategoryById = (categoryId) => {
	return categoryOptions.find(category => category.value === categoryId)
}

export const updateRegion = (region) => {
	return {
		type: UPDATE_REGION,
		region
	}
}

export const deleteCheckinFromState = (docKey) => ({
  type: DELETE_CHECKIN,
  docKey
})