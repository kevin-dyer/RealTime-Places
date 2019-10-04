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


let _firestore
let _imageStoreRef
let _user

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
export const firebaseInit = () => {
    if (!_firestore) _firestore = firebase.firestore();
    if (!_imageStoreRef) _imageStoreRef = firebase.storage().ref()
    if (!_geoFirestore) _geoFirestore = new GeoFirestore(_firestore);
    if (!_geoCollection) _geoCollection = _geoFirestore.collection('checkins');

    console.log("firebaseLogin success, set _geoCollection to: ", _geoCollection)
}

export const firebaseEmailSignUp = ({email, password}) => {
  return firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      // .then(() => this.props.navigation.navigate('Main'))
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
  return firebase
    .auth()
    .signOut()
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

  console.log("queryData: ", queryData,', originalQueryData',originalQueryData)
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
//             setSelectedCheckin(docKey)
// 
//             this.handleBack()
//             return docRef
            return resolve(docRef)
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

export const rateCheckin = ({
  id,
  ratings: {
    totalCount=0,
    positiveCount=0
  }={},
  positiveRating,
  userUid
}) => {
  return _geoCollection.doc(id).update({
      ratings: {
        totalCount: totalCount + 1,
        positiveCount: positiveCount + (positiveRating ? 1 : 0)
      }
    })
    .then((resp)=>{
      console.log("checkin rated successfully. totalCount: ", totalCount + 1, ", positiveCount: ", positiveCount + (positiveRating ? 1 : 0))
       
      //TODO: update the current user by adding the new checkin to their list of likes/dislikes


      return resp
    })
    .catch(error => {
      console.error("checkin failed to be flagged! error: ", error)
      // throw error
    })
}

export const flagInappropriateContent = ({
  id,
  inappropriateCount=0
}) => {
  return _geoCollection.doc(id).update({
    inappropriateCount: inappropriateCount + 1
  })
  .then((resp)=>{
    console.log("checkin flagged successfully")

    return resp
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
}