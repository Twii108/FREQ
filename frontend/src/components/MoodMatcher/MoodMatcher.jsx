import { useState } from 'react';
import { recommendAPI } from '../../services/api';
import { usePlayback } from '../../context/PlaybackContext';
import { getImageUrl } from '../../utils/imageHelper';
import './MoodMatcher.css';

const PRESETS = [
  "🏋️ High energy gym workout",
  "🌧️ Late night rainy study",
  "🚗 Sunset highway drive",
  "☕ Chill morning coffee",
  "🎉 Synthwave party vibe"
];

const MoodMatcher = () => {
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayback();

  const handleSearch = async (queryText) => {
    const searchPrompt = queryText !== undefined ? queryText : prompt;
    if (!searchPrompt.trim()) return;

    setLoading(true);
    setActivePrompt(searchPrompt);
    try {
      const res = await recommendAPI.getPromptMatch(searchPrompt);
      setResults(res.data.tracks || []);
    } catch (err) {
      console.error('Failed to fetch prompt recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackPlay = (track) => {
    const isCurrent = currentTrack && currentTrack.id === track.id;
    if (isCurrent && isPlaying) {
      pauseTrack();
    } else if (isCurrent && !isPlaying) {
      resumeTrack();
    } else {
      playTrack(track, results);
    }
  };

  return (
    <div className="mood-matcher-card">
      <div className="mm-header">
        <span className="mm-icon">🧠</span>
        <h3 className="mm-title">AI Prompt-to-Playlist</h3>
      </div>
      <p className="mm-subtitle">
        Type any mood or activity to match audio feature vectors (Energy, Tempo, Valence) via Cosine Similarity.
      </p>

      <form 
        onSubmit={(e) => { e.preventDefault(); handleSearch(); }}
        className="mm-input-group"
      >
        <input
          type="text"
          className="mm-input"
          placeholder="e.g. Energetic workout track..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button type="submit" className="mm-btn">
          {loading ? 'Matching...' : 'Generate'}
        </button>
      </form>

      <div className="mm-presets">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            type="button"
            className="mm-chip"
            onClick={() => {
              setPrompt(p);
              handleSearch(p);
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {activePrompt && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '12px', fontWeight: 600 }}>
          Matched tracks for: <span style={{ color: '#ec4899' }}>"{activePrompt}"</span>
        </div>
      )}

      <div className="mm-results-grid">
        {results.length === 0 && activePrompt && !loading && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'rgba(255,255,255,0.6)', padding: '24px', fontSize: '13px' }}>
            No tracks found matching "{activePrompt}". Try another keyword like "workout", "study", or "synth"!
          </div>
        )}

        {results.map((track) => {
          const isCurrent = currentTrack && currentTrack.id === track.id;
          const isThisPlaying = isCurrent && isPlaying;
          const energy = track.audio_features?.energy !== undefined ? Math.round(track.audio_features.energy * 100) : 50;
          const tempo = track.audio_features?.tempo !== undefined ? Math.round(track.audio_features.tempo) : 120;

          return (
            <div key={track.id} className="mm-track-card">
              <div className="mm-art-wrapper">
                <span style={{ fontSize: '16px' }}>🎵</span>
                <img
                  src={getImageUrl(track.album_art_url)}
                  alt=""
                  className="mm-art"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              </div>

              <div className="mm-track-info">
                <div className="mm-track-title">{track.title}</div>
                <div className="mm-track-artist">{track.artist?.name || track.artist_name}</div>
                <div className="mm-features">
                  <span className="mm-tag mm-tag-energy">⚡ {energy}% Energy</span>
                  <span className="mm-tag mm-tag-tempo">🎵 {tempo} BPM</span>
                </div>
              </div>

              <button
                className="mm-play-btn"
                onClick={() => handleTrackPlay(track)}
                aria-label="Play track"
              >
                {isThisPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default MoodMatcher;
