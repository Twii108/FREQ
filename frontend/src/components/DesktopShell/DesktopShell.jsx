import { useNavigate } from 'react-router-dom';
import { usePlayback } from '../../context/PlaybackContext';
import { getImageUrl } from '../../utils/imageHelper';
import './DesktopShell.css';

const DesktopShell = ({ children }) => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, volume, setVolume, toggleMute, isMuted } = usePlayback();

  return (
    <div className="desktop-wrapper">
      <div className="desktop-layout-grid">

        {/* LEFT SIDE PANEL (Desktop Info & Server Status) */}
        <div className="desktop-side-panel left-panel">
          <div className="panel-card">
            <h1 className="panel-brand-title">FREQ</h1>
            <p className="panel-brand-sub">AI Music Social Engine</p>

            <div className="status-badge">
              <div className="status-dot"></div>
              <span>Django Backend Active (:8000)</span>
            </div>
            <div className="status-badge" style={{ background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.3)', color: '#93c5fd' }}>
              <div className="status-dot" style={{ background: '#3b82f6', boxShadow: '0 0 10px #3b82f6' }}></div>
              <span>MongoDB 27017 Connected</span>
            </div>
            <div className="status-badge" style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)', color: '#c084fc' }}>
              <div className="status-dot" style={{ background: '#a855f7', boxShadow: '0 0 10px #a855f7' }}></div>
              <span>Vector ML Engine Online</span>
            </div>

            <div className="shortcut-nav">
              <button className="shortcut-link" onClick={() => navigate('/')}>
                <span>🏠</span> Home Feed
              </button>
              <button className="shortcut-link" onClick={() => navigate('/search')}>
                <span>🧠</span> AI Prompt-to-Playlist
              </button>
              <button className="shortcut-link" onClick={() => navigate('/quiz')}>
                <span>🎮</span> Music Quiz Trivia
              </button>
              <button className="shortcut-link" onClick={() => navigate('/profile')}>
                <span>👤</span> AI Music Persona Profile
              </button>
            </div>
          </div>
        </div>

        {/* CENTER MOBILE DEVICE MOCKUP FRAME */}
        <div className="mobile-device-shell">
          <div className="phone-notch-bar">
            <div className="speaker-grille"></div>
            <div className="camera-lens"></div>
          </div>
          {children}
        </div>

        {/* RIGHT SIDE PANEL (Desktop Audio Controls & Volume) */}
        <div className="desktop-side-panel right-panel">
          <div className="panel-card">
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#fff', marginBottom: '14px' }}>
              🎧 Desktop Audio Deck
            </h3>

            {currentTrack ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', padding: '10px', borderRadius: '14px' }}>
                  <img 
                    src={getImageUrl(currentTrack.album_art_url)} 
                    alt="" 
                    style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} 
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentTrack.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {currentTrack.artist_name || currentTrack.artist?.name}
                    </div>
                  </div>
                </div>

                {/* Volume & Mute Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <button 
                    onClick={toggleMute}
                    style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '6px 10px', borderRadius: '8px', fontSize: '14px' }}
                  >
                    {isMuted || volume === 0 ? '🔇' : '🔊'}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ flex: 1, accentColor: '#a855f7', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', width: '30px' }}>
                    {Math.round((isMuted ? 0 : volume) * 100)}%
                  </span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                No track playing. Click any song to test turntable & audio playback.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DesktopShell;
