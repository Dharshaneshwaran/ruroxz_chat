const router = require('express').Router();
const { getChats, createChat, getChatById } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/', getChats);
router.post('/', createChat);
router.get('/:id', getChatById);

module.exports = router;
