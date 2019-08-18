'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
  Dimensions
} from 'react-native';
import { IconToggle } from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';


const {width: screenWidth, height: screenHeight} = Dimensions.get('window')


export default class MediaItem extends Component {
  state = {paused: true}
  deleteCheckin = () => {
    const {
      item: {
        id,
        downloadURL,
        docKey
      },
      geoCollection,
      imageStoreRef
    } = this.props

    if (!!id) {
      Alert.alert(
        'Delete Checkin',
        'You sure? This cannot be undone!',
        [
          {
            text: 'Cancel',
            onPress: () => console.log('Cancel Pressed'),
            style: 'cancel',
          },
          {text: 'OK', onPress: () => {
            console.log("calling dleteCheckin")
            geoCollection.doc(id).delete()
            .then(()=>{
              console.log("checkin deleted successfully")
            })
            .catch(error => {
              console.error("checkin failed to delete! error: ", error)
            })

            // images/${docKey}.jpg
            imageStoreRef.child(`images/${docKey}.jpg`).delete()
            .then(()=>{
              console.log("image deleted successfully")
            })
            .catch(error => {
              console.error("image failed to delete! error: ", error)
            })
          }},
        ],
        {cancelable: true},
      )
    }
  }

  isSelected = () => {
    const {
      selectedCheckin,
      item: {
        docKey,
        photo_reference,
      },
      index
    } = this.props

    if (!!docKey && docKey === selectedCheckin) {
      return true
      //TODO: update selecting GoogleImage to set photo_reference as selectedCheckin
    } else if (!!photo_reference && photo_reference === selectedCheckin) {
      return true
    }

    return false
  }

  _renderMedia = (selected) => {
    const {
      item: {
        type,
        uri,
        downloadURL
      }={},
      index
    } = this.props

    if (type === 'googlePhoto' || type === 'image') {
      return <Image
        source={{uri: downloadURL || uri}}
        style={{
          flex: 1,
          resizeMode: 'cover'
        }}
      />
    } else if (type === 'video') {
      return this._renderVideo(selected)
    }
  }

  _renderVideo = (selected) => {
    const {
      item: {
        downloadURL
      }={},
      index,
      fullScreen,
      selectedCheckin
    } = this.props
    const {paused} = this.state

    console.log("video downloadURL: ", downloadURL)
    return <View
      style={{
        position: 'relative',
        flex: 1
      }}
    >
      <Video
        source={{uri: downloadURL}}
        paused={paused}
        ref={(ref) => {
         //TODO: need to change this so it is an array
         this.player = ref
        }}
        // onBuffer={this.onBuffer}                // Callback when remote video is buffering
        // onError={this.videoError}               // Callback when video cannot be loaded
        style={{
          flex: 1
        }}
        resizeMode={'cover'}
        repeat
        resizeMode={'cover'}
      />

      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <IconToggle name={paused ? 'play-circle-filled' : 'pause-circle-filled'}
          color={'rgba(255,255,255,0.65)'}
          size={fullScreen
            ? 50
            : selectedCheckin
              ? 40
              : 30
          }
          onPress={this.togglePause}
        />
      </View>
    </View>
  }

  togglePause = () => {
    this.setState({paused: !this.state.paused})
  }

  render() {
    const {
      item: {
        downloadURL='',
        docKey,
        userUid,
        comment,
        placeNearby: {
          name: placeName=''
        }={},
        category='',
        //For google photo:
        photo_reference,
        uri,
      }={},
      index,
      userUid: currentUserUuid,
      selectedCheckin,
      fullScreen,
      size,
      scale,
      onExpand=()=>{},
      setSelectedCheckin=()=>{}
    } = this.props
    const selected = this.isSelected()
    const marginLeft = index > 0 ? 1 : 0
    const sideMargin = selected ? -(size * scale - size) / 2 : 0
    const containerHeight = fullScreen
      ? screenHeight
      : selected ? size * scale : size
    const containerWidth = fullScreen
      ? screenWidth
      : selected ? size * scale : size
    const key = docKey || photo_reference || index


    // console.log("imageCheckin currentUserUuid: ", currentUserUuid, ", checkin.userUid: ", userUid)
    return (
      <TouchableOpacity
        key={key}
        style={{
          position: 'relative',
          height: containerHeight,
          width: containerWidth,
          marginLeft: fullScreen ? 0 : marginLeft + sideMargin,
          // marginRight: sideMargin,
          // zIndex: selected ? 200 : 1
        }}
        onPress={e => !fullScreen && setSelectedCheckin(key)}
        activeOpacity={1}
      >
        {this._renderMedia(selected)}

        {(selected || fullScreen) &&
          <View
            style={{
              position: 'absolute',
              top: fullScreen ? 20 : 0,
              right: 0,
            }}
          >
            <View style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row'
            }}>
              <IconToggle
                name={fullScreen ? "ios-contract" : "ios-expand"}
                iconSet="Ionicons"
                size={fullScreen ? 30 : 24}
                color={'#FFF'}
                onPress={onExpand}
              />

              {(!userUid || userUid === currentUserUuid) &&
                <IconToggle
                  name="ios-trash"
                  iconSet="Ionicons"
                  size={28}
                  color={'#FFF'}
                  onPress={this.deleteCheckin}
                />
              }
            </View>
          </View>
        }

        {fullScreen &&
          <View
            style={{
              width: screenWidth,
              height: screenHeight - screenWidth,
              backgroundColor: '#000',
              padding: 18,
              flexDirection: 'column',
              // justifyContent: 'space-around',
              // alignItems: 'stretch'
            }}
          >
            {!!comment && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                // alignItems: 'center'
                }}
              >
                <Icon
                  name='ios-create'
                  size={16}
                  color='white'
                />

                <Text
                  style={{
                    color: '#FFF',
                    marginLeft: 20,
                    fontSize: 14
                  }}
                >{comment}</Text>
              </View>}
            

            {!!placeName && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                }}
              >
                <Icon
                  name='ios-pin'
                  size={16}
                  color='white'
                />

                <Text
                  style={{
                    color: '#FFF',
                    marginLeft: 20
                  }}
                >{placeName}</Text>
              </View>}

            {!!category && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                }}
              >
                <Icon
                  name='ios-albums'
                  size={16}
                  color='white'
                />
  
                <Text
                  style={{
                    color: '#FFF',
                    marginLeft: 20
                  }}
                >{category}</Text>
              </View>}
            
          </View>
        }
      </TouchableOpacity>
    )
  }
}