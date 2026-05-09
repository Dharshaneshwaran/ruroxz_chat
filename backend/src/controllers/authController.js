require('dotenv').config();
const jwt = require('jsonwebtoken');
const axios = require('axios');
const admin = require('../config/firebase');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'ruroxz-chat-secret';

// identifier (email or phone) -> { otp, expiry }
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const normalizeIdentifier = (email, phoneNumber) => {
  if (email && String(email).trim()) return String(email).trim().toLowerCase();
  if (phoneNumber && String(phoneNumber).trim()) return String(phoneNumber).trim().replace(/\s+/g, '');
  return '';
};

const sendEmailOTP = async (email, otp) => {
  await axios.post(
    'https://api.brevo.com/v3/smtp/email',
    {
      sender: {
        name: process.env.BREVO_SENDER_NAME || 'WhatApp Clone',
        email: process.env.BREVO_SENDER_EMAIL,
      },
      to: [{ email }],
      subject: 'Your WhatApp Clone OTP',
      htmlContent: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px">
          <h2 style="color:#25D366">WhatApp Clone</h2>
          <p style="font-size:16px">Your one-time password is:</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#25D366;margin:24px 0">${otp}</div>
          <p style="color:#888;font-size:13px">This OTP expires in 5 minutes. Do not share it with anyone.</p>
        </div>
      `,
    },
    {
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    }
  );
};

const sendOTP = async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;
    const identifier = normalizeIdentifier(email, phoneNumber);
    if (!identifier) return res.status(400).json({ error: 'email or phoneNumber required' });

    const otp = generateOTP();
    otpStore.set(identifier, { otp, expiry: Date.now() + 5 * 60 * 1000 });

    if (email) {
      await sendEmailOTP(email.trim(), otp);
      console.log(`[OTP] Sent to email: ${email}`);
      return res.json({ message: 'OTP sent to your email' });
    }

    // Phone fallback — log in dev
    console.log(`[OTP] ${phoneNumber} -> ${otp}`);
    const response = { message: 'OTP sent' };
    if (process.env.NODE_ENV !== 'production') response.devOtp = otp;
    res.json(response);
  } catch (error) {
    console.error('sendOTP error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
};

const verifyOTP = async (req, res) => {
  try {
    const { email, phoneNumber, otp, displayName, fcmToken } = req.body;
    const identifier = normalizeIdentifier(email, phoneNumber);
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'identifier and otp required' });
    }

    const stored = otpStore.get(identifier);
    console.log(`[OTP Verify] ID: ${identifier}, Stored: ${stored?.otp}, Received: ${otp}`);

    if (!stored || stored.otp !== String(otp).trim() || Date.now() > stored.expiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    otpStore.delete(identifier);

    // Find or create user
    let user = email
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { phone: identifier } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...(email && { email: identifier }),
          ...(phoneNumber && { phone: identifier }),
          displayName: displayName || email || phoneNumber,
          fcmToken,
        },
      });
    } else if (fcmToken) {
      user = await prisma.user.update({ where: { id: user.id }, data: { fcmToken } });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const customToken = await admin.auth().createCustomToken(user.id);
    res.json({ token, customToken, user });
  } catch (error) {
    console.error('verifyOTP error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Direct email login - no OTP needed
const emailLogin = async (req, res) => {
  try {
    const { email, displayName } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: trimmedEmail,
          displayName: displayName || trimmedEmail.split('@')[0],
        },
      });
    } else if (displayName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { displayName },
      });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    const customToken = await admin.auth().createCustomToken(user.id);
    res.json({ token, customToken, user });
  } catch (error) {
    console.error('emailLogin error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Web: verify Firebase ID token from Firebase Phone Auth (kept for mobile if needed)
const firebaseLogin = async (req, res) => {
  try {
    const { idToken, fcmToken, displayName } = req.body;
    if (!idToken) return res.status(400).json({ error: 'idToken required' });

    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, phone_number, email } = decoded;

    let user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: uid,
          phone: phone_number || null,
          email: email || null,
          displayName: displayName || phone_number || email || 'User',
          fcmToken,
        },
      });
    } else if (fcmToken || displayName) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { ...(fcmToken && { fcmToken }), ...(displayName && { displayName }) },
      });
    }

    res.json({ user });
  } catch (error) {
    console.error('firebaseLogin error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

const getMe = async (req, res) => res.json(req.user);

const lookupUserByPhone = async (req, res) => {
  try {
    const phone = String(req.query.phone || req.body.phoneNumber || '')
      .trim()
      .replace(/\s+/g, '');

    if (!phone) return res.status(400).json({ error: 'phone required' });

    const user = await prisma.user.findUnique({
      where: { phone },
      select: {
        id: true,
        phone: true,
        email: true,
        displayName: true,
        photoUrl: true,
      },
    });

    if (!user) return res.status(404).json({ error: 'No user found with this phone number' });

    res.json({
      user,
      isSelf: user.id === req.user.id,
    });
  } catch (error) {
    console.error('lookupUserByPhone error:', error);
    res.status(500).json({ error: 'Failed to lookup user' });
  }
};

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { displayName, phoneNumber } = req.body;
    const userId = req.user.id;

    const data = {};
    if (displayName !== undefined) data.displayName = displayName;
    if (phoneNumber !== undefined) data.phone = phoneNumber.trim().replace(/\s+/g, '');

    const user = await prisma.user.update({
      where: { id: userId },
      data,
    });

    res.json(user);
  } catch (error) {
    console.error('updateProfile error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Phone number already in use' });
    }
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = { sendOTP, verifyOTP, emailLogin, firebaseLogin, getMe, lookupUserByPhone, updateFcmToken, updateProfile };


