'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button,
  Alert
} from 'react-native';
import {
  firebaseSignout,
  firebaseDeleteUser,
  getUser
} from '../../FireService/FireService'
import {
  COLOR
} from 'react-native-material-ui';


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
    //TODO: log into firestore via FireService
    firebaseSignout()
    .then(user => {
      navigate('SignIn')
    })
    .catch(error => {
      this.setState({errorMessage: error.message})
    })
  }

  handleDelete = () => {
    Alert.alert(
      'Are you Sure?',
      'Your account and all your data will be lost.',
      [{
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {
        text: 'Delete',
        onPress: () => {
          firebaseDeleteUser()
          .then(() => {
            this.handleSignOut()
          })
          .catch((erro) => {
            console.warn("error deleting account: ", erro)
          })
        },
        style: 'destructive'
      }]
    )
    
  }

	render() {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {
      errorMessage
    } = this.state
    const {
      email=''
    } = getUser()

    return (
      <View style={styles.container}>
        <Text>User Profile</Text>
        <Text>{email}</Text>
        {!!errorMessage &&
          <Text style={{ color: 'red' }}>
            {errorMessage}
          </Text>}
        <Button title="Sign Out" onPress={this.handleSignOut} />

        <Button title="Delete Account" onPress={this.handleDelete} color={COLOR.red500}/>
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