import React, { useEffect, useMemo, useState } from 'react';
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

function Icon({ name, size = 24 }) {
  const common = { stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };
  const paths = {
    chats: <><path {...common} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" /><path {...common} d="M8 9h8M8 13h5" /></>,
    status: <><path {...common} d="M4 12a8 8 0 0 1 8-8" /><path {...common} d="M20 12a8 8 0 0 1-8 8" /><path {...common} d="M8 4.9a8 8 0 0 1 11.1 7.1" /><path {...common} d="M16 19.1A8 8 0 0 1 4.9 8" /><circle {...common} cx="12" cy="12" r="3" /></>,
    channels: <><path {...common} d="M7 8a5 5 0 0 1 10 0c0 4-5 8-5 8S7 12 7 8z" /><path {...common} d="M5 19h14" /></>,
    groups: <><path {...common} d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle {...common} cx="9" cy="7" r="4" /><path {...common} d="M22 21v-2a4 4 0 0 0-3-3.87" /><path {...common} d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    sparkle: <><path {...common} d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z" /><path {...common} d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
    newChat: <><path {...common} d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h8" /><path {...common} d="M19 3v6M16 6h6" /></>,
    dots: <><circle cx="12" cy="5" r="1.8" fill="currentColor" /><circle cx="12" cy="12" r="1.8" fill="currentColor" /><circle cx="12" cy="19" r="1.8" fill="currentColor" /></>,
    search: <><circle {...common} cx="11" cy="11" r="7" /><path {...common} d="M20 20l-3.5-3.5" /></>,
    bellOff: <><path {...common} d="M13.7 21a2 2 0 0 1-3.4 0" /><path {...common} d="M18 8a6 6 0 0 0-8.3-5.5" /><path {...common} d="M5.3 5.3A6 6 0 0 0 4 9c0 7-3 7-3 7h15" /><path {...common} d="M2 2l20 20" /></>,
    close: <><path {...common} d="M18 6L6 18M6 6l12 12" /></>,
    image: <><rect {...common} x="3" y="3" width="18" height="18" rx="2" /><circle {...common} cx="8.5" cy="8.5" r="1.5" /><path {...common} d="M21 15l-5-5L5 21" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-head">
          <h3>{title}</h3>
          <button onClick={onClose} className="icon-btn" title="Close"><Icon name="close" size={22} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SettingsModal({ onClose }) {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg({ text: '', type: '' });
    try {
      const res = await api.put('/auth/profile', { displayName: name, phoneNumber: phone });
      setUser(res.data);
      setMsg({ text: 'Profile updated successfully.', type: 'success' });
      setTimeout(onClose, 1000);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Profile Settings" onClose={onClose}>
      {msg.text && <p className={`modal-message ${msg.type}`}>{msg.text}</p>}
      <form onSubmit={handleUpdate} className="modal-form">
        <label>Display Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        <label>Phone Number</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91XXXXXXXXXX" />
        <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</button>
      </form>
    </Modal>
  );
}

function NewChatModal({ onClose, onCreated }) {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState('direct');
  const [input, setInput] = useState('');
  const [groupName, setGroupName] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [err, setErr] = useState('');
  const normalizedInput = normalizePhone(input);
  const canLookupPhone = tab === 'direct' && isPhoneLike(input);

  useEffect(() => {
    setLookupResult(null);
    setErr('');

    if (!canLookupPhone || normalizedInput.length < 6) {
      setLookupLoading(false);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setLookupLoading(true);
      try {
        const res = await api.get('/auth/lookup-phone', { params: { phone: normalizedInput } });
        if (!cancelled) {
          setLookupResult(res.data);
          setErr('');
        }
      } catch (error) {
        if (!cancelled) {
          setLookupResult(null);
          setErr(error.response?.status === 404 ? 'No account found for this number' : 'Could not check this number');
        }
      } finally {
        if (!cancelled) setLookupLoading(false);
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [canLookupPhone, normalizedInput, tab]);

  const startDirect = async (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    setLoading(true);
    setErr('');
    try {
      const contact = canLookupPhone ? normalizedInput : input.trim();
      const res = await api.post('/chats', { participantPhones: [contact], isGroup: false });
      onCreated(res.data);
    } catch (error) {
      setErr(error.response?.data?.error || 'User not found');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim() || members.length === 0) {
      setErr('Group name and at least one member are required');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const res = await api.post('/chats', { participantPhones: members, chatName: groupName.trim(), isGroup: true });
      onCreated(res.data);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const messageSelf = async () => {
    if (!user) return;
    setLoading(true);
    setErr('');
    try {
      const res = await api.post('/chats', { participantIds: [user.id], isGroup: false });
      onCreated(res.data);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to start self chat');
    } finally {
      setLoading(false);
    }
  };

  const addMember = () => {
    const next = input.trim();
    if (next && !members.includes(next)) {
      setMembers((current) => [...current, next]);
      setInput('');
    }
  };

  return (
    <Modal title="New Conversation" onClose={onClose}>
      <div className="modal-tabs">
        <button className={tab === 'direct' ? 'active' : ''} onClick={() => setTab('direct')}>Direct Chat</button>
        <button className={tab === 'group' ? 'active' : ''} onClick={() => setTab('group')}>New Group</button>
      </div>
      {err && <p className="modal-message error">{err}</p>}
      {tab === 'direct' ? (
        <form onSubmit={startDirect} className="modal-form">
          <input value={input} onChange={(e) => setInput(e.target.value)} autoFocus placeholder="Email, phone number, or user id" />
          {canLookupPhone && (
            <ContactLookupCard
              lookupLoading={lookupLoading}
              lookupResult={lookupResult}
              phone={normalizedInput}
              onChat={() => startDirect()}
              chatLoading={loading}
            />
          )}
          {!lookupResult && <button type="submit" disabled={loading || lookupLoading}>{loading ? 'Starting...' : lookupLoading ? 'Checking...' : 'Start Chat'}</button>}
          <button type="button" onClick={messageSelf} disabled={loading || !user} className="secondary">Message myself</button>
        </form>
      ) : (
        <form onSubmit={createGroup} className="modal-form">
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} autoFocus placeholder="Group name" />
          <div className="modal-row">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Add member email or phone" onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMember())} />
            <button type="button" onClick={addMember}>+</button>
          </div>
          {members.length > 0 && (
            <div className="member-chips">
              {members.map((member) => (
                <span key={member}>
                  {member}
                  <button type="button" onClick={() => setMembers(members.filter((item) => item !== member))}>x</button>
                </span>
              ))}
            </div>
          )}
          <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Group'}</button>
        </form>
      )}
    </Modal>
  );
}

function ContactLookupCard({ lookupLoading, lookupResult, phone, onChat, chatLoading }) {
  if (lookupLoading) {
    return <div className="contact-lookup-card muted">Checking database...</div>;
  }

  if (!lookupResult?.user) return null;

  const contact = lookupResult.user;
  const name = contact.displayName || contact.phone || contact.email || 'Contact';

  return (
    <div className="contact-lookup-card">
      <div className="contact-lookup-main">
        <div className="wa-avatar small">{name.charAt(0).toUpperCase()}</div>
        <div>
          <strong>{name}</strong>
          <span>{lookupResult.isSelf ? 'This is your account' : contact.phone}</span>
        </div>
      </div>
      <div className="contact-actions">
        <button type="button" onClick={onChat} disabled={chatLoading}>
          {chatLoading ? 'Opening...' : 'Chat'}
        </button>
      </div>
    </div>
  );
}

function normalizePhone(value) {
  return String(value || '').trim().replace(/[^\d+]/g, '');
}

function isPhoneLike(value) {
  const next = String(value || '').trim();
  return next.length > 0 && !next.includes('@') && /^[+\d\s().-]+$/.test(next);
}

function ChatLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { chats, setChats, addChat, reset } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [noticeVisible, setNoticeVisible] = useState(true);
  const navigate = useNavigate();
  const { chatId: activeChatId } = useParams();

  const chatIds = chats.map((chat) => chat.id);
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
    } catch (err) {
      console.error('fetchChats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChatCreated = (chat) => {
    addChat(chat);
    setModal(false);
    navigate(`/chat/${chat.id}`);
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await api.delete(`/chats/${chatId}`);
      setChats(chats.filter((chat) => chat.id !== chatId));
      if (activeChatId === chatId) navigate('/');
    } catch (err) {
      console.error('handleDeleteChat:', err);
      alert('Failed to delete chat');
    }
  };

  const handleLogout = () => {
    reset();
    logout();
  };

  const unreadCount = useMemo(() => chats.filter((chat) => chat.messages?.[0] && chat.messages[0].senderId !== user?.id).length, [chats, user?.id]);
  const displayName = user?.displayName || user?.email || user?.phone || 'Me';

  const filtered = chats.filter((chat) => {
    const other = chat.participants?.find((p) => p.userId !== user?.id);
    const name = chat.isGroup ? chat.name : (other?.user?.displayName || other?.user?.email || other?.user?.phone || '');
    const matchesSearch = name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === 'groups') return chat.isGroup;
    if (filter === 'unread') return chat.messages?.[0] && chat.messages[0].senderId !== user?.id;
    if (filter === 'favorites') return Boolean(chat.isFavorite || chat.favorite);
    return true;
  });

  return (
    <div className="wa-shell">
      <aside className="wa-rail">
        <div className="rail-top">
          <RailButton active badge={unreadCount || null} title="Chats"><Icon name="chats" /></RailButton>
          <RailButton title="Status"><Icon name="status" /></RailButton>
          <RailButton title="Channels"><Icon name="channels" /></RailButton>
          <RailButton title="Communities"><Icon name="groups" /></RailButton>
          <div className="rail-separator" />
          <RailButton title="AI"><Icon name="sparkle" /></RailButton>
        </div>
        <div className="rail-bottom">
          <RailButton title="Archived"><Icon name="image" /></RailButton>
          <button className="rail-avatar" onClick={() => setSettingsModal(true)} title="Profile settings">{displayName.charAt(0).toUpperCase()}</button>
        </div>
      </aside>

      <aside className="wa-sidebar">
        <header className="sidebar-titlebar">
          <h1>WhatsApp</h1>
          <div>
            <button className="icon-btn" onClick={() => setModal(true)} title="New chat"><Icon name="newChat" size={22} /></button>
            <button className="icon-btn" onClick={handleLogout} title="Log out"><Icon name="dots" size={22} /></button>
          </div>
        </header>

        <div className="search-wrap">
          <Icon name="search" size={21} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search or start a new chat" />
        </div>

        <div className="filter-row">
          <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>All</button>
          <button className={filter === 'unread' ? 'active' : ''} onClick={() => setFilter('unread')}>Unread {unreadCount || ''}</button>
          <button className={filter === 'favorites' ? 'active' : ''} onClick={() => setFilter('favorites')}>Favorites</button>
          <button className={filter === 'groups' ? 'active' : ''} onClick={() => setFilter('groups')}>Groups</button>
          <button className="round" onClick={() => setModal(true)} title="New chat">+</button>
        </div>

        {noticeVisible && (
          <div className="notification-card">
            <Icon name="bellOff" size={34} />
            <div><strong>Message notifications are off.</strong> <button onClick={requestNotificationPermission}>Turn on</button></div>
            <button className="notif-close" title="Dismiss" onClick={() => setNoticeVisible(false)}><Icon name="close" size={24} /></button>
          </div>
        )}

        <div className="chat-list">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-list">
              <Icon name="chats" size={52} />
              <p>No chats found</p>
              <button onClick={() => setModal(true)}>Start a conversation</button>
            </div>
          ) : (
            filtered.map((chat) => (
              <ChatItem
                key={chat.id}
                chat={chat}
                currentUserId={user?.id}
                active={chat.id === activeChatId}
                onClick={() => navigate(`/chat/${chat.id}`)}
                onDelete={handleDeleteChat}
              />
            ))
          )}
        </div>

        <button className="windows-cta">Get WhatsApp for Windows</button>
      </aside>

      <main className="wa-main">
        <Routes>
          <Route path="/chat/:chatId" element={<Chat />} />
          <Route path="*" element={<WelcomePane onNewChat={() => setModal(true)} />} />
        </Routes>
      </main>

      {modal && <NewChatModal onClose={() => setModal(false)} onCreated={handleChatCreated} />}
      {settingsModal && <SettingsModal onClose={() => setSettingsModal(false)} />}
    </div>
  );
}

function RailButton({ children, title, active, badge }) {
  return (
    <button className={`rail-btn ${active ? 'active' : ''}`} title={title}>
      {children}
      {badge ? <span>{badge}</span> : null}
    </button>
  );
}

function WelcomePane({ onNewChat }) {
  return (
    <section className="welcome-pane">
      <div className="welcome-mark">WA</div>
      <h2>WhatsApp Web</h2>
      <p>Send and receive messages instantly from this browser.</p>
      <button onClick={onNewChat}>Start a new conversation</button>
    </section>
  );
}

export default function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setBooting(false);
      return;
    }
    import('./services/api').then(({ default: apiClient }) => {
      apiClient.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(() => localStorage.removeItem('authToken'))
        .finally(() => setBooting(false));
    });
  }, [setUser]);

  if (booting) {
    return (
      <div className="boot-screen">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {!user ? <Route path="/*" element={<Login />} /> : <Route path="/*" element={<ChatLayout />} />}
      </Routes>
    </BrowserRouter>
  );
}
