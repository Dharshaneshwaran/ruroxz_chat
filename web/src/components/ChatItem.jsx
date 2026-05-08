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
    ? 'typing…'
    : last?.content || (last?.mediaUrl ? '📷 Media' : '');

  const time = last
    ? formatTime(new Date(last.createdAt))
    : '';

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
      style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #1f2c33', position: 'relative' }}
    >
      {/* Avatar */}
      <div style={{
        width: 49, height: 49, borderRadius: '50%',
        background: chat.isGroup ? '#667781' : '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontWeight: 700, fontSize: 20, flexShrink: 0,
      }}>
        {initials}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}>
          <span style={{ color: '#e9edef', fontWeight: 500, fontSize: 17, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
            {name}
          </span>
          <span style={{ color: typing.length > 0 ? '#25D366' : '#8696a0', fontSize: 12, flexShrink: 0 }}>
            {time}
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          color: typing.length > 0 ? '#25D366' : '#8696a0',
          fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {last && !chat.isGroup && last.senderId === currentUserId && (
            <span style={{ color: '#53bdeb', fontSize: 13, flexShrink: 0 }}>✓✓</span>
          )}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {preview || <span style={{ fontStyle: 'italic', opacity: 0.5 }}>No messages yet</span>}
          </span>
        </div>
      </div>

      {/* Right-click for delete option */}
    </div>
  );
}

function formatTime(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString([], { day: '2-digit', month: '2-digit', year: '2-digit' });
}
