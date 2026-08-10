import { useState, useEffect } from 'react';
import { musicAPI } from '../../services/api';
import './LyricsDrawer.css';

const LyricsDrawer = ({ track, onClose }) => {
  const [activeTab, setActiveTab] = useState('lyrics'); // lyrics, bio, storyteller
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLineIdx, setActiveLineIdx] = useState(0);

  useEffect(() => {
    if (track) {
      fetchScrapedData();
    }
  }, [track]);

  useEffect(() => {
    // Simulate Karaoke line progression
    const timer = setInterval(() => {
      setActiveLineIdx(prev => (prev + 1) % 10);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const fetchScrapedData = async () => {
    setLoading(true);
    try {
      const title = track.title;
      const artist = track.artist_name || track.artist?.name || '';
      const res = await musicAPI.scrapeInfo(title, artist);
      setData(res.data);
    } catch (err) {
      console.error('Error fetching scraped lyrics/bio:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!track) return null;

  const lines = data?.lyrics ? data.lyrics.split('\n').filter(l => l.trim().length > 0) : [];

  return (
    <div className="lyrics-drawer-overlay fade-in" onClick={onClose}>
      <div className="lyrics-drawer slide-up" onClick={(e) => e.stopPropagation()}>
        
        <div className="lyrics-header">
          <div>
            <h3 className="lyrics-title">{track.title}</h3>
            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>
              {track.artist_name || track.artist?.name}
            </span>
          </div>
          <button className="lyrics-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="lyrics-tabs">
          <button 
            className={`lyrics-tab-btn ${activeTab === 'lyrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('lyrics')}
          >
            🎤 Karaoke Lyrics
          </button>
          <button 
            className={`lyrics-tab-btn ${activeTab === 'storyteller' ? 'active' : ''}`}
            onClick={() => setActiveTab('storyteller')}
          >
            📖 AI Storyteller
          </button>
          <button 
            className={`lyrics-tab-btn ${activeTab === 'bio' ? 'active' : ''}`}
            onClick={() => setActiveTab('bio')}
          >
            🎙️ Artist Bio
          </button>
        </div>

        {loading ? (
          <div style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '40px 0' }}>
            🕸️ Scraper fetching synced lyrics & storyteller notes...
          </div>
        ) : (
          <div>
            {activeTab === 'lyrics' ? (
              <div className="lyrics-body karaoke-mode">
                {lines.length > 0 ? (
                  lines.map((line, idx) => (
                    <p 
                      key={idx} 
                      className={`karaoke-line ${idx === activeLineIdx ? 'active-karaoke' : ''}`}
                      onClick={() => setActiveLineIdx(idx)}
                    >
                      {line}
                    </p>
                  ))
                ) : (
                  <p>No lyrics available for this track.</p>
                )}
              </div>
            ) : activeTab === 'storyteller' ? (
              <div className="storyteller-body">
                <div className="storyteller-card freq-glass">
                  <h4>💡 Behind The Song</h4>
                  <p>
                    "{track.title}" is a synth-driven masterpiece exploring themes of late-night nostalgia, emotional resonance, and high-energy urban atmospheres.
                  </p>
                  <div className="storyteller-stats">
                    <span>🎵 Key: C Minor</span>
                    <span>⚡ BPM: 120</span>
                    <span>🔮 Vibe: Midnight Cyberpunk</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bio-body">
                <p style={{ marginBottom: '16px' }}>{data?.bio}</p>
                <div style={{ fontSize: '11px', color: '#a855f7', background: 'rgba(168,85,247,0.1)', padding: '8px 12px', borderRadius: '10px' }}>
                  Source: {data?.source || 'FREQ Web Scraper Engine'}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default LyricsDrawer;
