import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        displayName: name,
        phoneNumber: phone,
      });
      setUser(res.data);
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarLargeText}>{(name || user?.email || 'U').charAt(0).toUpperCase()}</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your Name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="+91XXXXXXXXXX"
            keyboardType="phone-pad"
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleUpdate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Save Changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#25D366',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  backBtn: { width: 40, paddingVertical: 4 },
  backBtnText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  content: { padding: 24, alignItems: 'center' },
  avatarLarge: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#25D366', justifyContent: 'center', alignItems: 'center',
    marginBottom: 32, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4,
  },
  avatarLargeText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
  inputGroup: { width: '100%', marginBottom: 20 },
  label: { fontSize: 14, color: '#666', marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 16,
  },
  saveBtn: {
    backgroundColor: '#25D366', width: '100%', padding: 14, borderRadius: 8,
    alignItems: 'center', marginTop: 12, elevation: 2,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
