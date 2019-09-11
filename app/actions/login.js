import AsyncStorage from '@react-native-community/async-storage';


//NOTE: redirect from the calling component
export const logout = async () => {
	await AsyncStorage.clear()
}