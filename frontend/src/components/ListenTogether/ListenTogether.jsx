import { useState, useEffect } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import './ListenTogether.css';

const ListenTogether = () => {
  const [roomData, setRoomData] = useState(null);
  const [floatingEmojis, setFloatingEmojis] = useState([]);
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayback();

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
          id: 't1',
          title: 'Blinding Lights',
          artist_name: 'The Weeknd',
          album_art_url: '/default_track.jpg',
          preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a'
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

  if (!roomData || !displayTrack) return null;

  return (
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
            <button key={idx} className="lt-emoji-btn" onClick={() => handleEmojiClick(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ListenTogether;
