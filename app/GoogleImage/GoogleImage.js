'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert
} from 'react-native';
import { IconToggle } from 'react-native-material-ui';



export default class GoogleImage extends Component {
	state = {
		width: 0,
	}

  componentDidMount() {
    const {
      height,
      uri,
    } = this.props

    Image.getSize(uri, this.setImgSize)
  }

	setImgSize = (natWidth, natHeight, other) => {
		const {height} = this.props

    console.log("setImgSize Other (for portrate): ", other)
		this.setState({
			width: (natWidth / natHeight) * height
		})
	}

	render() {
		const {
			height,
      uri,
      selected,
      index,
      onPress=()=>{}
		} = this.props
		const {
      width
    } = this.state

    return (
      <TouchableOpacity
        key={`googlePhoto-${index}`}
        style={{position: 'relative'}}
        onPress={onPress}
      >
        <Image
          source={{uri}}
          style={{
            marginLeft: index > 0 ? 1 : 0,
            height: selected ? height * 1.5 : height,
            width: selected ? width * 1.5 : height,
            resizeMode: 'cover'
          }}
        />
      </TouchableOpacity>
    )
	}
}