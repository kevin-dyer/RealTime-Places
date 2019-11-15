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
import React, {Component} from 'react'
import {connect} from 'react-redux'
import MapView, {
  PROVIDER_GOOGLE,
  Marker,
  AnimatedRegion,
  Animated
} from 'react-native-maps';
// import MediaDrawer from '../MediaDrawer/MediaDrawer'
import DrawerTest from '../MediaDrawer/DrawerTest'

import Geolocation from '@react-native-community/geolocation'
import { throttle, debounce } from 'throttle-debounce'
import {
  clearQuery,
  firebaseLogin,
  getNearbyCheckins,
  isCheckinOnScreen
} from '../../FireService/FireService' //TODO: clear on componentWillUnmount
import {
  selectCheckin,
  updateNearbyCheckins,
  updateRegion
} from '../../actions/checkins'
import {updateAutocompleteSearch} from '../../actions/search'
import PlacesAutoComplete from '../PlacesAutoComplete/PlacesAutoComplete'
import {PLACES_KEY} from '../../../configs'
import {
  COLOR,
  ActionButton,
  IconToggle
} from 'react-native-material-ui'



const {width, height} = Dimensions.get('window')
const PHOTO_SIZE = 140
const PHOTO_SCALE = 2
const maxDocs = 16


const stateToProps = ({
  checkins: {
    region,
    selectedCheckin,
    nearbyCheckins=new Map()
  }={}
}) => ({
  selectedCheckin,
  nearbyCheckins: Array.from(nearbyCheckins.values())
    .filter(checkin => !!region ? isCheckinOnScreen(checkin, region) : true )
    .sort((a, b) => {
      if (a.timestamp < b.timestamp) {
       return 1
      } else if (a.timestamp > b.timestamp) {
       return -1
      } else {
       return 0
      }
    })
    .slice(0, maxDocs),
  regionInState: region
})

type Props = {};

// const MapWrapper = ({
//   // region,
//   initialRegion,
//   onRegionChange,
//   onRegionChangeComplete,
//   onPoiClick,
//   children
// }) => {
//   console.log("Rendering Animated Map!")
//   return <MapView
//           provider={PROVIDER_GOOGLE}
//           style={styles.map}
//           // region={region}
//           initialRegion={initialRegion}
//           onRegionChange={onRegionChange}
//           onRegionChangeComplete={onRegionChangeComplete}
//           onPoiClick={onPoiClick}
//           showsUserLocation={true}
//           showsMyLocationButton={true}
//           showsCompass={true}
//           showsScale={true}
//           loadingEnabled={true}
//           mapPadding={{
//             top: 0,
//             left: 0,
//             right: 0,
//             bottom: PHOTO_SIZE
//           }}
//         >
//           {children}
//         </MapView>
// }


class MapSearch extends Component<Props> {
  constructor(props) {
    super(props)

    this.state = {
      searchText: '',
      selectedPlace: undefined,
      //TODO: comment out lat and long
      region: undefined,
      currentLocation: undefined,
      predictions: [],
      photos: [],
      // uploadMedia: false,
      // queryData: [],
      user: {},
      offScreenCheckins: new Set()
    }
  }

  componentDidMount() {

    // setTimeout(()=>{
    //   console.log("setting testValue to true")
    //   this.setState({
    //     testValue: true
    //   })
    // }, 7000)
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

    // console.log("MapSearch geolocation...")
    Geolocation.getCurrentPosition((location={}) => {
      // console.log("currentLocation: ", location)

      const {coords: {latitude, longitude}} = location || {}

      // console.log("setting region to latitude, longitude: ", latitude, longitude)

      this.setState({
        currentLocation: {latitude, longitude},
        // region: {
        //   latitude: coords.latitude,
        //   longitude: coords.longitude
        // }
        // region: new AnimatedRegion({
        //   latitude,
        //   longitude,
        //   latitudeDelta: .02,
        //   longitudeDelta: .02,
        // })
      })
    }, (error) => {
      console.error("error getting current position: ", error)
    }, {
      enableHighAccuracy: true
    })
  }

  componentDidUpdate({
    navigation: {
      state: {
        params: {
          currentLocation: {
            latitude: prevLat,
            longitude: prevLng
          }={}
        }={}
      }={}
    }={}
  }={}) {
    const {
      navigation: {
        state: {
          params: {
            currentLocation,
            currentLocation: {
              latitude,
              longitude
            }={}
          }={}
        }={}
      }={}
    } = this.props

    console.log("current lat, lng: ", latitude, longitude, ", old: ", prevLat, prevLng, ", this.props.navigation.state.params: ", this.props.navigation.state.params)

    if (prevLat !== latitude || prevLng !== longitude) {
      console.log("moving region to your last checkin!")
      this.moveRegion({
        latitude,
        longitude,
        latitudeDelta: 0.04,
        longitudeDelta: 0.04
      })
    }
  }

  componentWillUnmount() {

    //geoQuery.cancel() is not defined...
    // clearQuery()
  }

  handleTextChange = (text) => {
    this.setState({searchText: text})

    fetch(`https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${text}&key=${PLACES_KEY}`)
    .then(resp => {
      if (resp.ok) {
        return resp.json()
      }
    }).then(resp => {
      // console.log("prediction resp.predictions: ", resp.predictions, ', resp; ', resp)
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
      place_id,
      coordinate: {
        latitude,
        longitude
      }={}
    } = place
    const {updateAutocompleteSearch} = this.props
    // console.log("handlePlaceSelect. place: ", place)
    updateAutocompleteSearch(`${primaryText} ${secondaryText}`)

    // this.setState({
    //   searchText: `${primaryText} ${secondaryText}`,
    //   predictions: []
    // })

    // console.log("fetching place details place_id: ", place_id)

    // Keyboard.dismiss()

    //Set initial POI marker optimistically, if lat and lng exist
    if (!!latitude && !!longitude) {
      this.setState({
        selectedPlace: {
          title: primaryText,
          description: secondaryText,
          geometry: {
            location: {
              lat: latitude,
              lng: longitude
            }
          }
        }
      })
    }

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
      // console.log("place details result: ", result)
      this.setState({
        selectedPlace: {
          ...result,
          title: primaryText,
          description: secondaryText
        }
      })

      // console.log("place select lat: ", lat, ", lng: ", lng, ", northeast: ", northeast, ", southwest: ", southwest,", latDelta: ", latDelta, ", lngDelta: ", lngDelta)

      if (!disableRegionChange) {
        // this.state.region.timing({
        this.moveRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        })
      }

      // console.log("places photos: ", photos)

      //TODO: split photos by size (thumb vs full size (screenWidth))
      return this.fetchPlacePhotos(photos).then(photoUrls => {
        this.setState({photos: photos.map((photo, index) => ({
          uri: photoUrls[index],
          photo_reference: photo.photo_reference,
          height: photo.height,
          width: photo.width,
          type: 'googlePhoto'
        }))})

//         setTimeout(() => {
//           if (photos.length > 0) {
// 
//             //NOTE: this is not quite right, want to actually go to the very beginning of the list
//             this.setSelectedCheckin(0)
//           }
//         })
      })
    })
    .catch(error => {
      console.log("failed to fetch place details. error: ", error)
      throw error
    })
  }

  onPoiClick = ({nativeEvent}={}) => {
    // console.log("onPoiClick nativeEvent: ", nativeEvent)
    const {
      selectCheckin,
    } = this.props
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
      },
      coordinate
    }, false)
    .then(resp => {
      const {photos=[]} = this.state

      if (photos.length > 0) {
        // console.log("photos > 0 , scrolling to end of nearbyCheckins")

        //selecting first image in POI photos
        const [{photo_reference}] = photos

        selectCheckin(photo_reference)
      }
    })
  }

  clearSearch = () => {
    this.setState({
      searchText: '',
      predictions: [],
      photos: [],
      selectedPlace: undefined
    })
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
    // this.state.region.setValue(region);
  }

  onRegionChangeComplete = (region={}) => {
    const {updateRegion, regionInState={}} = this.props

    // console.log("onRegionChangeComplete region: ", region, ", regionInState: ", regionInState)
    //TODO: why is this going pack to current location?

    //NOTE: this does not catch the bug either
    if (regionInState.latitude !== region.latitude && regionInState.longitude !== region.longitude) {
      this.getNearbyCheckins(region)
      this.updateOffscreenCheckins(region)
      updateRegion(region)
    } else {
      // console.log("onRegionChangeComplete NO UPDATES, region did not change")
    }
  }

  updateOffscreenCheckins = (region) => {
    const {nearbyCheckins} = this.props
    const {offScreenCheckins: offscreenState} = this.state

    let hasChanged = false
    //TODO: compile Set of offScreenCheckins
    const offScreenCheckins = nearbyCheckins.filter((checkin) => {
      const isOffScreen = !isCheckinOnScreen(checkin, region)

      if (isOffScreen && !offscreenState.has(checkin.docKey)) {
        hasChanged = true
      }
      return isOffScreen
    }).map(checkin => checkin.docKey)

    if (offScreenCheckins.length !== offscreenState.size) {
      hasChanged = true
    }

    if (hasChanged) {
      this.setState({
        offScreenCheckins: new Set(offScreenCheckins)
      })
    }
  }

  //TODO: Need to throttle
  //TODO: Need to adjust the query radius based on latitude delta 
  getNearbyCheckins = (region) => {
    const {updateNearbyCheckins} = this.props

    return getNearbyCheckins(region, (queryData) => {
      // this.setState({
      //   queryData
      // })
      updateNearbyCheckins(queryData)
    })
  }

  setSelectedCheckin = (docKey) => {
    const {
      selectedCheckin,
      selectCheckin
    } = this.props
    const nextCheckin = docKey === selectedCheckin ? null : docKey
    // console.log("setSelectedCheckin called! docKey: ", docKey)

    selectCheckin(nextCheckin)
  }

  moveRegion = (region) => {
    // const {region: stateRegion} = this.state
//     if (!!stateRegion) {
// 
//       console.log("moveRegion called!")
//       stateRegion.timing(region).start()
//     }
    if (!!this.mapRef) {
      this.mapRef.animateToRegion(region, 500)
    }
  }

  render() {
    const {
      selectedCheckin,
      nearbyCheckins,
      selectCheckin,
      regionInState
    } = this.props
    const {
      searchText,
      region,
      predictions,
      // currentLocation={
      //   latitude: 37.7749, //TODO: default to undefined if SF preset is not desired
      //   longitude: 122.4194
      // },
      currentLocation,
      currentLocation: {
        latitude: currentLat=37.7749, //NOTE: hardcoded to SF
        longitude: currentLng=122.4194
      }={},
      selectedPlace,
      selectedPlace: {
        geometry: {
          location: {
            lat: placeLat,
            lng: placeLng
          }={}
        }={}
      }={},
      photos=[],
      // queryData=[],
      // uploadMedia,
      // geoFirestore,
      // geoCollection,
      // imageStoreRef,
      user,
      offScreenCheckins,
      autocompleteDefault,

      // testValue
    } = this.state
    const visibleCheckins = nearbyCheckins.filter(checkin => !offScreenCheckins.has(checkin.docKey))
    // const allPhotos = [...nearbyCheckins, ...photos]
    const isSelectedPlaceVisible = !!selectedPlace && isCheckinOnScreen({
      coordinates: {
        latitude: placeLat,
        longitude: placeLng
      }
    }, regionInState)

    const filteredPlacePhotos = isSelectedPlaceVisible ? photos : []
    const allPhotos = [...visibleCheckins, ...filteredPlacePhotos]
    const initialRegion = {
      latitude: currentLat,
      longitude: currentLng,
      latitudeDelta: 0.04,
      longitudeDelta: 0.04
    }
    // console.log("initialRegion: ", initialRegion)

    return (
      <View style={styles.container}>

        {!!currentLocation &&
          <MapView
            ref={mapRef => this.mapRef = mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            // region={region}
            initialRegion={initialRegion}
            // onRegionChange={this.onRegionChange}
            onRegionChangeComplete={this.onRegionChangeComplete}
            onPoiClick={this.onPoiClick}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            showsScale={true}
            mapPadding={{
              top: 0,
              left: 0,
              right: 0,
              bottom: PHOTO_SIZE
            }}
          >

            {!!nearbyCheckins && nearbyCheckins.map(doc => {
              return <Marker
                key={doc.docKey}
                coordinate={{
                  latitude: doc.coordinates.latitude,
                  longitude: doc.coordinates.longitude
                }}
                onPress={e => {
                  selectCheckin(doc.docKey)
                }}
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

            
          </MapView>
        }

        <PlacesAutoComplete
          onPlaceSelect={this.handlePlaceSelect}
          defaultValue={autocompleteDefault}
          onClear={this.clearSearch}
        />

        <DrawerTest
          allMedia={allPhotos}
          selectedCheckin={selectedCheckin}
        />
      </View>
    );
  }
}

export default connect(stateToProps, {
  selectCheckin,
  updateNearbyCheckins,
  updateRegion,
  updateAutocompleteSearch
})(MapSearch)

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
    height: height - 64,
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

