require('dotenv').config();
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const prisma = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'rurozx-chat-secret';

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

const updateFcmToken = async (req, res) => {
  try {
    const { fcmToken } = req.body;
    const user = await prisma.user.update({ where: { id: req.user.id }, data: { fcmToken } });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update FCM token' });
  }
};

module.exports = { emailLogin, firebaseLogin, getMe, updateFcmToken };
