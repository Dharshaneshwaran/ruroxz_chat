import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useChatStore } from '../store/chatStore';
import '../styles/bubbles.css';

const PHONE_RE = /(\+?\d[\d\s().-]{5,}\d)/g;

/* ── Full-screen media lightbox ── */
function MediaLightbox({ url, type, name, onClose }) {
  const isImage = type === 'image';
  const isVideo = type === 'video';

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 500,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      {/* Top bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 20px', background: 'rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ color: '#e9edef', fontSize: 14, fontWeight: 500, maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {name || (isImage ? 'Image' : isVideo ? 'Video' : 'File')}
        </span>
        <div style={{ display: 'flex', gap: 12 }}>
          <a
            href={url}
            download
            target="_blank"
            rel="noreferrer"
            style={{ color: '#8696a0', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 }}
            onClick={(e) => e.stopPropagation()}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M5 20h14v-2H5v2zm7-18L5.33 9h3.84v4h5.66V9h3.84L12 2z"/>
            </svg>
            Download
          </a>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#e9edef', fontSize: 24, cursor: 'pointer', lineHeight: 1, padding: 0 }}
          >✕</button>
        </div>
      </div>

      {/* Media */}
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isImage && (
          <img
            src={url}
            alt="preview"
            style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
        )}
        {isVideo && (
          <video
            src={url}
            controls
            autoPlay
            style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: 4, boxShadow: '0 8px 40px rgba(0,0,0,0.6)' }}
          />
        )}
        {!isImage && !isVideo && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>📄</div>
            <p style={{ color: '#e9edef', fontSize: 16, marginBottom: 20 }}>{name}</p>
            <a
              href={url}
              download
              target="_blank"
              rel="noreferrer"
              style={{
                padding: '12px 32px', background: '#25D366', color: '#fff',
                borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              Download
            </a>
          </div>
        )}
      </div>

      <p style={{ position: 'absolute', bottom: 20, color: '#8696a0', fontSize: 12 }}>
        Click outside or press Esc to close
      </p>
    </div>
  );
}

/* ── Message Bubble ── */
export default function MessageBubble({ message, isOwn, participants, onDelete }) {
  const [showDelete, setShowDelete] = useState(false);
  const [lightbox, setLightbox] = useState(false);
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

  const hasMedia = !!message.mediaUrl;
  const mediaType = message.mediaType;

  return (
    <>
      {lightbox && (
        <MediaLightbox
          url={message.mediaUrl}
          type={mediaType}
          name={null}
          onClose={() => setLightbox(false)}
        />
      )}

      <div
        style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 2, padding: '1px 0' }}
        onMouseEnter={() => setShowDelete(true)}
        onMouseLeave={() => setShowDelete(false)}
      >
        <div
          className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}
          style={{
            maxWidth: '65%', minWidth: 80,
            borderRadius: isOwn ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
            padding: hasMedia && !message.content ? '4px 4px 8px' : '6px 10px 8px',
            background: isOwn ? '#005c4b' : '#202c33',
            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
            position: 'relative',
          }}
        >
          {/* Delete button */}
          {isOwn && showDelete && (
            <button
              onClick={handleDelete}
              style={{
                position: 'absolute', top: -8, right: -8,
                background: '#ff6b6b', color: 'white', border: 'none',
                borderRadius: '50%', width: 20, height: 20,
                cursor: 'pointer', fontSize: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)', zIndex: 1,
              }}
              title="Delete message"
            >×</button>
          )}

          {/* Group sender name */}
          {!isOwn && senderName && (
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3, color: senderColor, padding: hasMedia ? '2px 6px 0' : 0 }}>
              {senderName}
            </div>
          )}

          {/* Snap indicator */}
          {message.isSnap && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#f78da7', fontSize: 11, marginBottom: 4, padding: hasMedia ? '0 6px' : 0 }}>
              <SnapMiniIcon />
              <span>Snap · 24h</span>
            </div>
          )}

          {/* Image */}
          {hasMedia && mediaType === 'image' && (
            <div
              onClick={() => setLightbox(true)}
              style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: 6, marginBottom: message.content ? 6 : 0 }}
            >
              <img
                src={message.mediaUrl}
                alt="media"
                style={{ display: 'block', maxWidth: 280, maxHeight: 220, width: '100%', objectFit: 'cover', borderRadius: 6 }}
              />
            </div>
          )}

          {/* Video */}
          {hasMedia && mediaType === 'video' && (
            <div
              onClick={() => setLightbox(true)}
              style={{ cursor: 'pointer', position: 'relative', borderRadius: 6, overflow: 'hidden', marginBottom: message.content ? 6 : 0 }}
            >
              <video
                src={message.mediaUrl}
                style={{ display: 'block', maxWidth: 280, maxHeight: 180, width: '100%', objectFit: 'cover', borderRadius: 6 }}
              />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="#111"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
          )}

          {/* File / PDF */}
          {hasMedia && mediaType !== 'image' && mediaType !== 'video' && (
            <div
              onClick={() => setLightbox(true)}
              style={{
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', background: 'rgba(255,255,255,0.06)',
                borderRadius: 8, marginBottom: message.content ? 6 : 0,
              }}
            >
              <span style={{ fontSize: 26 }}>📄</span>
              <div>
                <div style={{ color: '#53bdeb', fontSize: 13, fontWeight: 500 }}>View file</div>
                <div style={{ color: '#8696a0', fontSize: 11 }}>Tap to preview</div>
              </div>
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div style={{ color: '#e9edef', fontSize: 14.5, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: hasMedia ? '0 6px' : 0 }}>
              <PhoneAwareText text={message.content} onPhoneClick={handlePhoneClick} />
            </div>
          )}

          {/* Phone lookup card */}
          {selectedPhone && (
            <PhoneActionCard
              phone={selectedPhone}
              lookup={lookup}
              openingChat={openingChat}
              onChat={openChat}
              onClose={() => setSelectedPhone('')}
            />
          )}

          {/* Timestamp */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3, padding: hasMedia ? '0 6px' : 0 }}>
            <span style={{ color: '#8696a0', fontSize: 11 }}>{time}</span>
            {isOwn && <span style={{ color: '#53bdeb', fontSize: 14, lineHeight: 1 }}>✓✓</span>}
          </div>
        </div>
      </div>
    </>
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
          style={{
            background: 'none', border: 'none', color: '#53bdeb',
            textDecoration: 'underline', cursor: 'pointer', padding: 0,
            fontSize: 'inherit', fontStyle: 'inherit', fontWeight: 'inherit',
          }}
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
    <div style={{
      background: '#111b21', border: '1px solid #3b4a54', borderRadius: 8,
      padding: 12, marginTop: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ color: '#e9edef', fontWeight: 600, fontSize: 13 }}>
            {lookup.loading ? 'Checking database...' : name}
          </div>
          <div style={{ color: '#8696a0', fontSize: 11 }}>
            {lookup.error || (lookup.user ? 'Number found' : phone)}
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#8696a0', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onChat}
          disabled={lookup.loading || !lookup.user || openingChat}
          style={{
            flex: 1, padding: '6px 0', borderRadius: 4, border: 'none',
            background: '#25D366', color: '#fff', fontSize: 12, fontWeight: 600,
            cursor: (lookup.loading || !lookup.user || openingChat) ? 'not-allowed' : 'pointer',
            opacity: (lookup.loading || !lookup.user || openingChat) ? 0.6 : 1,
          }}
        >
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
