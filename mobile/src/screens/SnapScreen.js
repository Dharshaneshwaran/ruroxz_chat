import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput, ScrollView, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';

const SnapScreen = ({ navigation }) => {
  const cameraRef = useRef(null);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [oneTimeView, setOneTimeView] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraPermission, requestCameraPermission] = Camera.useCameraPermissions();

  const startCamera = async () => {
    if (cameraPermission?.status !== 'granted') {
      const { status } = await requestCameraPermission();
      if (status !== 'granted') {
        Alert.alert('Camera permission required');
        return;
      }
    }
  };

  const takeSnap = async () => {
    if (cameraRef.current && cameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: true,
        });
        setPhoto(photo);
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  const sendSnap = () => {
    if (!photo) {
      Alert.alert('Please take a photo first');
      return;
    }
    Alert.alert('Snap sent!', `Message: ${message}\nOne-time view: ${oneTimeView ? 'Yes' : 'No'}`);
    setPhoto(null);
    setMessage('');
    setOneTimeView(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Snap</Text>
          <TouchableOpacity onPress={() => Alert.alert('Snap Settings', 'Settings coming soon...')}>
            <Text style={styles.settingsButton}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Camera or Photo Preview */}
        {!photo ? (
          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.camera}
              type={Camera.Constants.Type.front}
              onCameraReady={() => setCameraReady(true)}
            />
            <TouchableOpacity
              style={styles.snapButton}
              onPress={takeSnap}
              disabled={!cameraReady}
            >
              <Text style={styles.snapButtonText}>📷 Take Snap</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.previewContainer}>
            <Image source={{ uri: photo.uri }} style={styles.previewImage} />
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={() => setPhoto(null)}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Message Input */}
        <TextInput
          style={styles.messageInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
        />

        {/* One-Time View Toggle */}
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => setOneTimeView(!oneTimeView)}
        >
          <View style={[styles.checkbox, oneTimeView && styles.checkboxActive]}>
            {oneTimeView && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.toggleLabel}>One Time View</Text>
        </TouchableOpacity>

        {/* Send Button */}
        <TouchableOpacity
          style={[styles.sendButton, !photo && styles.sendButtonDisabled]}
          onPress={sendSnap}
          disabled={!photo}
        >
          <Text style={styles.sendButtonText}>Send Snap</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181c2f',
  },
  scrollContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#282f42',
  },
  backButton: {
    fontSize: 16,
    color: '#4f8cff',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
  },
  settingsButton: {
    fontSize: 20,
  },
  cameraContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {
    width: '100%',
    aspectRatio: 9 / 16,
  },
  snapButton: {
    backgroundColor: '#4f8cff',
    paddingVertical: 12,
    alignItems: 'center',
  },
  snapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    marginVertical: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    aspectRatio: 9 / 16,
    borderRadius: 12,
  },
  retakeButton: {
    backgroundColor: '#4f8cff',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
    borderRadius: 8,
  },
  retakeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  messageInput: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#282f42',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#4f8cff',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#4f8cff',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 14,
  },
  sendButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 12,
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SnapScreen;
