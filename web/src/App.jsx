import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useChatStore } from './store/chatStore';
import { useSocket } from './hooks/useSocket';
import { requestNotificationPermission } from './services/notification';
import socket from './services/socket';
import api from './services/api';
import Login from './pages/Login';
import Chat from './pages/Chat';
import ChatItem from './components/ChatItem';
import './styles/bubbles.css';

/* ─── New Conversation Modal ─── */
/* ─── Settings / Profile Modal ─── */
function SettingsModal({ onClose }) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ text: '', type: '' });
    try {
      const res = await api.put('/auth/profile', { displayName: name, phoneNumber: phone });
      setUser(res.data);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
      setTimeout(onClose, 1500);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#233138', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#e9edef', fontWeight: 600, fontSize: 18 }}>Profile Settings</h3>
          <button onClick={onClose} className="icon-btn">✕</button>
        </div>
        
        {msg.text && (
          <p style={{ color: msg.type === 'error' ? '#ff6b6b' : '#25D366', fontSize: 13, marginBottom: 12 }}>{msg.text}</p>
        )}

        <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ color: '#8696a0', fontSize: 13, display: 'block', marginBottom: 6 }}>Display Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" style={mStyle.input} />
          </div>
          <div>
            <label style={{ color: '#8696a0', fontSize: 13, display: 'block', marginBottom: 6 }}>Phone Number</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" style={mStyle.input} />
          </div>
          <button type="submit" disabled={loading} style={mStyle.btn}>{loading ? 'Saving…' : 'Save Changes'}</button>
        </form>
      </div>
    </div>
  );
}

function NewChatModal({ onClose, onCreated }) {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('direct');
  const [input, setInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const startDirect = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setErr('');
    try {
      const res = await api.post('/chats', { participantPhones: [input.trim()], isGroup: false });
      onCreated(res.data);
    } catch (e) { setErr(e.response?.data?.error || 'User not found'); }
    finally { setLoading(false); }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || members.length === 0) return setErr('Group name and at least 1 member required');
    setLoading(true); setErr('');
    try {
      const res = await api.post('/chats', { participantPhones: members, chatName: groupName.trim(), isGroup: true });
      onCreated(res.data);
    } catch (e) { setErr(e.response?.data?.error || 'Failed'); }
    finally { setLoading(false); }
  };

  const messageSelf = async () => {
    if (!user) return;
    setLoading(true); setErr('');
    try {
      const res = await api.post('/chats', { participantIds: [user.id], isGroup: false });
      onCreated(res.data);
    } catch (e) { setErr(e.response?.data?.error || 'Failed to start self chat'); }
    finally { setLoading(false); }
  };

  const addMember = () => {
    if (input.trim() && !members.includes(input.trim())) {
      setMembers((m) => [...m, input.trim()]); setInput('');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#233138', borderRadius: 16, padding: 28, width: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ color: '#e9edef', fontWeight: 600, fontSize: 18 }}>New Conversation</h3>
          <button onClick={onClose} className="icon-btn">✕</button>
        </div>
        <div style={{ display: 'flex', marginBottom: 20, background: '#2a3942', borderRadius: 10, padding: 4 }}>
          {['direct', 'group'].map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '8px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: tab === t ? '#25D366' : 'transparent',
              color: tab === t ? '#fff' : '#8696a0', fontWeight: 600, fontSize: 13, transition: 'all 0.2s', boxShadow: tab === t ? '0 0 15px rgba(37, 211, 102, 0.8)' : 'none',
            }}>
              {t === 'direct' ? '👤 Direct Chat' : '👥 New Group'}
            </button>
          ))}
        </div>
        {err && <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{err}</p>}
        {tab === 'direct' ? (
          <form onSubmit={startDirect} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} autoFocus
              placeholder="Email, phone number, or user id" style={mStyle.input} />
            <button type="submit" disabled={loading} style={mStyle.btn}>{loading ? 'Starting…' : 'Start Chat'}</button>
            <button type="button" onClick={messageSelf} disabled={loading || !user} style={{ ...mStyle.btn, background: '#1b7f5c' }}>
              {loading ? 'Starting…' : 'Message myself'}
            </button>
          </form>
        ) : (
          <form onSubmit={createGroup} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus
              placeholder="Group name" style={mStyle.input} />
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Add member (email or phone)"
                style={{ ...mStyle.input, flex: 1, marginBottom: 0 }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())} />
              <button type="button" onClick={addMember} style={{ ...mStyle.btn, padding: '0 16px', width: 'auto' }}>+</button>
            </div>
            {members.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {members.map((m) => (
                  <span key={m} style={{ background: '#2a3942', color: '#e9edef', padding: '3px 10px', borderRadius: 20, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {m}
                    <span style={{ cursor: 'pointer', color: '#8696a0' }} onClick={() => setMembers(members.filter((x) => x !== m))}>✕</span>
                  </span>
                ))}
              </div>
            )}
            <button type="submit" disabled={loading} style={mStyle.btn}>{loading ? 'Creating…' : 'Create Group'}</button>
          </form>
        )}
      </div>
    </div>
  );
}

const mStyle = {
  input: { padding: '10px 14px', background: '#2a3942', border: '1px solid #3b4a54', borderRadius: 8, color: '#e9edef', fontSize: 14, outline: 'none', width: '100%' },
  btn: { background: '#25D366', color: '#fff', border: 'none', padding: 12, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', boxShadow: '0 0 15px rgba(37, 211, 102, 0.6)' },
};

/* ─── Chat Layout ─── */
function ChatLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, setChats, addChat, reset } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const navigate = useNavigate();
  const { chatId: activeChatId } = useParams();

  // Single socket manager — no listeners in Chat.jsx
  const chatIds = chats.map((c) => c.id);
  useSocket(chatIds);

  useEffect(() => {
    fetchChats();
    requestNotificationPermission();
    return () => { socket.disconnect(); };
  }, []);

  const fetchChats = async () => {
    try {
      const res = await api.get('/chats');
      setChats(res.data);
    } catch (err) { console.error('fetchChats:', err); }
    finally { setLoading(false); }
  };

  const handleChatCreated = (chat) => {
    addChat(chat);
    setModal(false);
    navigate(`/chat/${chat.id}`);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`);
      // Remove chat from local state
      setChats(chats.filter(c => c.id !== chatId));
      // Navigate away if we're in the deleted chat
      if (activeChatId === chatId) {
        navigate('/');
      }
    } catch (err) {
      console.error('handleDeleteChat:', err);
      alert('Failed to delete chat');
    }
  };

  const handleLogout = () => {
    reset();
    logout();
  };

  const filtered = chats.filter((c) => {
    const other = c.participants?.find((p) => p.userId !== user?.id);
    const name = c.isGroup ? c.name : (other?.user?.displayName || other?.user?.email || other?.user?.phone || '');
    return name?.toLowerCase().includes(search.toLowerCase());
  });

  const displayName = user?.displayName || user?.email || user?.phone || 'Me';

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* ══════ SIDEBAR ══════ */}
      <div style={{ width: 420, maxWidth: '35%', display: 'flex', flexDirection: 'column', background: '#111b21', borderRight: '1px solid #222e35', flexShrink: 0 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', background: '#202c33', gap: 10, minHeight: 60 }}>
          <div style={{ ...avatarStyle(40, '#25D366'), cursor: 'pointer' }} onClick={() => setSettingsModal(true)} title="Profile settings">
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }} />
          <button className="icon-btn" onClick={() => setModal(true)} title="New chat">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#aebac1">
              <path d="M19.005 3.175H4.674C3.642 3.175 3 3.789 3 4.821V21.02l3.544-3.514h12.461c1.033 0 2.064-1.06 2.064-2.093V4.821c-.001-1.032-1.032-1.646-2.064-1.646zm-4.989 9.869H7.041V11.1h6.975v1.944zm3-4H7.041V7.1h10.975v1.944z" />
            </svg>
          </button>
          <button className="icon-btn" onClick={handleLogout} title="Log out">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#aebac1">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '8px 12px', background: '#111b21' }}>
          <div style={{ display: 'flex', alignItems: 'center', background: '#202c33', borderRadius: 8, padding: '7px 14px', gap: 10 }}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="#8696a0">
              <path d="M15.009 13.805h-.636l-.22-.219a5.184 5.184 0 0 0 1.256-3.386 5.207 5.207 0 1 0-5.207 5.208 5.185 5.185 0 0 0 3.385-1.255l.221.22v.635l4.004 3.999 1.194-1.195-3.997-4.007zm-4.808 0a3.605 3.605 0 1 1 0-7.21 3.605 3.605 0 0 1 0 7.21z" />
            </svg>
            <input className="search-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or start new chat" />
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 30, height: 30, border: '3px solid #2a3942', borderTop: '3px solid #25D366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 24px' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💬</div>
              <p style={{ color: '#8696a0', fontSize: 14, marginBottom: 16 }}>No chats yet</p>
              <button onClick={() => setModal(true)} style={{ ...mStyle.btn, padding: '8px 20px', fontSize: 13 }}>Start a conversation</button>
            </div>
          ) : (
            filtered.map((chat) => (
              <ChatItem key={chat.id} chat={chat} currentUserId={user?.id}
                active={chat.id === activeChatId}
                onClick={() => navigate(`/chat/${chat.id}`)}
                onDelete={handleDeleteChat} />
            ))
          )}
        </div>
      </div>

      {/* ══════ MAIN AREA ══════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Routes>
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="*" element={<WelcomePane onNewChat={() => setModal(true)} />} />
        </Routes>
      </div>

      {modal && <NewChatModal onClose={() => setModal(false)} onCreated={handleChatCreated} />}
      {settingsModal && <SettingsModal onClose={() => setSettingsModal(false)} />}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function WelcomePane({ onNewChat }) {
  return (
    <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#222e35', gap: 20 }}>
      <svg viewBox="0 0 303 172" width="288" height="163" fill="none">
        <path d="M229.565 160.229c32.647-10.984 55.985-41.6 55.985-77.329C285.55 36.788 248.354 0 202.688 0c-45.666 0-82.862 36.788-82.862 82.9 0 14.9 4 28.894 11.007 40.944L110 160l31.024-3.607a83.377 83.377 0 0 0 41.391 11.507h.273c4.192 0 8.327-.3 12.392-.878" fill="#202c33"/>
        <path d="M128.565 134.557c-8.952-15.586-14.1-33.709-14.1-53.05C114.465 36.266 151.663 0 197.327 0c28.27 0 53.24 13.818 68.546 35.046a82.11 82.11 0 0 0-19.77-2.437c-45.666 0-82.862 36.788-82.862 82.9 0 19.14 6.535 36.74 17.374 50.73L158 175l-29.435-40.443z" fill="#2a3942"/>
        <circle cx="197" cy="82" r="25" fill="#25D366" opacity=".3"/>
        <circle cx="197" cy="82" r="15" fill="#25D366"/>
        <path d="M191 82l4 4 8-8" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#e9edef', fontWeight: 300, fontSize: 30, marginBottom: 12 }}>WhatApp Clone</h2>
        <p style={{ color: '#8696a0', fontSize: 14, lineHeight: 1.6, maxWidth: 400 }}>
          Send and receive messages instantly.<br />Your messages are end-to-end encrypted.
        </p>
      </div>
      <button onClick={onNewChat} style={{ ...mStyle.btn, padding: '10px 28px', borderRadius: 24, fontSize: 14 }}>
        ✏️  Start a new conversation
      </button>
    </div>
  );
}

/* ─── Root with auth persistence ─── */
export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) { setBooting(false); return; }
    import('./services/api').then(({ default: api }) => {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('authToken'))
        .finally(() => setBooting(false));
    });
  }, []);

  if (booting) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111b21' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #2a3942', borderTop: '3px solid #25D366', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <BrowserRouter>
      <Routes>
        {!user ? (
          <Route path="/*" element={<Login />} />
        ) : (
          <Route path="/*" element={<ChatLayout />} />
        )}
      </Routes>
    </BrowserRouter>
  );
}

const avatarStyle = (size, bg) => ({
  width: size, height: size, borderRadius: '50%', background: bg,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: '#fff', fontWeight: 700, fontSize: size * 0.4, flexShrink: 0,
});
