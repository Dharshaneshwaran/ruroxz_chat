import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ChatItem({ chat, currentUserId, onPress, onDelete }) {
  const otherParticipant = chat.participants?.find((p) => p.userId !== currentUserId);
  const name = chat.isGroup
    ? chat.name || 'Group'
    : otherParticipant?.user?.displayName || otherParticipant?.user?.phone || 'Me';

  const lastMessage = chat.messages?.[0];
  const preview = lastMessage?.content || (lastMessage?.mediaUrl ? '📷 Media' : 'No messages yet');
  const time = lastMessage
    ? new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const initials = (name || 'U').charAt(0).toUpperCase();

  const handleLongPress = () => {
    Alert.alert(
      'Delete Chat',
      `Delete ${chat.isGroup ? 'group chat' : 'chat'} "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete && onDelete(chat.id) },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      onLongPress={handleLongPress}
      activeOpacity={0.7}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderColor: '#f0f0f0',
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  content: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  name: { fontWeight: '600', fontSize: 15, flex: 1, marginRight: 8 },
  time: { fontSize: 11, color: '#999' },
  preview: { fontSize: 13, color: '#888' },
});
