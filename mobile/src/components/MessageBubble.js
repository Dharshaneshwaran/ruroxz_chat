import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Alert } from 'react-native';

export default function MessageBubble({ message, isOwn, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Are you sure you want to delete this message?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(message.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}
      onLongPress={() => isOwn && setShowDelete(true)}
      onPress={() => setShowDelete(false)}
      activeOpacity={0.8}
    >
      {!isOwn && message.sender?.displayName ? (
        <Text style={styles.senderName}>{message.sender.displayName}</Text>
      ) : null}
      <View style={[styles.bubble, isOwn ? styles.ownBubble : styles.otherBubble]}>
        {message.mediaUrl && message.mediaType === 'image' ? (
          <Image source={{ uri: message.mediaUrl }} style={styles.media} resizeMode="cover" />
        ) : null}
        {message.content ? (
          <Text style={[styles.text, isOwn ? styles.ownText : styles.otherText]}>
            {message.content}
          </Text>
        ) : null}
        <Text style={[styles.time, isOwn ? styles.ownTime : styles.otherTime]}>{time}</Text>
      </View>

      {/* Delete button overlay for own messages */}
      {isOwn && showDelete && (
        <TouchableOpacity
          style={styles.deleteOverlay}
          onPress={handleDelete}
          activeOpacity={0.8}
        >
          <View style={styles.deleteButton}>
            <Text style={styles.deleteText}>🗑️ Delete</Text>
          </View>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, paddingHorizontal: 8 },
  wrapperOwn: { alignItems: 'flex-end' },
  wrapperOther: { alignItems: 'flex-start' },
  senderName: { fontSize: 11, color: '#6D28D9', marginBottom: 2, marginLeft: 4 },
  bubble: {
    maxWidth: '75%', borderRadius: 12, padding: 8,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1,
  },
  ownBubble: { backgroundColor: '#DCF8C6', borderBottomRightRadius: 2 },
  otherBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 2 },
  media: { width: 200, height: 150, borderRadius: 8, marginBottom: 4 },
  text: { fontSize: 15 },
  ownText: { color: '#000' },
  otherText: { color: '#000' },
  time: { fontSize: 10, marginTop: 2, alignSelf: 'flex-end' },
  ownTime: { color: '#888' },
  otherTime: { color: '#aaa' },
  deleteOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deleteText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
