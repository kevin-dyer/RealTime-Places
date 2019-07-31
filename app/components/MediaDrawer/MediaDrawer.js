'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
  Animated,
  OverflowableView
} from 'react-native';
import {
  COLOR,
  IconToggle
} from 'react-native-material-ui'
import Image from 'react-native-scalable-image';
import Icon from 'react-native-vector-icons/Ionicons';

import ImageCheckin from '../../ImageCheckin/ImageCheckin'
import GoogleImage from '../../GoogleImage/GoogleImage'
import Video from '../../Video/Video'
import {PLACES_KEY} from '../../../configs'

const {width, height} = Dimensions.get('window')


// import { Input, Button } from 'react-native-elements';
// import Icon from 'react-native-vector-icons/Ionicons';


//Use Pan Responder to slide drawer up
//three snap points
  // only FlatList displayed on bottom of screen
  // selected Image takes up half screen
  // Full screen - Selected Image at top, grid of images underneath

//QUESTION; how do I handle the case when an image is not selected?
  //placeholder
  // put image grid at top, but that will be a bad experience when an image is selected and everything is shifted down
  // 

//For now, I can start with non-animated snap points
  // FlatList
  // Single selected image
  // or just have full page view - images stacked vertically

const PHOTO_SIZE = 140
const PHOTO_SCALE = 2
export default class MediaDrawer extends Component {
	state = {
    fullScreen: false
	}

  componentDidMount() {
  }

  _renderMedia = (media={}) => {
    const {item: {
      type
    }={}} = media

    if (type === 'googlePhoto') {
      return this._renderPhoto(media)
    } else if (type === 'image') {
      return this._renderQueryPhoto(media)
    } else if (type === 'video') {
      return this._renderVideo(media)
    }
  }
  _renderPhoto = (
    {
      item: {photo_reference, uri},
      index
    }={}
  ) => {
    const {
      selectedCheckin,
      queryData=[]
    } = this.props
    const queryLength = queryData.length
    // const selected = selectedCheckin === photo_reference
    const photoIndex = index - queryLength
    const selected = selectedCheckin === photoIndex

    return <GoogleImage
      key={`googleImage-${index}`}
      uri={uri}
      height={PHOTO_SIZE}
      onPress={e => {
        // this.scrollToGoogleImage(photo_reference)
        console.log("scrollToGoogleImage photoIndex: ", photoIndex)
        this.scrollToGoogleImage(photoIndex)
      }}
      selected={selected}
      index={index}
      scale={PHOTO_SCALE}
    />
  }

  _renderQueryPhoto = ({
    item: {
      downloadURL='',
      docKey,
      userUid
    }={},
    item,
    index
  }={}) => {
    const {
      selectedCheckin,
      user: {uid}={},
      geoCollection,
      imageStoreRef
    } = this.props
    const {fullScreen} = this.state
    const selected = selectedCheckin === docKey
    
    return <ImageCheckin
      key={`queryPhoto-${docKey}`}
      checkin={item}
      index={index}
      userUid={uid}
      height={PHOTO_SIZE}
      selected={selected}
      onPress={e => {
        // console.log("calling setSelectedCheckin, docKey: ", docKey)
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
      geoCollection={geoCollection}
      imageStoreRef={imageStoreRef}
      scale={PHOTO_SCALE}
      onExpand={this.toggleFullScreen}
      fullScreen={fullScreen}
    />
  }

  _renderVideo = ({
    item: {docKey}={},
    item,
    index
  }={}) => {
    const {
      user: {uid}={},
      geoCollection,
      imageStoreRef,
      selectedCheckin,
    } = this.props
    const selected = selectedCheckin === docKey
    // console.log("_renderVideo downloadURL: ", downloadURL)
    return <Video
      key={`video-${docKey || index}`}
      checkin={item}
      height={PHOTO_SIZE}
      userUid={uid}
      selected={selected}
      onPress={e => {
        // this.setSelectedCheckin(docKey)
        this.scrollToCheckin(docKey)
      }}
      index={index}
      geoCollection={geoCollection}
      imageStoreRef={imageStoreRef}
      scale={PHOTO_SCALE}
    />
  }

  //TODO: rename this method to include selecting place
  scrollToCheckin=(docKey) => {
    const {
      queryData=[],
      selectedCheckin,
      setSelectedCheckin=()=>{},
      moveRegion=()=>{}
    } = this.props


    //FIX THIS
    const index = queryData.findIndex(checkin =>
      checkin.docKey === docKey
    )

    console.log("scrollToCheckin docKey: ", docKey, ", index: ", index, ", queryData: ", queryData)

    if (index > -1) {
      const checkin = queryData[index]
      //NOTE: do not scroll if checkin is already selected
      if (selectedCheckin !== checkin.docKey) {
        this.flatListRef.scrollToIndex({
          animated: true,
          index,
          // viewOffset: -PHOTO_SIZE,
          // viewPosition: 1
        })
      }

      if (!this.isCheckinOnScreen(checkin)) {
        const {
          coordinates: {latitude, longitude}={},
          docKey
        } = checkin
        moveRegion({
          latitude,
          longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        })
      }

      //TODO: need to set new variable to selectedCheckin
      setSelectedCheckin(docKey)
    }
  }

  isCheckinOnScreen = ({
    coordinates: {
      latitude: checkinLat,
      longitude: checkinLng
    }={}
  }={}) => {
    const {region} = this.state

    if (!region) return false

    const {
      latitude=0,
      longitude=0,
      latitudeDelta=0,
      longitudeDelta=0
    } = (this.state.region && this.state.region.__getValue()) || {}

    return Math.abs(latitude - checkinLat) < (latitudeDelta * 0.5) &&
      Math.abs(longitude - checkinLng) < (longitudeDelta * 0.5)
  }

  scrollToGoogleImage = (index) => {
    const {
      queryData=[],
      photos=[],
      selectedCheckin,
      setSelectedCheckin=()=>{}
    } = this.props

    if (index > -1) {
      if (selectedCheckin !== index) {

        console.log("scrolling to (queryData.length + index + 1) * PHOTO_SIZE: ", (queryData.length + index + 1) * PHOTO_SIZE)
        this.flatListRef.scrollToIndex({
          animated: true,
          index: queryData.length + index,
          // offset: (queryData.length + index + 1) * PHOTO_SIZE
          // viewOffset: PHOTO_SIZE,
          // viewPosition: 0
        })
      }
      setSelectedCheckin(index)
    }

  }

  toggleFullScreen = () => {
    this.setState({fullScreen: !this.state.fullScreen})
  }

	render() {
    const {
      allMedia=[],
      selectedCheckin,
      setSelectedCheckin=()=>{},
      queryData=[],
      toggleMediaUpload=()=>{}
    } = this.props
    const {fullScreen} = this.state
    const queryLength = queryData.length

    console.log("allMedia: ", allMedia)


    //TODO: position selected image using xPosition and the image's width
      // make sure it centers itself
      // it should stop animating when offscreen
    //Think about how full screen will work

    return <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      zIndex: 2,
      height: fullScreen ? height : null,
      width
    }}>
      <View style={{
        position: 'relative',
        flex: 1
      }}>
        <FlatList
          ref={(ref) => {this.flatListRef = ref}}
          data={allMedia}
          renderItem={this._renderMedia}
          horizontal={!fullScreen}
          keyExtractor={(item, index) => {
            return item.docKey || item.id
          }}
          style={styles.swiperWrapper}
          contentContainerStyle={styles.swiperContainer}
          removeClippedSubviews={false}
          ListHeaderComponent={
            <TouchableOpacity style={{
                height: PHOTO_SIZE,
                width: fullScreen ? width : PHOTO_SIZE * 0.75,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                marginRight: 1
              }}
              onPress={toggleMediaUpload}
            >
              <Icon
                name="ios-camera"
                size={40}
                color={'rgba(0,0,0,0.5)'}
              />
            </TouchableOpacity>
          }
          getItemLayout={(data, index) => ({
            length: PHOTO_SIZE,
            offset: (PHOTO_SIZE + 1) * index,
            index
          })}
          onRefresh={()=>{
            this.toggleFullScreen()
          }}
          refreshing={false}
        />

        {false && !!selectedCheckin &&
          <View style={{
            position: 'absolute',
            top: 0,
            right: 0,
          }}>
            <IconToggle
              name="close"
              size={30}
              color={'rgba(255,255,255,0.8)'}
              onPress={e => {
                console.log("Calling FlatList onPress!")
                setSelectedCheckin(null)
              }}
            />
          </View>
        }
      </View>
    </View>
	}
}

const styles = StyleSheet.create({
  swiperWrapper: {
    width,
  },
  swiperContainer: {
    alignItems: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  }
});