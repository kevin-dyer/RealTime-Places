'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  Button
} from 'react-native';
import {firebaseEmailSignUp} from '../../FireService/FireService'



export default class SignUpScreen extends Component {
  state = {
    email: '',
    password: '',
    // email: 'dyer.kevin136@gmail.com',
    // password: 'password',
    errorMessage: null
  }

  handleSignUp = () => {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email, password} = this.state
    //TODO: log into firestore via FireService
    firebaseEmailSignUp({email, password})
    .then(user => {
      navigate('App')
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
      password,
      errorMessage
    } = this.state

    return (
      <View style={styles.container}>
        <Text>Sign Up</Text>
        {!!errorMessage &&
          <Text style={{ color: 'red' }}>
            {errorMessage}
          </Text>}
        <TextInput
          placeholder="Email"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={email => this.setState({ email })}
          value={email}
        />
        <TextInput
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          style={styles.textInput}
          onChangeText={password => this.setState({ password })}
          value={password}
        />
        <Button title="Sign Up" onPress={this.handleSignUp} />
        <Button
          title="Already have an account? Login"
          onPress={() => navigate('Login')}
        />
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