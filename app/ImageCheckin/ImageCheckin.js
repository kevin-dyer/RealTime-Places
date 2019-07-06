'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image
} from 'react-native';
import { IconToggle } from 'react-native-material-ui';



export default class ImageCheckin extends Component {
	state = {
		width: 0,
	}

  componentDidMount() {
    const {
      height,
      checkin: {
        downloadURL='',
        docKey,
        userUid
      }
    } = this.props

    Image.getSize(downloadURL, this.setImgSize)
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

    // console.log("imageCheckin width: ", width, ", height: ", height)
    return (
      <TouchableOpacity
        key={`queryPhoto-${docKey || index}`}
        style={{position: 'relative'}}
        onPress={onPress}
      >
        <Image
          source={{uri: downloadURL}}
          style={{
            marginLeft: index > 0 ? 1 : 0,
            height: selected ? height * 1.5 : height,
            width: selected ? width * 1.5 : width
          }}
        />

        {(!!userUid && userUid === currentUserUuid) &&
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              flex: 0,
              borderWidth: 5,
              borderColor: 'white'
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
      </TouchableOpacity>
    )
	}
}