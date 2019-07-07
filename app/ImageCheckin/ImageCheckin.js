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


	render() {
		const {
			height,
      checkin: {
        downloadURL='',
        docKey,
        userUid
      },
      userUid: currentUserUuid,
      selected,
      index,
      onPress=()=>{}
		} = this.props
		const {
      width
    } = this.state

    console.log("imageCheckin currentUserUuid: ", currentUserUuid, ", checkin.userUid: ", userUid)
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

        {(!userUid || userUid === currentUserUuid) &&
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
    )
	}
}