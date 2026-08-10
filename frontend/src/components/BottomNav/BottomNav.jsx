import { useLocation, useNavigate } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { path: '/', icon: 'globe', label: 'Discover' },
  { path: '/community', icon: 'matches', label: 'Matches' },
  { path: '/search', icon: 'search', label: 'Search' },
  { path: '/quiz', icon: 'music', label: 'Quiz' },
  { path: '/profile', icon: 'profile', label: 'Profile' },
];

const icons = {
  globe: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />
    </svg>
  ),
  matches: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="9" width="12" height="12" rx="2" ry="2" />
      <path d="M9 3h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2" />
    </svg>
  ),
  search: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  music: (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {/* Game Controller Body */}
      <rect x="2" y="6" width="20" height="12" rx="4" />
      {/* Controller D-Pad */}
      <line x1="6" y1="12" x2="10" y2="12" />
      <line x1="8" y1="10" x2="8" y2="14" />
      {/* Musical Note inside right side */}
      <path d="M15 14v-5l4-1v5" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" />
      <circle cx="18" cy="13" r="1.5" fill="currentColor" />
    </svg>
  ),

  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Custom matching logic for tabs activation
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bottom-nav freq-glass">
      {tabs.map(tab => (
        <button key={tab.path} className={`nav-tab ${isActive(tab.path) ? 'active' : ''}`} onClick={() => navigate(tab.path)}>
          <span className="nav-icon">{icons[tab.icon]}</span>
        </button>
      ))}
    </nav>
  );
};
export default BottomNav;
