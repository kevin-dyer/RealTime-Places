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
  ScrollView
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


const PHOTO_SIZE = 140
const PHOTO_SCALE = 2

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
    fullScreen,
    scrollToIndex
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

class DrawerTest extends Component {
  state = {
    // fullScreen: false,
    allMedia: [],
    mediaToDelete: []
  }

  componentDidUpdate({
    allMedia: prevMedia=[],
    selectedCheckin: oldSelectedCheckin,
    fullScreen: oldFullScreen
  }) {
    const {
      allMedia=[],
      selectedCheckin,
      fullScreen,
      scrollToIndex
    } = this.props
    const {
      mediaToDelete: toDelete=[],
      allMedia: allMediaState=[]
    } = this.state

    //Get list of docKeys to be removed after exit animation
    const mediaToDelete = prevMedia.filter((prevMedia, index) => {
      const prevKey = getKey(prevMedia)

      //return true if did exist but now it does not
      return !allMedia.some(media => {
        const key = getKey(media)
        return prevKey === key
      })
    }).map(getKey)


    if (mediaToDelete.length > 0) {
      // console.log("mediaToDelete: ", mediaToDelete, ", setting to: ", [...toDelete, ...mediaToDelete])

      this.setState({
        mediaToDelete: [...toDelete, ...mediaToDelete]
      })
    }

    //TODO: add new items in allMedia props to state
    //get mediaToAdd that also outputs their index
    const mediaToAdd = allMedia.reduce((mToAdd=[], media, index) => {
      const key = getKey(media)
      const isNew = !prevMedia.some(pMedia => {
        const prevKey = getKey(pMedia)

        return prevKey === key
      })
      if (isNew) {
        return [
          ...mToAdd,
          [media, index]
        ]
      }

      return mToAdd
    }, [])

    //TODO: if filter is done after the fact, should just append to the end of the list
    if (mediaToAdd.length > 0) {
      let nextAllMedia = [...allMediaState]

      mediaToAdd.forEach(([media, index]) => {
        //problem is here
        nextAllMedia.splice(index, 0, media)
      })


      this.setState({
        allMedia: nextAllMedia
      })
    }


    //BIG NOTE: if there is mediaToAdd or mediaToDelete, those should be considered before scrolling
    //NOTE: even if mediaToDelete has been filtered out, could still get messed up if media has been added.
    //        Would need to wait until enter animation is complete
    if ((!!selectedCheckin || Number.isInteger(selectedCheckin)) && oldSelectedCheckin !== selectedCheckin) {
      
      const remainingMedia = allMedia.filter(media =>
        !mediaToDelete.some(mtd => mtd.docKey === media.docKey)
      )
      const selectedIndex = remainingMedia.findIndex(media => {
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

    if (oldFullScreen && !fullScreen) {
      this.scrollToMedia(scrollToIndex)
    }
  }

  scrollToMedia = (selectedIndex) => {
    const {fullScreen} = this.props

    this.scrollViewRef.scrollTo({
      animated: true,
      x: selectedIndex * (PHOTO_SIZE + 1) - (width - PHOTO_SIZE * PHOTO_SCALE) / 2, //assuming always scrolling to selected
      // y: fullScreen ? height * selectedIndex : 0
    })
  }

  removeMedia = (mediaToRemove) => {
    const {mediaToDelete=[], allMedia=[]} = this.state
    const keyToRemove = getKey(mediaToRemove)

    // console.log("removeMedia called keyToRemove: ", keyToRemove)
    this.setState({
      mediaToDelete: mediaToDelete.filter(key => {
        // const key = getKey(media)

        //remove key from mediaToDelete list in state
        return keyToRemove !== key
      }),
      allMedia: allMedia.filter(media => {
        const key = getKey(media)

        return keyToRemove !== key
      })
    }, () => {
      const {allMedia, mediaToDelete} = this.state
    })
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
    const {mediaToDelete=[]} = this.state
    const key = getKey(item)
    const user = getUser() || {}
    const toRemove = mediaToDelete.some(keyToRemove => keyToRemove === key)


    // console.log("_renderMedia media: ", media)

    return <MediaItem
      {...media}
      key={docKey || photo_reference || index}
      fullScreen={fullScreen}
      size={PHOTO_SIZE}
      scale={PHOTO_SCALE}
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
      toRemove={toRemove}
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
    toggleFullScreen(true, index)

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

  selectedCheckinIsVisible = (viewableItems=[]) => {
    const {selectedCheckin} = this.props

    return viewableItems.some(({
      item: {
        docKey,
        photo_reference
      }={}
    }) => {
      return !!docKey  && docKey === selectedCheckin ||
         !!photo_reference && photo_reference === selectedCheckin
    })
  }

  handleListChange = debounce(
    ({
      viewableItems=[],
      changed=[]
    }) => {
      const {selectCheckin} = this.props
      const {fullScreen} = this.state
      const checkinIsVisible = this.selectedCheckinIsVisible(viewableItems)

      //TODO: Remove SelectedCheckin if offscreen
      if (!checkinIsVisible) {
        selectCheckin(null)
      }
    }, 600
  )


  render() {
    const {
      // allMedia=[],
      selectedCheckin,
      selectCheckin=()=>{},
      // toggleMediaUpload=()=>{}
      navigation: {
        navigate
      }={}
    } = this.props
    const {fullScreen, allMedia=[]} = this.state

    return <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      zIndex: 2,
      height: fullScreen ? height : null,
      width,
      shadowColor: 'rgb(0,0,0)',
      shadowOffset: {width: 0, height: -1},
      shadowRadius: 6,
      shadowOpacity: 0.4
    }}>
      <View style={{
        position: 'relative',
        flex: 1
      }}>
        <ScrollView
          ref={(ref) => {this.scrollViewRef = ref}}
          horizontal={!fullScreen}
          decelerationRate={fullScreen ? 0 : 'normal'}
          snapToInterval={fullScreen ? height : PHOTO_SIZE + 1} //your element width
          snapToAlignment={"start"}
          style={styles.swiperWrapper}
          contentContainerStyle={styles.contentContainer}
        >
          {allMedia.map((media, index) => {
            return this._renderMedia({item: media, index})
          })}
        </ScrollView>
      </View>
    </View>
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
})(DrawerTest))

const styles = StyleSheet.create({
  swiperWrapper: {
    width,
    minHeight: PHOTO_SIZE,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  contentContainer: {
    alignItems: 'flex-end',
  }
  // swiperContainer: {
  //   alignItems: 'flex-end',
  //   backgroundColor: 'rgba(0,0,0,0.2)',
  // }
});