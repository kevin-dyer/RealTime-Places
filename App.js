/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, {Component} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Dimensions,
  TextInput,
  Keyboard,
  // Image,
  FlatList
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  AnimatedRegion,
  Animated
} from 'react-native-maps';
import RNGooglePlaces from 'react-native-google-places';
import Autocomplete from 'react-native-autocomplete-input'
import Image from 'react-native-scalable-image';
import MediaUpload from './app/MediaUpload/MediaUpload'
import firebase from 'react-native-firebase'
import {
  GeoCollectionReference,
  GeoFirestore,
  GeoQuery,
  GeoQuerySnapshot
} from 'geofirestore'
import {PLACES_KEY} from 'configs'


const {width, height} = Dimensions.get('window')
const PHOTO_SIZE = 200


const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};
export default class App extends Component<Props> {
  constructor(props) {
    super(props)

    this.state = {
      searchText: '',
      selectedPlace: null,
      region: new AnimatedRegion({
        latitude: 0,
        longitude: 0,
        latitudeDelta: .02,
        longitudeDelta: .02,
      }),
      currentLocation: {
        latitude: 0,
        longitude: 0
      },
      predictions: [],
      photos: [],
      uploadMedia: false
    }
  }

  componentDidMount() {

    //Get phone's current location
    // // - useful for determining the verified location of user when uploading media
    // RNGooglePlaces.getCurrentPlace()
    // .then((results) => {
    //   console.log("results: ", results)
    //   this.setState({predictions: results.map(result => ({
    //     primaryText: result.name,
    //     secondaryText: result.address,
    //     ...result
    //   }))})
    // })
    // .catch((error) => console.log(error.message));

    navigator.geolocation.getCurrentPosition((location={}) => {
      // console.log("currentLocation: ", location)

      const {coords: {latitude, longitude}} = location || {}

      this.setState({
        currentLocation: {latitude, longitude},
        // region: {
        //   latitude: coords.latitude,
        //   longitude: coords.longitude
        // }
      })


      console.log("latitude: ", latitude, ", longitude: ", longitude, ", this.state.region: ", this.state.region)
      // this.state.region.setValue({
      //   latitude,
      //   longitude
      // })
      this.state.region.timing({latitude, longitude}).start()
    }, (error) => {
      console.error("error getting current position: ", error)
    }, {
      enableHighAccuracy: true
    })

    //Firebase test
    firebase.auth()
      .signInAnonymously()
      .then(credential => {
        if (credential) {
          console.log('default app user ->', credential.user.toJSON());

          // Create a Firestore reference
          const firestore = firebase.firestore();
          // // Create a GeoFirestore reference
          const geofirestore: GeoFirestore = new GeoFirestore(firestore);

          // // Create a GeoCollection reference
          const geocollection: GeoCollectionReference = geofirestore.collection('checkins');

          console.log("geofirestore: ", geofirestore, ", geocollection: ", geocollection)
        }
      })
      .catch(error => {
        console.log("error authenticating user. error: ", error)
      })

          
  }

  handleTextChange = (text) => {
    this.setState({searchText: text})

    RNGooglePlaces.getAutocompletePredictions(text, {fields: ['photos']})
    .then((results) => {
      console.log("prediction results: ", results)
      this.setState({ predictions: results })
    })
    .catch((error) => console.log(error.message));

    
  }

  handlePlaceSelect = (place) => {
    console.log("handlePlaceSelect. place: ", place)

    this.setState({
      // selectedPlace: place,
      searchText: place.primaryText + place.secondaryText,
      predictions: []
    })

    RNGooglePlaces.lookUpPlaceByID(place.placeID)
    .then((results) => {
      const {latitude, longitude} = results
      console.log("place by ID: ", results)

      //TODO: update selectedPlace
      this.setState({
        selectedPlace: results
      })
      // this.state.region.latitude.setValue(latitude)
      // this.state.region.longitude.setValue(longitude)
      this.state.region.timing({latitude, longitude}).start()
    })
    .catch((error) => console.log(error.message));



    fetch(`https://maps.googleapis.com/maps/api/place/details/json?key=${PLACES_KEY}&placeid=${place.placeID}&fields=photo`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      console.log("placeDetail results: ", resp)
      const {result: {photos=[]}={}} = resp || {}


      return this.fetchPlacePhotos(photos).then(photos => {
        this.setState({photos})
      })
    })

    Keyboard.dismiss()
  }

  fetchPlacePhotos = (photos) => {
    const requests = photos.map(photo => 
      fetch(
        `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photo.photo_reference}&key=${PLACES_KEY}&maxheight=${PHOTO_SIZE}`
      ).then(resp => {
        // let json = JSON.parse(resp._bodyText);
        // return resp.json()

        // return resp.json()
        console.log("photo resp: ", resp)
        if (resp.ok) {
          return resp.url
        }
      // }).then(resp => {
      //   console.log("photo resp2: ", resp)
      //   return resp
      }).catch(error => {
        console.error("error: ", error)
      })
    )

    return Promise.all(requests)
    // .then(photos => {
    //   console.log("all photos: ", photos)
    //   this.setState({photos: photos})
    // })
  }

  onRegionChange = (region) => {
    this.state.region.setValue(region);
  }

  _renderPhoto = (uri, i) => {
    return <Image
        key={i}
        source={{uri: uri.item}}
        height={PHOTO_SIZE}
        style={{
          marginTop: 2,
          marginBottom: 2,
          borderColor: 'black',
          borderWidth: 3
        }}
      />
  }

  toggleMediaUpload=()=> {
    this.setState({uploadMedia: !this.state.uploadMedia})
  }


  render() {
    const {
      searchText,
      region,
      predictions,
      currentLocation={latitude: 0, longitude: 0},
      selectedPlace,
      photos=[],
      uploadMedia
    } = this.state

    //Crude routing
    if (uploadMedia) {
      return <MediaUpload/>
    }

    return (
      <View style={styles.container}>
        

        <Animated
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChange={this.onRegionChange}
        >

        {!!currentLocation &&
          <Marker
            title={"Current Position"}
            description={"Current Position"}
            coordinate={currentLocation}
            pinColor={'blue'}
          />
        }

        {!!selectedPlace &&
          <Marker
            title={"Selected Place"}
            description={"Selected Place"}
            coordinate={selectedPlace}
          />
        }
        
        </Animated>

        <View style={{
          position: 'absolute',
          width,
          height: 200,
          top: 0,
          left: 0,
          padding: 20,
          marginTop: 40
        }}>
          <Autocomplete
            data={predictions}
            value={searchText}
            onChangeText={this.handleTextChange}
            renderTextInput={(props) => {
              return <TextInput
                value={searchText}
                autoFocus={true}
                {...props}
                blurOnSubmit={true}
                style={[
                  ...props.style,
                  {
                    borderRadius: 2,
                    borderWidth: 0,
                    marginBottom: 10,
                    borderColor: 'rgba(0,0,0,0)',
                    height:  45
                   }
                ]}
                
                shadowColor={'black'}
                shadowOffset={{width: 0, height: 2}}
                shadowOpacity={0.3}
                shadowRadius={4}
              />
            }}
            renderItem={({
              item: {
                primaryText,
                secondaryText,
                placeID
              },
              item,
              i
            }) => (
              <TouchableOpacity
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
            )}
            containerStyle={{
              flex: 1,
              // width
              borderWidth: 0
            }}
            listContainerStyle={{
              backgroundColor: 'rgba(0,0,0,0)',
              borderWidth: 0,

            }}
            listStyle={{
              backgroundColor: 'rgba(0,0,0,0)',
              maxHeight: 400,
              overflow: 'scroll',
              borderWidth: 0
            }}
            inputContainerStyle={{
              borderWidth: 0
            }}
          />
        </View>

        {photos && photos.length > 0 &&
          <FlatList
            data={photos}
            renderItem={this._renderPhoto}
            horizontal={true}
            style={styles.swiperWrapper}
          />
        }

        <TouchableOpacity
          style={{
            margin: 20,
            padding: 20,
            borderRadius: 50,
            backgroundColor: uploadMedia ? 'grey' : 'blue',
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 3
          }}
          onPress={this.toggleMediaUpload}
        >
          <Text style={{color: 'white'}}>Upload</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    position: 'relative'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  map: {
    top: 0,
    left: 0,
    height,
    width,
    position: 'absolute'
  },
  searchContainer: {
    // flex: 1,
    zIndex: 2
  },
  swiperWrapper: {
    width,
    height: PHOTO_SIZE,
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 2
  }
});
