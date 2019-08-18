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
import MediaItem from '../MediaItem/MediaItem'
import {PLACES_KEY} from '../../../configs'
import {debounce} from 'lodash'

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

  componentDidUpdate({selectedCheckin: oldSelectedCheckin}) {
    const {selectedCheckin, allMedia=[]} = this.props

    if ((!!selectedCheckin || !isNaN(selectedCheckin)) && oldSelectedCheckin !== selectedCheckin) {
      //Go to specified index if selectedCheckin is an integer
      if (!isNaN(selectedCheckin)) {
        this.flatListRef.scrollToIndex({
          animated: true,
          index: selectedCheckin,
          // viewOffset: -PHOTO_SIZE,
          // viewPosition: 1
        })
        return
      }
      const selectedIndex = allMedia.findIndex(media => 
        media.docKey === selectedCheckin || media.photo_reference === selectedCheckin
      )

      if (selectedIndex > -1) {
        console.log("scrolling to index: ", selectedIndex, this.flatListRef)
        this.flatListRef.scrollToIndex({
          animated: true,
          index: selectedIndex,
          // viewOffset: -PHOTO_SIZE,
          // viewPosition: 1
        })
      }
    }
    //TODO: if selectedCheckin changes, then scroll to it
    //NOTE: might still need a way to scroll to something
  }

  //TODO: Check if userUid is correct
  //TODO: pass in geoCollection and imageStoreRef
  _renderMedia = (media={}) => {
    const {
      selectedCheckin,
      setSelectedCheckin,
      user: {
        uid
      }={},
      geoCollection,
      imageStoreRef
    } = this.props
    const {fullScreen} = this.state
    return <MediaItem
      {...media}
      fullScreen={fullScreen}
      size={PHOTO_SIZE}
      scale={PHOTO_SCALE}
      userUid={uid}
      selectedCheckin={selectedCheckin}
      geoCollection={geoCollection}
      imageStoreRef={imageStoreRef}
      onExpand={this.toggleFullScreen}
      setSelectedCheckin={setSelectedCheckin}
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

    // if (index > -1) {
      if (selectedCheckin !== index) {

        // console.log("scrolling to (queryData.length + index + 1) * PHOTO_SIZE: ", (queryData.length + index + 1) * PHOTO_SIZE)
        // this.flatListRef.scrollToIndex({
        //   animated: true,
        //   index: queryData.length + index,
        //   // offset: (queryData.length + index + 1) * PHOTO_SIZE
        //   // viewOffset: PHOTO_SIZE,
        //   // viewPosition: 0
        // })
      }
      setSelectedCheckin(index)
    // }

  }

  toggleFullScreen = (index) => {
    this.setState({fullScreen: !this.state.fullScreen})

    if (!!this.flatListRef && !isNaN(index)) {
      console.log("toggleFullScreen calling scrollToIndex: ", index)
      setTimeout(() => { 
        this.flatListRef.scrollToIndex({
          animated: false,
          index
        })
      }, 200)
    }
  }

  selectedCheckinIsVisible = (viewableItems=[]) => {
    const {selectedCheckin} = this.props

    return viewableItems.some(({item: {docKey, photo_reference}={}}) => {
      return !!docKey  && docKey === selectedCheckin ||
         !!photo_reference && photo_reference === selectedCheckin
    })
  }

//   handleListChange = debounce(
//     ({
//       viewableItems=[],
//       changed=[]
//     }) => {
//       const {setSelectedCheckin} = this.props
//       const {fullScreen} = this.state
//       console.log("update FlatList!", viewableItems)
// 
//       //TODO: Remove SelectedCheckin if offscreen
//       if (this.selectedCheckinIsVisible(viewableItems)) {
//         setSelectedCheckin(null)
//       }
// 
//       //if full screen, snap to index
//       //NOTE: this could cause feedback loop
//       if (fullScreen) {
//         console.log("snap to index here!")
//       }
//     }, 500
//   )


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

    // console.log("allMedia: ", allMedia)


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
          ListHeaderComponent={!fullScreen &&
            <TouchableOpacity style={{
                height: PHOTO_SIZE,
                width: fullScreen ? width : PHOTO_SIZE * 0.75,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: 'rgba(0,0,0,0.3)',
                marginRight: fullScreen ? 0 : 1
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
            length: fullScreen ? height : PHOTO_SIZE + 1,
            offset: fullScreen
              ? height * index
              : (PHOTO_SIZE + 1) * index,
            index
          })}
          onRefresh={()=>{
            this.toggleFullScreen(0)
          }}
          refreshing={false}
          // snapToAlignment={'start'}
          // onViewableItemsChanged={
          //   this.handleListChange
          // }
          decelerationRate={fullScreen ? 0 : 'normal'}
          snapToInterval={fullScreen ? height : PHOTO_SIZE + 1} //your element width
          snapToAlignment={"start"}
        />
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