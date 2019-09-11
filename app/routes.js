import {
	createStackNavigator,
	createSwitchNavigator,
	createAppContainer
} from 'react-navigation'
import AuthLoadingScreen from './components/AuthLoadingScreen/AuthLoadingScreen'
import MapSearch from './components/MapSearch/MapSearch'
import MediaUpload from './components/MediaUpload/MediaUpload'
import SignInScreen from './components/SignIn/SignIn'
import SignUpScreen from './components/SignUp/SignUp'

const AppStack = createStackNavigator({
  MapSearch,
  MediaUpload,
}, {
	initialRouteName: 'MapSearch',
	headerMode: 'none'
});
const AuthStack = createStackNavigator({
	SignIn: SignInScreen,
	SignUp: SignUpScreen
});

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