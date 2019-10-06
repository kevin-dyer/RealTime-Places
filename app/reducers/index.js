import { combineReducers } from 'redux'
import checkins from './checkins'
import login from './login'

const rootReducer = combineReducers({
	checkins,
	login
})

export default rootReducer