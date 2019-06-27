'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Video from 'react-native-video';


export default class CVideo extends Component {
	state = {
		width: 0
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

	render() {
		const {
			uri,
			height
		} = this.props
		const {width} = this.state

		console.log("Video height: ", height, ", width: ", width)

		return <Video
      // source={{uri: downloadURL}}   // Can be a URL or a local file.
      // source={{uri: 'http://techslides.com/demos/sample-videos/small.mp4'}}
      source={{uri}}
      ref={(ref) => {
       //TODO: need to change this so it is an array
       this.player = ref
      }}
      // onBuffer={this.onBuffer}                // Callback when remote video is buffering
      onError={this.videoError}               // Callback when video cannot be loaded
      style={{
        height,
        width,
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
	}
}