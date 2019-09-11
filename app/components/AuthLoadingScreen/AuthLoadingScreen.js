import React, {Component} from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
// import AsyncStorage from '@react-native-community/async-storage';
import firebase from 'react-native-firebase'
import {firebaseSignout} from '../../FireService/FireService'


export default class AuthLoadingScreen extends Component {
  componentDidMount() {


    //for testing only
    // firebaseSignout()


    firebase.auth().onAuthStateChanged(user => {
      console.log("onAuthStateChanged. user: ", user)
      this.props.navigation.navigate(user ? 'App' : 'Auth')
    })
  }
//   componentDidMount() {
//     this._bootstrapAsync();
//   }
// 
//   // Fetch the token from storage then navigate to our appropriate place
//   _bootstrapAsync = async () => {
//     //TODO: FOR TESTING ONLY!
//     await AsyncStorage.setItem('userToken', ' ')
// 
//     const userToken = await AsyncStorage.getItem('userToken');
// 
//     // This will switch to the App screen or Auth screen and this loading
//     // screen will be unmounted and thrown away.
//     this.props.navigation.navigate(userToken ? 'App' : 'Auth');
//   };

  // Render any loading content that you like here
  render() {
    return (
      <View style={{flex: 1}}>
        <ActivityIndicator />
        <StatusBar barStyle="default" />
      </View>
    );
  }
}