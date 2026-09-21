import { useState, useEffect } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import ImmersiveRoom from '../ImmersiveRoom/ImmersiveRoom';
import './ListenTogether.css';

const ListenTogether = () => {
  const [roomData, setRoomData] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayback();
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user'))?.username || 'you'; } catch { return 'you'; } })();

  useEffect(() => {
    fetchSyncRoom();
  }, []);

  const fetchSyncRoom = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/social/listen-together/');
      const data = await res.json();
      setRoomData(data);
    } catch {
      setRoomData({
        room_name: '⚡ Midnight Frequencies Live Sync',
        listeners_count: 18,
        current_track: {
          id: 'master-1',
          title: 'Blinding Lights',
          artist_name: 'The Weeknd',
          album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/400x400bb.jpg',
          preview_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
        },
        active_reactions: ['🔥', '💖', '⚡', '🎧', '🕺']
      });
    }
  };

  const handleEmojiClick = (emoji) => {
    const newEmoji = {
      id: Date.now() + Math.random(),
      emoji,
      left: Math.random() * 80 + 10,
    };
    setFloatingEmojis(prev => [...prev, newEmoji]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== newEmoji.id));
    }, 2000);
  };

  const isLiveSyncActive = Boolean(currentTrack?.is_live_sync);
  const displayTrack = isLiveSyncActive ? currentTrack : roomData?.current_track;
  const isThisPlaying = isLiveSyncActive && isPlaying;

  const handleSyncPlay = () => {
    if (isThisPlaying) {
      pauseTrack();
    } else if (currentTrack?.is_live_sync) {
      resumeTrack();
    } else if (roomData?.current_track) {
      playTrack({
        ...roomData.current_track,
        is_live_sync: true
      });
    }
  };

  const [isImmersiveOpen, setIsImmersiveOpen] = useState(false);
  const [roomMood, setRoomMood] = useState('chill');

  // Auto-start music when entering the room
  const handleEnterRoom = () => {
    // If nothing is playing, start the live sync track immediately
    if (!isPlaying || !currentTrack) {
      const track = roomData?.current_track;
      if (track) {
        playTrack({ ...track, is_live_sync: true });
      }
    } else if (currentTrack && !currentTrack.is_live_sync) {
      // Something else is playing — switch to live sync track
      const track = roomData?.current_track;
      if (track) playTrack({ ...track, is_live_sync: true });
    }
    setIsImmersiveOpen(true);
  };

  if (!roomData || !displayTrack) return null;

  return (
    <>
      {isImmersiveOpen && (
        <ImmersiveRoom 
          onClose={() => setIsImmersiveOpen(false)} 
          mood={roomMood} 
          track={displayTrack} 
          currentUser={currentUser}
        />
      )}
      <div className="listen-together-card freq-glass fade-in">
        <div className="lt-header">
          <div className="lt-badge">
            <span className="lt-pulse"></span>
            <span className="lt-live-text">LIVE SYNC ROOM</span>
          </div>
          <div className="lt-listeners-count">
            <span>👥 {roomData.listeners_count} Listening Now</span>
          </div>
        </div>

        <div className="lt-main-stage">
          <div className="lt-album-wrap">
            <img src={displayTrack.album_art_url || displayTrack.cover_image_url || '/default_track.jpg'} alt="" className={`lt-album-art ${isThisPlaying ? 'spinning' : ''}`} />
            <button className="lt-sync-play-btn" onClick={handleSyncPlay}>
              {isThisPlaying ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>
          </div>

          <div className="lt-track-info">
            <h3 className="lt-title">{displayTrack.title}</h3>
            <p className="lt-artist">{displayTrack.artist_name || displayTrack.artist?.name}</p>
            <span className="lt-room-subtitle">{roomData.room_name}</span>
          </div>
        </div>

        {/* Launch AR/VR Button */}
        <button 
          className="launch-immersive-btn"
          onClick={handleEnterRoom}
          style={{
            marginTop: '15px', width: '100%', padding: '12px', background: 'var(--freq-bg-input)', color: 'var(--freq-cyan)', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: 'var(--freq-shadow-sm)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          Enter FREQ Spatial (AR/VR)
        </button>

        {/* Floating Emoji Canvas Overlay */}
        <div className="lt-floating-layer">
          {floatingEmojis.map(e => (
            <span key={e.id} className="floating-emoji" style={{ left: `${e.left}%` }}>
              {e.emoji}
            </span>
          ))}
        </div>

        {/* Reaction Bar */}
        <div className="lt-reaction-bar">
          <span className="lt-react-label">React Live:</span>
          <div className="lt-emoji-buttons">
            {roomData.active_reactions.map((emoji, idx) => (
              <button key={idx} className="lt-emoji-btn" onClick={() => {
                handleEmojiClick(emoji);
                // Simple simulated sentiment based on emoji clicked
                if (['🔥', '⚡', '🕺'].includes(emoji)) setRoomMood('hype');
                else if (['☕', '🌌', '🌧️'].includes(emoji)) setRoomMood('chill');
                else if (['😭', '💔'].includes(emoji)) setRoomMood('melancholic');
              }}>
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default ListenTogether;
