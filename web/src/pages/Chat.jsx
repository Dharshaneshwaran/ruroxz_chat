import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const { messages, setMessages, addMessage, updateChatLastMessage, chats, typing } = useChatStore();
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

  const fetchMessages = useCallback(async () => {
    try {
      const res = await api.get(`/chats/${chatId}/messages`);
      setMessages(chatId, res.data);
    } catch (err) {
      console.error('fetchMessages:', err);
    } finally {
      setLoading(false);
      setTimeout(() => bottomRef.current?.scrollIntoView(), 50);
    }
  }, [chatId, setMessages]);

  useEffect(() => {
    setLoading(true);
    fetchMessages();
    socket.emit('join_chats', { userId: user?.id, chatIds: [chatId] });
  }, [chatId, fetchMessages, user?.id]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
    if (isNearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = useCallback(async ({ content, file, isSnap }) => {
    try {
      if (file) {
        const fd = new FormData();
        fd.append('media', file);
        fd.append('isSnap', String(Boolean(isSnap)));
        if (content) fd.append('content', content);
        const res = await api.post(`/chats/${chatId}/messages`, fd);
        addMessage(chatId, res.data);
        updateChatLastMessage(chatId, res.data);
      } else if (content?.trim()) {
        socket.emit('send_message', { chatId, senderId: user?.id, content: content.trim(), isSnap: Boolean(isSnap) });
      }
    } catch (err) {
      console.error('handleSend:', err);
    }
  }, [addMessage, chatId, updateChatLastMessage, user?.id]);

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.delete(`/chats/${chatId}/messages/${messageId}`);
      setMessages(chatId, chatMessages.filter((msg) => msg.id !== messageId));
    } catch (err) {
      console.error('handleDeleteMessage:', err);
      alert('Failed to delete message');
    }
  };

  const grouped = groupByDate(chatMessages);
  const initials = (chatName || 'C').charAt(0).toUpperCase();

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className={`wa-avatar large ${chat?.isGroup ? 'group' : ''}`}>{initials}</div>
        <div className="chat-header-main">
          <div className="chat-header-name">{chatName}</div>
          <div className="chat-header-sub">
            {isTyping ? 'typing...' : chat?.isGroup ? `${memberCount} members` : ''}
          </div>
        </div>
        <button className="wa-icon-btn" title="Search">
          <SearchIcon />
        </button>
        <button className="wa-icon-btn" title="Menu">
          <MoreIcon />
        </button>
      </div>

      <div ref={containerRef} className="chat-bg">
        {loading ? (
          <div className="loading-state"><div className="spinner" /></div>
        ) : chatMessages.length === 0 ? (
          <div className="date-label">
            <span>Start chatting with {chatName}</span>
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

      <ChatInput chatId={chatId} userId={user?.id} onSend={handleSend} />
    </div>
  );
}

function DateLabel({ label }) {
  return (
    <div className="date-label">
      <span>{label}</span>
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

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.8-3.8" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}
