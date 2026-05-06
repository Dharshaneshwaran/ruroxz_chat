const router = require('express').Router();
const { sendOTP, verifyOTP, firebaseLogin, getMe, updateFcmToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/firebase-login', firebaseLogin);
router.get('/me', authMiddleware, getMe);
router.put('/fcm-token', authMiddleware, updateFcmToken);

module.exports = router;
