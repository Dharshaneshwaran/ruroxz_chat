import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useChatStore } from '../store/chatStore';
import '../styles/bubbles.css';

const PHONE_RE = /(\+?\d[\d\s().-]{5,}\d)/g;

export default function MessageBubble({ message, isOwn, participants, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const [selectedPhone, setSelectedPhone] = useState('');
  const [lookup, setLookup] = useState({ loading: false, user: null, error: '' });
  const [openingChat, setOpeningChat] = useState(false);
  const addChat = useChatStore((s) => s.addChat);
  const navigate = useNavigate();
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sender = message.sender || participants?.find((p) => p.userId === message.senderId)?.user;
  const senderName = sender?.displayName || sender?.email || sender?.phone || '';
  const senderColor = stringToColor(message.senderId);

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this message?')) onDelete(message.id);
  };

  const handlePhoneClick = async (rawPhone) => {
    const phone = normalizePhone(rawPhone);
    setSelectedPhone(phone);
    setLookup({ loading: true, user: null, error: '' });
    try {
      const res = await api.get('/auth/lookup-phone', { params: { phone } });
      setLookup({ loading: false, user: res.data.user, error: '' });
    } catch (error) {
      setLookup({
        loading: false,
        user: null,
        error: error.response?.status === 404 ? 'No account found for this number' : 'Could not check this number',
      });
    }
  };

  const openChat = async () => {
    if (!selectedPhone) return;
    setOpeningChat(true);
    try {
      const res = await api.post('/chats', { participantPhones: [selectedPhone], isGroup: false });
      addChat(res.data);
      navigate(`/chat/${res.data.id}`);
      setSelectedPhone('');
    } catch (error) {
      setLookup((current) => ({
        ...current,
        error: error.response?.data?.error || 'Could not open chat for this number',
      }));
    } finally {
      setOpeningChat(false);
    }
  };

  return (
    <div
      className={`message-row ${isOwn ? 'own' : 'other'}`}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}>
        {isOwn && showDelete && (
          <button onClick={handleDelete} className="bubble-delete" title="Delete message">
            ×
          </button>
        )}

        {!isOwn && senderName && (
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: senderColor }}>
            {senderName}
          </div>
        )}

        {message.isSnap && (
          <div className="snap-chip">
            <SnapMiniIcon />
            <span>Snap · 24h</span>
          </div>
        )}

        {message.mediaUrl && message.mediaType === 'image' && (
          <img
            src={message.mediaUrl}
            alt="media"
            className="bubble-media"
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        )}

        {message.mediaUrl && message.mediaType !== 'image' && (
          <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="attachment-link">
            <span>Attachment</span>
            <span>View attachment</span>
          </a>
        )}

        {message.content && (
          <div className="bubble-text">
            <PhoneAwareText text={message.content} onPhoneClick={handlePhoneClick} />
          </div>
        )}

        {selectedPhone && (
          <PhoneActionCard
            phone={selectedPhone}
            lookup={lookup}
            openingChat={openingChat}
            onChat={openChat}
            onClose={() => setSelectedPhone('')}
          />
        )}

        <div className="bubble-meta">
          <span className="bubble-time">{time}</span>
          {isOwn && <span className="chat-ticks">✓✓</span>}
        </div>
      </div>
    </div>
  );
}

function SnapMiniIcon() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12s3.4-5.5 9-5.5 9 5.5 9 5.5-3.4 5.5-9 5.5S3 12 3 12z" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M18 4l2-2M20 2v5h-5" />
    </svg>
  );
}

function PhoneAwareText({ text, onPhoneClick }) {
  const parts = String(text).split(PHONE_RE);

  return parts.map((part, index) => {
    if (!part) return null;
    if (isPhoneNumber(part)) {
      return (
        <button
          key={`${part}-${index}`}
          type="button"
          className="message-phone-link"
          onClick={() => onPhoneClick(part)}
        >
          {part}
        </button>
      );
    }
    return <React.Fragment key={`${part}-${index}`}>{part}</React.Fragment>;
  });
}

function PhoneActionCard({ phone, lookup, openingChat, onChat, onClose }) {
  const name = lookup.user?.displayName || lookup.user?.phone || lookup.user?.email || phone;

  return (
    <div className="message-phone-card">
      <div className="message-phone-top">
        <div>
          <strong>{lookup.loading ? 'Checking database...' : name}</strong>
          <span>{lookup.error || (lookup.user ? 'Number found' : phone)}</span>
        </div>
        <button type="button" onClick={onClose} title="Close">×</button>
      </div>
      <div className="message-phone-actions">
        <button type="button" onClick={onChat} disabled={lookup.loading || !lookup.user || openingChat}>
          {openingChat ? 'Opening...' : 'Chat'}
        </button>
      </div>
    </div>
  );
}

function isPhoneNumber(value) {
  const normalized = normalizePhone(value);
  return normalized.replace(/\D/g, '').length >= 6;
}

function normalizePhone(value) {
  return String(value || '').trim().replace(/[^\d+]/g, '');
}

function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#d19a66'];
  return colors[Math.abs(hash) % colors.length];
}
