import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PlaybackProvider } from './context/PlaybackContext';
import './styles/globals.css';

// Page imports
import Login from './pages/Login/Login';
import Register from './pages/Register/Register';
import Home from './pages/Home/Home';
import Profile from './pages/Profile/Profile';
import Chats from './pages/Chats/Chats';
import ChatRoom from './pages/ChatRoom/ChatRoom';
import MusicQuiz from './pages/MusicQuiz/MusicQuiz';
import Community from './pages/Community/Community';
import Search from './pages/Search/Search';
import Settings from './pages/Settings/Settings';
import Concerts from './pages/Concerts/Concerts';

// Component imports
import Header from './components/Header/Header';
import BottomNav from './components/BottomNav/BottomNav';
import NowPlaying from './components/NowPlaying/NowPlaying';
import AmbientGlow from './components/AmbientGlow/AmbientGlow';

import { useState, useEffect } from 'react';
import SplashScreen from './components/SplashScreen/SplashScreen';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading FREQ...</div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('freq_theme') || 'light';
    if (savedTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, []);

  const shouldShowHeader = isAuthenticated && location.pathname !== '/settings' && !location.pathname.startsWith('/chat/');
  
  return (
    <div className="app-container-fullscreen">
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
      <AmbientGlow />
      {shouldShowHeader && <Header />}

      <div className="app-body-layout">
        <main className="app-main">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile/:username?" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><Chats /></ProtectedRoute>} />
            <Route path="/chat/:roomId" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/quiz" element={<ProtectedRoute><MusicQuiz /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/concerts" element={<ProtectedRoute><Concerts /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>

      {isAuthenticated && <NowPlaying />}
      {isAuthenticated && <BottomNav />}
    </div>
  );
};



function App() {
  return (
    <Router>
      <AuthProvider>
        <PlaybackProvider>
          <AppContent />
        </PlaybackProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
