import React, {Component} from 'react'
import {
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-community/async-storage';
import {firebaseForgotPassword} from '../../FireService/FireService'

export default class ForgotPassword extends Component {
  static navigationOptions = {
    title: 'Forgot Password',
  };
  state = {
    // email: '',
    email: 'thedude136895@gmail.com',
    errorMessage: null
  }

  handlePasswordResetRequest = () => {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email} = this.state
    //TODO: log into firestore via FireService
    firebaseForgotPassword(email)
    .then(user => {
      Alert.alert(
        'Password reset request sent!',
        'Check your email',
        [{
          text: 'OK',
          onPress: () => {
            console.log('OK Pressed')
            navigate('SignIn')
          }
        }]
      )
    })
    .catch(error => {
      console.log("forgotPassword error: ", error)
      this.setState({errorMessage: error.message})
    })
  }



  render() {
    const {
      navigation: {
        navigate=()=>{}
      }={}
    } = this.props
    const {email} = this.state

    return (
      <View style={styles.container}>
        <Text>Password Reset Request</Text>
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
        <Button title="Request new password" onPress={this.handlePasswordResetRequest} />
        <Button
          title="Already know your password? Sign In"
          onPress={() => navigate('SignIn')}
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