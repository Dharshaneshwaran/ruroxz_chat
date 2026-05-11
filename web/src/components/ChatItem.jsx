import React from 'react';
import { useChatStore } from '../store/chatStore';

export default function ChatItem({ chat, currentUserId, active, onClick, onDelete }) {
  const typing = useChatStore((s) => s.typing[chat.id] || []);
  const other = chat.participants?.find((p) => p.userId !== currentUserId);
  const name = chat.isGroup
    ? chat.name || 'Group'
    : other?.user?.displayName || other?.user?.email || other?.user?.phone || 'Me';

  const last = chat.messages?.[0];
  const preview = typing.length > 0
    ? 'typing...'
    : last?.isSnap
    ? 'Snap message'
    : last?.content || (last?.mediaUrl ? 'Media' : '');
  const time = last ? formatTime(new Date(last.createdAt)) : '';
  const initials = (name || 'U').charAt(0).toUpperCase();

  const handleContextMenu = (e) => {
    e.preventDefault();
    if (onDelete && window.confirm(`Delete ${chat.isGroup ? 'group chat' : 'chat'} "${name}"?`)) {
      onDelete(chat.id);
    }
  };

  return (
    <div
      onClick={onClick}
      onContextMenu={handleContextMenu}
      className={`sidebar-item ${active ? 'active' : ''}`}
      title="Right-click to delete"
    >
      <div className={`wa-avatar medium ${chat.isGroup ? 'group' : ''}`}>{initials}</div>

      <div className="sidebar-item-content">
        <div className="sidebar-item-top">
          <span className="chat-name">{name}</span>
          <span className="chat-time" style={{ color: typing.length > 0 ? '#25D366' : undefined }}>
            {time}
          </span>
        </div>
        <div className="sidebar-item-bottom">
          {last && !chat.isGroup && last.senderId === currentUserId && (
            <span className="chat-ticks">✓✓</span>
          )}
          <span className="chat-preview" style={{ color: typing.length > 0 ? '#25D366' : undefined }}>
            {preview || <span style={{ fontStyle: 'italic', opacity: 0.65 }}>No messages yet</span>}
          </span>
        </div>
      </div>
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}
