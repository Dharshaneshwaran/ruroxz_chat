require('dotenv').config();
const axios = require('axios');
const admin = require('../config/firebase');
const prisma = require('../config/db');

// identifier (email or phone) -> { otp, expiry }
const otpStore = new Map();

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

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
    const identifier = (email || phoneNumber || '').trim();
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
    const identifier = (email || phoneNumber || '').trim();
    if (!identifier || !otp) {
      return res.status(400).json({ error: 'identifier and otp required' });
    }

    const stored = otpStore.get(identifier);
    if (!stored || stored.otp !== String(otp).trim() || Date.now() > stored.expiry) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }
    otpStore.delete(identifier);

    // Find or create user
    let user = email
      ? await prisma.user.findUnique({ where: { email: email.trim() } })
      : await prisma.user.findUnique({ where: { phone: phoneNumber.trim() } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          ...(email && { email: email.trim() }),
          ...(phoneNumber && { phone: phoneNumber.trim() }),
          displayName: displayName || email || phoneNumber,
          fcmToken,
        },
      });
    } else if (fcmToken) {
      user = await prisma.user.update({ where: { id: user.id }, data: { fcmToken } });
    }

    const customToken = await admin.auth().createCustomToken(user.id);
    res.json({ customToken, user });
  } catch (error) {
    console.error('verifyOTP error:', error);
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

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};

module.exports = { sendOTP, verifyOTP, firebaseLogin, getMe, updateFcmToken };
