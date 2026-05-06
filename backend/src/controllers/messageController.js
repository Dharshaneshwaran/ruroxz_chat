const prisma = require('../config/db');

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { cursor, limit = '50' } = req.query;

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const messages = await prisma.message.findMany({
      where: { chatId },
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
    const mediaUrl = req.file?.path || null;
    const mediaType = req.file ? req.file.mimetype.split('/')[0] : null;

    if (!content && !mediaUrl) {
      return res.status(400).json({ error: 'content or media required' });
    }

    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    const message = await prisma.message.create({
      data: { chatId, senderId: req.user.id, content, mediaUrl, mediaType },
      include: { sender: true },
    });

    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });

    res.status(201).json(message);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

module.exports = { getMessages, sendMessage };
