import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  ActivityIndicator, TextInput, Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../services/api';
import socket from '../services/socket';
import ChatItem from '../components/ChatItem';

export default function ChatListScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, setChats, addChat } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [phoneInput, setPhoneInput] = useState('');
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchChats();

    socket.on('receive_message', (message) => {
      useChatStore.getState().addMessage(message.chatId, message);
    });

    return () => socket.off('receive_message');
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
      const chatIds = res.data.map((c) => c.id);
      socket.emit('join_chats', { userId: user.id, chatIds });
    } catch (err) {
      console.error('fetchChats error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(chats.filter(c => c.id !== chatId));
    } catch (err) {
      console.error('handleDeleteChat error:', err);
      Alert.alert('Error', 'Failed to delete chat');
    }
  };

  const startDirectChat = async () => {
    const phone = phoneInput.trim();
    if (!phone) return;
    setSearching(true);
    try {
      // Find user by phone via API, then create chat
      const res = await api.post('/chats', {
        participantPhones: [phone],
        isGroup: false,
      });
      addChat(res.data);
      setPhoneInput('');
      navigation.navigate('Chat', { chat: res.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'User not found');
    } finally {
      setSearching(false);
    }
  };

  const startSelfChat = async () => {
    setSearching(true);
    try {
      const res = await api.post('/chats', { participantIds: [user.id], isGroup: false });
      addChat(res.data);
      navigation.navigate('Chat', { chat: res.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to start self chat');
    } finally {
      setSearching(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6D28D9" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>WhatApp Clone</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={startSelfChat} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Me</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('CreateGroup')}
            style={styles.headerBtn}
          >
            <Text style={styles.headerBtnText}>Group</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.headerBtn}>
            <Text style={styles.headerBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Start chat by phone, email, or user id"
          value={phoneInput}
          onChangeText={setPhoneInput}
          keyboardType="default"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.goBtn} onPress={startDirectChat} disabled={searching}>
          {searching ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.goBtnText}>Go</Text>
          )}
        </TouchableOpacity>
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem
            chat={item}
            currentUserId={user.id}
            onPress={() => navigation.navigate('Chat', { chat: item })}
            onDelete={handleDeleteChat}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No chats yet. Start one above!</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#6D28D9',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 6 },
  headerBtnText: { color: '#fff', fontSize: 13 },
  searchRow: { flexDirection: 'row', padding: 12, gap: 8, borderBottomWidth: 1, borderColor: '#eee' },
  searchInput: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 8, fontSize: 14 },
  goBtn: { backgroundColor: '#6D28D9', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  goBtnText: { color: '#fff', fontWeight: 'bold' },
  empty: { textAlign: 'center', marginTop: 48, color: '#999' },
});
