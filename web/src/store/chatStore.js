import { create } from 'zustand';

export const useChatStore = create((set, get) => ({
  chats: [],
  messages: {},   // chatId -> Message[]
  typing: {},     // chatId -> userId[]

  setChats: (chats) => set({ chats }),

  addChat: (chat) =>
    set((s) => ({ chats: [chat, ...s.chats.filter((c) => c.id !== chat.id)] })),

  // Add message — deduplicates by id; when a real message arrives, drops matching temp entries
  addMessage: (chatId, message) =>
    set((s) => {
      const existing = s.messages[chatId] || [];
      if (existing.some((m) => m.id === message.id)) return s;
      const isReal = !message.id.startsWith('temp-');
      const filtered = isReal
        ? existing.filter((m) => !(m.id.startsWith('temp-') && m.senderId === message.senderId && m.content === message.content))
        : existing;
      return { messages: { ...s.messages, [chatId]: [...filtered, message] } };
    }),

  setMessages: (chatId, messages) =>
    set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),

  // Update last message preview in chat list and move chat to top
  updateChatLastMessage: (chatId, message) =>
    set((s) => {
      const chat = s.chats.find((c) => c.id === chatId);
      if (!chat) return s;
      const updated = { ...chat, messages: [message], updatedAt: message.createdAt };
      return { chats: [updated, ...s.chats.filter((c) => c.id !== chatId)] };
    }),

  setTyping: (chatId, userId) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [chatId]: [...new Set([...(s.typing[chatId] || []), userId])],
      },
    })),

  clearTyping: (chatId, userId) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [chatId]: (s.typing[chatId] || []).filter((id) => id !== userId),
      },
    })),

  reset: () => set({ chats: [], messages: {}, typing: {} }),
}));
