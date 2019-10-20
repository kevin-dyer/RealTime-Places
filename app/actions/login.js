import AsyncStorage from '@react-native-community/async-storage';

export const UPDATE_USER_DATA = 'UPDATE_USER_DATA'
export const TRACK_FLAGGED = 'TRACK_FLAGGED'
export const TRACK_LIKED = 'TRACK_LIKED'

//NOTE: redirect from the calling component
export const logout = async () => {
	await AsyncStorage.clear()
}

export const updateUserData = (userData) => {
	return {
		type: UPDATE_USER_DATA,
		userData
	}
}

export const trackFlagged = (checkinId) => {
	return {
		type: TRACK_FLAGGED,
		checkinId
	}
}

export const trackLiked = (checkinId) => {
	return {
		type: TRACK_LIKED,
		checkinId
	}
}