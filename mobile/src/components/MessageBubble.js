import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function MessageBubble({ message, isOwn }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={[styles.wrapper, isOwn ? styles.wrapperOwn : styles.wrapperOther]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2, paddingHorizontal: 8 },
  wrapperOwn: { alignItems: 'flex-end' },
  wrapperOther: { alignItems: 'flex-start' },
  senderName: { fontSize: 11, color: '#25D366', marginBottom: 2, marginLeft: 4 },
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
});
