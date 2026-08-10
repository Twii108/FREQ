import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isLikesOpen, setIsLikesOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [likedPosts, setLikedPosts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);

  const notifPollRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 5 seconds for new notifications and unread counts
      notifPollRef.current = setInterval(fetchNotifications, 5000);
    }
    return () => { if (notifPollRef.current) clearInterval(notifPollRef.current); };
  }, [user, location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = async () => {
    try {
      const res = await authAPI.getNotifications();
      setNotifications(res.data || []);
      const countRes = await authAPI.getUnreadCount();
      setUnreadCount(countRes.data.count || 0);
      setUnreadChatsCount(countRes.data.chats_count || 0);
    } catch {

      // Mock notifications (excluding legacy chat ones)
      setNotifications([
        { 
          id: 1, 
          title: 'New Message', 
          body: 'alex_beats sent you a direct message.', 
          created_at: new Date().toISOString(),
          from_user: { username: 'alex_beats', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' }
        },
        { 
          id: 2, 
          title: 'Badge Earned!', 
          body: 'Congratulations! You earned the Swiftie Elite badge.', 
          created_at: new Date(Date.now() - 3600000).toISOString(),
          from_user: { username: 'system', avatar_url: '' }
        },
        { 
          id: 3, 
          title: 'New Follower', 
          body: 'melody_finder is now following you.', 
          created_at: new Date(Date.now() - 7200000).toISOString(),
          from_user: { username: 'melody_finder', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' }
        }
      ]);
      setUnreadCount(3);
    }
  };

  const handleOpenNotifications = async () => {
    setIsNotifOpen(true);
    setUnreadCount(0);
    try {
      await authAPI.markAllNotificationsRead();
    } catch {}
  };

  const handleSidebarNavigate = (path) => {
    setIsSidebarOpen(false);
    navigate(path);
  };

  return (
    <>
      <header className="header freq-glass">
        {/* Top Left Menu & Brand Group */}
        <div className="header-left-group">
          <button className="header-menu" aria-label="Menu" onClick={() => setIsSidebarOpen(true)} style={{ color: 'var(--freq-text)' }}>
            <svg width="22" height="18" viewBox="0 0 22 18" fill="none">
              <path d="M1 1h20M1 9h20M1 17h20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>

          <div className="header-brand" onClick={() => navigate('/')}>
            <span className="header-brand-text">FREQ</span>
          </div>
        </div>


        {/* Top Right Action Icons */}
        <div className="header-actions">
          {/* Chat Rooms / Direct Messages Button */}
          <button className="header-icon header-notif" aria-label="Chatrooms" onClick={() => navigate('/chats')} title="Direct Messages & Listener Rooms">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            {unreadChatsCount > 0 && <span className="notif-badge" style={{ backgroundColor: 'var(--freq-purple)' }}>{unreadChatsCount}</span>}
          </button>

          {/* Bell/Notifications Button */}
          <button className="header-icon header-notif" aria-label="Notifications" onClick={handleOpenNotifications} title="Notifications">
            <svg width="20" height="22" viewBox="0 0 18 20" fill="none">
              <path d="M14 7A5 5 0 004 7c0 5.25-2 6.5-2 6.5h14S14 12.25 14 7zM10.73 17a2 2 0 01-3.46 0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </button>          {/* Theme Toggle Button */}
          <button 
            className="header-icon" 
            aria-label="Toggle Theme" 
            onClick={() => {
              const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
              if (isDark) {
                document.documentElement.removeAttribute('data-theme');
                localStorage.setItem('freq_theme', 'light');
              } else {
                document.documentElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('freq_theme', 'dark');
              }
            }} 
            title="Toggle Theme"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          </button>
          {/* User Profile Avatar Icon */}
          <div className="header-avatar" onClick={() => navigate(`/profile/${user?.username || ''}`)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden' }}>
            <div className="avatar-placeholder" style={{ zIndex: 1, fontSize: '12px', fontWeight: 800 }}>{user?.username?.[0]?.toUpperCase() || 'F'}</div>
            {user?.avatar_url && (
              <img 
                src={user.avatar_url} 
                alt="" 
                onError={(e) => { e.target.style.display = 'none'; }} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
              />
            )}
          </div>
        </div>
      </header>

      {/* Sidebar Slide-out Drawer */}
      {isSidebarOpen && (
        <div className="sidebar-overlay fade-in" onClick={() => setIsSidebarOpen(false)}>
          <div className="sidebar freq-glass slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-header">
              <div className="sb-avatar" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden' }}>
                <div className="sb-avatar-placeholder" style={{ zIndex: 1, fontSize: '18px', fontWeight: 800 }}>{user?.username?.[0]?.toUpperCase()}</div>
                {user?.avatar_url && (
                  <img 
                    src={user.avatar_url} 
                    alt="" 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                  />
                )}
              </div>
              <div className="sb-info">
                <h3>{user?.username || 'Guest Listener'}</h3>
                <p>{user?.email}</p>
              </div>
            </div>
            
            <div className="sidebar-links">
              <button onClick={() => handleSidebarNavigate('/')}>🏠 Home Discover</button>
              <button onClick={() => handleSidebarNavigate('/concerts')}>🎟️ Upcoming Concerts</button>
              <button onClick={() => handleSidebarNavigate(`/profile/${user?.username || ''}`)}>💿 Vinyl Wall</button>
              <button onClick={() => handleSidebarNavigate('/chats')}>💬 Chats & Rooms</button>
              <button onClick={() => handleSidebarNavigate('/quiz')}>🎵 Music Trivia</button>
              <button onClick={() => handleSidebarNavigate('/community')}>👥 Community Match</button>
              <button onClick={() => handleSidebarNavigate('/search')}>🔍 Search catalog</button>
            </div>

            <button className="sidebar-logout" onClick={() => { setIsSidebarOpen(false); logout(); }}>
              🚪 Log Out
            </button>
          </div>
        </div>
      )}

      {/* Notifications Dropdown Modal */}
      {isNotifOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsNotifOpen(false)}>
          <div className="header-dropdown-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="hdm-header">
              <h3>Notifications</h3>
              <button className="hdm-close" onClick={() => setIsNotifOpen(false)}>✕</button>
            </div>
            <div className="hdm-content">
              {notifications.length === 0 ? (
                <p className="hdm-empty">No new notifications</p>
              ) : (
                notifications.map(notif => {
                  const avatar = notif.from_user?.avatar_url;
                  const usernameInitials = notif.from_user?.username?.[0]?.toUpperCase() || 'F';
                  return (
                    <div key={notif.id} className="notif-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--freq-purple-light)' }}>
                      <div className="notif-avatar" style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--freq-purple-light)', background: 'var(--freq-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--freq-text)', zIndex: 1 }}>{usernameInitials}</div>
                        {avatar && (
                          <img 
                            src={avatar} 
                            alt="" 
                            onError={(e) => { e.target.style.display = 'none'; }} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} 
                          />
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--freq-text)' }}>{notif.title}</strong>
                        <p style={{ fontSize: '12px', color: 'var(--freq-text-secondary)', margin: 0 }}>{notif.body}</p>
                      </div>
                    </div>
                  );

                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Likes/Saved Drawer Modal */}
      {isLikesOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsLikesOpen(false)}>
          <div className="header-dropdown-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="hdm-header">
              <h3>Your Bookmarks</h3>
              <button className="hdm-close" onClick={() => setIsLikesOpen(false)}>✕</button>
            </div>
            <div className="hdm-content">
              <p className="hdm-empty">No bookmarked posts or tracks yet. Tap 🔖 on feed to save them here!</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
