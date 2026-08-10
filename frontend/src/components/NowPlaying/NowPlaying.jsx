import { useState } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import VinylTurntable from '../VinylTurntable/VinylTurntable';
import EqualizerCanvas from '../EqualizerCanvas/EqualizerCanvas';
import LyricsDrawer from '../LyricsDrawer/LyricsDrawer';
import ArtistModal from '../ArtistModal/ArtistModal';
import './NowPlaying.css';

const NowPlaying = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    pauseTrack,
    resumeTrack,
    seek,
    playNext,
    playPrevious,
  } = usePlayback();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // If no track has been loaded yet, do not show the bar
  if (!currentTrack) return null;


  const handlePlayPause = (e) => {
    e.stopPropagation();
    if (isPlaying) {
      pauseTrack();
    } else {
      resumeTrack();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekChange = (e) => {
    seek(parseFloat(e.target.value));
  };

  return (
    <>
      {/* Mini Bar Player */}
      <div className="now-playing" onClick={() => setIsExpanded(true)}>
        <div className="np-left">
          <div className="np-art" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', borderRadius: '50%', overflow: 'hidden', width: '40px', height: '40px', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', zIndex: 1 }}>🎵</span>
            <img 
              src={currentTrack.album_art_url || ''} 
              alt="" 
              onError={(e) => { e.target.style.display = 'none'; }}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
            />
          </div>
          <div className="np-waveform">
            {[...Array(4)].map((_, i) => (
              <span key={i} className={`wave-bar ${isPlaying ? 'animate' : ''}`} style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
        <div className="np-info">
          <span className="np-title">{currentTrack.title}</span>
          <span 
            className="np-artist" 
            onClick={(e) => { 
              e.stopPropagation(); 
              setSelectedArtist(currentTrack.artist_name || currentTrack.artist?.name); 
            }} 
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
          >
            {currentTrack.artist_name || currentTrack.artist?.name}
          </span>
        </div>
        <div className="np-controls-mini" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button 
            className="np-btn-mini" 
            onClick={(e) => { e.stopPropagation(); if (!currentTrack?.is_live_sync) playPrevious(); }}
            disabled={Boolean(currentTrack?.is_live_sync)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: currentTrack?.is_live_sync ? 'not-allowed' : 'pointer', opacity: currentTrack?.is_live_sync ? 0.35 : 1, padding: '4px' }}
            title={currentTrack?.is_live_sync ? "Live Sync Room: Songs advance automatically!" : "Previous Song"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M19 20L9 12l10-8v16zM5 19V5"/></svg>
          </button>

          <button className="np-play" onClick={handlePlayPause} aria-label="Play/Pause">
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>

          <button 
            className="np-btn-mini" 
            onClick={(e) => { e.stopPropagation(); if (!currentTrack?.is_live_sync) playNext(); }}
            disabled={Boolean(currentTrack?.is_live_sync)}
            style={{ background: 'none', border: 'none', color: '#fff', cursor: currentTrack?.is_live_sync ? 'not-allowed' : 'pointer', opacity: currentTrack?.is_live_sync ? 0.35 : 1, padding: '4px' }}
            title={currentTrack?.is_live_sync ? "Live Sync Room: Songs advance automatically!" : "Next Song"}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M5 4l10 8-10 8V4zM19 5v14"/></svg>
          </button>
        </div>
      </div>


      {/* Expanded Player Sheet Modal */}
      {isExpanded && (
        <div className="expanded-player-overlay fade-in" onClick={() => setIsExpanded(false)}>
          <div className="expanded-player" onClick={(e) => e.stopPropagation()} style={{ background: '#181825', border: '1px solid #2A2A3E', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0, 0, 0, 0.6)', color: '#FFFFFF' }}>
            <button className="player-close-btn" onClick={() => setIsExpanded(false)} style={{ cursor: 'pointer', background: 'none', border: 'none' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2"><path d="M19 9l-7 7-7-7"/></svg>
            </button>

            {/* 3D Interactive Spinning Vinyl Deck Player */}
            <VinylTurntable track={currentTrack} isPlaying={isPlaying} />

            <div className="player-meta">
              {currentTrack?.is_live_sync && (
                <span style={{ background: '#EF4444', color: '#FFFFFF', fontSize: '11px', fontWeight: 800, padding: '4px 12px', borderRadius: '12px', display: 'inline-block', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  🔴 LIVE SYNC ROOM (Auto-Advancing)
                </span>
              )}
              <h2 className="player-title" style={{ color: '#FFFFFF' }}>{currentTrack.title}</h2>
              <p 
                className="player-artist" 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedArtist(currentTrack.artist_name || currentTrack.artist?.name);
                }}
                style={{ cursor: 'pointer', textDecoration: 'underline', color: '#94A3B8', fontWeight: 600 }}
              >
                {currentTrack.artist_name || currentTrack.artist?.name}
              </p>
            </div>

            {/* Real-Time Equalizer Spectrum Canvas */}
            <EqualizerCanvas isPlaying={isPlaying} barCount={28} />

            <div className="player-scrubber-box">
              <input
                type="range"
                className="player-scrubber"
                min="0"
                max={duration || 30}
                step="0.1"
                value={currentTime}
                onChange={handleSeekChange}
              />
              <div className="player-times" style={{ color: '#CBD5E1' }}>
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="player-controls">
              <button 
                className="p-control-btn secondary" 
                onClick={() => { if (!currentTrack?.is_live_sync) playPrevious(); }}
                disabled={Boolean(currentTrack?.is_live_sync)}
                style={{ cursor: currentTrack?.is_live_sync ? 'not-allowed' : 'pointer', opacity: currentTrack?.is_live_sync ? 0.35 : 1 }}
                title={currentTrack?.is_live_sync ? "Live Sync Room: Songs advance automatically!" : "Previous Song"}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5"><path d="M19 20L9 12l10-8v16zM5 19V5"/></svg>
              </button>
              <button className="p-control-btn play-pause-main" onClick={handlePlayPause} style={{ cursor: 'pointer', background: '#FFFFFF' }}>
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#181825"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#181825"><polygon points="5,3 19,12 5,21"/></svg>
                )}
              </button>
              <button 
                className="p-control-btn secondary" 
                onClick={() => { if (!currentTrack?.is_live_sync) playNext(); }}
                disabled={Boolean(currentTrack?.is_live_sync)}
                style={{ cursor: currentTrack?.is_live_sync ? 'not-allowed' : 'pointer', opacity: currentTrack?.is_live_sync ? 0.35 : 1 }}
                title={currentTrack?.is_live_sync ? "Live Sync Room: Songs advance automatically!" : "Next Song"}
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5"><path d="M5 4l10 8-10 8V4zM19 5v14"/></svg>
              </button>
            </div>

            <button 
              onClick={() => setShowLyrics(true)}
              style={{
                marginTop: '24px',
                background: '#374151',
                border: '1px solid #4B5563',
                color: '#FFFFFF',
                padding: '10px 20px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              📜 View Scraped Lyrics & Bio
            </button>
          </div>
        </div>
      )}

      {showLyrics && (
        <LyricsDrawer track={currentTrack} onClose={() => setShowLyrics(false)} />
      )}

      {selectedArtist && (
        <ArtistModal artistName={selectedArtist} onClose={() => setSelectedArtist(null)} />
      )}

    </>
  );
};

export default NowPlaying;
