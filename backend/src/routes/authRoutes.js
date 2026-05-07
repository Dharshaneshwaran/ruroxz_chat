const router = require('express').Router();
const { emailLogin, firebaseLogin, getMe, updateFcmToken } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/email-login', emailLogin);
router.post('/firebase-login', firebaseLogin);
router.get('/me', authMiddleware, getMe);
router.put('/fcm-token', authMiddleware, updateFcmToken);

module.exports = router;
