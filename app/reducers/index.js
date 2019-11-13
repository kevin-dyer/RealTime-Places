import { combineReducers } from 'redux'
import checkins from './checkins'
import login from './login'
import search from './search'

const rootReducer = combineReducers({
	checkins,
	login,
	search
})

export default rootReducer