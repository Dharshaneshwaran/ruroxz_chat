import { useEffect } from 'react';
import socket from '../services/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';

export const useSocket = (chatIds = []) => {
  const user = useAuthStore((s) => s.user);
  const { addMessage, updateChatLastMessage, setTyping, clearTyping } = useChatStore();

  useEffect(() => {
    if (!user) return;

    socket.connect();
    if (chatIds.length) {
      socket.emit('join_chats', { userId: user.id, chatIds });
    }

    const onMessage = (message) => {
      addMessage(message.chatId, message);
      updateChatLastMessage(message.chatId, message);
    };

    const onTyping = ({ chatId, userId }) => {
      if (userId !== user.id) setTyping(chatId, userId);
    };

    const onStopTyping = ({ chatId, userId }) => {
      clearTyping(chatId, userId);
    };

    socket.on('receive_message', onMessage);
    socket.on('typing', onTyping);
    socket.on('stop_typing', onStopTyping);

    return () => {
      socket.off('receive_message', onMessage);
      socket.off('typing', onTyping);
      socket.off('stop_typing', onStopTyping);
    };
  }, [user?.id, chatIds.join(',')]);
};
