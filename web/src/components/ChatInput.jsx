import React, { useCallback, useRef, useState } from 'react';
import socket from '../services/socket';

const MAX_FILE_MB = 16;
let typingTimer = null;

export default function ChatInput({ chatId, userId, onSend }) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSnap, setIsSnap] = useState(false);
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
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    emitTyping();
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSend({ content, isSnap });
    setText('');
    setIsSnap(false);
    if (textRef.current) textRef.current.style.height = 'auto';
    clearTimeout(typingTimer);
    socket.emit('stop_typing', { chatId, userId });
    setIsTyping(false);
    textRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_FILE_MB}MB.`);
      return;
    }
    onSend({ file, isSnap });
    setIsSnap(false);
    e.target.value = '';
  };

  const hasText = text.trim().length > 0;

  return (
    <div className="composer-shell">
      <div className={`snap-bar ${isSnap ? 'active' : ''}`}>
        <button type="button" className="snap-toggle" onClick={() => setIsSnap((value) => !value)}>
          <SnapIcon />
          <span>{isSnap ? 'Snap is on' : 'Snap'}</span>
        </button>
        <span className="snap-hint">{isSnap ? 'Deletes automatically after 24 hours.' : 'Post a 24-hour snap message'}</span>
      </div>

      <div className="composer">
        <button className="wa-icon-btn" title="Attach" onClick={() => fileRef.current?.click()}>
          <PlusIcon />
        </button>
        <input
          type="file"
          ref={fileRef}
          style={{ display: 'none' }}
          onChange={handleFile}
          accept="image/*,application/pdf,video/*,audio/*,.doc,.docx,.xls,.xlsx"
        />
        <button className="wa-icon-btn" title="Emoji">
          <SmileIcon />
        </button>

        <div className="composer-box">
          <textarea
            ref={textRef}
            className="input-field"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isSnap ? 'Post a 24-hour snap' : 'Type a message'}
            rows={1}
          />
        </div>

        <button className="wa-icon-btn" onClick={hasText ? send : undefined} title={hasText ? 'Send' : 'Voice message'}>
          {hasText ? <SendIcon /> : <MicIcon />}
        </button>
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function SmileIcon() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="currentColor">
      <path d="M2.3 20.7 22 12 2.3 3.3 2.4 10l12.2 2-12.2 2 .1 6.7z" />
    </svg>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" />
      <path d="M19 11a7 7 0 0 1-14 0M12 18v3" />
    </svg>
  );
}

function SnapIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="3" />
      <path d="M18 5l2-2M20 3v5h-5" />
    </svg>
  );
}
