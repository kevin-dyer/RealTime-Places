'use strict';
import React, { Component } from 'react';
import {connect} from 'react-redux'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Dimensions,
  Keyboard
} from 'react-native';
import { IconToggle } from 'react-native-material-ui';
import Autocomplete from 'react-native-autocomplete-input'
import {updateAutocompleteSearch} from '../../actions/search'
import {PLACES_KEY} from '../../../configs'
const {width, height} = Dimensions.get('window')


const stateToProps = ({
  search: {searchText=''}={}
}) => {
  return {
    searchText
  }
}

class PlacesAutoComplete extends Component {
  state={
    // textSearch: '',
    predictions: []
  }
  handleTextChange = (text) => {
    // this.setState({searchText: text})
    const {updateAutocompleteSearch} = this.props

    updateAutocompleteSearch(text)

    this.fetchPredictions(text)
  }

  fetchPredictions = (text) => {
    return fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${PLACES_KEY}`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      // console.log("prediction resp.predictions: ", resp.predictions, ', resp; ', resp)
      this.setState({ predictions: resp.predictions })
    })
    .catch(error => {
      console.log("failed to fetch predictions. error: ", error)
    })
  }

  clearSearch = () => {
    this.setState({predictions: []})
    this.props.updateAutocompleteSearch('')
  }

  handlePlaceSelect = (place={}) => {
    const {
      structured_formatting: {
        main_text: primaryText='',
        secondary_text: secondaryText=''
      }={},
      place_id
    } = place
    const {updateAutocompleteSearch} = this.props

    console.log("handlePlaceSelect autocomplete place: ", place)
    const {onPlaceSelect=()=> {}} = this.props

    updateAutocompleteSearch(`${primaryText} ${secondaryText}`)
    this.setState({
      // searchText: `${primaryText} ${secondaryText}`,
      predictions: []
    })

    Keyboard.dismiss()

    return onPlaceSelect(place, false)
  }


  _renderTextInput = (props) => {
    const {searchText} = this.props
    const {predictions} = this.state
    return <View style={{
      position: 'relative'
    }}>
      <TextInput
        value={searchText}
        autoFocus={false}
        {...props}
        blurOnSubmit={true}
        style={[
          ...props.style,
          {
            borderRadius: 2,
            borderWidth: 0,
            marginBottom: 10,
            borderColor: 'rgba(0,0,0,0)',
            height:  45,
            paddingRight: 50
           }
        ]}
        
        shadowColor={'black'}
        shadowOffset={{width: 0, height: 2}}
        shadowOpacity={0.3}
        shadowRadius={4}
      />
      {!!searchText &&
        <View style={{
          position: 'absolute',
          top: 5,
          right: 0,
        }}>
          <IconToggle
            name="close"
            size={18}
            color={'rgba(0,0,0,0.8)'}
            onPress={this.clearSearch}
          />
        </View>
      }
    </View>
  }

  _renderItem = ({
    item: {
      place_id: placeID,
      structured_formatting: {
        main_text: primaryText,
        secondary_text: secondaryText
      }
    },
    item,
    i
  }) => {

    return <TouchableOpacity
      onPress={e => this.handlePlaceSelect(item)}
      style={{
        padding: 10,
        margin: 2,
        backgroundColor: 'rgba(255,255,255,1)'
      }}
      key={placeID}
    >
      <Text>{primaryText}</Text>
      <Text style={{
        fontSize: 9,
        color: 'rgba(0,0,0,0.6)'
      }}>{secondaryText}</Text>
    </TouchableOpacity>
  }

	render() {
    const {searchText} = this.props
    const {
      predictions=[]
    } = this.state

		return <View style={{
      position: 'absolute',
      width: width - 40,
      top: 0,
      left: 0,
      marginTop: 50,
      marginLeft: 20,
      marginRight: 20
    }}>
      <Autocomplete
        data={predictions}
        value={searchText}
        onChangeText={this.handleTextChange}
        onFocus={e => {
          console.log("Autocomplete onFocus called! searchText: ", searchText, ", predictions: ", predictions)
          if (!!searchText && predictions.length === 0) {
            console.log("calling fetchPredictions!")
            this.fetchPredictions(searchText)
          }
        }}
        renderTextInput={this._renderTextInput}
        renderItem={this._renderItem}
        containerStyle={{
          flex: 0
        }}
        listContainerStyle={{
          backgroundColor: 'rgba(0,0,0,0)',
        }}
        listStyle={{
          backgroundColor: 'rgba(0,0,0,0)',
          maxHeight: height * 0.7,
          overflow: 'scroll'
        }}
        inputContainerStyle={{
          borderWidth: 0,
          position: 'relative'
        }}
      />
    </View>
	}
}

export default connect(stateToProps, {
  updateAutocompleteSearch
})(PlacesAutoComplete)