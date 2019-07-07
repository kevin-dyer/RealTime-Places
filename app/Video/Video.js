'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert
} from 'react-native';
import Video from 'react-native-video';
import { IconToggle } from 'react-native-material-ui';



export default class CVideo extends Component {
	state = {
		width: 0,
    paused: true
	}

  componentDidUpdate(prevProps) {
    const {} = this.props
  }

	setVidSize = (natWidth, natHeight) => {
		const {height} = this.props
		this.setState({
			width: (natWidth / natHeight) * height
		})
	}

	videoError = (e) => {
		console.log("Video Error: ", e)
	}

  togglePause = () => {
    this.setState({paused: !this.state.paused})

    //to select checkin
    this.props.onPress()
  }

  deleteCheckin = () => {
    const {
      checkin: {
        id,
        downloadURL,
        docKey
      }={},
      geoCollection,
      imageStoreRef
    } = this.props

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
          imageStoreRef.child(`images/${docKey}.mov`).delete()
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

	render() {
		const {
			checkin: {
        downloadURL: uri,
        userUid
      },
			height,
      // userUid,
      userUid: currentUserUuid,
      selected,
      index,
      onPress=()=>{}
		} = this.props
		const {
      width,
      paused
    } = this.state

		// console.log("Video height: ", height, ", width: ", width)


		return <TouchableOpacity
      onPress={onPress}
      style={{position: 'relative'}}
    >
      <Video
        // source={{uri: downloadURL}}   // Can be a URL or a local file.
        // source={{uri: 'http://techslides.com/demos/sample-videos/small.mp4'}}
        source={{uri}}
        paused={!selected}
        ref={(ref) => {
         //TODO: need to change this so it is an array
         this.player = ref
        }}
        // onBuffer={this.onBuffer}                // Callback when remote video is buffering
        onError={this.videoError}               // Callback when video cannot be loaded
        style={{
          marginLeft: index > 0 ? 1 : 0,
          height: selected ? height * 1.5 : height,
          width: selected ? width * 1.5 : height
        }}
        resizeMode={'cover'}
        repeat
        onLoad={response => {
          const {
          	naturalSize: {
          		width: natWidth,
          		height: natHeight,
          		orientation
          	}={},
          	naturalSize
          } = response || {}
          console.log("onLoad naturalSize: ", naturalSize)

          if (orientation === "portrait") {
          	//Reverse width and height
          	this.setVidSize(natHeight, natWidth)
          } else {
          	this.setVidSize(natWidth, natHeight)
          }
        }}
        resizeMode={'cover'}
      />

      {(!selected && width > 0) &&
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <IconToggle name={'play-circle-filled'}
            color={'rgba(255,255,255,0.65)'}
            size={50}
            onPress={onPress}
          />
        </View>
      }

      {((!userUid || userUid === currentUserUuid) && selected) &&
        <View
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            flex: 0
          }}
        >
          <IconToggle
            name="close"
            size={25}
            color={'#FFF'}
            onPress={this.deleteCheckin}
          />
        </View>
      }
    </TouchableOpacity>
	}
}