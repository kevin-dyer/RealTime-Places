import React from 'react'
import {
	createStackNavigator,
	createSwitchNavigator,
	createAppContainer
} from 'react-navigation'
import { createBottomTabNavigator } from 'react-navigation-tabs';
import AuthLoadingScreen from './components/AuthLoadingScreen/AuthLoadingScreen'
import MapSearch from './components/MapSearch/MapSearch'
import MediaUpload from './components/MediaUpload/MediaUpload'
import IonIcons from 'react-native-vector-icons/Ionicons'


//
/////////TODO: make this component!
//
import UserSettings from './components/UserSettings/UserSettings'
import SignInScreen from './components/SignIn/SignIn'
import SignUpScreen from './components/SignUp/SignUp'
import ForgotPassword from './components/ForgotPassword/ForgotPassword'

const AppStack = createBottomTabNavigator({
  MapSearch,
  MediaUpload,
  UserSettings
}, {
	initialRouteName: 'MapSearch',
	headerMode: 'none',
	defaultNavigationOptions: ({ navigation }) => ({
    tabBarIcon: ({ focused, horizontal, tintColor }) => {
      const { routeName } = navigation.state;
      // let IconComponent = Ionicons;
      let iconName;
      if (routeName === 'MapSearch') {
        iconName = `ios-globe`;
        // Sometimes we want to add badges to some icons.
        // You can check the implementation below.
        // IconComponent = HomeIconWithBadge;
      } else if (routeName === 'MediaUpload') {
        iconName = `ios-camera`;
      } else if (routeName === 'UserSettings') {
      	iconName = 'ios-person'
      }

      // You can return any component that you like here!
      return <IonIcons name={iconName} size={25} color={tintColor} />;
    },
  }),
  tabBarOptions: {
    activeTintColor: 'tomato',
    inactiveTintColor: 'gray',
    showLabel: false,
    style: {
    	height: 30
    },
    tabStyle: {
    	height: 30
    }
  }
})
const AuthStack = createStackNavigator({
	SignIn: SignInScreen,
	SignUp: SignUpScreen,
	ForgotPassword
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