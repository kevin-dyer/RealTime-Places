'use strict';
import React, { Component } from 'react';
import {connect} from 'react-redux';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import {
  IconToggle,
  COLOR
} from 'react-native-material-ui';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { isIphoneX } from 'react-native-iphone-x-helper'
import {
  likeCheckin,
  flagInappropriateContent,
  deleteCheckin,
  // getUserData
} from '../../FireService/FireService'
import {
  trackFlagged,
  trackLiked
} from '../../actions/login'
import {
  selectCheckin,
  updateLikeCount
} from '../../actions/checkins'



const {width: screenWidth, height: screenHeight} = Dimensions.get('window')
const isX = isIphoneX()
const HEADER_HEIGHT = isX ? 150 : 100
const HEADER_OFFSET = isX ? 80 : 30
const ANIMATION_TIME = 500


// const stateToProps = ({
//   login: {
//     userData={},
//     userData: {
//       liked=[],
//       flagged=[]
//     }={}
//   }={},
//   checkins: {
//     selectedCheckin
//   }={}
// }, {
//   item: {
//     docKey,
//     photo_reference
//   }={},
//   index
// }) => ({
//   userData,
//   liked,
//   flagged,
//   isSelected: selectedCheckin === (docKey || photo_reference || index)
// })

export default class MediaItem extends Component {
  state = {
    paused: true,
    flagging: false,
    liking: false,
    didLike: true, //used to increase likeCount
    deleting: false,
    mediaLoading: false,
    mediaWidth: new Animated.Value(0.01)
  }

  componentDidMount() {
    // this.animateEnter()
  }
  componentDidUpdate({
    selectedCheckin: oldCheckin,
    userData: {
      liked: oldLiked=[]
    }={},
    toRemove: wasToRemove
  }, {
    paused: wasPaused
  }) {
    const {
      selectedCheckin,
      item: {type, id}={},
      userData,
      // userData: {
      //   liked=[]
      // }={}
      isSelected,
      toRemove
    } = this.props
    // const wasSelected = this.isSelected(oldCheckin)
    // const isSelected = this.isSelected(selectedCheckin)

    if (!wasPaused && !isSelected) {
      // console.log("no longer selected!")
      this.togglePause(true)
    }

    if (!wasToRemove && toRemove) {

      // console.log("media toRemove, calling animateExit")
      this.animateExit()
    }

    // if (isSelected) {
    //   console.log("MediaItem UPDATE. userData: ", userData)
    // }

    //if isLiked changed, set liking to false
//     const wasLiked = oldLiked.includes(id)
//     const isLiked = liked.includes(id)
// 
//     if (isSelected) {
//       console.log("wasLiked: ", wasLiked, ", isLiked: ", isLiked)
//     }
// 
//     if (wasLiked !== isLiked) {
//       this.setState({
//         liking: false
//       })
//     }
  }

  animateEnter = () => {
    const {size} = this.props

    // console.log("animateEnter called, setting to size: ", size)

    Animated.timing(this.state.mediaWidth, {
      toValue: 1,
      duration: ANIMATION_TIME,
      // isInteraction: false,
      // useNativeDriver: true
    }).start(() => {
      // console.log("Enter Animation is complete!")
    })
  }

  animateExit = () => {
    const {
      item,
      removeMedia=()=>{},
    } = this.props

    Animated.timing(this.state.mediaWidth, {
      toValue: 0,
      duration: ANIMATION_TIME,
      // isInteraction: false,
      // useNativeDriver: true
    }).start(() => {
      // console.log("Exit Animation is complete!")
      removeMedia(item)
    })
  }

  deleteCheckin = () => {
    const {
      item: {
        id,
        downloadURL,
        docKey
      },
      geoCollection,
      imageStoreRef
    } = this.props

    if (!!id) {
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
            this.setState({deleting: true})

            deleteCheckin({
              id,
              docKey
            }).catch(() => {
              this.setState({deleting: false})
            })
          }, style: 'destructive'},
        ],
        {cancelable: true},
      )
    }
  }

  flagInappropriateContent = () => {
    const {
      item: {
        id,
        downloadURL,
        docKey,
        inappropriateCount=0
      },
      flagged=[],
      geoCollection,
      trackFlagged
    } = this.props
    // const {flagged} = getUserData() || {}
    const isFlagged = flagged.includes(id)

    //Prevent double flagging
    if (isFlagged) return

    this.setState({
      flagging: true
    })

    Alert.alert(
      'Inappropriate Content',
      'Flag this checkin as Inappropriate.',
      [
        {
          text: 'Cancel',
          onPress: () => {
            this.setState({
              flagging: false
            })
          },
          style: 'cancel',
        },
        {text: 'OK', onPress: () => {
          flagInappropriateContent({
            id,
            inappropriateCount
          }).finally(() => {
            setTimeout(() => {
              this.setState({
                flagging: false
              })
            }, 300)

            trackFlagged(id)
          })
        }, style: 'destructive'},
      ],
      {cancelable: false},
    )
  }

  //Toggle between liked and not liked
  likeCheckin = () => {
    const {
      item: {
        id,
        downloadURL,
        docKey,
        likeCount
      },
      userUid,
      userData: {
        liked=[]
      }={},
      geoCollection,
      likeCheckin,
      trackLiked,
      updateLikeCount
    } = this.props
    const isLiked = liked.includes(id)

    this.setState({liking: true})

    // console.log("calling likeCheckin with liked: ", !isLiked)

    likeCheckin({
      id,
      likeCount,
      liked: !isLiked,
      userUid
    }).finally(() => {
      setTimeout(() => {
        this.setState({
          liking: false,
          didLike: true
        })
      }, 300)

      trackLiked(id)
      updateLikeCount(id, !isLiked)
    })
  }

  _renderMedia = (selected) => {
    const {
      item: {
        type,
        uri,
        downloadURL
      }={},
      index
    } = this.props
    const {mediaLoading} = this.state

    if (type === 'googlePhoto' || type === 'image') {
      return <Image
        source={{uri: downloadURL || uri}}
        style={{
          flex: 1,
          resizeMode: 'cover',
          // display: mediaLoading ? 'none' : 'flex'
        }}
        onLoadStart={e => {
          this.setState({mediaLoading: true})
        }}
        onLoadEnd={e => {
          this.setState({mediaLoading: false})

          //console.log("onLoadEnd called!")
          this.animateEnter()
        }}

        onLoad={e => {
          // console.log("image onLoad called!")
        }}
      />
    } else if (type === 'video') {
      return this._renderVideo(selected)
    }
  }

  _renderVideo = (selected) => {
    const {
      item: {
        downloadURL
      }={},
      index,
      fullScreen,
      selectedCheckin
    } = this.props
    const {paused} = this.state

    return <View
      style={{
        position: 'relative',
        flex: 1
      }}
    >
      <Video
        source={{uri: downloadURL}}
        paused={paused}
        ref={(ref) => {
         //TODO: need to change this so it is an array
         this.player = ref
        }}
        // onBuffer={this.onBuffer}                // Callback when remote video is buffering
        // onError={this.videoError}               // Callback when video cannot be loaded
        style={{
          flex: 1
        }}
        resizeMode={'cover'}
        repeat
        onEnd={this.togglePause}
        onLoadStart={e => {
          this.setState({
            mediaLoading: true
          })
        }}
        onLoad={e => {
          this.setState({
            mediaLoading: false
          })

          this.animateEnter()
        }}
      />

      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <IconToggle name={paused ? 'play-circle-filled' : 'pause-circle-filled'}
          color={'rgba(255,255,255,0.65)'}
          size={fullScreen
            ? 50
            : selectedCheckin
              ? 40
              : 30
          }
          onPress={this.togglePause}
        />
      </View>
    </View>
  }

  togglePause = (paused) => {
    const nextPaused = typeof(paused) === 'boolean'
      ? paused
      : !this.state.paused
    this.setState({paused: nextPaused})
  }

  getKey = () => {
    const {
      item: {
        docKey,
        photo_reference
      }={},
      index
    } = this.props

    return docKey || photo_reference || index
  }

  render() {
    const {
      item,
      item: {
        id,
        downloadURL='',
        docKey,
        userUid,
        comment,
        placeNearby: {
          name: placeName=''
        }={},
        category='',
        //For google photo:
        photo_reference,
        uri,
        likeCount=0
      }={},
      index,
      userUid: currentUserUuid,
      selectedCheckin,
      liked=[],
      flagged=[],
      fullScreen,
      size,
      scale,
      isSelected: selected,
      onExpand=()=>{},
      // setSelectedCheckin=()=>{}
      selectCheckin=()=>{}
    } = this.props
    const {
      flagging,
      liking,
      didLike,
      deleting,
      mediaWidth=0
    } = this.state
    // const selected = this.isSelected()
    const marginLeft = index > 0 ? 1 : 0
    const sideMargin = (selected && index > 0) ? -(size * scale - size) / 2 : 0
    const containerHeight = fullScreen
      ? screenHeight
      : selected ? size * scale : size
    const containerWidth = fullScreen
      ? screenWidth
      : selected ? size * scale : size
    const key = this.getKey()
    const isFlagged = flagged.includes(id)
    const isLiked = liked.includes(id)

    if (selected) {
      // console.log("MEdiaItem isLiked: ", isLiked, "userData.liked: ", liked)
    }
    // const translateX = mediaWidth.interpolate({
    //   inputRange: [0, 1],
    //   outputRange: [size/2, 0]
    // })
    const widthVal = mediaWidth.interpolate({
      inputRange: [0, 1],
      outputRange: [0, containerWidth]
    })
    const trueLikeCount = likeCount + (isLiked && didLike ? 1 : 0)


    return (
      <Animated.View style={{
        transform: [
          // {scaleX: mediaWidth},
          // {translateX}
        ],
        // width: size,
        width: widthVal,
        height: containerHeight,
        overflow: 'hidden',
        marginLeft: fullScreen ? 0 : marginLeft + sideMargin,
      }}>
      <TouchableOpacity
        key={key}
        style={{
          position: 'relative',
          flex: 1,
          // height: containerHeight,
          // width: containerWidth,
          
          // marginRight: sideMargin,
          // zIndex: selected ? 200 : 1
        }}
        onPress={e => !fullScreen && selectCheckin(key)}
        activeOpacity={1}
      >
        {fullScreen &&
          <View style={{
            width: screenWidth,
            height: HEADER_HEIGHT,
            backgroundColor: '#000'
            }}
          >

          </View>
        }


        {this._renderMedia(selected)}

        {(selected || fullScreen) &&
          <View
            style={{
              position: 'absolute',
              top: fullScreen ? HEADER_OFFSET : 0,
              right: 0,
              width: '100%'
            }}
          >
            <View style={{
              alignItems: 'center',
              flex: 1,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
              <View>
                {fullScreen &&
                  <IconToggle
                    name={"ios-arrow-back"}
                    iconSet="Ionicons"
                    size={35}
                    color={'#FFF'}
                    onPress={e => onExpand(index)}
                  />
                }
              </View>
              <View style={{flexDirection: 'row', justifyContent: 'flex-end'}}>
                {!fullScreen &&
                  <IconToggle
                    name={fullScreen ? "ios-contract" : "ios-expand"}
                    iconSet="Ionicons"
                    size={fullScreen ? HEADER_OFFSET : 24}
                    color={'#FFF'}
                    onPress={e => onExpand(index)}
                  />
                }

                {userUid !== currentUserUuid &&
                  <IconToggle
                    name="ios-alert"
                    iconSet="Ionicons"
                    size={28}
                    color={flagging
                      ? COLOR.grey500
                      : isFlagged ? COLOR.red500 : '#FFF'
                    }
                    onPress={this.flagInappropriateContent}
                    disabled={flagging}
                  />
                }

                {(!userUid || userUid === currentUserUuid) && !photo_reference &&
                  <IconToggle
                    name="ios-trash"
                    iconSet="Ionicons"
                    size={28}
                    color={deleting ? COLOR.grey500 : '#FFF'}
                    disabled={deleting}
                    onPress={this.deleteCheckin}
                  />
                }
              </View>
            </View>
          </View>
        }

        {(selected || fullScreen) &&
          <View style={{
            position: 'absolute',
            bottom: fullScreen ? screenHeight - screenWidth - HEADER_HEIGHT : 20,
            right: 0,
            flexDirection: 'row'
          }}>
            <IconToggle
              name="ios-thumbs-up"
              iconSet="Ionicons"
              size={fullScreen ? 28 : 20}
              color={liking
                ? COLOR.grey500
                : isLiked ? COLOR.blue500 : '#FFF'
              }
              disabled={liking}
              onPress={e => this.likeCheckin()}
            />

            {trueLikeCount > 0 &&
              <Text style={{
                fontSize: 10,
                color: liking
                  ? COLOR.grey500
                  : isLiked ? COLOR.blue500 : '#FFF',
                transform: [
                  {translateX: -14},
                  {translateY: 4}
                ]
              }}>{trueLikeCount}</Text>
            }
          </View>
        }

        {fullScreen &&
          <View
            style={{
              width: screenWidth,
              height: screenHeight - screenWidth - HEADER_HEIGHT,
              backgroundColor: '#000',
              padding: 18,
              flexDirection: 'column',
            }}
          >
            {!!comment && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                marginBottom: 16
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
              </View>}
            

            {!!placeName && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                marginBottom: 16
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
              </View>}

            {!!category && <View style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginTop: 16,
                marginBottom: 16
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
              </View>}
            
          </View>
        }
      </TouchableOpacity>
      </Animated.View>
    )
  }
}

// export default connect(stateToProps, {
//   likeCheckin,
//   trackFlagged,
//   trackLiked,
//   updateLikeCount,
//   selectCheckin
// })(MediaItem)