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
import RNGooglePlaces from 'react-native-google-places';
import Autocomplete from 'react-native-autocomplete-input'
import Image from 'react-native-scalable-image';
import ImageCheckin from './app/ImageCheckin/ImageCheckin'
import GoogleImage from './app/GoogleImage/GoogleImage'
import Video from './app/Video/Video'
import MediaUpload from './app/MediaUpload/MediaUpload'
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

import personIcon from './app/assets/images/circle.png'

console.log("personIcon: ", personIcon)

//util method
function queryDataHasChanged(queryData=[], originalQueryData=[]) {
  if (queryData.length !== originalQueryData.length) {
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
      uploadMedia: true,
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

    this.setState({
      searchText: `${primaryText} ${secondaryText}`,
      predictions: []
    })

    console.log("fetching place details place_id: ", place_id)

    Keyboard.dismiss()

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
        this.state.region.timing({
          latitude: lat,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }).start()
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
        // this.flatListRef.scrollToIndex({
        //   animated: true,
        //   index: queryData.length + 1,
        //   // viewOffset,
        //   viewPosition: 0
        // })
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
    const query: GeoQuery = geoCollection.near({
      center: new firebase.firestore.GeoPoint(latitude, longitude),
      radius // TODO: adjust based on latitudeDelta
    });

    // Get query (as Promise)
    query.get()
    query.onSnapshot((snapshot: GeoQuerySnapshot) => {
      const {queryData: originalQueryData} = this.state
      // console.log("query.onSnapshot. snapshot: ", snapshot)
      const {docs=[]} = snapshot || {}
      const queryData = docs.map(doc => {
        return {
          ...doc.data(),
          id: doc.id
        }
      })

      //BIG TODO: need to filter queryData based on if it is inside view window

      //Attempt to only update state if results have changed
      //TODO: improve this by checking each datum's id
      if (queryDataHasChanged(queryData, originalQueryData)) {
      // if (true || queryData.length !== originalQueryData.length) {
        console.log("setting queryData from snapshot: ", queryData)
        this.setState({
          queryData: queryData
          // .filter(({
          //   coordinates: {
          //     latitude: checkinLat,
          //     longitude: checkinLng
          //   }}) => {
          //   //NOTE: delta are degrees (111km or 69mi)
          //   return Math.abs(latitude - checkinLat) < (latitudeDelta * 0.5) &&
          //     Math.abs(longitude - checkinLng) < (longitudeDelta * 0.5)
          // })
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

  _renderMedia = (media={}) => {
    const {item: {
      type
    }={}} = media
    const {selectedCheckin} = this.state

    if (type === 'googlePhoto') {
      return this._renderPhoto(media, selectedCheckin)
    } else if (type === 'image') {
      return this._renderQueryPhoto(media, selectedCheckin)
    } else if (type === 'video') {
      return this._renderVideo(media, selectedCheckin)
    }
  }
  _renderPhoto = (
    {
      item: {photo_reference, uri},
      index
    }={},
    selectedCheckin
  ) => {
    // console.log("_renderPhoto item: ", item)
    const {queryData=[]} = this.state
    // const selected = selectedCheckin === photo_reference
    const photoIndex = index - queryData.length
    const selected = selectedCheckin === photoIndex

    console.log("selected: ", selected, ", photoIndex: ", photoIndex, ", index: ", index)

    return <GoogleImage
      key={`googleImage-${index}`}
      uri={uri}
      height={PHOTO_SIZE}
      onPress={e => {
        // this.scrollToGoogleImage(photo_reference)
        console.log("scrollToGoogleImage photoIndex: ", photoIndex)
        this.scrollToGoogleImage(photoIndex)
      }}
      selected={selected}
      index={index}
      scale={PHOTO_SCALE}
    />
  }

  _renderQueryPhoto = ({
    item: {
      downloadURL='',
      docKey,
      userUid
    }={},
    item,
    index
  }={}, selectedCheckin={}) => {
    const {
      user: {uid}={},
      geoCollection,
      imageStoreRef
    } = this.state
    const selected = selectedCheckin === docKey

    // console.log("_renderQueryPhoto downloadURL: ", downloadURL)

    // console.log("query photo render. this.state.user.uid: ", this.state.user && this.state.user.uid)
    
    return <ImageCheckin
      key={`queryPhoto-${docKey}`}
      checkin={item}
      index={index}
      userUid={uid}
      height={PHOTO_SIZE}
      selected={selected}
      onPress={e => {
        // console.log("calling setSelectedCheckin, docKey: ", docKey)
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
      geoCollection={geoCollection}
      imageStoreRef={imageStoreRef}
      scale={PHOTO_SCALE}
    />
  }

  _renderVideo = ({
    item: {docKey}={},
    item,
    index
  }={}, selectedCheckin) => {
    const {
      user: {uid}={},
      geoCollection,
      imageStoreRef
    } = this.state
    const selected = selectedCheckin === docKey
    // console.log("_renderVideo downloadURL: ", downloadURL)
    return <Video
      key={`video-${docKey || index}`}
      checkin={item}
      height={PHOTO_SIZE}
      userUid={uid}
      selected={selected}
      onPress={e => {
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
      index={index}
      geoCollection={geoCollection}
      imageStoreRef={imageStoreRef}
      scale={PHOTO_SCALE}
    />
  }

  deleteCheckin = (checkin) => {
    Alert.alert(
      'Delete Checkin',
      'Are you sure you want to delete this checkin?',
      [
        {
          text: 'Cancel',
          onPress: () => console.log('Cancel Pressed'),
          style: 'cancel',
        },
        {text: 'OK', onPress: () => {
          console.log('TODO: delete checkin and media here')
        }},
      ],
      {cancelable: true}
    )
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

  //TODO: rename this method to include selecting place
  scrollToCheckin=(docKey) => {
    const {queryData=[], selectedCheckin} = this.state


    //FIX THIS
    const index = queryData.findIndex(checkin =>
      checkin.docKey === docKey
    )

    console.log("scrollToCheckin docKey: ", docKey, ", index: ", index, ", queryData: ", queryData)

    if (index > -1) {
      const checkin = queryData[index]
      //NOTE: do not scroll if checkin is already selected
      if (selectedCheckin !== checkin.docKey) {
        this.flatListRef.scrollToIndex({
          animated: true,
          index,
          // viewOffset: -PHOTO_SIZE,
          // viewPosition: 1
        })
      }

      if (!this.isCheckinOnScreen(checkin)) {
        const {
          coordinates: {latitude, longitude}={}
        } = checkin
        this.state.region.timing({
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }).start()
      }

      //TODO: need to set new variable to selectedCheckin
      this.setSelectedCheckin(docKey)
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

  scrollToGoogleImage = (index) => {
    const {
      queryData=[],
      photos=[],
      selectedCheckin
    } = this.state

    // const index = photos.findIndex(({photo_reference: photoRef}) => {
    //   return  photo_reference === photoRef
    // })

    // console.log("scrollToGoo Images selectedCheckin: ", selectedCheckin, ", photo_reference: ", photo_reference)

    if (index > -1) {
      if (selectedCheckin !== index) {

        console.log("scrolling to (queryData.length + index + 1) * PHOTO_SIZE: ", (queryData.length + index + 1) * PHOTO_SIZE)
        this.flatListRef.scrollToIndex({
          animated: true,
          index: queryData.length + index,
          // offset: (queryData.length + index + 1) * PHOTO_SIZE
          // viewOffset: PHOTO_SIZE,
          // viewPosition: 0
        })
      }
      this.setSelectedCheckin(index)
    }

  }

  //BIG NOTE: note able to get working for google images
  handleViewableItemsChanged = ({
    viewableItems,
    changed,
  }) => {
    const {selectedCheckin} = this.state
    //TODO: Update selecteCheckin

    if (!!selectedCheckin) {
      const isSelectedVisible = viewableItems.some(({
        item: {docKey, photo_reference}={},
        index
      }) => {
        // return docKey === selectedCheckin || photo_reference === selectedCheckin
        return docKey === selectedCheckin || selectedCheckin === index
      })

      //if selected checkin is not visible, unselect
      //NOTE: this may not be desireable because will cause shift
      if (!isSelectedVisible) {
        console.log("selected is NOT visible, setting to null")
        this.setSelectedCheckin(null)
      }
    }
    // console.log("handleViewableItemsChanged, viewableItems: ", viewableItems, ", changed: ", changed)
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

            {/*!!currentLocation &&
              <Marker
                key="currentLocation"
                coordinate={currentLocation}
                image={personIcon}
              />
            */}

            {!!selectedPlace &&
              <Marker
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

            {queryData && queryData.map(doc => {
              return <Marker
                key={doc.docKey}
                coordinate={{
                  latitude: doc.coordinates.latitude,
                  longitude: doc.coordinates.longitude
                }}
                onPress={e => this.scrollToCheckin(doc.docKey)}
                pinColor={doc.docKey === selectedCheckin ? COLOR.green200 : COLOR.red700}
              />
            })}

            
          </Animated>}

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
                return <View style={{
                  position: 'relative'
                }}>
                  <TextInput
                    value={searchText}
                    autoFocus={false}
                    {...props}
                    blurOnSubmit={true}
                    style={[
                      ...props.style,
                      {
                        borderRadius: 2,
                        borderWidth: 0,
                        marginBottom: 10,
                        borderColor: 'rgba(0,0,0,0)',
                        height:  45,
                        paddingRight: 50
                       }
                    ]}
                    
                    shadowColor={'black'}
                    shadowOffset={{width: 0, height: 2}}
                    shadowOpacity={0.3}
                    shadowRadius={4}
                  />

                  {!!searchText &&
                    <View style={{
                      position: 'absolute',
                      top: 5,
                      right: 0,
                    }}>
                      <IconToggle
                        name="close"
                        size={18}
                        color={'rgba(0,0,0,0.8)'}
                        onPress={this.clearSearch}
                      />
                    </View>
                  }
                </View>
              }}
              renderItem={({
                item: {
                  place_id: placeID,
                  structured_formatting: {
                    main_text: primaryText,
                    secondary_text: secondaryText
                  }
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
                flex: 0
              }}
              listContainerStyle={{
                backgroundColor: 'rgba(0,0,0,0)',
              }}
              listStyle={{
                backgroundColor: 'rgba(0,0,0,0)',
                maxHeight: height * 0.7,
                overflow: 'scroll'
              }}
              inputContainerStyle={{
                borderWidth: 0,
                position: 'relative'
              }}
            />
          </View>

          <View style={{
            // position: 'relative',
            position: 'absolute',
            bottom: 0,
            left: 0,
            zIndex: 2,
          }}>
            <View style={{
              position: 'relative',
              width
            }}>
              <FlatList
                ref={(ref) => {this.flatListRef = ref}}
                data={allPhotos}
                renderItem={this._renderMedia}
                horizontal={true}
                keyExtractor={(item, index) => {
                  return item.docKey || item.id
                }}
                style={styles.swiperWrapper}
                contentContainerStyle={styles.swiperContainer}
                onViewableItemsChanged={this.handleViewableItemsChanged}
                removeClippedSubviews={false}
                ListHeaderComponent={
                  <TouchableOpacity style={{
                      height: PHOTO_SIZE,
                      width: PHOTO_SIZE * 0.75,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0,0,0,0.3)',
                      marginRight: 1
                    }}
                  >
                    <IconToggle
                      name="camera-alt"
                      size={40}
                      color={'rgba(0,0,0,0.5)'}
                      onPress={this.toggleMediaUpload}
                    />
                  </TouchableOpacity>
                }
                getItemLayout={(data, index) => ({
                  length: PHOTO_SIZE,
                  offset: (PHOTO_SIZE + 1) * index,
                  index
                })}
              />
              {false && !!selectedCheckin &&
                <View style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                }}>
                  <IconToggle
                    name="close"
                    size={30}
                    color={'rgba(255,255,255,0.8)'}
                    onPress={e => {
                      console.log("Calling FlatList onPress!")
                      this.setSelectedCheckin(null)
                    }}
                  />
                </View>
              }
            </View>
          </View>

          {uploadMedia && !!geoCollection &&
            <MediaUpload
              geoFirestore={geoFirestore}
              geoCollection={geoCollection}
              imageStoreRef={imageStoreRef}
              toggleMediaUpload={this.toggleMediaUpload}
              user={user}
              scrollToCheckin={this.scrollToCheckin}
              animateToRegion={reg =>
                !!region && region.timing(reg).start()
              }
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
