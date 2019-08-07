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
  FlatList,
  Alert
} from 'react-native';
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  AnimatedRegion,
  Animated
} from 'react-native-maps';
// import RNGooglePlaces from 'react-native-google-places';
import MediaUpload from './app/MediaUpload/MediaUpload'
import MediaDrawer from './app/components/MediaDrawer/MediaDrawer'
import PlacesAutoComplete from './app/components/PlacesAutoComplete/PlacesAutoComplete'
import firebase from 'react-native-firebase'
import {
  GeoCollectionReference,
  GeoFirestore,
  GeoQuery,
  GeoQuerySnapshot,
  GeoDocumentReference
} from 'geofirestore'
import Geolocation from '@react-native-community/geolocation'
import {
  COLOR,
  ThemeContext,
  getTheme,
  ActionButton,
  IconToggle
} from 'react-native-material-ui'
import {PLACES_KEY} from './configs'
import uuidV4 from 'uuid/v4'
import { throttle, debounce } from 'throttle-debounce'
import { Icon } from 'react-native-material-ui'


//util method
function queryDataHasChanged(queryData=[], originalQueryData=[]) {

  console.log("queryData: ", queryData,', originalQueryData',originalQueryData)
  if (queryData.length !== originalQueryData.length) {
    console.log("exiting queryDataHasChanged b/c lenghts are diff")
    return true
  }
  // const maxLength = Math.max(queryData.length, originalQueryData.length)
  for(let i = 0; i < queryData.length; i++) {
    if (queryData[i].docKey !== originalQueryData[i].docKey) {
      return true
    }
  }
  return false
}



console.disableYellowBox = true;


const {width, height} = Dimensions.get('window')
const PHOTO_SIZE = 140
const PHOTO_SCALE = 2

const uiTheme = {
  palette: {
    primaryColor: COLOR.blue500,
  },
  toolbar: {
    container: {
      height: 50,
    },
  },
};

// console.log("places key: ", PLACES_KEY)

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
      selectedPlace: undefined,
      // region: new AnimatedRegion({
      //   latitude: 0,
      //   longitude: 0,
      //   latitudeDelta: .02,
      //   longitudeDelta: .02,
      // }),

      //TODO: comment out lat and long
      region: undefined,
      currentLocation: {
        latitude: 0,
        longitude: 0
      },
      predictions: [],
      photos: [],
      uploadMedia: false,
      queryData: [],
      user: {},
      selectedCheckin: undefined //Used to highlight photo/video
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

    Geolocation.getCurrentPosition((location={}) => {
      // console.log("currentLocation: ", location)

      const {coords: {latitude, longitude}} = location || {}

      console.log("setting region to latitude, longitude: ", latitude, longitude)

      this.setState({
        currentLocation: {latitude, longitude},
        // region: {
        //   latitude: coords.latitude,
        //   longitude: coords.longitude
        // }

        region: new AnimatedRegion({
          latitude,
          longitude,
          latitudeDelta: .02,
          longitudeDelta: .02,
        })
      })
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
          // // Create a GeoCollection reference
          const geocollection: GeoCollectionReference = geofirestore.collection('checkins');

          this.setState({
            geoFirestore: geofirestore,
            geoCollection: geocollection,
            user: credential.user.toJSON(),
            imageStoreRef
          })
        }
      })
      .catch(error => {
        console.log("error: ", error)
      })

          
  }

  componentWillUnmount() {
    if (!!this.geoQuery) {
      this.geoQuery.cancel()
    }
  }

  handleTextChange = (text) => {
    this.setState({searchText: text})

    fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${PLACES_KEY}`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      console.log("prediction resp.predictions: ", resp.predictions, ', resp; ', resp)
      this.setState({ predictions: resp.predictions })
    })
    .catch(error => {
      console.log("failed to fetch predictions. error: ", error)
    })
  }

  handlePlaceSelect = (place={}, disableRegionChange) => {
    const {
       structured_formatting: {
         main_text: primaryText='',
         secondary_text: secondaryText=''
       }={},
      place_id
    } = place
    console.log("handlePlaceSelect. place: ", place)

    // this.setState({
    //   searchText: `${primaryText} ${secondaryText}`,
    //   predictions: []
    // })

    console.log("fetching place details place_id: ", place_id)

    // Keyboard.dismiss()

    return fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${place_id}&key=${PLACES_KEY}&fields=geometry,photo`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      const {
        result: {
          geometry: {
            location: {
              lat,
              lng
            }={},
            viewport: {
              northeast={},
              southwest={}
            }={}
          },
          photos=[]
        }={},
        result
      } = resp || {}
      const latDelta = Math.abs(northeast.lat - southwest.lat)
      const lngDelta = Math.abs(northeast.lng - southwest.lng)
      console.log("place details result: ", result)
      this.setState({
        selectedPlace: {
          ...result,
          title: primaryText,
          description: secondaryText
        }
      })

      console.log("place select lat: ", lat, ", lng: ", lng, ", northeast: ", northeast, ", southwest: ", southwest,", latDelta: ", latDelta, ", lngDelta: ", lngDelta)

      if (!disableRegionChange) {
        // this.state.region.timing({
        this.moveRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        })
      }

      console.log("places photos: ", photos)
      return this.fetchPlacePhotos(photos).then(photoUrls => {
        this.setState({photos: photos.map((photo, index) => ({
          uri: photoUrls[index],
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width,
          type: 'googlePhoto'
        }))})
      })
    })
    .catch(error => {
      console.log("failed to fetch place details. error: ", error)
      throw error
    })
  }

  onPoiClick = ({nativeEvent}={}) => {
    console.log("onPoiClick nativeEvent: ", nativeEvent)
    const {queryData=[]} = this.state
    const {
      placeId: place_id,
      coordinate,
      name=''
    } = nativeEvent

    //call handlePlaceSelect with disableRegionChange = true
    this.handlePlaceSelect({
      place_id,
      structured_formatting: {
        main_text: name
      }
    }, true)
    .then(resp => {
      const {photos=[]} = this.state

      if (photos.length > 0) {
        console.log("photos > 0 , scrolling to end of queryData")

        const [{photo_reference}] = photos

        setTimeout(() => {
          // this.scrollToGoogleImage(photo_reference)
          this.scrollToGoogleImage(0)
        }, 500)
      }
    })
  }

  clearSearch = () => {
    this.setState({searchText: '', predictions: []})
  }

  //NOTE: maxHeight will change in different views
  fetchPlacePhotos = (photos) => {
    const requests = photos.map(photo => 
      fetch(
        `https://maps.googleapis.com/maps/api/place/photo?photoreference=${photo.photo_reference}&key=${PLACES_KEY}&maxheight=${PHOTO_SIZE}`
      ).then(resp => {
        // console.log("photo resp: ", resp)
        if (resp.ok) {
          return resp.url
        }
        throw resp
      }).catch(error => {
        console.error("error: ", error)
      })
    )

    return Promise.all(requests)
  }



  onRegionChange = (region) => {
    // console.log("calling onRegionChange. region: ", region)
    this.state.region.setValue(region);
  }

  //TODO: Need to throttle
  //TODO: Need to adjust the query radius based on latitude delta 
  getNearbyCheckins = debounce(1000, (region) => {
    const {
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta
    } = region
    const {
      geoCollection
    } = this.state
    const mainDelta = Math.max(latitudeDelta, longitudeDelta)
    const radius = ((mainDelta * 40008000 / 360) / 2) / 1000//not sure if I need to divide by 2
    const maxDocs = 10
    // console.log("radius: ", radius)

    // console.log("calling getNearbyCheckins, region latitude: ",latitude, ", longitude: ", longitude)

    //validation
    if (
      !latitude ||
      !longitude ||
      Math.min(latitude, longitude) < -180 ||
      Math.max(latitude, longitude) > 180
    ) {
      console.warn("skipping getNearbyCheckins call. location is invalid. lat, lng: ", latitude, longitude)
      return
    }

    const queryConfigs = {
      center: new firebase.firestore.GeoPoint(latitude, longitude),
      radius
    }

    // const twoWkMs = 3600 * 24 * 14 * 1000
    this.geoQuery = geoCollection
      .near(queryConfigs)
      // .orderBy('d.timestamp')
      .limit(20)
      //TODO: replace with orderBy if possible
      // .where('timestamp', '>=', Date.now()) //last two weeks



    // Get query (as Promise)
    this.geoQuery.get()

//     this.geoQuery.on('key_entered', (key, location, distance) => {
//       console.log(key + " entered query at " + location + " (" + distance + " km from center)");
//       // const doc = geoCollection.get(key).then()
//     })
// 
//     this.geoQuery.on('key_exited', (key, location, distance) => {
//       console.log(key + " exited query to " + location + " (" + distance + " km from center)");
//     })


     // this.geoQuery.onSnapshot((snapshot: GeoQuerySnapshot) => {
    .then((snapshot: GeoQuerySnapshot) => {
       const {queryData: originalQueryData} = this.state
       // console.log("query.onSnapshot. snapshot: ", snapshot)
       const {docs=[]} = snapshot || {}
       const queryData = docs.map(doc => {
         return {
           ...doc.data(),
           id: doc.id
         }
       })
       .filter(this.isCheckinOnScreen)
       .sort((a, b) => {
         if (a.timestamp < b.timestamp) {
           return 1
         } else if (a.timestamp > b.timestamp) {
           return -1
         } else {
           return 0
         }
       })
       .slice(0, maxDocs)
 
       //BIG TODO: format new query data 
 
       //Attempt to only update state if results have changed
       //TODO: improve this by checking each datum's id
       if (queryDataHasChanged(queryData, originalQueryData)) {
       // if (true || queryData.length !== originalQueryData.length) {
         // console.log("setting queryData from snapshot queryData: ", queryData, ", originalQueryData: ", originalQueryData)
         this.setState({
           queryData: queryData
           // .filter(this.isCheckinOnScreen)
           // .sort((a, b) => {
           //   if (a.timestamp < b.timestamp) {
           //     return 1
           //   } else if (a.timestamp > b.timestamp) {
           //     return -1
           //   } else {
           //     return 0
           //   }
           // })
           // .slice(0, maxDocs)
         })
       }
     })
  })

  setSelectedCheckin = (docKey) => {
    const {selectedCheckin} = this.state
    const nextCheckin = docKey === selectedCheckin ? null : docKey
    console.log("setSelectedCheckin called! docKey: ", docKey)

    //Unselect checkin if already selected
    this.setState({
      selectedCheckin: nextCheckin
    })
  }

  toggleMediaUpload=(show)=> {
    const {uploadMedia} = this.state
    this.setState({uploadMedia: typeof(show) === 'boolean'
      ? show
      : !uploadMedia
    })

    //Unselect checkins when going to media upload page
    if (show === true || (!uploadMedia && show === undefined)) {
      this.setSelectedCheckin(null)
    }
  }

   isCheckinOnScreen = ({
     coordinates: {
       latitude: checkinLat,
       longitude: checkinLng
     }={}
   }={}) => {
     const {region} = this.state
 
     if (!region) return false
 
     const {
       latitude=0,
       longitude=0,
       latitudeDelta=0,
       longitudeDelta=0
     } = (this.state.region && this.state.region.__getValue()) || {}
 
     return Math.abs(latitude - checkinLat) < (latitudeDelta * 0.5) &&
       Math.abs(longitude - checkinLng) < (longitudeDelta * 0.5)
   }

  moveRegion = (region) => {
    const {region: stateRegion} = this.state
    if (!!stateRegion) {

      console.log("calling  moveRegion stateRegion.timing")
      stateRegion.timing(region).start()
    }
  }

  render() {
    const {
      searchText,
      region,
      predictions,
      currentLocation={latitude: 0, longitude: 0},
      selectedPlace,
      selectedCheckin,
      photos=[],
      queryData=[],
      uploadMedia,
      geoFirestore,
      geoCollection,
      imageStoreRef,
      user
    } = this.state
    const allPhotos = [...queryData, ...photos]

    // console.log("render state photos: ", photos)
    // console.log("selectedPlace: ", selectedPlace)

    return (
      <ThemeContext.Provider value={getTheme(uiTheme)}>
        <View style={styles.container}>
          {!!region && <Animated
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            initialRegion={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04
            }}
            user={user}
            onRegionChange={this.onRegionChange}
            onRegionChangeComplete={this.getNearbyCheckins}
            onPoiClick={this.onPoiClick}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            mapPadding={{
              top: 0,
              left: 0,
              right: 0,
              bottom: !!selectedCheckin ? ((PHOTO_SIZE * PHOTO_SCALE) - 30) : (PHOTO_SIZE - 30)
            }}
          >

            {queryData && queryData.map(doc => {
              return <Marker
                key={doc.docKey}
                coordinate={{
                  latitude: doc.coordinates.latitude,
                  longitude: doc.coordinates.longitude
                }}
                onPress={e => this.scrollToCheckin(doc.docKey)}
                pinColor={doc.docKey === selectedCheckin ? COLOR.green200 : COLOR.red700}
                zIndex={doc.docKey === selectedCheckin ? 10 : 1}
              />
            })}

            {!!selectedPlace &&
              <Marker
                ref={selectedMarker => this.selectedMarker = selectedMarker}
                key="selectedPlace"
                title={selectedPlace.title}
                description={selectedPlace.description}
                coordinate={{
                  latitude: selectedPlace.geometry.location.lat,
                  longitude: selectedPlace.geometry.location.lng
                }}
                pinColor={COLOR.yellow600}
              />
            }

            
          </Animated>}

          <PlacesAutoComplete
            onPlaceSelect={this.handlePlaceSelect}
          />

          <MediaDrawer
            allMedia={allPhotos}
            selectedCheckin={selectedCheckin}
            setSelectedCheckin={this.setSelectedCheckin}
            queryData={queryData} 
            user={user}
            geoCollection={geoCollection}
            imageStoreRef={imageStoreRef}
            moveRegion={this.moveRegion}
            toggleMediaUpload={this.toggleMediaUpload}
          />

          {uploadMedia && !!geoCollection &&
            <MediaUpload
              geoFirestore={geoFirestore}
              geoCollection={geoCollection}
              imageStoreRef={imageStoreRef}
              toggleMediaUpload={this.toggleMediaUpload}
              user={user}
              scrollToCheckin={this.scrollToCheckin}
              animateToRegion={this.moveRegion}
            />
          }
        </View>
      </ThemeContext.Provider>
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
    // height: PHOTO_SIZE,
    // position: 'absolute',
    // bottom: 0,
    // left: 0,
    // zIndex: 2,
  },
  swiperContainer: {
    alignItems: 'flex-end',
    // paddingRight: 20,
    backgroundColor: 'rgba(0,0,0,0.2)',
  }
});
