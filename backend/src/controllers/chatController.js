const prisma = require('../config/db');

const activeMessageWhere = () => ({
  OR: [
    { expiresAt: null },
    { expiresAt: { gt: new Date() } },
  ],
});

const getChats = async (req, res) => {
  try {
    const chats = await prisma.chat.findMany({
      where: { participants: { some: { userId: req.user.id } } },
      include: {
        participants: { include: { user: true } },
        messages: {
          where: activeMessageWhere(),
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
    const contacts = participantPhones?.map((c) => c.trim()).filter(Boolean) || [];

    if (contacts.length) {
      const phoneContacts = contacts.filter((c) => !c.includes('@'));
      const emailContacts = contacts.filter((c) => c.includes('@')).map((c) => c.toLowerCase());

      const users = await prisma.user.findMany({
        where: {
          OR: [
            ...(phoneContacts.length ? [{ phone: { in: phoneContacts } }] : []),
            ...(emailContacts.length ? [{ email: { in: emailContacts } }] : []),
            ...(contacts.length ? [{ id: { in: contacts } }] : []),
          ],
        },
        select: { id: true },
      });
      if (users.length === 0) return res.status(404).json({ error: 'No users found with those contacts' });
      resolvedIds = [...resolvedIds, ...users.map((u) => u.id)];
    }

    if (!resolvedIds.length) {
      return res.status(400).json({ error: 'participantIds or participantPhones required' });
    }

    const allIds = [...new Set([req.user.id, ...resolvedIds])];

    if (!isGroup) {
      if (allIds.length === 1) {
        const existing = await prisma.chat.findFirst({
          where: {
            isGroup: false,
            participants: { every: { userId: req.user.id } },
          },
          include: {
            participants: { include: { user: true } },
            messages: { where: activeMessageWhere(), orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
          },
        });
        if (existing) return res.json(existing);
      } else if (allIds.length === 2) {
        const existing = await prisma.chat.findFirst({
          where: {
            isGroup: false,
            AND: allIds.map((userId) => ({
              participants: { some: { userId } },
            })),
          },
          include: {
            participants: { include: { user: true } },
            messages: { where: activeMessageWhere(), orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
          },
        });
        if (existing && existing.participants.length === 2) return res.json(existing);
      }
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
        messages: { where: activeMessageWhere(), orderBy: { createdAt: 'desc' }, take: 1, include: { sender: true } },
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

const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is a participant
    const participant = await prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId: id, userId: req.user.id } },
    });
    if (!participant) return res.status(403).json({ error: 'Not a participant' });

    // For group chats, only admins can delete
    const chat = await prisma.chat.findUnique({ where: { id } });
    if (chat.isGroup && participant.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete group chats' });
    }

    // Delete all messages first (cascade should handle this, but being explicit)
    await prisma.message.deleteMany({ where: { chatId: id } });

    // Delete chat participants
    await prisma.chatParticipant.deleteMany({ where: { chatId: id } });

    // Delete the chat
    await prisma.chat.delete({ where: { id } });

    res.json({ success: true });
  } catch (error) {
    console.error('deleteChat error:', error);
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

module.exports = { getChats, createChat, getChatById, deleteChat };
