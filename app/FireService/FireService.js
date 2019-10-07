import firebase from 'react-native-firebase'
import {
  GeoCollectionReference,
  GeoFirestore,
  GeoQuery,
  GeoQuerySnapshot,
  GeoDocumentReference
} from 'geofirestore'
import Geolocation from '@react-native-community/geolocation'
import uuidV4 from 'uuid/v4'
import {updateUserData} from '../actions/login'


let _firestore
let _imageStoreRef
let _user
let _userDataRef
let _usersRef
let _userData

let _geoQuery
let _geoFirestore
let _geoCollection
let _queryData=[]

//Getters
export const getFirestore = () => _firestore
export const getImageStoreRef = () => _imageStoreRef
export const getUser = () => _user
export const getGeoQuery = () => _geoQuery
export const getGeoFirestore = () => _geoFirestore
export const getGeoCollection = () => _geoCollection
export const getUserData = () => _userData


export const firebaseLogin = () => {
  return firebase.auth()
    .signInAnonymously()
    .then(credential => {
      if (credential) {
        _user = credential.user.toJSON()
        console.log('default app user ->', _user);

        // Create a Firestore reference
        

        return _user.refreshToken
      }
    })
    .catch(error => {
      console.log("error: ", error)
      // throw error
    })
}

//NOTE: Called from AuthLoadingScreen
export const firebaseInit = (user, dispatch) => {

    console.log("firebaseInit, updating _dispatch to: ", dispatch)
    _dispatch = dispatch
    _firestore = firebase.firestore();
    _imageStoreRef = firebase.storage().ref()
    _geoFirestore = new GeoFirestore(_firestore);
    _geoCollection = _geoFirestore.collection('checkins');
    _user = user

      //TODO: set up listener for changes to doc
    _usersRef = _firestore.collection('users')
    _userDataRef = _usersRef.doc(user.uid)

    //test
    fetch("https://us-central1-realtime-places-239604.cloudfunctions.net/sendMail?dest=thedude136895@gmail.com")
    .then(resp => {
      console.log("send mail resP: ", resp)
    })
    .catch(erro => {
      console.warn("error sending mail: ", erro)
    })


     console.log("firebaseInit. user.uid: ", user.uid)
    if (!_userData) {

      console.log("setting _userData, _userDataRef: ", _userDataRef)
      _userDataRef.get().then(snapshot => {
        _userData = snapshot.data()

        _dispatch(updateUserData(_userData))

        if (!_userData) {
          console.log("creating user, user.uid: ", user.uid)
          const nextUser = {
            uid: user.uid,
            liked: [],
            flagged: [],
            checkins: []
          }
          _usersRef.doc(user.uid).set(nextUser).then(docRef => {
            console.log("created userData! docRef: ", docRef)

            _userData = nextUser
            _dispatch(updateUserData(_userData))
          }).catch(error => {
            console.warn("error creating user. error: ", error)
          })
        } else {
          console.log("_userData: ", _userData)
        }
      })
      .catch(error => {
        console.warn("Error getting userData. error: ", error)
      })
    }
// 
//     console.log("firebaseLogin success, set _geoCollection to: ", _geoCollection)
}

export const firebaseEmailSignUp = ({email, password}) => {
  return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      // .catch(error => this.setState({ errorMessage: error.message }))
}

export const firebaseEmailSignIn = ({email, password}) => {
  return firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      // .then(() => this.props.navigation.navigate('Main'))
      // .catch(error => this.setState({ errorMessage: error.message }))
}

export const firebaseSignout = () => {
  _firestore = undefined
  _imageStoreRef = undefined
  _geoFirestore = undefined
  _geoCollection = undefined
  _user = undefined
  _userDataRef = undefined
  _userData = undefined



  return firebase
    .auth()
    .signOut()

  
}

export const firebaseDeleteUser = () => {
  return firebase
    .auth()
    .currentUser.delete()
}

export const firebaseForgotPassword = (email) => {
  return firebase
    .auth()
    .sendPasswordResetEmail(email)
    // .then(function (user) {
    //   alert('Please check your email...')
    // }).catch(function (e) {
    //   console.log(e)
    // })
  }



export const clearQuery = () => {
  if (_geoQuery) {

    // debugger
    // _geoQuery.cancel()
  }
}

export const getNearbyCheckins = (region={}, onQueryData=()=>{}) => {
  const {
    latitude,
    longitude,
    latitudeDelta,
    longitudeDelta
  } = region
  const mainDelta = Math.max(latitudeDelta, longitudeDelta)
  const radius = ((mainDelta * 40008000 / 360) / 2) / 1000//not sure if I need to divide by 2
  const maxDocs = 10
  // console.log("radius: ", radius)

  // console.log("calling getNearbyCheckins, region latitude: ",latitude, ", longitude: ", longitude)

  //validation
  if (
    !latitude ||
    !longitude ||
    Math.min(latitude, longitude) < -180 ||
    Math.max(latitude, longitude) > 180
  ) {
    console.warn("skipping getNearbyCheckins call. location is invalid. lat, lng: ", latitude, longitude)
    return
  }

  if (!_geoCollection) {
    console.warn("_geoCollection not defined, cannot getNearbyCheckins!")
    return
  }

  const queryConfigs = {
    center: new firebase.firestore.GeoPoint(latitude, longitude),
    radius
  }

  // const twoWkMs = 3600 * 24 * 14 * 1000
  _geoQuery = _geoCollection.near(queryConfigs)

    // Get query (as Promise)
  _geoQuery.get()

  _geoQuery.onSnapshot((snapshot: GeoQuerySnapshot) => {
    // .then((snapshot: GeoQuerySnapshot) => {
    // const originalQueryData = _queryData
    const {docs=[]} = snapshot || {}
    const queryData = docs.map(doc => {
      return {
       ...doc.data(),
       id: doc.id
      }
    })
    .filter(checkin => isCheckinOnScreen(checkin, region))
    .sort((a, b) => {
      if (a.timestamp < b.timestamp) {
       return 1
      } else if (a.timestamp > b.timestamp) {
       return -1
      } else {
       return 0
      }
    })
    .slice(0, maxDocs)

     //Attempt to only update state if results have changed
    if (queryDataHasChanged(queryData, _queryData)) {
      onQueryData(queryData)
      _queryData = queryData
    }
  })
}

function queryDataHasChanged(queryData=[], originalQueryData=[]) {

  // console.log("queryData: ", queryData,', originalQueryData',originalQueryData)
  if (queryData.length !== originalQueryData.length) {
    console.log("exiting queryDataHasChanged b/c lenghts are diff")
    return true
  }
  // const maxLength = Math.max(queryData.length, originalQueryData.length)
  for(let i = 0; i < queryData.length; i++) {
    if (queryData[i].docKey !== originalQueryData[i].docKey) {
      return true
    }
  }
  return false
}

const isCheckinOnScreen = ({
  coordinates: {
    latitude: checkinLat,
    longitude: checkinLng
  }={}
}={}, region) => {
  if (!region) return false

  const {
   latitude=0,
   longitude=0,
   latitudeDelta=0,
   longitudeDelta=0
  } = region

  return Math.abs(latitude - checkinLat) < (latitudeDelta * 0.5) &&
   Math.abs(longitude - checkinLng) < (longitudeDelta * 0.5)
}


function generateCheckin({
  latitude,
  longitude,
  type='image',
  docKey='',
  url='',
  userUid='',
  comment,
  placeNearby: {
    place_id,
    name,
    id,
    geometry: {
      location
    }={}
  }={},
  category
}) {
  return {
    timestamp: Date.now(),
    coordinates: new firebase.firestore.GeoPoint(latitude,longitude),
    docKey,
    type,
    downloadURL: url, //TODO: change downloadURL to just url
    userUid,
    comment,
    placeNearby: {
      place_id,
      id,
      location,
      name
    },
    category
  };
}

export const saveMedia = ({
  docKey,
  userUid,
  imageUri,
  videoUri,
  currentPosition: {
    latitude,
    longitude
  }={},
  comment,
  placeNearby,
  category,
  onProgress=()=>{}
}) => {
  return new Promise((resolve, reject) => {
    const {checkins=[]} = _userData || {}
    const checkinType = !!videoUri ? 'video' : 'image'
    const mediaRef = !!videoUri
      ? _imageStoreRef.child(`images/${docKey}.mov`)
      : _imageStoreRef.child(`images/${docKey}.jpg`)

    mediaRef.putFile(imageUri || videoUri)
    .on(
      firebase.storage.TaskEvent.STATE_CHANGED,
      snapshot => {
        // let state = {};
        // state = {
        //   ...state,
        //   progress: (snapshot.bytesTransferred / snapshot.totalBytes) * 100 // Calculate progress percentage
        // };

        onProgress(snapshot.bytesTransferred / snapshot.totalBytes)
        // this.setState({
        //   uploadProgress: (snapshot.bytesTransferred / snapshot.totalBytes)
        // })
        // console.log("upload progress: ", (snapshot.bytesTransferred / snapshot.totalBytes) * 100)
        if (snapshot.state === firebase.storage.TaskState.SUCCESS) {
          console.log("Successful upload!")
          console.log('Uploaded a blob or file! snapshot.downloadURL: ', snapshot && snapshot.downloadURL);

          // this.setState({
          //   uploadProgress: 1
          // })

          onProgress(1)
          const doc = generateCheckin({
            latitude,
            longitude,
            docKey,
            type: checkinType,
            url: snapshot.downloadURL,
            userUid,
            comment,
            placeNearby,
            category
          });

          _geoCollection.add(doc)
          .then(docRef => {
            console.log("added doc to geocollection. docRef: ", docRef, ", ref id: ", docRef.id)
            const nextCheckins = [...checkins, docRef.id]
            //Add checkin to userData.checkins array
            _userDataRef.update({
              checkins: nextCheckins
            }).then((userRef) => {
              _userData.checkins = nextCheckins

              _dispatch(updateUserData(_userData))
              console.log("updated userRef: ", userRef)
              return resolve(docRef)
            }).catch(error => {
              console.warn("Error adding checkin to userDataRef: ", error)
            })
          })
          .catch(error => {
            // console.log("error adding doc: ", error)
            // this.setState({uploading: false})
            return reject(error)
            // throw error
          })
        }
      },
      error => {
        console.alert('Sorry, Try again. error: ', error);
      }
    )
  })
}

export const likeCheckin = ({
  id,
  likeCount,
  // liked, //user is either liking or unliking
  userUid
}) => {
  return (dispatch) => {
    const {liked: likedList=[]} = _userData || {}
    const liked = likedList.includes(id)

    //format likeCount to an integer
    likeCount = parseInt(likeCount) || 0

    console.log("likeCheckin called. id: ", id)

    //if already liked, we are unliking
    let nextLikeCount = liked ? likeCount - 1 : likeCount + 1

    if (nextLikeCount < 0) nextLikeCount = 0
    return _geoCollection.doc(id).update({
        likeCount: nextLikeCount
      })
      .then((docRef)=>{
        console.log("checkin rated successfully. likeCount: ", nextLikeCount, ", previously liked: ", liked)
        //NOTE: liked is the previous liked state of this checkin,
        //so add if it is not already liked,
        //otherwise filter out
        const nextLiked = !liked
          ? [...likedList, id]
          : likedList.filter(checkinId => checkinId !== id)
        //TODO: update the current user by adding the new checkin to their list of likes/dislikes
        _userDataRef.update({
          liked: nextLiked
        }).then(() => {

        _userData.liked = nextLiked

        console.log("dispatching updateUserData, with _userData: ", _userData)
        dispatch(updateUserData(_userData))

          return docRef
        }).catch(error => {
          console.warn("Error adding checkin to userDataRef: ", error)
        })

        return docRef
      })
      .catch(error => {
        console.error("checkin failed to be flagged! error: ", error)
        // throw error
      })
  }
}

export const flagInappropriateContent = ({
  id,
  inappropriateCount=0
}) => {
  const {flagged=[]} = _userData || {}
  return _geoCollection.doc(id).update({
    inappropriateCount: inappropriateCount + 1
  })
  .then((docRef)=>{
    console.log("checkin flagged successfully")
    const nextFlagged = [...flagged, id]
    _userDataRef.update({
      flagged: nextFlagged
    }).then(() => {

      //Update cached userData
      _userData.flagged = nextFlagged

      _dispatch(updateUserData(_userData))
      return docRef
    }).catch(error => {
      console.warn("Error adding checkin to userDataRef: ", error)
    })

    return docRef
  })
  .catch(error => {
    console.error("checkin failed to be flagged! error: ", error)
  })
}

export const deleteCheckin = ({
  id,
  docKey
}) => {
  return _geoCollection.doc(id).delete()
  .then((resp)=>{
    console.log("checkin deleted successfully")
    const nextCheckins = _userData.checkins.filter(checkinId => checkinId !== id)
    _userDataRef.update({
      checkins: nextCheckins
    }).then((docRef) => {

      _userData.checkins = nextCheckins

      _dispatch(updateUserData(_userData))
      return docRef
    }).catch(error => {
      console.warn("Error adding checkin to userDataRef: ", error)

      return error
    })

    return resp
  })
  .catch(error => {
    console.error("checkin failed to delete! error: ", error)

    return error
  })

  // images/${docKey}.jpg
  imageStoreRef.child(`images/${docKey}.jpg`).delete()
  .then(()=>{
    console.log("image deleted successfully")
  })
  .catch(error => {
    console.error("image failed to delete! error: ", error)
  })
}