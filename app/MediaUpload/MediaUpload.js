'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RNCamera } from 'react-native-camera';
import uuidV4 from 'uuid/v4'
import RNFS from 'react-native-fs'
import firebase from 'react-native-firebase'


export default class BadInstagramCloneApp extends Component {
  takePicture = async function() {
    const {
      geoCollection,
      toggleMediaUpload,
      // imageStoreRef
    } = this.props

    console.log("take pic called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        quality: 0.5,
        base64: true,
        doNotSave: true
      };
      const data = await this.camera.takePictureAsync(options);
      console.log("camera data: ", data);

      navigator.geolocation.getCurrentPosition((location={}) => {
        const {coords: {latitude, longitude}} = location || {}
        const docKey = uuidV4()

        console.log("lat: ", latitude, ", lng: ", longitude, ", !!data.base64: ", !!data.base64)

        const doc = {
          timestamp: Date.now(),
          base64: data.base64,
          coordinates: new firebase.firestore.GeoPoint(latitude,longitude),
          imageKey: docKey,
          type: 'image'
        };

        geoCollection.add(doc)
        .then(docRef => {
          console.log("added doc to geocollection. docRef: ", docRef)
          toggleMediaUpload()
        })
        .catch(error => {
          console.log("error adding doc: ", error)
        })
      }, (error) => {
        console.error("error getting current position: ", error)
      }, {
        enableHighAccuracy: true
      })
    }
  };

  takeVideo = async function() {
    const {
      toggleMediaUpload,
      geoCollection
    } = this.props
    console.log("take VIDEO called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        maxDuration: 2,
        quality: RNCamera.Constants.VideoQuality['720p']

      };
      const data = await this.camera.recordAsync(options);
      console.log("video data: ", data);

      const fileUri = data.uri

      RNFS.readFile(fileUri, 'base64')
      .then(base64 => {
        // console.log("video fileBlob: ", fileBlob)
        navigator.geolocation.getCurrentPosition((location={}) => {
          console.log("currentPostion location: ", location)
          const {
            coords: {
              latitude,
              longitude
            }={}
          } = location || {}
          const docKey = uuidV4()

          console.log("video lat: ", latitude, ", lng: ", longitude, ", !!data.base64: ", !!base64)

          const doc = {
            timestamp: Date.now(),
            base64,
            coordinates: new firebase.firestore.GeoPoint(latitude,longitude),
            videoKey: docKey,
            type: 'video'
          };

          console.log("adding video doc: ", doc)
          geoCollection.add(doc)
          .then(docRef => {
            console.log("added doc to geocollection. docRef: ", docRef)
            toggleMediaUpload()
          })
          .catch(error => {
            console.log("error adding doc: ", error)
          })
        })
      })

      toggleMediaUpload()
    }
  }

  render() {

    return (
      <View style={styles.container}>
        <RNCamera
          ref={ref => {
            this.camera = ref;
          }}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.on}
          androidCameraPermissionOptions={{
            title: 'Permission to use camera',
            message: 'We need your permission to use your camera',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          androidRecordAudioPermissionOptions={{
            title: 'Permission to use audio recording',
            message: 'We need your permission to use your audio',
            buttonPositive: 'Ok',
            buttonNegative: 'Cancel',
          }}
          onGoogleVisionBarcodesDetected={({ barcodes }) => {
            console.log(barcodes);
          }}
        />
        <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
          <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
            <Text style={{ fontSize: 14 }}> Pic </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.takeVideo.bind(this)} style={[styles.capture, styles.videoCapture]}>
            <Text style={styles.vidText}>Vid</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
    width: '100%',
    zIndex: 100
  },
  preview: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  capture: {
    flex: 0,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 15,
    paddingHorizontal: 20,
    alignSelf: 'center',
    margin: 20,
  },
  videoCapture: {
    backgroundColor: 'rgba(0,0,0,0)',
    borderWidth: 2,
    borderColor: '#FFF'
  },
  vidText: {
    fontSize: 14,
    // fontWeight: '800',
    color: '#FFF',
  }
});