const prisma = require('../config/db');
const { addBytes } = require('../services/storageTracker');
const socketService = require('../services/socketService');

const SNAP_TTL_MS = 24 * 60 * 60 * 1000;

const toBoolean = (value) => value === true || value === 'true' || value === '1';
const getSnapExpiry = () => new Date(Date.now() + SNAP_TTL_MS);

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = '50' } = req.query;

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const messages = await prisma.message.findMany({
      where: {
        chatId,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { sender: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    res.json(messages.reverse());
  } catch (error) {
    console.error('getMessages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const isSnap = toBoolean(req.body.isSnap);
    const mediaUrl = req.file
      ? `${process.env.R2_PUBLIC_URL}/${req.file.key}`
      : null;
    const mediaType = req.file ? req.file.mimetype.split('/')[0] : null;

    if (req.file?.size) {
      addBytes(req.file.size).catch((err) => console.error('[Storage] addBytes failed:', err.message));
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({ error: 'content or media required' });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: req.user.id,
        content,
        mediaUrl,
        mediaType,
        isSnap,
        expiresAt: isSnap ? getSnapExpiry() : null,
      },
      include: { sender: true },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

    const io = socketService.getIO();
    if (io) io.to(chatId).emit('receive_message', message);

    res.status(201).json(message);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { chatId, messageId } = req.params;

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) return res.status(404).json({ error: 'Message not found' });

    // Only allow sender to delete their own messages
    if (message.senderId !== req.user.id) {
      return res.status(403).json({ error: 'Can only delete your own messages' });
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('deleteMessage error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

module.exports = { getMessages, sendMessage, deleteMessage };
