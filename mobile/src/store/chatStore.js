import { create } from 'zustand';

export const useChatStore = create((set) => ({
  chats: [],
  messages: {},
  setChats: (chats) => set({ chats }),
  addChat: (chat) => set((s) => ({ chats: [chat, ...s.chats.filter((c) => c.id !== chat.id)] })),
  updateChat: (chat) =>
    set((s) => ({ chats: s.chats.map((c) => (c.id === chat.id ? chat : c)) })),
  setMessages: (chatId, messages) =>
    set((s) => ({ messages: { ...s.messages, [chatId]: messages } })),
  addMessage: (chatId, message) =>
    set((s) => ({
      messages: { ...s.messages, [chatId]: [...(s.messages[chatId] || []), message] },
    })),
}));
