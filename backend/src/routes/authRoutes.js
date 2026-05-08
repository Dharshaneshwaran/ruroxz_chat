const router = require('express').Router();
const { sendOTP, verifyOTP, emailLogin, firebaseLogin, getMe, updateFcmToken, updateProfile } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/email-login', emailLogin);
router.post('/firebase-login', firebaseLogin);
router.get('/me', authMiddleware, getMe);
router.put('/fcm-token', authMiddleware, updateFcmToken);
router.put('/profile', authMiddleware, updateProfile);

module.exports = router;


