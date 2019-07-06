'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Video from 'react-native-video';
import { IconToggle } from 'react-native-material-ui';



export default class CVideo extends Component {
	state = {
		width: 0,
    paused: true
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

	render() {
		const {
			uri,
			height,
      userUuid,
      selected,
      index
		} = this.props
		const {
      width,
      paused
    } = this.state

		// console.log("Video height: ", height, ", width: ", width)


		return <TouchableOpacity
      onPress={this.togglePause}
      style={{position: 'relative'}}
    >
      <Video
        // source={{uri: downloadURL}}   // Can be a URL or a local file.
        // source={{uri: 'http://techslides.com/demos/sample-videos/small.mp4'}}
        source={{uri}}
        paused={paused}
        ref={(ref) => {
         //TODO: need to change this so it is an array
         this.player = ref
        }}
        // onBuffer={this.onBuffer}                // Callback when remote video is buffering
        onError={this.videoError}               // Callback when video cannot be loaded
        style={{
          marginLeft: index > 0 ? 1 : 0,
          height: selected ? height * 1.5 : height,
          width: selected ? width * 1.5 : width
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
      />

      {(paused && width > 0) &&
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
            size={75}
            onPress={this.togglePause}
          />
        </View>
      }
    </TouchableOpacity>
	}
}