import React, {Component} from 'react'
import {
  View,
  Button,
  Text,
  TextInput,
  StyleSheet
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage';
import {firebaseEmailSignIn} from '../../FireService/FireService'

export default class SignInScreen extends Component {
  static navigationOptions = {
    title: 'Please sign in',
  };
  state = {
    email: '',
    password: '',
    // email: 'thedude136895@gmail.com',
    // password: 'Password',
    // email: 'dyer.kevin136@gmail.com',
    // password: 'password',
    errorMessage: null
  }

  handleLogin = () => {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email, password} = this.state
    //TODO: log into firestore via FireService
    firebaseEmailSignIn({email, password})
    .then(user => {
      console.log("firebase signed in user: ", user)
      navigate('App')
    })
    .catch(error => {
      this.setState({errorMessage: error.message})
    })
    // await AsyncStorage.setItem('userToken', userToken);
  };

  render() {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email, password} = this.state

    return (
      <View style={styles.container}>
        <Text>Login</Text>
        {this.state.errorMessage &&
          <Text style={{ color: 'red' }}>
            {this.state.errorMessage}
          </Text>}
        <TextInput
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Email"
          onChangeText={email => this.setState({ email })}
          value={email}
        />
        <TextInput
          secureTextEntry
          style={styles.textInput}
          autoCapitalize="none"
          placeholder="Password"
          onChangeText={password => this.setState({ password })}
          value={password}
        />
        <Button title="Login" onPress={this.handleLogin} />
        <Button
          title="Forgot your password?"
          onPress={() => navigate('ForgotPassword')}
        />
        <Button
          title="Don't have an account? Sign Up"
          onPress={() => navigate('SignUp')}
        />
      </View>
    );
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