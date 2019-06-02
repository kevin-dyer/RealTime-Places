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
  GeoQuerySnapshot,
  GeoDocumentReference
} from 'geofirestore'
// import {encodeGeohash} from 'geofirestore/utils.d'
import {PLACES_KEY} from './configs'
import uuidV4 from 'uuid/v4'

console.disableYellowBox = true;


console.log("GeoFirestore: ", GeoFirestore)

const {width, height} = Dimensions.get('window')
const PHOTO_SIZE = 200

console.log("places key: ", PLACES_KEY)

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
      uploadMedia: false,
      queryData: []
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

      // console.log("geohash: ", encodeGeohash({lat: latitude, lng:}))

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
          const imageStoreRef = firebase.storage().ref()
          // // Create a GeoFirestore reference
          const geofirestore: GeoFirestore = new GeoFirestore(firestore);

          // const restaurantsGeostoreRef = db.collection('exploreMap');
          // const restaurantsRef = new GeoFirestore(restaurantsGeostoreRef);

          // // Create a GeoCollection reference
          const geocollection: GeoCollectionReference = geofirestore.collection('checkins');

          this.setState({
            geoFirestore: geofirestore,
            geoCollection: geocollection,
            user: credential.user.toJSON(),
            imageStoreRef
          })

          //Test set
          // console.log("geocollection: ", geocollection, ", .add: ", geocollection.add)

          // console.log("GeoPoint: ", firebase.firestore.GeoPoint)
          // console.log("GeoDocumentReference: ", GeoDocumentReference)
          // console.log("encodeGeohash: ", encodeGeohash)
          // interface GeoDocument {
          //   g: string; //geohash
          //   l: GeoPoint;
          //   d: DocumentData;
          // }
          // const testDoc: GeoDocument = {
          //   g: firebase.firestore.GeoPoint(10, 20)
          // }

          // const doc = {
          //   timestamp: Date.now(),
          //   base64: 'testdata',
          //   coordinates: new firebase.firestore.GeoPoint(11,22),
          // };

          // console.log("sending doc: ", doc)

          // geocollection.add(doc)
          // .then(docRef => {
          //   console.log("added doc to geocollection. docRef: ", docRef)
          // })
          // .catch(error => {
          //   console.log("error adding doc: ", error)
          // })
          // geofirestore.setWithDocument('test', firebase.firestore.GeoPoint(10,20), {
          //   timestamp: Date.now(),
          //   type: 'image',
          //   base64: 'testdata'
          // }).then(() => {
          //   console.log('TEST Provided key has been added to GeoFirestore');
          // }, (error) => {
          //   console.log('Error: ' + error);
          // });

          // console.log("geofirestore: ", geofirestore, ", geocollection: ", geocollection)
        }
      })
      .catch(error => {
        console.log("error: ", error)
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

  //TODO: Need to throttle
  //TODO: Need to adjust the query radius based on latitude delta 
  getNearbyCheckins = (region) => {
    const {
      latitude,
      longitude,
      latitudeDelta
    } = region
    const {
      geoCollection
    } = this.state

    if (!latitude || !longitude) {
      return
    }
    const query: GeoQuery = geoCollection.near({
      center: new firebase.firestore.GeoPoint(latitude, longitude),
      radius: 1000 // TODO: adjust based on latitudeDelta
    });

    // Get query (as Promise)
    query.get().then((value: GeoQuerySnapshot) => {
      // console.log("geoQuery value.docs: ", value.docs); // All docs returned by GeoQuery
      const {docs=[]} = value || {}
      const queryData = docs.map(doc => {
        // console.log("doc data: ", doc.data())
        return doc.data()
      })
      
       // console.log("setState queryData: ", queryData)
      this.setState({
        queryData
      })
    });
  }

  _renderPhoto = (photo, i) => {
    if (typeof(photo.item) === 'object' && !!photo.item.base64) {
      // if (photo.item.type === 'image') {
      if (!!photo.item.imageKey) {
        return this._renderQueryPhoto(photo.item, i)
      } else if (!!photo.item.videoKey) {
        console.log("need to render video")
      }
    } else {
      return <Image
          key={i}
          source={{photo: photo.item}}
          height={PHOTO_SIZE}
          style={{
            marginTop: 2,
            marginBottom: 2,
            borderColor: 'black',
            borderWidth: 3
          }}
        />
    }
  }

  _renderQueryPhoto = ({base64=''}={}, i) => {

    console.log("renderQueryPhoto! base64: ", base64.length, ", i: ", i)
    return <Image
        key={`queryPhoto-${i}`}
        source={{uri: `data:image/jpeg;base64,${base64}`}}
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
      queryData=[],
      uploadMedia,
      geoFirestore,
      geoCollection
    } = this.state
    const allPhotos = [...queryData.filter(doc => {
      return !!doc.imageKey
    }).sort((a, b) => {
      if (a.timestamp < b.timestamp) {
        return 1
      } else if (a.timestamp > b.timestamp) {
        return -1
      } else {
        return 0
      }
    }), ...photos]

    console.log("queryData: ", queryData)

    return (
      <View style={styles.container}>
        <Animated
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChange={this.onRegionChange}
          onRegionChangeComplete={this.getNearbyCheckins}
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

        {queryData && queryData.map(doc => {
          return <Marker
            title={"Selected Place"}
            description={"Selected Place"}
            coordinate={{
              latitude: doc.coordinates.latitude,
              longitude: doc.coordinates.longitude
            }}
          />
        })}
        
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

        {allPhotos && allPhotos.length > 0 &&
          <FlatList
            data={allPhotos}
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

        {uploadMedia && !!geoCollection &&
          <MediaUpload
            geoFirestore={geoFirestore}
            geoCollection={geoCollection}
            toggleMediaUpload={this.toggleMediaUpload}
          />
        }
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
