const prisma = require('../config/db');

const getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(chats);
  } catch (error) {
    console.error('getChats error:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

const createChat = async (req, res) => {
  try {
    const { participantIds, participantPhones, isGroup, chatName } = req.body;

    let resolvedIds = participantIds || [];

    // Resolve phones to user IDs
    if (participantPhones?.length) {
      const users = await prisma.user.findMany({
        where: { phone: { in: participantPhones } },
        select: { id: true },
      });
      if (users.length === 0) return res.status(404).json({ error: 'No users found with those phone numbers' });
      resolvedIds = [...resolvedIds, ...users.map((u) => u.id)];
    }

    if (!resolvedIds.length) {
      return res.status(400).json({ error: 'participantIds or participantPhones required' });
    }

    const allIds = [...new Set([req.user.id, ...resolvedIds])];

    if (!isGroup && allIds.length === 2) {
      const existing = await prisma.chat.findFirst({
        where: {
          isGroup: false,
          AND: allIds.map((userId) => ({
            participants: { some: { userId } },
          })),
        },
        include: {
          participants: { include: { user: true } },
          messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
        },
      });
      if (existing && existing.participants.length === 2) return res.json(existing);
    }

    const chat = await prisma.chat.create({
      data: {
        isGroup: Boolean(isGroup),
        name: isGroup ? chatName : null,
        participants: {
          create: allIds.map((userId) => ({
            userId,
            role: userId === req.user.id ? 'admin' : 'member',
          })),
        },
      },
      include: {
        participants: { include: { user: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
      },
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('createChat error:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await prisma.chat.findFirst({
      where: {
        id: req.params.id,
        participants: { some: { userId: req.user.id } },
      },
      include: { participants: { include: { user: true } } },
    });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch chat' });
  }
};

module.exports = { getChats, createChat, getChatById };
