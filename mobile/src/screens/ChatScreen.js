import React, { useEffect, useRef, useState } from 'react';
import {
  View, FlatList, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, Platform, Text, Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../services/api';
import socket from '../services/socket';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

export default function ChatScreen({ route, navigation }) {
  const { chat } = route.params;
  const user = useAuthStore((s) => s.user);
  const { messages, setMessages, addMessage } = useChatStore();
  const [loading, setLoading] = useState(true);
  const flatRef = useRef(null);

  const chatMessages = messages[chat.id] || [];

  const chatName = chat.isGroup
    ? chat.name
    : chat.participants?.find((p) => p.userId !== user.id)?.user?.displayName || 'Chat';

  useEffect(() => {
    navigation.setOptions({ headerShown: true, title: chatName });
    fetchMessages();
    socket.emit('join_chats', { userId: user.id, chatIds: [chat.id] });

    socket.on('receive_message', (msg) => {
      if (msg.chatId === chat.id) addMessage(chat.id, msg);
    });

    return () => socket.off('receive_message');
  }, []);

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [chatMessages.length]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chats/${chat.id}/messages`);
      setMessages(chat.id, res.data);
    } catch (err) {
      console.error('fetchMessages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async ({ content, mediaUri, mediaType }) => {
    try {
      if (mediaUri) {
        const formData = new FormData();
        formData.append('media', {
          uri: mediaUri,
          type: mediaType || 'image/jpeg',
          name: 'media.' + (mediaType?.split('/')[1] || 'jpg'),
        });
        if (content) formData.append('content', content);
        await api.post(`/chats/${chat.id}/messages`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        socket.emit('send_message', {
          chatId: chat.id,
          senderId: user.id,
          content,
        });
      }
    } catch (err) {
      console.error('handleSend error:', err);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chats/${chat.id}/messages/${messageId}`);
      // Remove message from local state
      const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
      setMessages(chat.id, updatedMessages);
    } catch (err) {
      console.error('handleDeleteMessage error:', err);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatRef}
        data={chatMessages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isOwn={item.senderId === user.id}
            onDelete={handleDeleteMessage}
          />
        )}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={<Text style={styles.empty}>No messages yet</Text>}
      />
      <ChatInput onSend={handleSend} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ECE5DD' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messageList: { padding: 12, paddingBottom: 4 },
  empty: { textAlign: 'center', color: '#999', marginTop: 40 },
});
