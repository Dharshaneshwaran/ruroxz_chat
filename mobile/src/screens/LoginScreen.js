import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInWithCustomToken } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from '../utils/constants';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

let auth;
if (!getApps().length) {
  const app = initializeApp(FIREBASE_CONFIG);
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} else {
  const { getAuth } = require('firebase/auth');
  auth = getAuth();
}

export default function LoginScreen() {
  const setUser = useAuthStore((s) => s.setUser);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);
  const [devOtp, setDevOtp] = useState('');

  const handleSendOTP = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      return Alert.alert('Error', 'Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneNumber: trimmed });
      setDevOtp(res.data.devOtp || '');
      setStep('otp');
      if (res.data.devOtp) Alert.alert('Dev OTP', res.data.devOtp);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) return Alert.alert('Error', 'Enter the 6-digit OTP');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', {
        phoneNumber: phone.trim(),
        otp: otp.trim(),
      });

      const { customToken, user } = res.data;
      await signInWithCustomToken(auth, customToken);
      setUser(user);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.box}>
        <Text style={styles.title}>WhatApp Clone</Text>
        <Text style={styles.subtitle}>Sign in with your phone number</Text>

        {step === 'phone' ? (
          <>
            <TextInput
              style={styles.input}
              placeholder="+91XXXXXXXXXX"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send OTP</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.info}>OTP sent to {phone}</Text>
            <TextInput
              style={styles.input}
              placeholder="6-digit OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify OTP</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.link}>Change phone number</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f5f5f5' },
  box: { margin: 24, padding: 24, backgroundColor: '#fff', borderRadius: 12, elevation: 3 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#25D366', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 24 },
  info: { fontSize: 13, color: '#444', marginBottom: 12 },
  input: {
    borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
    padding: 12, fontSize: 16, marginBottom: 12,
  },
  btn: {
    backgroundColor: '#25D366', padding: 14, borderRadius: 8,
    alignItems: 'center', marginBottom: 12,
  },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  link: { color: '#25D366', textAlign: 'center', fontSize: 14 },
});
