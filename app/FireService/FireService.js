import firebase from 'react-native-firebase'
import {
  GeoCollectionReference,
  GeoFirestore,
  GeoQuery,
  GeoQuerySnapshot,
  GeoDocumentReference
} from 'geofirestore'
import Geolocation from '@react-native-community/geolocation'

let _fireStore
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
        _firestore = firebase.firestore();
        _imageStoreRef = firebase.storage().ref()

        // // Create a GeoFirestore reference
        _geoFirestore: GeoFirestore = new GeoFirestore(firestore);
        // // Create a GeoCollection reference
        _geoCollection: GeoCollectionReference = geofirestore.collection('checkins');

        // this.setState({
        //   geoFirestore: geofirestore,
        //   geoCollection: geocollection,
        //   user: credential.user.toJSON(),
        //   imageStoreRef
        // })
      }

      return credential
    })
    .catch(error => {
      console.log("error: ", error)
      throw error
    })
}



export const clearQuery = () => {
  if (_geoQuery) {
    geoQuery.cancel()
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
    .filter(chechin => isCheckinOnScreen(checkin, region))
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
    const docKey = uuidV4()
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

          this.setState({
            uploadProgress: 1
          })
          const doc = generateCheckin({
            latitude,
            longitude,
            docKey,
            type: checkinType,
            url: snapshot.downloadURL,
            userUid: uid,
            comment,
            placeNearby,
            category
          });

          geoCollection.add(doc)
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