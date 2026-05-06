import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import api from '../services/api';
import socket from '../services/socket';
import MessageBubble from '../components/MessageBubble';
import ChatInput from '../components/ChatInput';

export default function Chat() {
  const { chatId } = useParams();
  const user = useAuthStore((s) => s.user);
  const { messages, setMessages, chats, typing } = useChatStore();
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef(null);
  const containerRef = useRef(null);

  const chatMessages = messages[chatId] || [];
  const chat = chats.find((c) => c.id === chatId);
  const other = chat?.participants?.find((p) => p.userId !== user?.id);
  const chatName = chat?.isGroup
    ? chat.name
    : other?.user?.displayName || other?.user?.email || other?.user?.phone || 'Chat';
  const memberCount = chat?.participants?.length;
  const typingUsers = typing[chatId] || [];
  const isTyping = typingUsers.length > 0;

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    socket.emit('join_chats', { userId: user?.id, chatIds: [chatId] });
  }, [chatId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      setMessages(chatId, res.data);
    } catch (err) {
      console.error('fetchMessages:', err);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  };

  const handleSend = useCallback(async ({ content, file }) => {
    try {
      if (file) {
        const fd = new FormData();
        fd.append('media', file);
        if (content) fd.append('content', content);
        await api.post(`/chats/${chatId}/messages`, fd);
      } else if (content?.trim()) {
        socket.emit('send_message', { chatId, senderId: user?.id, content: content.trim() });
      }
    } catch (err) {
      console.error('handleSend:', err);
    }
  }, [chatId, user?.id]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chats/${chatId}/messages/${messageId}`);
      // Remove message from local state
      const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
      setMessages(chatId, updatedMessages);
    } catch (err) {
      console.error('handleDeleteMessage:', err);
      alert('Failed to delete message');
    }
  };

  const grouped = groupByDate(chatMessages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#111b21' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#202c33', flexShrink: 0, minHeight: 60 }}>
        <div style={avatar(49, chat?.isGroup ? '#667781' : '#6D28D9')}>
          {(chatName || 'C').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e9edef', fontWeight: 600, fontSize: 17 }}>{chatName}</div>
          <div style={{ color: isTyping ? '#6D28D9' : '#8696a0', fontSize: 13, minHeight: 18 }}>
            {isTyping ? 'typing…' : chat?.isGroup ? `${memberCount} members` : ''}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={containerRef} style={{ flex: 1, overflowY: 'auto', padding: '12px 5%', background: '#0a0e11' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #2a3942', borderTop: '3px solid #6D28D9', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <span style={{ background: '#182229', color: '#8696a0', fontSize: 12.5, padding: '6px 18px', borderRadius: 14 }}>
              🔒 Start chatting with {chatName}
            </span>
          </div>
        ) : (
          grouped.map(({ label, msgs }) => (
            <div key={label}>
              <DateLabel label={label} />
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === user?.id}
                  participants={chat?.participants}
                  onDelete={handleDeleteMessage}
                />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* Input */}
      <ChatInput chatId={chatId} userId={user?.id} onSend={handleSend} />
    </div>
  );
}

function DateLabel({ label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      <span style={{ background: '#182229', color: '#8696a0', fontSize: 12, padding: '4px 16px', borderRadius: 12 }}>
        {label}
      </span>
    </div>
  );
}

function groupByDate(messages) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const yStr = yesterday.toDateString();

  return messages.reduce((acc, msg) => {
    const d = new Date(msg.createdAt);
    const ds = d.toDateString();
    const label =
      ds === today
        ? 'Today'
        : ds === yStr
        ? 'Yesterday'
        : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!acc.length || acc[acc.length - 1].label !== label) acc.push({ label, msgs: [] });
    acc[acc.length - 1].msgs.push(msg);
    return acc;
  }, []);
}

const avatar = (size, bg) => ({
  width: size,
  height: size,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 700,
  fontSize: size * 0.38,
  flexShrink: 0,
});
