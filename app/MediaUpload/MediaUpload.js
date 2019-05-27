'use strict';
import React, { Component } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { RNCamera } from 'react-native-camera';

export default class BadInstagramCloneApp extends Component {
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

  takePicture = async function() {
    console.log("take pic called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        quality: 0.5,
        base64: true,
        doNotSave: true
      };
      const data = await this.camera.takePictureAsync(options);
      console.log(data);
    }
  };

  takeVideo = async function() {
    console.log("take VIDEO called! this.camera: ", this.camera)
    if (this.camera) {
      const options = {
        maxDuration: 10,
        quality: RNCamera.Constants.VideoQuality['720p']

      };
      const data = await this.camera.recordAsync(options);
      console.log(data);
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: 'black',
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