import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function Settings() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();

  const [displayName, setDisplayName]   = useState(user?.displayName || '');
  const [about, setAbout]               = useState(user?.about || '');
  const [phone, setPhone]               = useState(user?.phone || '');
  const [editingName, setEditingName]   = useState(false);
  const [editingAbout, setEditingAbout] = useState(false);
  const [editingPhone, setEditingPhone] = useState(false);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState('');

  const [activeSection, setActiveSection] = useState(null);
  // activeSection: null | 'privacy' | 'notifications' | 'help'

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const saveField = async (field, value) => {
    setSaving(true);
    try {
      const payload = {};
      if (field === 'displayName') payload.displayName = value.trim();
      if (field === 'about')       payload.about       = value.trim();
      if (field === 'phone')       payload.phoneNumber = value.trim();
      const res = await api.put('/auth/profile', payload);
      // sync global store
      setUser(res.data);
      // sync local state from server response so UI stays consistent
      if (res.data.displayName !== undefined) setDisplayName(res.data.displayName || '');
      if (res.data.about       !== undefined) setAbout(res.data.about || '');
      if (res.data.phone       !== undefined) setPhone(res.data.phone || '');
      showToast('✓ Saved');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const initials = (displayName || user?.email || 'U').charAt(0).toUpperCase();

  /* If a sub-section is open, render it */
  if (activeSection === 'privacy')       return <PrivacySection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'notifications') return <NotificationsSection onBack={() => setActiveSection(null)} />;
  if (activeSection === 'help')          return <HelpSection onBack={() => setActiveSection(null)} />;

  return (
    <div className="settings-page">
      {/* ── Header ── */}
      <div className="settings-header">
        <button className="settings-back-btn" onClick={() => navigate('/')} title="Back">
          <ArrowLeftIcon />
        </button>
        <h1>Settings</h1>
      </div>

      <div className="settings-scroll">
        {/* ── Profile card ── */}
        <div className="settings-profile-card">
          <div className="settings-avatar-wrap">
            <div className="settings-avatar">{initials}</div>
            <button className="settings-avatar-edit" title="Change photo">
              <CameraIcon />
            </button>
          </div>

          {/* Name */}
          <div className="settings-profile-field">
            <span className="spf-label">Your name</span>
            {editingName ? (
              <div className="spf-edit-row">
                <input
                  className="spf-input"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  autoFocus
                  maxLength={60}
                />
                <button className="spf-save" disabled={saving}
                  onClick={() => { saveField('displayName', displayName); setEditingName(false); }}>
                  <CheckIcon />
                </button>
                <button className="spf-cancel" onClick={() => { setDisplayName(user?.displayName || ''); setEditingName(false); }}>
                  <XIcon />
                </button>
              </div>
            ) : (
              <div className="spf-view-row" onClick={() => setEditingName(true)}>
                <span className="spf-value">{displayName || <em>Add your name</em>}</span>
                <PencilIcon />
              </div>
            )}
          </div>

          {/* About */}
          <div className="settings-profile-field">
            <span className="spf-label">About</span>
            {editingAbout ? (
              <div className="spf-edit-row">
                <input
                  className="spf-input"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  autoFocus
                  maxLength={139}
                  placeholder="Hey there! I am using RuroxZ Chat"
                />
                <button className="spf-save" disabled={saving}
                  onClick={() => { saveField('about', about); setEditingAbout(false); }}>
                  <CheckIcon />
                </button>
                <button className="spf-cancel" onClick={() => { setAbout(user?.about || ''); setEditingAbout(false); }}>
                  <XIcon />
                </button>
              </div>
            ) : (
              <div className="spf-view-row" onClick={() => setEditingAbout(true)}>
                <span className="spf-value">{about || <em>Hey there! I am using RuroxZ Chat</em>}</span>
                <PencilIcon />
              </div>
            )}
          </div>

          {/* Phone */}
          <div className="settings-profile-field">
            <span className="spf-label">Phone</span>
            {editingPhone ? (
              <div className="spf-edit-row">
                <input
                  className="spf-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  autoFocus
                  placeholder="+91XXXXXXXXXX"
                />
                <button className="spf-save" disabled={saving}
                  onClick={() => { saveField('phone', phone); setEditingPhone(false); }}>
                  <CheckIcon />
                </button>
                <button className="spf-cancel" onClick={() => { setPhone(user?.phone || ''); setEditingPhone(false); }}>
                  <XIcon />
                </button>
              </div>
            ) : (
              <div className="spf-view-row" onClick={() => setEditingPhone(true)}>
                <span className="spf-value">{phone || <em>Add phone number</em>}</span>
                <PencilIcon />
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="settings-profile-field">
            <span className="spf-label">Email</span>
            <div className="spf-view-row no-hover">
              <span className="spf-value muted">{user?.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* ── Setting rows ── */}
        <div className="settings-rows">
          <SettingRow
            icon={<PrivacyIcon />}
            label="Privacy"
            sub="Last seen, profile photo, about"
            onClick={() => setActiveSection('privacy')}
          />
          <SettingRow
            icon={<BellIcon />}
            label="Notifications"
            sub="Message, group & call tones"
            onClick={() => setActiveSection('notifications')}
          />
          <SettingRow
            icon={<ThemeIcon />}
            label="Theme"
            sub="Dark"
          />
          <SettingRow
            icon={<HelpIcon />}
            label="Help"
            sub="FAQ, contact us, privacy policy"
            onClick={() => setActiveSection('help')}
          />
        </div>

        {/* ── Logout ── */}
        <button className="settings-logout-btn" onClick={handleLogout}>
          <LogoutIcon />
          Log out
        </button>
      </div>

      {/* Toast */}
      {toast && <div className="settings-toast">{toast}</div>}
    </div>
  );
}

/* ── Privacy sub-section ── */
function PrivacySection({ onBack }) {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}><ArrowLeftIcon /></button>
        <h1>Privacy</h1>
      </div>
      <div className="settings-scroll">
        <div className="settings-rows">
          <SettingRow icon={<EyeIcon />}    label="Last seen & online" sub="Everyone" />
          <SettingRow icon={<UserIcon />}   label="Profile photo"      sub="Everyone" />
          <SettingRow icon={<InfoIcon />}   label="About"              sub="Everyone" />
          <SettingRow icon={<CheckDblIcon />} label="Read receipts"    sub="If turned off, you won't send or receive read receipts" toggle defaultChecked />
          <SettingRow icon={<GroupIcon />}  label="Groups"             sub="Everyone" />
        </div>
        <div className="settings-section-label">Advanced</div>
        <div className="settings-rows">
          <SettingRow icon={<LockIcon />}   label="Blocked contacts"   sub="0 blocked" />
          <SettingRow icon={<LockIcon />}   label="Two-step verification" sub="Disabled" />
        </div>
      </div>
    </div>
  );
}

/* ── Notifications sub-section ── */
function NotificationsSection({ onBack }) {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}><ArrowLeftIcon /></button>
        <h1>Notifications</h1>
      </div>
      <div className="settings-scroll">
        <div className="settings-section-label">Messages</div>
        <div className="settings-rows">
          <SettingRow icon={<BellIcon />}   label="Notification tone"  sub="Default" />
          <SettingRow icon={<BellIcon />}   label="Vibrate"            sub="Default" />
          <SettingRow icon={<BellIcon />}   label="Popup notification" sub="No popup" />
          <SettingRow icon={<BellIcon />}   label="Light"              sub="None" />
          <SettingRow icon={<BellIcon />}   label="Use high priority notifications" toggle defaultChecked />
        </div>
        <div className="settings-section-label">Groups</div>
        <div className="settings-rows">
          <SettingRow icon={<BellIcon />}   label="Notification tone"  sub="Default" />
          <SettingRow icon={<BellIcon />}   label="Vibrate"            sub="Default" />
        </div>
      </div>
    </div>
  );
}

/* ── Help sub-section ── */
function HelpSection({ onBack }) {
  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back-btn" onClick={onBack}><ArrowLeftIcon /></button>
        <h1>Help</h1>
      </div>
      <div className="settings-scroll">
        <div className="settings-rows">
          <SettingRow icon={<HelpIcon />}   label="FAQ" />
          <SettingRow icon={<HelpIcon />}   label="Contact us" />
          <SettingRow icon={<LockIcon />}   label="Privacy policy" />
          <SettingRow icon={<InfoIcon />}   label="App info" sub="Version 1.0.0" />
        </div>
      </div>
    </div>
  );
}

/* ── Reusable setting row ── */
function SettingRow({ icon, label, sub, onClick, toggle, defaultChecked }) {
  return (
    <div className={`settings-row ${onClick ? 'clickable' : ''}`} onClick={onClick}>
      <div className="settings-row-icon">{icon}</div>
      <div className="settings-row-body">
        <span className="settings-row-label">{label}</span>
        {sub && <span className="settings-row-sub">{sub}</span>}
      </div>
      {toggle
        ? <label className="settings-toggle" onClick={(e) => e.stopPropagation()}>
            <input type="checkbox" defaultChecked={defaultChecked} />
            <span className="settings-toggle-slider" />
          </label>
        : onClick
        ? <ChevronIcon />
        : null
      }
    </div>
  );
}

/* ── Icons ── */
const ic = (d, extra = '') => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={extra}>{d}</svg>
);

function ArrowLeftIcon()  { return ic(<><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>); }
function PencilIcon()     { return ic(<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>); }
function CheckIcon()      { return ic(<><polyline points="20 6 9 17 4 12"/></>); }
function XIcon()          { return ic(<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>); }
function CameraIcon()     { return ic(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>); }
function PrivacyIcon()    { return ic(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>); }
function BellIcon()       { return ic(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>); }
function ThemeIcon()      { return ic(<><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>); }
function HelpIcon()       { return ic(<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>); }
function LogoutIcon()     { return ic(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>); }
function EyeIcon()        { return ic(<><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>); }
function UserIcon()       { return ic(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>); }
function InfoIcon()       { return ic(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>); }
function CheckDblIcon()   { return ic(<><polyline points="17 1 9 9 5 5"/><polyline points="21 5 9 17 3 11"/></>); }
function GroupIcon()      { return ic(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>); }
function LockIcon()       { return ic(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>); }
function ChevronIcon()    { return ic(<><polyline points="9 18 15 12 9 6"/></>); }
