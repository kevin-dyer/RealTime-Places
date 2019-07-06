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
// import Video from 'react-native-video';
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



console.disableYellowBox = true;


const {width, height} = Dimensions.get('window')
const PHOTO_SIZE = 140

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
      region: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: .02,
        longitudeDelta: .02,
      },
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

      // console.log("geohash: ", encodeGeohash({lat: latitude, lng:}))

      console.log("latitude: ", latitude, ", longitude: ", longitude, ", this.state.region: ", this.state.region)
      // this.state.region.setValue({
      //   latitude,
      //   longitude
      // })
      // this.state.region.timing({latitude, longitude}).start()

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

    // RNGooglePlaces.getAutocompletePredictions(text, {fields: ['photos']})
    // .then((results) => {
    //   console.log("prediction results: ", results)
    //   this.setState({ predictions: results })
    // })
    // .catch((error) => console.log(error.message));

    
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
      // selectedPlace: place,
      searchText: `${primaryText} ${secondaryText}`,
      predictions: []
    })

    console.log("fetching place details place_id: ", place_id)

    fetch(`https://maps.googleapis.com/maps/api/place/details/json?placeid=${place_id}&key=${PLACES_KEY}&fields=geometry,photo`)
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
        this.state.region.timing({
          latitude: lat,
          longitude: lng,
          latitudeDelta: latDelta,
          longitudeDelta: lngDelta,
        }).start()
      }

      console.log("places photos: ", photos)
      return this.fetchPlacePhotos(photos).then(photos => {
        this.setState({photos})
      })
    })
    .catch(error => {
      console.log("failed to fetch place details. error: ", error)
    })

    Keyboard.dismiss()
  }

  onPoiClick = ({nativeEvent}={}) => {
    console.log("onPoiClick nativeEvent: ", nativeEvent)
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

    // this.structured_formatting: {
    //     main_text: primaryText,
    //     secondary_text: secondaryText
    //   }={},
    //   place_id
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
      }).catch(error => {
        console.error("error: ", error)
      })
    )

    return Promise.all(requests)
  }

  onRegionChange = (region) => {
    this.state.region.setValue(region);
  }

  //TODO: Need to throttle
  //TODO: Need to adjust the query radius based on latitude delta 
  getNearbyCheckins = throttle(1000, (region) => {
    const {
      latitude,
      longitude,
      latitudeDelta
    } = region
    const {
      geoCollection
    } = this.state

    const radius = ((latitudeDelta * 40008000 / 360) / 2) / 1000//not sure if I need to divide by 2

    console.log("radius: ", radius)

    console.log("calling getNearbyCheckins")

    if (!latitude || !longitude) {
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
        return doc.data()
      })

      //BIG TODO: need to filter queryData based on if it is inside view window

      //Attempt to only update state if results have changed
      //TODO: improve this by checking each datum's id
      if (queryData.length !== originalQueryData.length) {
        console.log("setting queryData from snapshot: ", queryData)
        this.setState({
          queryData: queryData.sort((a, b) => {
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
    const {item} = media
    const {selectedCheckin} = this.state

    // console.log("_renderMedia item: ", item)

    if (typeof(item) === 'string') {
      return this._renderPhoto(media)
    }
    const {type} = item || {}
    if (type === 'image') {
      return this._renderQueryPhoto(media, selectedCheckin)
    } else if (type === 'video') {
      return this._renderVideo(media, selectedCheckin)
    }
  }
  _renderPhoto = ({item, index}={}, ) => {
    // console.log("_renderPhoto item: ", item)
    return <Image
        key={`photo-${index}`}
        source={{uri: item}}
        height={PHOTO_SIZE}
        style={{
          marginLeft: index > 0 ? 1 : 0
        }}
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
    const {user: {uid}={}} = this.state
    const selected = selectedCheckin === docKey

    console.log("_renderQueryPhoto downloadURL: ", downloadURL)
    
    return <ImageCheckin
      checkin={item}
      index={index}
      userUid={uid}
      height={PHOTO_SIZE}
      selected={selected}
      onPress={e => {
        console.log("calling setSelectedCheckin, docKey: ", docKey)
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
    />
  }

  _renderVideo = ({
    item: {downloadURL, docKey}={},
    index
  }={}, selectedCheckin) => {
    const {user: {uid}={}} = this.state
    const selected = selectedCheckin === docKey
    // console.log("_renderVideo downloadURL: ", downloadURL)
    return <Video
      key={`video-${docKey || index}`}
      uri={downloadURL}
      height={PHOTO_SIZE}
      userUid={uid}
      selected={selected}
      onPress={e => {
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
      index={index}
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

  toggleMediaUpload=()=> {
    this.setState({uploadMedia: !this.state.uploadMedia})
  }

  //TODO: rename this method to include selecting place
  scrollToCheckin=(docKey) => {
    const {queryData=[], selectedCheckin} = this.state


    //FIX THIS
    const index = queryData.findIndex(checkin =>
      checkin.docKey === docKey
    )

    console.log("scrollToCheckin docKey: ", docKey, ", index: ", index, ", queryData: ", queryData)

    //NOTE: do not scroll if checkin is already selected
    if (index > -1) {
      // const place = queryData[index]
      
      if (selectedCheckin !== queryData[index].docKey) {
        this.flatListRef.scrollToIndex({
          animated: true,
          index,
          // viewOffset,
          // viewPosition
        })
      }

      //TODO: need to set new variable to selectedCheckin
      this.setSelectedCheckin(docKey)
    }
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
      geoCollection,
      imageStoreRef,
      user
    } = this.state
    const allPhotos = [...queryData, ...photos]

    // console.log("render state photos: ", photos)
    console.log("selectedPlace: ", selectedPlace)

    return (
      <ThemeContext.Provider value={getTheme(uiTheme)}>
        <View style={styles.container}>
          <Animated
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={region}
            user={user}
            onRegionChange={this.onRegionChange}
            onRegionChangeComplete={this.getNearbyCheckins}
            onPoiClick={this.onPoiClick}
          >

          {!!currentLocation &&
            <Marker
              title={"Current Position"}
              description={""}
              coordinate={currentLocation}
              pinColor={COLOR.blue600}
            />
          }

          {!!selectedPlace &&
            <Marker
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
              title={"Checkin"}
              description={"checkin description"}
              coordinate={{
                latitude: doc.coordinates.latitude,
                longitude: doc.coordinates.longitude
              }}
              onPress={e => this.scrollToCheckin(doc.docKey)}
              pinColor={COLOR.red600}
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

          {allPhotos && allPhotos.length > 0 &&
            <FlatList
              ref={(ref) => {this.flatListRef = ref}}
              data={allPhotos}
              renderItem={this._renderMedia}
              horizontal={true}
              keyExtractor={(item) => {
                return item.docKey || item.imageKey || item.videoKey
              }}
              style={styles.swiperWrapper}
              contentContainerStyle={styles.swiperContainer}
            />
          }

          {/*<TouchableOpacity
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
          </TouchableOpacity>*/}

          <View style={{
            // margin: 20,
            // backgroundColor: uploadMedia ? 'grey' : 'blue',
            position: 'absolute',
            bottom: 0,
            right: 0,
            zIndex: 3
          }}>
            <IconToggle
              name="add-circle"
              color={COLOR.blue500}
              size={50}
              onPress={this.toggleMediaUpload}
            />
          </View>

          {uploadMedia && !!geoCollection &&
            <MediaUpload
              geoFirestore={geoFirestore}
              geoCollection={geoCollection}
              imageStoreRef={imageStoreRef}
              toggleMediaUpload={this.toggleMediaUpload}
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
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 2,
  },
  swiperContainer: {
    alignItems: 'flex-end',
    paddingRight: 20
  }
});
