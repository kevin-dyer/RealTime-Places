import {firebaseLogin} from '../FireService/FireService'

class SignInScreen extends React.Component {
  static navigationOptions = {
    title: 'Please sign in',
  };

  render() {
    return (
      <View>
        <Button title="Sign in!" onPress={this._signInAsync} />
      </View>
    );
  }

  _signInAsync = async () => {
    //TODO: log into firestore via FireService
    const userToken = await firebaseLogin()
    await AsyncStorage.setItem('userToken', userToken);
    this.props.navigation.navigate('App');
  };
}