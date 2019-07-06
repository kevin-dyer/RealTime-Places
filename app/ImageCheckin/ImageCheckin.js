'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import Video from 'react-native-video';
import { IconToggle } from 'react-native-material-ui';



export default class ImageCheckin extends Component {
	state = {
		width: 0,
	}

	setImgSize = (natWidth, natHeight) => {
		const {height} = this.props
		this.setState({
			width: (natWidth / natHeight) * height
		})
	}


	render() {
		const {
			height,
      checkin: {
        downloadURL='',
        docKey,
        userUid
      },
      userUuid: currentUserUuid,
      selected,
      index,
      onPress=()=>{}
		} = this.props
		const {
      width
    } = this.state

    console.log("imageCheckin width: ", width, ", height: ", height)
    return (
      <View
        key={`queryPhoto-${docKey || index}`}
        style={{position: 'relative'}}
      >
        <Image
          source={{uri: downloadURL}}
          style={{
            marginLeft: index > 0 ? 1 : 0,
            height: selected ? height * 1.5 : height,
            width: selected ? width * 1.5 : width
          }}
          onPress={onPress}
          onLoad={response => {
            console.log("onLoad respnse: ", response)
          }}
          onLoadEnd={response => {

            console.log("onLoadEnd respnse: ", response)
            // const {
            //   naturalSize: {
            //     width: natWidth,
            //     height: natHeight,
            //     orientation
            //   }={},
            //   naturalSize
            // } = response || {}
            // console.log("onLoad naturalSize: ", naturalSize)

            // if (orientation === "portrait") {
            //   //Reverse width and height
            //   this.setImgSize(natHeight, natWidth)
            // } else {
            //   this.setImgSize(natWidth, natHeight)
            // }
          }}
        />

        {(!!userUid && userUid === currentUserUuid) &&
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0
            }}
          >
            <IconToggle
              name="close-circle"
              size={20}
              color={'#FFF'}
              onClick={this.deleteCheckin}
            />
          </View>
        }
      </View>
    )
	}
}