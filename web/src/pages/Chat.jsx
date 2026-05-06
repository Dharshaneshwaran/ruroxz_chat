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
    // Emit join for this specific chat (redundant but ensures room membership)
    socket.emit('join_chats', { userId: user?.id, chatIds: [chatId] });
  }, [chatId]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
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
        // Message will come back via socket (receive_message)
        await api.post(`/chats/${chatId}/messages`, fd);
      } else if (content?.trim()) {
        // Send via socket — comes back via receive_message (deduped in store)
        socket.emit('send_message', { chatId, senderId: user?.id, content: content.trim() });
      }
    } catch (err) {
      console.error('handleSend:', err);
    }
  }, [chatId, user?.id]);

  // Group messages by date label
  const grouped = groupByDate(chatMessages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#202c33', flexShrink: 0, minHeight: 60 }}>
        <div style={avatar(49, chat?.isGroup ? '#667781' : '#00a884')}>
          {(chatName || 'C').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: '#e9edef', fontWeight: 600, fontSize: 17 }}>{chatName}</div>
          <div style={{ color: isTyping ? '#00a884' : '#8696a0', fontSize: 13, minHeight: 18 }}>
            {isTyping ? 'typing…' : chat?.isGroup ? `${memberCount} members` : ''}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="icon-btn" title="Video call">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#aebac1">
              <path d="M15 8v8H5V8h10m1-2H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4V7c0-.55-.45-1-1-1z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Voice call">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#aebac1">
              <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z"/>
            </svg>
          </button>
          <button className="icon-btn" title="Search">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#aebac1">
              <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.185 5.185 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── Messages ── */}
      <div ref={containerRef} className="chat-bg" style={{ flex: 1, overflowY: 'auto', padding: '12px 5%' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <div style={{ width: 32, height: 32, border: '3px solid #2a3942', borderTop: '3px solid #00a884', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : chatMessages.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <span style={{ background: '#182229', color: '#8696a0', fontSize: 12.5, padding: '6px 18px', borderRadius: 14 }}>
              🔒 Messages are end-to-end encrypted. Say hello to {chatName}!
            </span>
          </div>
        ) : (
          grouped.map(({ label, msgs }) => (
            <div key={label}>
              <DateLabel label={label} />
              {msgs.map((msg) => (
                <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === user?.id}
                  participants={chat?.participants} />
              ))}
            </div>
          ))
        )}
        <div ref={bottomRef} style={{ height: 8 }} />
      </div>

      {/* ── Input ── */}
      <ChatInput chatId={chatId} userId={user?.id} onSend={handleSend} />
    </div>
  );
}

function DateLabel({ label }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
      <span style={{ background: '#182229', color: '#8696a0', fontSize: 12, padding: '4px 16px', borderRadius: 12 }}>{label}</span>
    </div>
  );
}

function groupByDate(messages) {
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const yStr = yesterday.toDateString();

  return messages.reduce((acc, msg) => {
    const d = new Date(msg.createdAt);
    const ds = d.toDateString();
    const label = ds === today ? 'Today'
      : ds === yStr ? 'Yesterday'
      : d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

    if (!acc.length || acc[acc.length - 1].label !== label) acc.push({ label, msgs: [] });
    acc[acc.length - 1].msgs.push(msg);
    return acc;
  }, []);
}

const avatar = (size, bg) => ({
  width: size, height: size, borderRadius: '50%', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontWeight: 700, fontSize: size * 0.38, flexShrink: 0,
});
