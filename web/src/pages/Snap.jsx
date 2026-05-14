import React, { useRef, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore';
import api from '../services/api';
import './Snap.css';

export default function Snap() {
  const location = useLocation();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const { addMessage, updateChatLastMessage, chats } = useChatStore();
  
  const initialChatId = location.state?.chatId || null;
  const [selectedChatId, setSelectedChatId] = useState(initialChatId);
  const [photo, setPhoto] = useState(null);
  const [message, setMessage] = useState('');
  const [oneTimeView, setOneTimeView] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const startCamera = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setStreaming(true);
        }
      }
    } catch (err) {
      console.error("Camera access denied or unavailable", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      setStreaming(false);
    }
  };

  const takeSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    setPhoto(canvas.toDataURL('image/png'));
    stopCamera();
  };

  const retakeSnap = () => {
    setPhoto(null);
    setMessage('');
    setOneTimeView(false);
  };

  const handleSendAction = () => {
    if (!selectedChatId) {
      setShowRecipientModal(true);
    } else {
      sendSnapToChat(selectedChatId);
    }
  };

  const dataURLtoBlob = (dataurl) => {
    let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
        bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
  };

  const sendSnapToChat = async (chatId) => {
    if (!photo) return;
    setLoading(true);
    try {
      const blob = dataURLtoBlob(photo);
      const fd = new FormData();
      fd.append('media', blob, 'snap.png');
      fd.append('isSnap', 'true');
      if (oneTimeView) {
        fd.append('oneTimeView', 'true');
      }
      if (message.trim()) {
        fd.append('content', message.trim());
      }
      
      const res = await api.post(`/chats/${chatId}/messages`, fd);
      addMessage(chatId, res.data);
      updateChatLastMessage(chatId, res.data);
      navigate(`/chat/${chatId}`);
    } catch (err) {
      console.error('Failed to send snap', err);
      alert('Failed to send snap. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="snap-wrapper">
      <button className="snap-close-btn" onClick={() => navigate(-1)}>&times;</button>
      
      {!photo ? (
        <div className="snap-camera-view">
          <video ref={videoRef} autoPlay playsInline muted className="snap-video" style={{ opacity: streaming ? 1 : 0 }} />
          
          {!streaming ? (
            <div className="snap-start-prompt">
              <button className="snap-start-btn" onClick={startCamera}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="7" width="18" height="13" rx="2" />
                  <circle cx="12" cy="13.5" r="3.5" />
                  <path d="M5 7l2-4h10l2 4" />
                </svg>
                <span>Tap to Open Camera</span>
              </button>
            </div>
          ) : (
            <div className="snap-camera-controls">
              <button className="snap-shutter-btn" onClick={takeSnap}></button>
            </div>
          )}
        </div>
      ) : (
        <div className="snap-preview-view">
          <img src={photo} alt="Snap preview" className="snap-preview-img" />
          
          <div className="snap-editor-overlay">
            <div className="snap-settings-top">
              <label className="snap-toggle-label">
                <input 
                  type="checkbox" 
                  checked={oneTimeView} 
                  onChange={e => setOneTimeView(e.target.checked)} 
                  className="snap-toggle-input"
                />
                <span className="snap-toggle-slider"></span>
                <span className="snap-toggle-text">One-Time View</span>
              </label>
              <button className="snap-retake-btn" onClick={retakeSnap}>Retake</button>
            </div>
            
            <div className="snap-bottom-controls">
              <input
                type="text"
                placeholder="Add a caption..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="snap-caption-input"
              />
              <button 
                className="snap-send-fab" 
                onClick={handleSendAction}
                disabled={loading}
              >
                {loading ? '...' : (
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M2.3 20.7 22 12 2.3 3.3 2.4 10l12.2 2-12.2 2 .1 6.7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecipientModal && (
        <div className="snap-modal-backdrop" onClick={() => setShowRecipientModal(false)}>
          <div className="snap-modal" onClick={e => e.stopPropagation()}>
            <h3>Send Snap To</h3>
            <div className="snap-chat-list">
              {chats.map(chat => {
                const name = chat.isGroup ? chat.name : chat.participants.find(p => p.userId !== location.state?.userId)?.user?.displayName || 'Chat';
                return (
                  <button 
                    key={chat.id} 
                    className="snap-chat-item"
                    onClick={() => sendSnapToChat(chat.id)}
                  >
                    <div className="snap-avatar">{name.charAt(0).toUpperCase()}</div>
                    <span>{name}</span>
                  </button>
                )
              })}
            </div>
            <button className="snap-cancel-btn" onClick={() => setShowRecipientModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
