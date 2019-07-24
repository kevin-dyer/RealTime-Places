'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Dropdown } from 'react-native-material-dropdown';
import { Input, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/Ionicons';
import {PLACES_KEY} from '../../../configs'



export default class PlacesNearbyPicker extends Component {
	state = {
		places: []
	}

  componentDidMount() {
    this.fetchPlacesNearby()
  }

  componentDidUpdate({currentPosition: {longitude: prevLng, latitude: prevLat}={}}) {
    const {currentPosition: {
      longitude,
      latitude
    }={}} = this.props

    if (prevLng !== longitude || prevLat !== latitude) {
      this.fetchPlacesNearby()
    }
  }

  fetchPlacesNearby = () => {
    const {
      currentPosition: {
        latitude,
        longitude
      }={}
    } = this.props

    if (!latitude || !longitude) {
      console.log("cannot fetchPlacesNearby. latitude: ", latitude, ", longitude: ", longitude)
      return
    }

    return fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?key=${PLACES_KEY}&location=${latitude},${longitude}&rankby=distance`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      console.log("fetchPlacesNearby resp: ", resp)

      this.setState({
        places: resp.results
      })
      return resp
    })
    .catch(error => {
      console.log("failed to fetch place details. error: ", error)
      throw error
    })
  }


	render() {
    const {
      onPlaceSelect=()=>{},
      selectedPlace=''
    } = this.props
    const {places=[]} = this.state

    console.log("selectedPlace: ", selectedPlace)

    return <Dropdown
      data={places}
      onChangeText={onPlaceSelect}
      labelExtractor={({name}) => name}
      valueExtractor={(place_id) => place_id}
      renderBase={props => {
        const {value: {name=''}={}} = props
        return <Input
          placeholder="Select a Place"
          leftIcon={
            <Icon
              name='ios-pin'
              size={24}
              color='black'
            />
          }
          containerStyle={{marginTop: 30}}
          leftIconContainerStyle={{marginRight: 20}}
          {...props}
          value={name}
        />
      }}

    />
	}
}