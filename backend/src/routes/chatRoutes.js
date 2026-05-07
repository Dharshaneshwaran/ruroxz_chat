const router = require('express').Router();
const { getChats, createChat, getChatById, deleteChat } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.get('/', getChats);
router.post('/', createChat);
router.get('/:id', getChatById);
router.delete('/:id', deleteChat);

module.exports = router;
