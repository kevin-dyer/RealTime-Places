'use strict';
import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions
} from 'react-native';
import {
  COLOR,
  IconToggle
} from 'react-native-material-ui'
import { RNCamera } from 'react-native-camera'
import uuidV4 from 'uuid/v4'
import RNFS from 'react-native-fs'
import firebase from 'react-native-firebase'
import MovToMp4 from 'react-native-mov-to-mp4'
import Geolocation from '@react-native-community/geolocation'
import MaterialTabs from 'react-native-material-tabs'

const {width, height} = Dimensions.get('window')


function generateCheckin({
  latitude,
  longitude,
  type='image',
  docKey='',
  url='',
  userUid=''
}) {
  return {
    timestamp: Date.now(),
    coordinates: new firebase.firestore.GeoPoint(latitude,longitude),
    docKey,
    type,
    downloadURL: url, //TODO: change downloadURL to just url
    userUid
  };
}

export default class BadInstagramCloneApp extends Component {
  state = {
    selectedTab: 0, //or video
    isRecording: false
  }

  takePicture = async function() {
    const {
      geoCollection,
      toggleMediaUpload,
      imageStoreRef,
      user: {uid=''}={},
      scrollToCheckin,
      animateToRegion
    } = this.props

    console.log("take pic called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        quality: 0.1,
        // base64: true,
        // doNotSave: true
      };

      this.setState({
        isRecording: true
      })
      const data = await this.camera.takePictureAsync(options);
      // console.log("camera data: ", data);

      this.setState({
        isRecording: false
      })

      Geolocation.getCurrentPosition((location={}) => {
        const {coords: {latitude, longitude}} = location || {}
        const docKey = uuidV4()

        // console.log("lat: ", latitude, ", lng: ", longitude, ", imageStoreRef: ", imageStoreRef)

        const imgRef = imageStoreRef.child(`images/${docKey}.jpg`)

        // console.log("imgRef: ", imgRef, ", data.uri: ", data.uri)




        imgRef.putFile(data.uri)
        .on(
          firebase.storage.TaskEvent.STATE_CHANGED,
          snapshot => {
            let state = {};
            state = {
              ...state,
              progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
            };
            console.log("upload progress: ", (snapshot.bytesTransferred / snapshot.totalBytes) * 100)
            if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
              console.log("Successful upload!")
              console.log('Uploaded a blob or file! snapshot.downloadURL: ', snapshot && snapshot.downloadURL);

              const doc = generateCheckin({
                latitude,
                longitude,
                docKey,
                type: 'image',
                url: snapshot.downloadURL,
                userUid: uid
              });

              geoCollection.add(doc)
              .then(docRef => {
                console.log("added doc to geocollection. docRef: ", docRef, ", ref id: ", docRef.id)
                toggleMediaUpload(false)

                animateToRegion({
                  latitude,
                  longitude,
                  latitudeDelta: 0.04,
                  longitudeDelta: 0.04
                }).start()
                setTimeout(() => {
                  scrollToCheckin(docKey)
                }, 1000)
              })
              .catch(error => {
                console.log("error adding doc: ", error)
              })
            }
            // this.setState(state);
          },
          error => {
            // unsubscribe();
            console.alert('Sorry, Try again. error: ', error);
          }
        )
        // .then(snapshot => {
        // })
        // .catch(error => {
        //   console.log("imgRef upload error: ", error)
        // })
      }, (error) => {
        console.error("error getting current position: ", error)
      }, {
        enableHighAccuracy: true
      })
    }
  };

  takeVideo = async function() {
    const {
      toggleMediaUpload,
      geoCollection,
      imageStoreRef,
      user: {uid=''}={},
      animateToRegion,
      scrollToCheckin
    } = this.props
    console.log("take VIDEO called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        maxDuration: 2,
        quality: RNCamera.Constants.VideoQuality['720p']

      };
      const docKey = uuidV4()

      this.setState({isRecording: true})
      const data = await this.camera.recordAsync(options);
      console.log("video data: ", data);

      this.setState({isRecording: false})

      //TODO: test if this works!
      MovToMp4.convertMovToMp4(data.uri, docKey + ".mp4", function (mp4Path) {
        //here you can upload the video...
        console.log("mp4 conversion mp4Path: ", mp4Path);

        Geolocation.getCurrentPosition((location={}) => {
          console.log("currentPostion location: ", location)
          const {
            coords: {
              latitude,
              longitude
            }={}
          } = location || {}
          const vidRef = imageStoreRef.child(`images/${docKey}.mov`)

          console.log("video lat: ", latitude, ", lng: ", longitude)
          console.log("vidRef: ", vidRef, ", data.uri: ", data.uri)

          vidRef.putFile(data.uri)
          .on(
            firebase.storage.TaskEvent.STATE_CHANGED,
            snapshot => {
              let state = {};
              state = {
                ...state,
                progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
              };
              console.log("upload progress: ", (snapshot.bytesTransferred / snapshot.totalBytes) * 100)
              if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
                console.log("Successful upload!")
                // console.log('Uploaded a blob or file! snapshot.downloadURL: ', snapshot && snapshot.downloadURL);

                const doc = generateCheckin({
                  latitude,
                  longitude,
                  docKey,
                  type: 'video',
                  url: snapshot.downloadURL,
                  userUid: uid
                });

                geoCollection.add(doc)
                .then(docRef => {
                  console.log("added doc to geocollection. docRef: ", docRef)
                  toggleMediaUpload(false)

                  animateToRegion({
                    latitude,
                    longitude,
                    latitudeDelta: 0.04,
                    longitudeDelta: 0.04
                  })
                  setTimeout(() => {
                    scrollToCheckin(docKey)
                  }, 2000)
                })
                .catch(error => {
                  console.log("error adding doc: ", error)
                })
              }
              // this.setState(state);
            },
            error => {
              // unsubscribe();
              console.alert('Sorry, Try again. error: ', error);
            }
          )
        })
      });
    }
  }

  stopVideo = () => {
    const {selectedTab} = this.state

    this.camera.stopRecording()
  }

  render() {
    const {toggleMediaUpload} = this.props
    const {selectedTab, isRecording} = this.state

    return (
      <View style={styles.container}>
        <View style={{
          position: 'absolute',
          top: 25,
          right: 0,
          zIndex: 100
        }}>
          <IconToggle
            name="close"
            size={35}
            color={'rgba(255,255,255,0.8)'}
            onPress={e => toggleMediaUpload(false)}
            style={{
              container: {
                shadowColor: '#000',
                shadowOffset: {width: 2, height: 2},
                shadowOpacity: 1,
                shadowRadius: 10
              },
              shadowColor: '#000',
                shadowOffset: {width: 2, height: 2},
                shadowOpacity: 1,
                shadowRadius: 10
            }}
          />
        </View>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
          ratio={'1:1'}
        />

        <View style={{
          backgroundColor: '#f7f7f7',
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'column',
          position: 'relative'
        }}>

          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 120
            }}
            onTouchStart={e => {
              console.log("onTouchStart called! e: ", e)

              if (selectedTab === 1) {
                console.log("handle recording")
                this.takeVideo()
              }
              return e
            }}
            onTouchEnd={e => {
              console.log("onTouchEnd Called e: ", e)

              if (selectedTab === 1) {
                this.stopVideo()
              }
              return e
            }}
          >
            <IconToggle
              name="md-radio-button-off"
              iconSet={'Ionicons'}
              size={isRecording ? 150 : 70}
              color={isRecording ? COLOR.red500 : '#cccccc'}
              underlayColor={isRecording ? COLOR.red500 : '#000'}
              maxOpacity={0.5}
              percent={200}
              onPress={e => {
                if (selectedTab === 0) {
                  this.takePicture()
                }
              }}
              style={{
                container: {
                  // shadowColor: '#000',
                  // shadowOffset: {width: 2, height: 2},
                  // shadowOpacity: 0.3,
                  // shadowRadius: 3,
                }
              }}
            />
          </View>
          <View style={{
            position: 'absolute',
            bottom: 20,
            left: 0,
            width,
            paddingLeft: 40,
            paddingRight: 40
          }}>
            <MaterialTabs
              items={['Photo', 'Video']}
              selectedIndex={selectedTab}
              onChange={index => this.setState({ selectedTab: index })}
              barColor={'rgba(0,0,0,0)'}
              indicatorColor={'#000'}
              activeTextColor={'#000'}
              inactiveTextColor={'#cccccc'}
              textStyle={{
                fontSize: 18
              }}
              barHeight={120}
              uppercase={false}
              disabled={isRecording}
            />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    width,
    height,
    zIndex: 100
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: width,
    width
  },
  // capture: {
  //   flex: 0,
  //   backgroundColor: '#fff',
  //   borderRadius: 5,
  //   padding: 15,
  //   paddingHorizontal: 20,
  //   alignSelf: 'center',
  //   margin: 20,
  // },
  // videoCapture: {
  //   backgroundColor: 'rgba(0,0,0,0)',
  //   borderWidth: 2,
  //   borderColor: '#FFF'
  // },
  // vidText: {
  //   fontSize: 14,
  //   // fontWeight: '800',
  //   color: '#FFF',
  // }
});