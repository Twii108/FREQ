import { useState, useEffect } from 'react';
import { recommendAPI, socialAPI } from '../../services/api';
import './PersonaCard.css';

const PersonaCard = ({ username }) => {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    fetchPersona();
  }, [username]);

  const fetchPersona = async () => {
    setLoading(true);
    try {
      const res = await recommendAPI.getPersona(username);
      setPersona(res.data);
    } catch (err) {
      console.error('Failed to load user persona:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareToFeed = async () => {
    if (!persona) return;
    try {
      await socialAPI.createPost({
        content: `🤖 My AI Music Persona is "${persona.archetype}" ${persona.icon}! "${persona.tagline}"`
      });
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    } catch {
      alert(`Shared "${persona.archetype}" to your feed!`);
      setShared(true);
      setTimeout(() => setShared(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="persona-card" style={{ opacity: 0.6, textAlign: 'center', padding: '32px' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', margin: 0 }}>Analyzing AI Music Persona...</p>
      </div>
    );
  }

  if (!persona) return null;

  return (
    <div className="persona-card">
      <div className="persona-badge-header">
        <div className="persona-icon-box" style={{ background: persona.gradient }}>
          {persona.icon}
        </div>
        <div className="persona-title-meta">
          <div className="persona-label">AI Music Persona</div>
          <h3 className="persona-archetype-name">{persona.archetype}</h3>
        </div>
      </div>

      <p className="persona-tagline">"{persona.tagline}"</p>

      <div className="persona-stats-container">
        <div className="persona-stat-row">
          <span className="stat-name">Energy</span>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${persona.stats.energy}%`, background: '#ef4444' }}></div>
          </div>
          <span className="stat-val">{persona.stats.energy}%</span>
        </div>

        <div className="persona-stat-row">
          <span className="stat-name">Danceability</span>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${persona.stats.danceability}%`, background: '#a855f7' }}></div>
          </div>
          <span className="stat-val">{persona.stats.danceability}%</span>
        </div>

        <div className="persona-stat-row">
          <span className="stat-name">Acoustic</span>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${persona.stats.acousticness}%`, background: '#10b981' }}></div>
          </div>
          <span className="stat-val">{persona.stats.acousticness}%</span>
        </div>

        <div className="persona-stat-row">
          <span className="stat-name">Tempo (BPM)</span>
          <div className="stat-bar-track">
            <div className="stat-bar-fill" style={{ width: `${Math.min((persona.stats.tempo / 180) * 100, 100)}%`, background: '#06b6d4' }}></div>
          </div>
          <span className="stat-val">{persona.stats.tempo}</span>
        </div>
      </div>

      <div className="persona-footer">
        <div className="persona-top-artists">
          {persona.top_artists.map((artist, idx) => (
            <span key={idx} className="artist-chip">🎙️ {artist}</span>
          ))}
        </div>

        <button className="share-persona-btn" onClick={handleShareToFeed}>
          {shared ? '✓ Shared!' : '🚀 Share Persona'}
        </button>
      </div>
    </div>
  );
};

export default PersonaCard;
