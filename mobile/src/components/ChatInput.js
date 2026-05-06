import React, { useState } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function ChatInput({ onSend }) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const content = text.trim();
    if (!content) return;
    onSend({ content });
    setText('');
  };

  const handleImagePick = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('Permission denied');

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      onSend({ mediaUri: asset.uri, mediaType: 'image/jpeg' });
    }
  };

  const handleFilePick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (result.assets?.[0]) {
      const asset = result.assets[0];
      onSend({ mediaUri: asset.uri, mediaType: asset.mimeType || 'application/octet-stream' });
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconBtn} onPress={handleImagePick}>
        <Text style={styles.icon}>📷</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.iconBtn} onPress={handleFilePick}>
        <Text style={styles.icon}>📎</Text>
      </TouchableOpacity>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        multiline
        maxLength={2000}
      />
      <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!text.trim()}>
        <Text style={styles.sendIcon}>➤</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 8, paddingVertical: 6,
    backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#eee',
  },
  iconBtn: { padding: 8 },
  icon: { fontSize: 20 },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 8, fontSize: 15, maxHeight: 100,
    marginHorizontal: 4,
  },
  sendBtn: {
    backgroundColor: '#25D366', width: 40, height: 40,
    borderRadius: 20, justifyContent: 'center', alignItems: 'center',
  },
  sendIcon: { color: '#fff', fontSize: 16 },
});
