'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button
} from 'react-native';
import {firebaseSignout} from '../../FireService/FireService'



export default class UserSettings extends Component {
  static navigationOptions = {
    title: 'Your Profile',
  };

  state = {
      errorMessage: ''
  }

  handleSignOut = () => {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email, password} = this.state
    //TODO: log into firestore via FireService
    firebaseSignout({email, password})
    .then(user => {
      navigate('SignIn')
    })
    .catch(error => {
      this.setState({errorMessage: error.message})
    })
  }


	render() {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email,
      errorMessage
    } = this.state

    return (
      <View style={styles.container}>
        {!!errorMessage &&
          <Text style={{ color: 'red' }}>
            {errorMessage}
          </Text>}
        <Button title="Sign Out" onPress={this.handleSignOut} />
      </View>
    )
	}
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  textInput: {
    height: 40,
    width: '90%',
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 8
  }
})