import React from 'react'
import {
	createStackNavigator,
	createSwitchNavigator,
	createAppContainer
} from 'react-navigation'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import App from './components/App'
import configureStore from './store/configureStore'
import Routes from './routes'
import {
  COLOR,
  ThemeContext,
  getTheme,
  ActionButton,
  IconToggle
} from 'react-native-material-ui'

const uiTheme = {
  palette: {
    primaryColor: COLOR.blue500,
  },
  toolbar: {
    container: {
      height: 50,
    },
  },
};

const store = configureStore()


export default function App () =>
	<ThemeContext.Provider value={getTheme(uiTheme)}>
		<Provider store={store}>
	    <Routes/>
	  </Provider>
	</ThemeContext.Provider>
