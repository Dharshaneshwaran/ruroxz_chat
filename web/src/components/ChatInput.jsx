import React, { useState, useRef, useCallback } from 'react';
import socket from '../services/socket';

const MAX_FILE_MB = 16;
let typingTimer = null;

export default function ChatInput({ chatId, userId, onSend }) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const emitTyping = useCallback(() => {
    if (!isTyping) {
      socket.emit('typing', { chatId, userId });
      setIsTyping(true);
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      socket.emit('stop_typing', { chatId, userId });
      setIsTyping(false);
    }, 2000);
  }, [chatId, userId, isTyping]);

  const handleChange = (e) => {
    setText(e.target.value);
    // Auto-resize
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    emitTyping();
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSend({ content });
    setText('');
    // Reset height
    if (textRef.current) { textRef.current.style.height = 'auto'; }
    // Stop typing indicator
    clearTimeout(typingTimer);
    socket.emit('stop_typing', { chatId, userId });
    setIsTyping(false);
    textRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_FILE_MB}MB.`); return;
    }
    onSend({ file });
    e.target.value = '';
  };

  const hasText = text.trim().length > 0;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 16px', background: '#202c33', flexShrink: 0 }}>
      {/* Emoji (placeholder) */}
      <button className="icon-btn" title="Emoji">
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#aebac1">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm-5-9h10v2H7v-2zm2-4a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
        </svg>
      </button>

      {/* Attach */}
      <input type="file" ref={fileRef} style={{ display: 'none' }}
        onChange={handleFile} accept="image/*,application/pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx" />
      <button className="icon-btn" title="Attach file" onClick={() => fileRef.current?.click()}>
        <svg viewBox="0 0 24 24" width="24" height="24" fill="#aebac1">
          <path d="M21.586 10.461l-10.05 10.075a6.5 6.5 0 0 1-9.143-9.242l10.05-10.075a4 4 0 0 1 5.657 5.657l-9.9 9.9a1.5 1.5 0 0 1-2.121-2.121l9.9-9.9-1.415-1.414-9.9 9.9a3.5 3.5 0 0 0 4.95 4.95l9.9-9.9a6 6 0 0 0-8.484-8.485l-10.05 10.075a8.5 8.5 0 0 0 12.02 12.03l10.05-10.075-1.414-1.375z"/>
        </svg>
      </button>

      {/* Text area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', background: '#2a3942', borderRadius: 10, padding: '9px 14px', gap: 8, minHeight: 44 }}>
        <textarea
          ref={textRef}
          className="input-field"
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message"
          rows={1}
        />
      </div>

      {/* Send / Mic */}
      {hasText ? (
        <button
          onClick={send}
          style={{ width: 46, height: 46, borderRadius: '50%', background: '#00a884', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}
          title="Send"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
            <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
          </svg>
        </button>
      ) : (
        <button className="icon-btn" title="Voice message" style={{ width: 46, height: 46, background: '#00a884', borderRadius: '50%', border: 'none' }}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
          </svg>
        </button>
      )}
    </div>
  );
}
