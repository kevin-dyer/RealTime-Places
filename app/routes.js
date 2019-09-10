import {
	createStackNavigator,
	createSwitchNavigator,
	createAppContainer
} from 'react-navigation'
import AuthLoadingScreen from './components/AuthLoadingScreen/AuthLoadingScreen'
import MapSearch from './components/MapSearch/MapSearch'
import MediaUpload from './components/MediaUpload/MediaUpload' //TODO: change file path

const AppStack = createStackNavigator({
  MapSearch,
  MediaUpload,
}, {
	initialRouteName: 'MapSearch',
	headerMode: 'none'
});
const AuthStack = createStackNavigator({ SignIn: SignInScreen });

export default createAppContainer(
  createSwitchNavigator(
    {
      AuthLoading: AuthLoadingScreen,
      App: AppStack,
      Auth: AuthStack,
    },
    {
      initialRouteName: 'AuthLoading',
    }
  )
);