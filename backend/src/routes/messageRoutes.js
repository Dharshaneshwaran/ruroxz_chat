const router = require('express').Router({ mergeParams: true });
const { getMessages, sendMessage, deleteMessage } = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');
const { upload } = require('../config/r2');

router.use(authMiddleware);
router.get('/', getMessages);
router.post('/', (req, res, next) => {
  upload.single('media')(req, res, (err) => {
    if (err?.message === 'STORAGE_LIMIT_EXCEEDED') {
      return res.status(507).json({ error: 'Storage limit reached (8 GB). Media uploads are currently disabled.' });
    }
    if (err?.message === 'INVALID_FILE_TYPE') {
      return res.status(415).json({ error: 'File type not allowed. Use jpg, png, gif, webp, mp4, or pdf.' });
    }
    if (err?.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 100 MB.' });
    }
    if (err) return next(err);
    next();
  });
}, sendMessage);
router.delete('/:messageId', deleteMessage);

module.exports = router;
