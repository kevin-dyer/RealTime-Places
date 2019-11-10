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
  updateLikeCount
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

const {width, height} = Dimensions.get('window')


const PHOTO_SIZE = 140
const PHOTO_SCALE = 2

const stateToProps = ({
  checkins: {
    nearbyCheckins=[]
  }={},
  login: {
    userData={},
    userData: {
      liked=[],
      flagged=[]
    }={}
  }={},
}) => ({
  userData,
  liked,
  flagged,
})

function getKey (media) {
  return media.docKey || media.photo_reference
}

class DrawerTest extends Component {
  state = {
    fullScreen: false,
    allMedia: [],
    mediaToDelete: []
  }

  componentDidUpdate({
    allMedia: prevMedia=[],
    selectedCheckin: oldSelectedCheckin
  }) {
    const {
      allMedia=[],
      selectedCheckin
    } = this.props
    const {
      mediaToDelete: toDelete=[],
      allMedia: allMediaState=[],
      fullScreen
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

    if ((!!selectedCheckin || Number.isInteger(selectedCheckin)) && oldSelectedCheckin !== selectedCheckin) {
      const selectedIndex = allMedia.findIndex(media => {
        const key = getKey(media)

        return key === selectedCheckin
      })
      //Go to specified index if selectedCheckin is an integer
      if (Number.isInteger(selectedCheckin) && selectedCheckin < allMedia.length) {
        // this.scrollViewRef.scrollToIndex({
        //   animated: true,
        //   index: selectedCheckin
        // })

        // console.log("scrolling to index: ", selectedIndex)

        this.scrollViewRef.scrollTo({
          animated: true,
          x: selectedIndex * PHOTO_SIZE - width / 2 + PHOTO_SIZE / 2
        })
        return
      }

      if (selectedIndex > -1) {
        // this.scrollViewRef.scrollToIndex({
        //   animated: true,
        //   index: selectedIndex,
        //   // viewOffset: -PHOTO_SIZE/2,
        //   viewPosition: fullScreen ? 0 : 0.5
        // })

        this.scrollViewRef.scrollTo({
          animated: true,
          x: selectedIndex * PHOTO_SIZE - width / 2 + PHOTO_SIZE / 2
          // viewOffset: -PHOTO_SIZE/2,
          // viewPosition: fullScreen ? 0 : 0.5
        })
      }
    }
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
      updateLikeCount
    } = this.props
    const {
      item,
      item: {
        docKey,
        photo_reference
      },
      index
    } = media
    const {fullScreen, mediaToDelete=[]} = this.state
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
    />
  }

  toggleFullScreen = (index) => {
    const nextFullScreen = !this.state.fullScreen
    this.setState({fullScreen: nextFullScreen})

    if (!!this.scrollViewRef && !isNaN(index)) {
      // console.log("toggleFullScreen calling scrollToIndex: ", index)
      setTimeout(() => { 
        this.scrollViewRef.scrollTo({
          animated: false,
          x: !nextFullScreen ? PHOTO_SIZE * index - width / 2 + PHOTO_SIZE / 2 : 0,
          y: nextFullScreen ? height * index : 0
        })
      }, 200)
    }
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
      nearbyCheckins=[],
      // toggleMediaUpload=()=>{}
      navigation: {
        navigate
      }={}
    } = this.props
    const {fullScreen, allMedia=[]} = this.state
    const queryLength = nearbyCheckins.length

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