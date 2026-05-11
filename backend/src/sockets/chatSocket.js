const prisma = require('../config/db');
const { sendPushNotification } = require('../services/notificationService');

const SNAP_TTL_MS = 24 * 60 * 60 * 1000;
const toBoolean = (value) => value === true || value === 'true' || value === '1';

// userId -> socketId
const onlineUsers = new Map();

const chatSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_chats', ({ userId, chatIds }) => {
      if (userId) {
        onlineUsers.set(userId, socket.id);
        socket.userId = userId;
      }
      if (Array.isArray(chatIds)) {
        chatIds.forEach((id) => socket.join(id));
        console.log(`User ${userId} joined rooms:`, chatIds);
      }
    });

    socket.on('send_message', async ({ chatId, senderId, content, mediaUrl, mediaType, isSnap }) => {
      try {
        if (!chatId || !senderId || (!content && !mediaUrl)) return;
        const shouldExpire = toBoolean(isSnap);

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId,
            content: content || null,
            mediaUrl: mediaUrl || null,
            mediaType: mediaType || null,
            isSnap: shouldExpire,
            expiresAt: shouldExpire ? new Date(Date.now() + SNAP_TTL_MS) : null,
          },
          include: { sender: true },
        });

        // Emit immediately after DB write — don't block on secondary updates
        io.to(chatId).emit('receive_message', message);

        // Run chat timestamp update and push notifications in background
        prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } }).catch(console.error);

        prisma.chatParticipant.findMany({
          where: { chatId, NOT: { userId: senderId } },
          include: { user: true },
        }).then(async (participants) => {
          for (const { user } of participants) {
            if (!onlineUsers.has(user.id) && user.fcmToken) {
              await sendPushNotification({
                token: user.fcmToken,
                title: message.sender.displayName || 'New Message',
                body: content || 'Media',
                data: { chatId },
              });
            }
          }
        }).catch(console.error);

      } catch (error) {
        console.error('send_message socket error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('typing', { chatId, userId });
    });

    socket.on('stop_typing', ({ chatId, userId }) => {
      socket.to(chatId).emit('stop_typing', { chatId, userId });
    });

    socket.on('disconnect', () => {
      if (socket.userId) onlineUsers.delete(socket.userId);
      console.log('Socket disconnected:', socket.id);
    });
  });
};

module.exports = chatSocket;
