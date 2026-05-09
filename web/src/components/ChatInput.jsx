import React, { useState, useRef, useCallback, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import socket from '../services/socket';

const MAX_FILE_MB = 16;
let typingTimer = null;

export default function ChatInput({ chatId, userId, onSend, onSendFile }) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmoji, setShowEmoji] = useState(false);

  // Preview state
  const [previewFile, setPreviewFile] = useState(null);   // File object
  const [previewUrl, setPreviewUrl] = useState(null);     // object URL
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadError, setUploadError] = useState('');

  const fileRef = useRef(null);
  const textRef = useRef(null);
  const emojiRef = useRef(null);

  // Revoke object URL when preview closes
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    if (!showEmoji) return;
    const handler = (e) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

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
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
    emitTyping();
  };

  const send = () => {
    const content = text.trim();
    if (!content) return;
    onSend({ content });
    setText('');
    if (textRef.current) textRef.current.style.height = 'auto';
    clearTimeout(typingTimer);
    socket.emit('stop_typing', { chatId, userId });
    setIsTyping(false);
    textRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
    if (e.key === 'Escape') setShowEmoji(false);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      alert(`File too large. Max ${MAX_FILE_MB} MB.`);
      e.target.value = '';
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewFile(file);
    setPreviewUrl(url);
    setCaption('');
    setUploadError('');
    setUploadPct(0);
    e.target.value = '';
  };

  const closePreview = () => {
    if (uploading) return;
    URL.revokeObjectURL(previewUrl);
    setPreviewFile(null);
    setPreviewUrl(null);
    setCaption('');
    setUploadError('');
    setUploadPct(0);
  };

  const handleSendFile = async () => {
    if (!previewFile || uploading) return;
    setUploading(true);
    setUploadError('');
    setUploadPct(0);
    try {
      await onSendFile(previewFile, caption.trim(), (pct) => setUploadPct(pct));
      closePreview();
    } catch (err) {
      const msg = err?.response?.data?.error || 'Upload failed. Please try again.';
      setUploadError(msg);
    } finally {
      setUploading(false);
    }
  };

  const onEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const el = textRef.current;
    if (el) {
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = text.slice(0, start) + emoji + text.slice(end);
      setText(next);
      setTimeout(() => {
        el.focus();
        el.selectionStart = el.selectionEnd = start + emoji.length;
      }, 0);
    } else {
      setText((t) => t + emoji);
    }
  };

  const isImage = previewFile?.type.startsWith('image/');
  const isVideo = previewFile?.type.startsWith('video/');
  const hasText = text.trim().length > 0;

  return (
    <>
      {/* ── File Preview Modal ── */}
      {previewFile && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
        }}>
          <div style={{
            background: '#202c33', borderRadius: 16, padding: 24,
            width: 420, maxWidth: '92vw', boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ color: '#e9edef', fontWeight: 600, fontSize: 16, flex: 1 }}>
                Send {isImage ? 'Image' : isVideo ? 'Video' : 'File'}
              </span>
              <button
                onClick={closePreview}
                disabled={uploading}
                style={{ background: 'none', border: 'none', color: '#8696a0', fontSize: 20, cursor: uploading ? 'not-allowed' : 'pointer', padding: 4 }}
              >✕</button>
            </div>

            {/* Preview Area */}
            <div style={{
              background: '#111b21', borderRadius: 10, overflow: 'hidden',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 180, maxHeight: 320, marginBottom: 16,
            }}>
              {isImage && (
                <img
                  src={previewUrl}
                  alt="preview"
                  style={{ maxWidth: '100%', maxHeight: 320, objectFit: 'contain', display: 'block' }}
                />
              )}
              {isVideo && (
                <video
                  src={previewUrl}
                  controls
                  style={{ maxWidth: '100%', maxHeight: 320, display: 'block' }}
                />
              )}
              {!isImage && !isVideo && (
                <div style={{ textAlign: 'center', padding: 32 }}>
                  <div style={{ fontSize: 52, marginBottom: 12 }}>
                    {previewFile.type === 'application/pdf' ? '📄' : '📎'}
                  </div>
                  <div style={{ color: '#e9edef', fontSize: 14, wordBreak: 'break-all', fontWeight: 500 }}>
                    {previewFile.name}
                  </div>
                  <div style={{ color: '#8696a0', fontSize: 12, marginTop: 6 }}>
                    {(previewFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                </div>
              )}
            </div>

            {/* Caption */}
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendFile(); }}
              placeholder="Add a caption…"
              disabled={uploading}
              style={{
                width: '100%', padding: '10px 14px', background: '#2a3942',
                border: '1px solid #3b4a54', borderRadius: 8, color: '#e9edef',
                fontSize: 14, outline: 'none', marginBottom: 14, boxSizing: 'border-box',
              }}
            />

            {/* Upload progress */}
            {uploading && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#8696a0', fontSize: 12 }}>Uploading…</span>
                  <span style={{ color: '#25D366', fontSize: 12, fontWeight: 600 }}>{uploadPct}%</span>
                </div>
                <div style={{ background: '#2a3942', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', background: '#25D366',
                    width: `${uploadPct}%`, transition: 'width 0.2s ease',
                    borderRadius: 4,
                  }} />
                </div>
              </div>
            )}

            {/* Error */}
            {uploadError && (
              <p style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 12 }}>{uploadError}</p>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={closePreview}
                disabled={uploading}
                style={{
                  flex: 1, padding: 11, borderRadius: 8, border: '1px solid #3b4a54',
                  background: 'transparent', color: '#8696a0', fontSize: 14,
                  cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: 500,
                }}
              >Cancel</button>
              <button
                onClick={handleSendFile}
                disabled={uploading}
                style={{
                  flex: 2, padding: 11, borderRadius: 8, border: 'none',
                  background: uploading ? '#1b7f5c' : '#25D366',
                  color: '#fff', fontSize: 14, fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  boxShadow: uploading ? 'none' : '0 0 12px rgba(37,211,102,0.5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {uploading ? (
                  <>
                    <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                    {uploadPct}%
                  </>
                ) : 'Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Input Bar ── */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', gap: 8, padding: '10px 16px', background: '#202c33', flexShrink: 0 }}>

        {/* Emoji Picker */}
        {showEmoji && (
          <div ref={emojiRef} style={{ position: 'absolute', bottom: 70, left: 16, zIndex: 100 }}>
            <EmojiPicker
              onEmojiClick={onEmojiClick}
              theme="dark"
              skinTonesDisabled
              height={380}
              width={320}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}

        {/* Emoji button */}
        <button className="icon-btn" title="Emoji" onClick={() => setShowEmoji((v) => !v)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill={showEmoji ? '#25D366' : '#aebac1'}>
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10zm-5-9h10v2H7v-2zm2-4a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0zm6 0a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0z"/>
          </svg>
        </button>

        {/* Attach */}
        <input type="file" ref={fileRef} style={{ display: 'none' }}
          onChange={handleFile} accept="image/*,application/pdf,video/mp4" />
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
            style={{ width: 46, height: 46, borderRadius: '50%', background: '#6D28D9', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s', boxShadow: '0 0 15px rgba(109, 40, 217, 0.7)' }}
            title="Send"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#fff">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z"/>
            </svg>
          </button>
        ) : (
          <button className="icon-btn" title="Voice message" style={{ width: 46, height: 46, background: '#6D28D9', borderRadius: '50%', border: 'none', boxShadow: '0 0 15px rgba(109, 40, 217, 0.7)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="#fff">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
            </svg>
          </button>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
