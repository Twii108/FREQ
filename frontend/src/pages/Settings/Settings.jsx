import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState(null); // null (main settings list), or section key
  const [copied, setCopied] = useState(false);
  const referralCode = 'RyNz2q2741204';

  // Delete account fields
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState([]);

  useEffect(() => {
    if (activeSection === 'blocked') {
      fetchBlockedUsers();
    }
  }, [activeSection]);

  const fetchBlockedUsers = async () => {
    try {
      const res = await authAPI.getBlockedUsers();
      setBlockedUsers(res.data);
    } catch {}
  };

  // Notification fields
  const [pushNotif, setPushNotif] = useState(true);
  const [emailNotif, setEmailNotif] = useState(false);
  const [dmBadges, setDmBadges] = useState(true);

  // Contact Support / Feedback fields
  const [supportMessage, setSupportMessage] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteAccountSubmit = async (e) => {
    e.preventDefault();
    setDeleteError('');

    if (deletePassword !== deleteConfirmPassword) {
      setDeleteError('Passwords do not match.');
      return;
    }

    try {
      await authAPI.deleteAccount(deletePassword);
      // Clean tokens and redirect
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      window.location.href = '/login';
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Incorrect password. Account deletion failed.';
      setDeleteError(errMsg);
    }
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    alert('Thank you! Your support request has been submitted.');
    setSupportMessage('');
    setActiveSection(null);
  };

  const handleFeedbackSubmit = (e) => {
    e.preventDefault();
    alert('Thank you for your feedback!');
    setFeedbackMessage('');
    setActiveSection(null);
  };

  const handleUnblock = async (blockedUser) => {
    try {
      await authAPI.blockToggle(blockedUser.id);
      setBlockedUsers(blockedUsers.filter(u => u.id !== blockedUser.id));
      alert(`${blockedUser.username} has been unblocked.`);
    } catch {
      alert('Failed to unblock user.');
    }
  };

  // Removed: preferences, music, ads
  const settingsList = [
    { key: 'account', title: 'Account' },
    { key: 'blocked', title: 'Blocked accounts' },
    { key: 'notifications', title: 'Notifications' },
    { key: 'contact', title: 'Contact Us' },
    { key: 'about', title: 'About' },
    { key: 'feedback', title: 'Send Feedback' }
  ];

  // Render Sub-sections
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'account':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">Account Details</h2>
            <div className="settings-card freq-glass">
              <div className="detail-row">
                <span className="detail-label">Username</span>
                <span className="detail-value">@{user?.username || 'user'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Email Address</span>
                <span className="detail-value">{user?.email || 'user@example.com'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Age</span>
                <span className="detail-value">{user?.age || '20'} years old</span>
              </div>
            </div>

            <div className="settings-danger-zone">
              <h3 className="section-subtitle-lbl" style={{ color: 'var(--freq-error)' }}>Danger Zone</h3>
              
              {!showDeleteConfirm ? (
                <button 
                  className="delete-acc-trigger-btn" 
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  Delete Account
                </button>
              ) : (
                <form onSubmit={handleDeleteAccountSubmit} className="delete-account-form">
                  <div className="warning-callout">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                      <line x1="12" y1="9" x2="12" y2="13"></line>
                      <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                    <span>Warning: Account deletion is permanent and cannot be undone.</span>
                  </div>
                  
                  <div className="input-group">
                    <label>Enter Password:</label>
                    <input 
                      type="password" 
                      className="freq-input" 
                      value={deletePassword} 
                      onChange={(e) => setDeletePassword(e.target.value)} 
                      required 
                      placeholder="Password"
                    />
                  </div>

                  <div className="input-group">
                    <label>Confirm Password:</label>
                    <input 
                      type="password" 
                      className="freq-input" 
                      value={deleteConfirmPassword} 
                      onChange={(e) => setDeleteConfirmPassword(e.target.value)} 
                      required 
                      placeholder="Confirm Password"
                    />
                  </div>

                  {deleteError && (
                    <div className="error-toast">
                      {deleteError}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    <button type="submit" className="delete-btn-action">
                      Delete Permanently
                    </button>
                    <button type="button" className="freq-btn-outline cancel-btn-action" onClick={() => setShowDeleteConfirm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        );

      case 'blocked':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">Blocked Accounts</h2>
            <div className="settings-card freq-glass">
              {blockedUsers.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--freq-text-dim)" strokeWidth="2" style={{ marginBottom: '8px' }}>
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                    <path d="M12 8v4M12 16h.01"/>
                  </svg>
                  <p style={{ fontSize: '13px', color: 'var(--freq-text-dim)' }}>No blocked accounts</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {blockedUsers.map(username => (
                    <div key={username} className="blocked-user-row">
                      <span className="blocked-username">@{username}</span>
                      <button 
                        onClick={() => handleUnblock(username)} 
                        className="unblock-btn"
                      >
                        Unblock
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">Notification Options</h2>
            <div className="settings-card freq-glass" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="toggle-row-premium">
                <div className="toggle-meta">
                  <span className="toggle-label-text">Push Notifications</span>
                  <span className="toggle-desc-text">Alerts for likes, comments, and recommendations</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={pushNotif} onChange={(e) => setPushNotif(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-row-premium">
                <div className="toggle-meta">
                  <span className="toggle-label-text">Email Alerts</span>
                  <span className="toggle-desc-text">Weekly digests and key account activity</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={emailNotif} onChange={(e) => setEmailNotif(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-row-premium">
                <div className="toggle-meta">
                  <span className="toggle-label-text">Direct Message Badges</span>
                  <span className="toggle-desc-text">Show count badges for unread chat messages</span>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={dmBadges} onChange={(e) => setDmBadges(e.target.checked)} />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">Contact Support</h2>
            <form onSubmit={handleSupportSubmit} className="settings-card freq-glass feedback-form-box">
              <p className="form-description">
                Having issues with matching, chat rooms, or audio? Message our support team below and we will respond via email.
              </p>
              <div className="input-group">
                <label>Your Message:</label>
                <textarea 
                  className="freq-input text-area-premium" 
                  value={supportMessage}
                  onChange={(e) => setSupportMessage(e.target.value)}
                  placeholder="Explain the issue in detail..."
                  required
                />
              </div>
              <button type="submit" className="freq-btn-primary submit-btn-premium">Submit Support Ticket</button>
            </form>
          </div>
        );

      case 'about':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">About FREQ</h2>
            <div className="settings-card freq-glass about-card">
              <span className="settings-logo freq-gradient-text">FREQ</span>
              <p className="about-app-desc">
                FREQ is a next-generation music social network built for audiophiles. 
                We connect people through a shared passion for music, mapping taste matches, 
                generating personalized vinyl walls, and powering live artist chatrooms.
              </p>

              <div className="about-dev-box">
                <span className="dev-header-lbl">Developer & Support Info</span>
                <div className="dev-info-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--freq-purple-light)" strokeWidth="2.5">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                  <span className="dev-email-text">dev@freq.music</span>
                </div>
                <div className="dev-info-row">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--freq-purple-light)" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span className="dev-email-text">www.freq.fm</span>
                </div>
              </div>

              <div className="about-links-box">
                <a href="#terms" onClick={(e) => { e.preventDefault(); alert('FREQ Terms of Service version 1.0.0'); }}>Terms of Service</a>
                <span className="link-divider">•</span>
                <a href="#privacy" onClick={(e) => { e.preventDefault(); alert('FREQ Privacy Policy'); }}>Privacy Policy</a>
              </div>

              <span className="copyright-lbl">© 2026 FREQ App. All rights reserved.</span>
            </div>
          </div>
        );

      case 'feedback':
        return (
          <div className="section-container fade-in">
            <h2 className="section-title-lbl">Send Feedback</h2>
            <form onSubmit={handleFeedbackSubmit} className="settings-card freq-glass feedback-form-box">
              <p className="form-description">
                We are constantly expanding FREQ. Let us know what features, design changes, or music widgets you would like to see!
              </p>
              <div className="input-group">
                <label>Feedback & Ideas:</label>
                <textarea 
                  className="freq-input text-area-premium" 
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  placeholder="Tell us what you think..."
                  required
                />
              </div>
              <button type="submit" className="freq-btn-primary submit-btn-premium">Send Feedback</button>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-page page-container fade-in">
      {/* Settings Header */}
      <header className="settings-header freq-glass">
        <button 
          className="settings-back-btn" 
          onClick={() => {
            if (activeSection) {
              setActiveSection(null);
            } else {
              navigate(-1);
            }
          }} 
          aria-label="Back"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <h1 className="settings-title">
          {activeSection 
            ? settingsList.find(i => i.key === activeSection)?.title 
            : 'Settings'
          }
        </h1>
        <div style={{ width: '20px' }}></div> {/* Spacer */}
      </header>

      <div className="settings-content">
        {!activeSection ? (
          <>
            <div className="settings-list">
              {settingsList.map((item, idx) => (
                <div key={idx} className="settings-item" onClick={() => setActiveSection(item.key)}>
                  <span className="settings-item-title">{item.title}</span>
                  <span className="settings-item-chevron">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--freq-text-dim)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </span>
                </div>
              ))}
            </div>

            {/* Log Out Button */}
            <div className="logout-container">
              <button className="settings-logout-btn" onClick={logout}>
                LOG OUT
              </button>
            </div>
          </>
        ) : (
          renderSectionContent()
        )}
      </div>
    </div>
  );
};

export default Settings;
