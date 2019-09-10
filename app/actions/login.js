import {
	AsyncStorage
} from 'react-native'


//NOTE: redirect from the calling component
export const logout = async () => {
	await AsyncStorage.clear()
}