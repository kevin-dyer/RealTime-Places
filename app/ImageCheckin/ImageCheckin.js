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


const {width: screenWidth, height: screenHeight} = Dimensions.get('window')


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

  componentDidUpdate({checkin: {downloadURL: origUrl=''}}) {
    const {checkin: {downloadURL=''}} = this.props

    if (origUrl !== downloadURL) {
      console.log("Checking Download URL has changed!: origUrl: ", origUrl, ", downloadURL: ", downloadURL)
    }
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
        userUid,
        comment,
        placeNearby: {
          name: placeName=''
        }={},
        category=''
      },
      userUid: currentUserUuid,
      selected,
      index,
      onPress=()=>{},
      scale,
      onExpand=()=>{},
      fullScreen
		} = this.props
		const {
      width
    } = this.state
    const marginLeft = index > 0 ? 1 : 0
    const sideMargin = selected ? -(width * scale - height) / 2 : 0
    const containerHeight = fullScreen
      ? screenWidth
      : selected ? height * scale : height
    const containerWidth = fullScreen
      ? screenWidth
      : selected ? width * scale : height

    // console.log("imageCheckin currentUserUuid: ", currentUserUuid, ", checkin.userUid: ", userUid)
    return (
      <TouchableOpacity
        key={`queryPhoto-${docKey || index}`}
        style={{
          position: 'relative',
          height: containerHeight,
          width: containerWidth,
          marginLeft: fullScreen ? 0 : marginLeft + sideMargin,
          // marginRight: sideMargin,
          // zIndex: selected ? 200 : 1
        }}
        onPress={onPress}
        // zIndex={selected ? 200 : 1}
      >
        <Image
          source={{uri: downloadURL}}
          style={{
            flex: 1,
            resizeMode: 'cover'
          }}
        />

        {((!userUid || userUid === currentUserUuid) && (selected || fullScreen)) &&
          <View
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
            }}
          >
            <View style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row'
            }}>
              <IconToggle
                name="ios-expand"
                iconSet="Ionicons"
                size={28}
                color={'#FFF'}
                onPress={onExpand}
              />
              <IconToggle
                name="ios-trash"
                iconSet="Ionicons"
                size={28}
                color={'#FFF'}
                onPress={this.deleteCheckin}
              />
            </View>
          </View>
        }

        {fullScreen &&
          <View
            style={{
              width: screenWidth,
              backgroundColor: '#000',
              padding: 18
            }}
          >
            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
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
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
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
            </View>

            <View style={{
              flexDirection: 'row',
              alignItems: 'center'
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
            </View>
            
          </View>
        }
      </TouchableOpacity>
    )
	}
}