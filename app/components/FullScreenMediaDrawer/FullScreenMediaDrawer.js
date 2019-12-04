'use strict';
import React, { Component } from 'react';
import {connect} from 'react-redux'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
  Dimensions,
  Animated,
  ScrollView,
  Modal
} from 'react-native';
import { withNavigation } from 'react-navigation';
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
import {
  selectCheckin,
  updateLikeCount,
  deleteCheckinFromState
} from '../../actions/checkins'
import {
  likeCheckin,
  flagInappropriateContent,
  deleteCheckin,
  // getUserData,
  getUser
} from '../../FireService/FireService'
import {
  trackFlagged,
  trackLiked
} from '../../actions/login'
import {toggleFullScreen} from '../../actions/search'


const {width, height} = Dimensions.get('window')

const stateToProps = ({
  // checkins: {
  //   nearbyCheckins=new Map()
  // }={},
  login: {
    userData={},
    userData: {
      liked=[],
      flagged=[]
    }={}
  }={},
  search: {
    fullScreen=false,
    scrollToIndex=0
  }={}
}) => ({
  userData,
  liked,
  flagged,
  fullScreen,
  scrollToIndex
})

function getKey (media) {
  return media.docKey || media.photo_reference
}

class FullScreenMediaDrawer extends Component {
  componentDidUpdate({
    // allMedia: prevMedia=[],
    selectedCheckin: oldSelectedCheckin,
    scrollToIndex: oldScrollToIndex,
    fullScreen: oldFullScreen
  }) {
    const {
      allMedia=[],
      selectedCheckin,
      fullScreen,
      scrollToIndex
    } = this.props
    // const {
    //   mediaToDelete: toDelete=[],
    //   // allMedia: allMediaState=[]
    // } = this.state

    if ((!!selectedCheckin || Number.isInteger(selectedCheckin)) && oldSelectedCheckin !== selectedCheckin) {
      const selectedIndex = allMedia.findIndex(media => {
        const key = getKey(media)

        return key === selectedCheckin
      })
      //Go to specified index if selectedCheckin is an integer
      if (Number.isInteger(selectedIndex) && selectedIndex < allMedia.length) {
        this.scrollToMedia(selectedIndex)
        return
      }

      if (selectedIndex > -1) {
        // this.scrollViewRef.scrollToIndex({
        //   animated: true,
        //   index: selectedIndex,
        //   // viewOffset: -PHOTO_SIZE/2,
        //   viewPosition: fullScreen ? 0 : 0.5
        // })

        // console.log("scrolling to index: ", selectedIndex)
        // this.scrollViewRef.scrollTo({
        //   animated: true,
        //   x: selectedIndex * PHOTO_SIZE - (width - PHOTO_SIZE * PHOTO_SCALE) / 2, //assuming always scrolling to selected
        // })
        this.scrollToMedia(selectedIndex)
      }
    }

    // if (oldSelectedCheckin !== scrollToIndex)
    if (!oldFullScreen && fullScreen) {
      console.log("calling scrollToMedia of scrollToIndex: ", scrollToIndex)
      setTimeout(() => this.scrollToMedia(scrollToIndex), 0)
    }
  }

  scrollToMedia = (selectedIndex) => {
    const {fullScreen} = this.props

    if (fullScreen && !!this.scrollViewRef) {
      console.log("calling scrollTo!")
      this.scrollViewRef.scrollTo({
        animated: false,
        // x: !fullScreen ? selectedIndex * (PHOTO_SIZE + 1) - (width - PHOTO_SIZE * PHOTO_SCALE) / 2 : 0, //assuming always scrolling to selected
        y: height * selectedIndex
      })
    }
  }

  _renderMedia = (media={}) => {
    const {
      selectedCheckin,
      userData,
      userData: {liked=[]},
      // selectCheckin,
      // user: {
      //   uid
      // }={},
      // geoCollection,
      // imageStoreRef,
      selectCheckin,
      likeCheckin,
      trackFlagged,
      trackLiked,
      updateLikeCount,
      flagged=[],
      fullScreen,
      deleteCheckinFromState
    } = this.props
    const {
      item,
      item: {
        docKey,
        photo_reference
      },
      index
    } = media
    // const {mediaToDelete=[]} = this.state
    const key = getKey(item)
    const user = getUser() || {}
    // const toRemove = mediaToDelete.some(keyToRemove => keyToRemove === key)


    // console.log("_renderMedia media: ", media)

    return <MediaItem
      {...media}
      key={docKey || photo_reference || index}
      fullScreen={fullScreen}
      // size={PHOTO_SIZE}
      // scale={PHOTO_SCALE}
      userUid={user.uid}
      liked={liked}
      flagged={flagged}
      selectedCheckin={selectedCheckin}
      // geoCollection={geoCollection}
      // imageStoreRef={imageStoreRef}
      onExpand={this.toggleFullScreen}
      // setSelectedCheckin={selectCheckin}

      selectCheckin={selectCheckin}
      likeCheckin={likeCheckin}
      trackFlagged={trackFlagged}
      trackLiked={trackLiked}
      updateLikeCount={updateLikeCount}
      isSelected={selectedCheckin === (docKey || photo_reference || index)}
      // toRemove={toRemove}
      removeMedia={this.removeMedia}
      deleteCheckinFromState={deleteCheckinFromState}
    />
  }

  toggleFullScreen = (index) => {
    const {
      // fullScreen,
      toggleFullScreen
    } = this.props
    // const nextFullScreen = !this.state.fullScreen
    // this.setState({fullScreen: nextFullScreen})
    toggleFullScreen(false, index)

    // if (!!this.scrollViewRef && !isNaN(index)) {
    //   // console.log("toggleFullScreen calling scrollToIndex: ", index)
    //   setTimeout(() => { 
    //     // this.scrollViewRef.scrollTo({
    //     //   animated: false,
    //     //   x: !nextFullScreen ? PHOTO_SIZE * index - width / 2 + PHOTO_SIZE / 2 : 0,
    //     //   y: nextFullScreen ? height * index : 0
    //     // })
    //     this.scrollToMedia(index)
    //   }, 200)
    // }
  }

  render() {
    const {
      fullScreen,
      allMedia
    } = this.props

    //TODO: consider turnning ScrollView into FlatList
    return (
      <Modal
        visible={fullScreen}
        animationType="slide"
        hardwareAccelerated={true}
        presentationStyle="fullScreen"
      >
        <ScrollView
          ref={(ref) => {this.scrollViewRef = ref}}
          horizontal={false}
          decelerationRate={0}
          snapToInterval={height} //your element width
          snapToAlignment={"start"}
          style={styles.swiperWrapper}
          contentContainerStyle={styles.contentContainer}
        >
          {allMedia.map((media, index) => {
            return this._renderMedia({item: media, index})
          })}
        </ScrollView>
      </Modal>
    )
  }

}

export default withNavigation(connect(stateToProps, {
  selectCheckin,
  likeCheckin,
  trackFlagged,
  trackLiked,
  updateLikeCount,
  deleteCheckinFromState,
  toggleFullScreen
})(FullScreenMediaDrawer))

const styles = StyleSheet.create({
  swiperWrapper: {
    width,
    // minHeight: PHOTO_SIZE,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    alignItems: 'stretch',
  }
  // swiperContainer: {
  //   alignItems: 'flex-end',
  //   backgroundColor: 'rgba(0,0,0,0.2)',
  // }
});