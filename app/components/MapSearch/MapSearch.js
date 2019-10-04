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
import MediaDrawer from '../MediaDrawer/MediaDrawer'
import Geolocation from '@react-native-community/geolocation'
import { throttle, debounce } from 'throttle-debounce'
import {
  clearQuery,
  firebaseLogin,
  getNearbyCheckins
} from '../../FireService/FireService' //TODO: clear on componentWillUnmount
import {
  selectCheckin
} from '../../actions/checkins'
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


const stateToProps = ({
  checkins: {
    selectedCheckin
  }={}
}) => ({
  selectedCheckin
})

type Props = {};


class MapSearch extends Component<Props> {
  constructor(props) {
    super(props)

    this.state = {
      searchText: '',
      selectedPlace: undefined,
      //TODO: comment out lat and long
      region: undefined,
      currentLocation: {
        latitude: 0,
        longitude: 0
      },
      predictions: [],
      photos: [],
      // uploadMedia: false,
      queryData: [],
      user: {},
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

    console.log("MapSearch geolocation...")
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
    console.log("onPoiClick nativeEvent: ", nativeEvent)
    const {selectCheckin} = this.props
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

        selectCheckin(photo_reference)
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
    return getNearbyCheckins(region, (queryData) => {
      this.setState({
        queryData
      })
    })
  })

  setSelectedCheckin = (docKey) => {
    const {
      selectedCheckin,
      selectCheckin
    } = this.props
    const nextCheckin = docKey === selectedCheckin ? null : docKey
    console.log("setSelectedCheckin called! docKey: ", docKey)

    //Unselect checkin if already selected
    // this.setState({
    //   selectedCheckin: nextCheckin
    // })
    selectCheckin(nextCheckin)
  }

  moveRegion = (region) => {
    const {region: stateRegion} = this.state
    if (!!stateRegion) {

      console.log("calling  moveRegion stateRegion.timing")
      stateRegion.timing(region).start()
    }
  }

  render() {
    const {selectedCheckin, selectCheckin} = this.props
    const {
      searchText,
      region,
      predictions,
      currentLocation={latitude: 0, longitude: 0},
      selectedPlace,
      photos=[],
      queryData=[],
      // uploadMedia,
      // geoFirestore,
      // geoCollection,
      // imageStoreRef,
      user
    } = this.state
    const allPhotos = [...queryData, ...photos]

    // console.log("render state photos: ", photos)
    // console.log("selectedPlace: ", selectedPlace)

    console.log("!!region: ", !!region, ", selectedCheckin: ", selectedCheckin)

    return (
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

          
        </Animated>}

        <PlacesAutoComplete
          onPlaceSelect={this.handlePlaceSelect}
        />

        <MediaDrawer
          allMedia={allPhotos}
          selectedCheckin={selectedCheckin}
          // setSelectedCheckin={this.setSelectedCheckin}
          queryData={queryData} 
          // geoCollection={geoCollection}
          // imageStoreRef={imageStoreRef}
          moveRegion={this.moveRegion}
          // toggleMediaUpload={this.toggleMediaUpload}
        />

        {/*uploadMedia && !!geoCollection &&
          <MediaUpload
            // geoFirestore={geoFirestore}
            // geoCollection={geoCollection}
            // imageStoreRef={imageStoreRef}
            toggleMediaUpload={this.toggleMediaUpload}
            user={user}
            setSelectedCheckin={this.setSelectedCheckin}
            animateToRegion={this.moveRegion}
          />
        */}
      </View>
    );
  }
}

export default connect(stateToProps, {
  selectCheckin,
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

