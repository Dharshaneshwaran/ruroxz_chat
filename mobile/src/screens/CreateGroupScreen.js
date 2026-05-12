import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import socket from '../services/socket';

export default function CreateGroupScreen({ navigation }) {
  const user = useAuthStore((s) => s.user);
  const addChat = useChatStore((s) => s.addChat);
  const [groupName, setGroupName] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const addParticipant = () => {
    const p = phoneInput.trim();
    if (!p || participants.includes(p)) return;
    setParticipants([...participants, p]);
    setPhoneInput('');
  };

  const removeParticipant = (p) => setParticipants(participants.filter((x) => x !== p));

  const handleCreate = async () => {
    if (!groupName.trim()) return Alert.alert('Error', 'Enter a group name');
    if (participants.length === 0) return Alert.alert('Error', 'Add at least one participant');

    setLoading(true);
    try {
      const res = await api.post('/chats', {
        participantPhones: participants,
        chatName: groupName.trim(),
        isGroup: true,
      });
      addChat(res.data);
      socket.emit('join_chats', { userId: user.id, chatIds: [res.data.id] });
      navigation.replace('Chat', { chat: res.data });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Group</Text>
      </View>

      <View style={styles.body}>
        <TextInput
          style={styles.input}
          placeholder="Group name"
          value={groupName}
          onChangeText={setGroupName}
        />

        <View style={styles.addRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Participant phone (+91...)"
            value={phoneInput}
            onChangeText={setPhoneInput}
            keyboardType="phone-pad"
          />
          <TouchableOpacity style={styles.addBtn} onPress={addParticipant}>
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={participants}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <View style={styles.participantRow}>
              <Text style={styles.participantPhone}>{item}</Text>
              <TouchableOpacity onPress={() => removeParticipant(item)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
          style={styles.participantList}
        />

        <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createBtnText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#25D366',
  },
  back: { color: '#fff', fontSize: 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  body: { padding: 16, flex: 1 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12 },
  addRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  addBtn: { backgroundColor: '#25D366', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: 'bold' },
  participantList: { flex: 1, marginBottom: 16 },
  participantRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee',
  },
  participantPhone: { fontSize: 14 },
  removeBtn: { color: '#e74c3c', fontSize: 16, paddingHorizontal: 8 },
  createBtn: {
    backgroundColor: '#25D366', padding: 14, borderRadius: 8, alignItems: 'center',
  },
  createBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
