import React, { useState, useEffect, useRef } from 'react';
import '../styles/bubbles.css';

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

  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sender = message.sender || participants?.find((p) => p.userId === message.senderId)?.user;
  const senderName = sender?.displayName || sender?.email || sender?.phone || '';
  const senderColor = stringToColor(message.senderId);

  const handleDelete = () => {
    if (onDelete && window.confirm('Delete this message?')) onDelete(message.id);
  };

  const hasMedia = !!message.mediaUrl;
  const mediaType = message.mediaType; // 'image' | 'video' | 'application' | etc.

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
              {/* Hover overlay hint */}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', borderRadius: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.25)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
              >
                <svg viewBox="0 0 24 24" width="32" height="32" fill="rgba(255,255,255,0.85)" style={{ opacity: 0, transition: 'opacity 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = 1; }}
                  onMouseLeave={(e) => { e.currentTarget.style.opacity = 0; }}
                >
                  <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
              </div>
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
              {/* Play overlay */}
              <div style={{
                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,0.35)',
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.9)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="#111">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
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
                <div style={{ color: '#8696a0', fontSize: 11 }}>Tap to preview or download</div>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="#8696a0" style={{ marginLeft: 'auto' }}>
                <path d="M9 18l6-6-6-6"/>
              </svg>
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <div style={{ color: '#e9edef', fontSize: 14.5, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap', padding: hasMedia ? '0 6px' : 0 }}>
              {message.content}
            </div>
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

function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#be5046', '#d19a66'];
  return colors[Math.abs(hash) % colors.length];
}
