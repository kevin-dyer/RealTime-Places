import AsyncStorage from '@react-native-community/async-storage';

export const UPDATE_USER_DATA = 'UPDATE_USER_DATA'

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