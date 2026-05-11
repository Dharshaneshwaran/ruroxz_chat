import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView,
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

  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setPhone('');
    setDisplayName('');
    setOtp('');
    setStep('phone');
  };

  const switchTab = (t) => {
    setTab(t);
    resetForm();
  };

  const handleSendOTP = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 8) {
      return Alert.alert('Error', 'Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
    }
    if (tab === 'signup' && !displayName.trim()) {
      return Alert.alert('Error', 'Enter your display name');
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/send-otp', { phoneNumber: trimmed });
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
      const payload = {
        phoneNumber: phone.trim(),
        otp: otp.trim(),
      };
      if (tab === 'signup' && displayName.trim()) {
        payload.displayName = displayName.trim();
      }
      const res = await api.post('/auth/verify-otp', payload);
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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.box}>
          {/* Logo */}
          <View style={styles.logoCircle}>
            <Text style={styles.logoEmoji}>💬</Text>
          </View>

          <Text style={styles.title}>RuroxZ Chat</Text>
          <Text style={styles.tagline}>Connect with anyone, anywhere</Text>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, tab === 'signin' && styles.tabActive]}
              onPress={() => switchTab('signin')}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'signup' && styles.tabActive]}
              onPress={() => switchTab('signup')}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Step: phone (+ name for signup) */}
          {step === 'phone' && (
            <>
              {tab === 'signup' && (
                <>
                  <Text style={styles.label}>Display name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                  />
                </>
              )}
              <Text style={styles.label}>Phone number</Text>
              <TextInput
                style={styles.input}
                placeholder="+91XXXXXXXXXX"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoFocus={tab === 'signin'}
              />
              <TouchableOpacity style={styles.btn} onPress={handleSendOTP} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>
                      {tab === 'signup' ? 'Create Account' : 'Sign In'}
                    </Text>
                }
              </TouchableOpacity>
              {tab === 'signin' ? (
                <TouchableOpacity onPress={() => switchTab('signup')}>
                  <Text style={styles.switchHint}>
                    Don't have an account? <Text style={styles.switchLink}>Sign Up</Text>
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => switchTab('signin')}>
                  <Text style={styles.switchHint}>
                    Already have an account? <Text style={styles.switchLink}>Sign In</Text>
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Step: OTP */}
          {step === 'otp' && (
            <>
              <Text style={styles.info}>OTP sent to {phone}</Text>
              <Text style={styles.label}>6-digit OTP</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="123456"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
              />
              <TouchableOpacity style={styles.btn} onPress={handleVerifyOTP} disabled={loading}>
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>
                      {tab === 'signup' ? 'Confirm & Create Account' : 'Verify & Sign In'}
                    </Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { setStep('phone'); setOtp(''); }}>
                <Text style={styles.link}>← Change phone number</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#128C7E' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  box: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logoCircle: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: '#25D366',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  logoEmoji: { fontSize: 28 },
  title: {
    fontSize: 26, fontWeight: '800', color: '#25D366',
    textAlign: 'center', marginBottom: 4,
  },
  tagline: {
    fontSize: 13, color: '#aaa', textAlign: 'center', marginBottom: 24,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f4',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  tab: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: '#888' },
  tabTextActive: { color: '#25D366' },
  label: { fontSize: 13, color: '#555', fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1.5, borderColor: '#e0e0e0', borderRadius: 10,
    padding: 13, fontSize: 15, marginBottom: 14,
  },
  otpInput: {
    letterSpacing: 10, fontSize: 22, textAlign: 'center',
  },
  btn: {
    backgroundColor: '#25D366',
    padding: 15, borderRadius: 10,
    alignItems: 'center', marginBottom: 14,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  info: { fontSize: 13, color: '#444', marginBottom: 12 },
  link: { color: '#25D366', textAlign: 'center', fontSize: 14, marginTop: 4 },
  switchHint: { fontSize: 13, color: '#888', textAlign: 'center', marginTop: 4 },
  switchLink: { color: '#25D366', fontWeight: '600' },
});
