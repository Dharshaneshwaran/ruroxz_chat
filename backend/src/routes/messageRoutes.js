const router = require('express').Router({ mergeParams: true });
const { getMessages, sendMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../config/cloudinary');

router.use(authMiddleware);
router.get('/', getMessages);
router.post('/', upload.single('media'), sendMessage);

module.exports = router;
