import React from 'react';
import '../styles/bubbles.css';

export default function MessageBubble({ message, isOwn, participants }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Resolve sender name for group chats
  const sender = message.sender
    || participants?.find((p) => p.userId === message.senderId)?.user;
  const senderName = sender?.displayName || sender?.email || sender?.phone || '';

  // Pastel colors per sender (consistent hue)
  const senderColor = stringToColor(message.senderId);

  return (
    <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 2, padding: '1px 0' }}>
      <div
        className={`bubble ${isOwn ? 'bubble-own' : 'bubble-other'}`}
        style={{
          maxWidth: '65%',
          minWidth: 80,
          borderRadius: isOwn ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
          padding: '6px 10px 8px',
          background: isOwn ? '#005c4b' : '#202c33',
          boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
        }}
      >
        {/* Group sender name */}
        {!isOwn && senderName && (
          <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 3, color: senderColor }}>
            {senderName}
          </div>
        )}

        {/* Image media */}
        {message.mediaUrl && message.mediaType === 'image' && (
          <img
            src={message.mediaUrl}
            alt="media"
            style={{ maxWidth: 300, maxHeight: 220, borderRadius: 6, display: 'block', marginBottom: 4, cursor: 'pointer' }}
            onClick={() => window.open(message.mediaUrl, '_blank')}
          />
        )}

        {/* File/video media */}
        {message.mediaUrl && message.mediaType !== 'image' && (
          <a
            href={message.mediaUrl}
            target="_blank"
            rel="noreferrer"
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#53bdeb', fontSize: 13, textDecoration: 'none', marginBottom: 4, padding: '6px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}
          >
            <span style={{ fontSize: 20 }}>📎</span>
            <span>View attachment</span>
          </a>
        )}

        {/* Text content */}
        {message.content && (
          <div style={{ color: '#e9edef', fontSize: 14.5, lineHeight: 1.45, wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
            {message.content}
          </div>
        )}

        {/* Timestamp + ticks */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3, marginTop: 3 }}>
          <span style={{ color: '#8696a0', fontSize: 11 }}>{time}</span>
          {isOwn && (
            <span style={{ color: '#53bdeb', fontSize: 14, lineHeight: 1 }}>✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Deterministic pastel color from userId string
function stringToColor(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const colors = ['#e06c75', '#98c379', '#e5c07b', '#61afef', '#c678dd', '#56b6c2', '#be5046', '#d19a66'];
  return colors[Math.abs(hash) % colors.length];
}
