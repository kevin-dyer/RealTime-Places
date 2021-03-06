'use strict';
import React, { Component } from 'react'
import {connect} from 'react-redux'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  View,
  Dimensions,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Keyboard
} from 'react-native';
import {withNavigationFocus} from 'react-navigation'
import {
  COLOR,
  IconToggle,
  // Badge
} from 'react-native-material-ui'
import {
  TextField,
  FilledTextField,
  OutlinedTextField,
} from 'react-native-material-textfield';
import { RNCamera } from 'react-native-camera'
import uuidV4 from 'uuid/v4'
import RNFS from 'react-native-fs'
import firebase from 'react-native-firebase'
import MovToMp4 from 'react-native-mov-to-mp4'
import Geolocation from '@react-native-community/geolocation'
import MaterialTabs from 'react-native-material-tabs'
import { ifIphoneX } from 'react-native-iphone-x-helper'
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import { Input, Button } from 'react-native-elements';
import { Dropdown } from 'react-native-material-dropdown';
import * as Progress from 'react-native-progress';
import PlacesNearbyPicker from '../PlacesNearbyPicker/PlacesNearbyPicker'
import {selectCheckin, categoryOptions} from '../../actions/checkins'
import {
  getUser,
  getFirestore,
  getImageStoreRef,
  saveMedia
} from '../../FireService/FireService'





const {width, height} = Dimensions.get('window')
const maxDuration = 15

const flashModeOrder = {
  off: 'on',
  on: 'auto',
  auto: 'off'
  // auto: 'torch',
  // torch: 'off',
};


const stateToProps = ({}) => ({})

class MediaUpload extends Component {
  state = {
    selectedTab: 0, //or video
    isRecording: false,
    flashMode: 'auto',
    imageUri: '',
    videoUri: '',
    currentPosition: {},
    uploadProgress: 0,// 0 - 100
    recordingStartTime: 0,
    videoProgress: 0,
    videoPaused: true,
    comment: '',
    placeNearby: undefined,
    nearbyPlaces: [],
    category: undefined,
    isMuted: false
  }

  componentDidUpdate(prevProps) {
    if (prevProps.isFocused && !this.props.isFocused) {
      this.clearForm()
    }
  }

  clearForm = () => {
    this.setState({
      // selectedTab: 0, //or video
      isRecording: false,
      // flashMode: 'auto',
      imageUri: '',
      videoUri: '',
      // currentPosition: {}, //NOTE: save currentPostion to add to navigation props
      uploadProgress: 0,// 0 - 100
      recordingStartTime: 0,
      videoProgress: 0,
      videoPaused: true,
      comment: '',
      placeNearby: undefined,
      nearbyPlaces: [],
      category: undefined,
      // isMuted: false
    })
  }

  takePicture = function() {

    // console.log("take pic called! this.camera: ", this.camera)
    if (!!this.camera) {
      const options = {
        quality: 0.2,
      };

      this.setState({
        isRecording: true
      }, async () => {
        const data = await this.camera.takePictureAsync(options);

        this.setState({
          isRecording: false
        })

        Geolocation.getCurrentPosition((location={}) => {
          const {
            coords: {latitude, longitude},
            coords
          } = location || {}

          this.setState({
            imageUri: data.uri,
            currentPosition: coords //{latitude, longitude}
          })
        }, (error) => {
          console.error("error getting current position: ", error)
        }, {
          enableHighAccuracy: true
        })
      })
    }
  };

  saveMedia = () => {
    const {
      selectCheckin,
      animateToRegion
    } = this.props
    const {
      imageUri,
      videoUri,
      currentPosition,
      comment,
      placeNearby,
      category,
    } = this.state
    const docKey = uuidV4()
    const user = getUser()

    this.setState({uploading: true})

    saveMedia({
      docKey,
      userUid: user.uid,
      imageUri,
      videoUri,
      currentPosition,
      comment,
      placeNearby,
      category,
      onProgress: (uploadProgress) => {
        this.setState({
          uploadProgress
        })
      }
    })
    .then(docRef => {
      // console.log("added doc to geocollection. docRef: ", docRef, ", ref id: ", docRef.id)
      selectCheckin(docKey)

      this.handleBack()
      return docRef
    })
    .catch(error => {
      console.log("error adding doc: ", error)
      this.setState({uploading: false})
      throw error
    })
  }

  takeVideo = () => {
    const {isMuted} = this.state

    if (this.camera) {
      const options = {
        maxDuration,
        quality: RNCamera.Constants.VideoQuality['720p'],
        muted: isMuted
      };
      const docKey = uuidV4()      

      this.videoStopped = false

      setTimeout(() => {
        if (this.videoStopped) {
          // console.log("touchEnd called before recording started")
          return
        }
        this.setState({
          isRecording: true,
          recordingStartTime: Date.now()
        }, async () => {
          this.startVideoProgress()

          const data = await this.camera.recordAsync(options);

          if (!!this.vidProgressTimer) {
            clearInterval(this.vidProgressTimer)
          }

          this.setState({
            videoProgress: 0,
            recordingStartTime: null,
            isRecording: false,
          })

          // this.camera.pausePreview()

          //TODO: test if this works!
          MovToMp4.convertMovToMp4(data.uri, docKey + ".mp4", (mp4Path) => {
            //here you can upload the video...
            // console.log("mp4 conversion mp4Path: ", mp4Path);

            Geolocation.getCurrentPosition((location={}) => {
              const {
                coords: {
                  latitude,
                  longitude
                }={},
                coords
              } = location || {}

              this.setState({
                videoUri: data.uri,
                currentPosition: coords
              })
            })
          })
        })
      }, 500)
    }
  }

  stopVideo = () => {
    const {selectedTab} = this.state
    this.videoStopped = true

    if (!!this.camera) {
      this.camera.stopRecording()

      if (!!this.vidProgressTimer) {
        // console.log("stopVideo called, calling clearInterval")
        clearInterval(this.vidProgressTimer)
      }
    }

    this.setState({
      videoProgress: 0,
      recordingStartTime: null
    })
  }


  toggleFlashMode = () => {
    // RNCamera.Constants.FlashMode.on
    this.setState({flashMode: flashModeOrder[this.state.flashMode]})
  }

  toggleMute = () => {
    // RNCamera.Constants.FlashMode.on
    this.setState({isMuted: !this.state.isMuted})
  }

  clearMedia = () => {
    this.setState({
      imageUri: '',
      videoUri: '',
      nearbyPlaces: [],
      videoPaused: true,
      videoProgress: 0,
      uploading: false
    })
  }

  handleBack = () => {
    const {
      navigation: {
        navigate
      }={}
    } = this.props
    const {currentPosition} = this.state

    navigate('MapSearch', {
      currentLocation: currentPosition
    })
  }

  toggleReplay = () => {
    const {videoPaused} = this.state

    // console.log("toggleReplay caled, videoPaused: ", videoPaused)
    if (!!this.player) {
      this.setState({videoPaused: !videoPaused})
    }
  }

  startVideoProgress = () => {
    const {recordingStartTime} = this.state
    // console.log("startVideoProgress called")
    this.vidProgressTimer = setInterval(() => {
      // console.log("startVideoProgress, recordingStartTime: ", recordingStartTime, ", final: ", ((Date.now() - recordingStartTime) / 1000) / maxDuration)
      this.setState({
        videoProgress: ((Date.now() - recordingStartTime) / 1000) / maxDuration
      })
    }, 500)
  }

  //Callback from PlacesNearbyPicker
  onPlaceSelect = (place) => {
    this.setState({
      placeNearby: {name: place}
    })
  }

  handleCommentChange = (text) => {
    this.setState({
      comment: text
    })
  }

  handleCategoryChange = (categoryId) => {
    // console.log("handleCategoryChange called. categoryId: ", categoryId)
    this.setState({
      category: categoryId.value
    })
  }

  render() {
    const {toggleMediaUpload} = this.props
    const {
      selectedTab,
      isRecording,
      flashMode,
      imageUri,
      videoUri,
      uploadProgress,
      recordingStartTime,
      videoProgress,
      videoPaused,
      currentPosition,
      placeNearby,
      uploading,
      isMuted,
      comment
    } = this.state
    // const videoProgress = Math.floor((Date.now() - recordingStartTime) / 1000) / 15
    // console.log("render imageUri: ", imageUri)
    // console.log("render videoProgress: ", videoProgress, ", selectedTab: ", selectedTab)

    // console.log("this.props.navigation: ", this.props.navigation.isFocused())
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={'padding'}
        enabled
      >
        <View style={{
          flex: 0,
          width,
          ...ifIphoneX({
            paddingTop: 30
          }, {
            paddingTop: 5
          }),
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'row'
        }}>
          <IconToggle
            name="ios-arrow-back"
            iconSet="Ionicons"
            size={35}
            color={'rgba(255,255,255,0.8)'}
            onPress={this.handleBack}
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

          {(!!imageUri || !!videoUri) &&
            <Button
              title="clear"
              type="clear"
              onPress={this.clearMedia}
              titleStyle={{
                fontSize: 20,
                color: '#FFF',
                paddingLeft: 10,
                paddingRight: 10
              }}
            />
          }
        </View>
        <View style={{
          position: 'relative',
          flex: 1,
        }}>
          {!!imageUri &&
            <Image
              source={{uri: imageUri}}
              style={{
                flex: 1,
                width,
                height: width,
                resizeMode: 'cover'
              }}
            />
          }

          {!!videoUri &&
            <View style={{flex: 1}}>
              <Video
                source={{uri: videoUri}}
                paused={videoPaused}
                ref={(ref) => {
                 //TODO: need to change this so it is an array
                 this.player = ref
                }}
                // onBuffer={this.onBuffer}                // Callback when remote video is buffering
                // onError={this.videoError}               // Callback when video cannot be loaded
                style={{
                  height: width,
                  width
                }}
                resizeMode={'contain'}
                repeat={true}
                onEnd={this.toggleReplay}
              />

              <View style={{
                position: 'absolute',
                // top: width / 2 - 20,
                // right: width / 2 - 20,
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
                padding: 8
              }}>
                <IconToggle
                  name={videoPaused ? 'ios-play' : 'ios-pause'}
                  iconSet={'Ionicons'}
                  size={40}
                  color={'#FFF'}
                  maxOpacity={0.5}
                  percent={200}
                  onPress={this.toggleReplay}
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
            </View>
          }
          {!imageUri && !videoUri && 
            <View style={{flex: 1}}>
              <RNCamera
                ref={ref => {
                  this.camera = ref;
                }}
                style={styles.preview}
                type={RNCamera.Constants.Type.back}
                flashMode={flashMode}
                captureAudio={!isMuted}
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
                  // console.log(barcodes);
                }}
                ratio={'1:1'}
              />

              <View style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                padding: 8,
                flexDirection: 'row',
                justifyContent: 'flex-end'
              }}>
                <View style={{
                  position: 'relative',
                  // flex: 1,
                  flexDirection: 'row'
                }}>
                  <IconToggle
                    name={flashMode === 'on'
                      ? 'ios-flash'
                      : flashMode === 'auto'
                        ? 'ios-flash'
                        : 'ios-flash-off'
                    }
                    iconSet={'Ionicons'}
                    size={25}
                    color={flashMode === 'off'
                      ? COLOR.grey500
                      : '#FFF'
                    }
                    maxOpacity={0.5}
                    percent={200}
                    onPress={this.toggleFlashMode}
                    style={{
                      container: {
                        // shadowColor: '#000',
                        // shadowOffset: {width: 2, height: 2},
                        // shadowOpacity: 0.3,
                        // shadowRadius: 3,
                      }
                    }}
                  />

                  {flashMode === 'auto' &&
                    <View style={{
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: "#FFF",
                      flex: 0,
                      position: 'absolute',
                      top: 27,
                      left: 26,
                      pointerEvents: 'none'
                    }}>
                      <Text style ={{
                        fontSize: 9,
                        color: "#FFF",
                        flex: 0,
                        marginLeft: 2,
                        marginRight: 2
                      }}>A</Text>
                    </View>
                  }
                </View>

                {selectedTab === 1 &&
                  <IconToggle
                    name={isMuted
                      ? 'ios-volume-off'
                      : 'ios-volume-high'
                    }
                    iconSet={'Ionicons'}
                    size={25}
                    color={isMuted
                      ? COLOR.red500
                      : '#FFF'
                    }
                    maxOpacity={0.5}
                    percent={200}
                    onPress={this.toggleMute}
                    style={{
                      container: {
                        // shadowColor: '#000',
                        // shadowOffset: {width: 2, height: 2},
                        // shadowOpacity: 0.3,
                        // shadowRadius: 3,
                      }
                    }}
                  />
                }
              </View>
            </View>
          }

          {!!imageUri || !!videoUri &&
            <View
              style={{position: 'absolute',
                bottom: 0,
                right: 0
              }}
            >
              {/* TODO: add icons to comment, places nearby and categry */}
            </View>
          }
        </View>

        <View style={{
          backgroundColor: '#f7f7f7',
          flex: 1,
          justifyContent: 'space-between',
          alignItems: 'center',
          flexDirection: 'column',
          position: 'relative'
        }}>
          <Progress.Bar
            progress={uploadProgress}
            width={width}
            height={4}
            color={COLOR.blue800}
            borderRadius={0}
            borderWidth={0}
            useNativeDriver={true}
            unfilledColor={'rgba(0,0,0,0)'}
          />

          {!imageUri && !videoUri &&
            <View style={{
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center'
              }}>
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onTouchStart={e => {
    
                  if (selectedTab === 1) {
                    this.takeVideo()
                  }
                  return e
                }}
                onTouchEnd={e => {    
                  if (selectedTab === 1) {
                    this.stopVideo()
                  }
                  return e
                }}
              >
                <View style={{position: 'relative'}}>
                  <IconToggle
                    size={100}
                    color={isRecording ? COLOR.red500 : '#cccccc'}
                    underlayColor={isRecording ? COLOR.red500 : '#000'}
                    maxOpacity={0.2}
                    percent={100}
                    onPress={e => {
                      if (selectedTab === 0) {
                        this.takePicture()
                      }
                    }}
                  >
                    <Icon
                      name="md-radio-button-off"
                      size={70}
                      color={'#cccccc'}
                      underlayColor={isRecording ? COLOR.red500 : '#000'}
                    />
                  </IconToggle>
                  {(isRecording && selectedTab === 1) &&
                    <Progress.Circle
                      size={200}
                      indeterminate={false}
                      color={COLOR.red500}
                      progress={videoProgress}
                      borderWidth={0}
                      thickness={3}
                      style={{
                        pointerEvents: 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                      }}
                    />
                 }
                </View>
              </View>
              <View style={{
                marginBottom: 10,
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
          }

          {(!!imageUri || !!videoUri) &&
            <View style={{
                flexDirection: 'column',
                alignItems: 'stretch',
                flex: 1,
                width,
                paddingLeft: 8,
                paddingRight: 8
              }}
            >

              <OutlinedTextField
                label='Add a Comment'
                // leftIcon={
                //   <Icon
                //     name='ios-create'
                //     size={24}
                //     color='black'
                //   />
                // }
                // inputStyle={{
                //   height: null
                // }}
                multiline={true}
                containerStyle={{marginTop: 30}}
                // leftIconContainerStyle={{marginRight: 20}}
                // numberOfLines={3}
                blurOnSubmit={true}
                returnKeyType={'done'}
                onChangeText={this.handleCommentChange}
                value={comment}
              />


              {/* <PlacesNearbyPicker */}
              {/*   onPlaceSelect={this.onPlaceSelect} */}
              {/*   currentPosition={currentPosition} */}
              {/*   selectedPlace={placeNearby} */}
              {/* /> */}

              {/* <TextInput */}
              {/*   style={styles.textInput} */}
              {/*   onChangeText={text => onChangeText(text)} */}
              {/*   value={value} */}
              {/* /> */}

              <OutlinedTextField
                label='Tag Place'
                // keyboardType='phone-pad'
                // formatText={this.formatText}
                // onSubmitEditing={this.onSubmit}
                ref={this.fieldRef}
                onChangeText={this.onPlaceSelect}
              />

              <Dropdown
                label="Select a Category"
                data={categoryOptions}
                onChangeText={this.handleCategoryChange}
                labelExtractor={({title='', text=''}) => `${title}`}
                valueExtractor={(categoryId) => {
                  // console.log("valueExtractor categoryId: ", categoryId)
                  return categoryId.value
                  }}
//                 renderBase={props => {
//                   const {value: {value='', title=''}={}} = props
//                   // console.log("category title: ", title)
//                   const nextProps = {
//                     // ...props,
//                     // onFocus: props.onFocus,
//                     // onChangeText: props.onChangeText,
//                     label: "Select a category",
//                     value: props.value
//                   }
// 
//                   delete nextProps.title
// 
//                   console.log("category props.title: ", props.title)
// 
//                   return <OutlinedTextField
//                     // leftIcon={
//                     //   <Icon
//                     //     name='ios-albums'
//                     //     size={24}
//                     //     color='black'
//                     //   />
//                     // }
//                     // containerStyle={{marginTop: 30}}
//                     // leftIconContainerStyle={{marginRight: 20}}
//                     // {...nextProps}
//                     // {...props}
//                     label="Select a Category"
//                     value={props.title}
//                     ref={this.categoryRef}
//                   />
//                 }}
                onFocus={e => {
                  // console.log("dropdown onFocus");
                  Keyboard.dismiss();
                }}
                containerStyle={{
                  margin:0,
                  padding: 0,
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderWidth: 1,
                  borderRadius: 4,
                  borderColor: 'rgba(0, 0, 0, 0.28)',
                  // height: 40
                }}
                inputContainerStyle={{
                  margin: 0,
                  padding: 0,
                  height: 48,
                  top: -15
                  }}
                  pickerStyle={{
                    margin: 0,
                  padding: 0
                    }}
                lineWidth={0}
              />

              <View style={{
                flex:1,
                alignItems: 'center',
                justifyContent: 'flex-end',
                ...ifIphoneX({
                  marginBottom: 25,
                }, {
                  marginBottom: 10,
                })
              }}>
                <Button
                  title="Submit"
                  type="clear"
                  titleStyle={{fontSize: 24}}
                  disabled={uploading}
                  onPress={this.saveMedia}
                />
              </View>
            </View>
          }
        </View>
      </KeyboardAvoidingView>
    );
  }
}

export default connect(stateToProps, {selectCheckin})(withNavigationFocus(MediaUpload))

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
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1
  }
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