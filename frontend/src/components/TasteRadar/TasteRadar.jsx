import './TasteRadar.css';

const TasteRadar = ({ user1 = { username: 'You' }, user2 = { username: 'Match' }, matchScore = 92, isOwnProfile = false }) => {
  // Audio Feature Vectors: Danceability, Energy, Valence, Acousticness, Tempo
  const features = [
    { label: 'Energy ⚡', u1: 85, u2: 70 },
    { label: 'Danceability 🕺', u1: 78, u2: 65 },
    { label: 'Valence 💖', u1: 65, u2: 60 },
    { label: 'Acousticness 🌿', u1: 40, u2: 50 },
    { label: 'Synthwave / Bass 🎧', u1: 92, u2: 75 }
  ];

  return (
    <div className="taste-radar-container freq-glass fade-in">
      <div className="tr-header">
        <span className="tr-badge">🔮 AI SYNTHESIS</span>
        <h3 className="tr-title">{isOwnProfile ? 'Your Audio Feature DNA & Taste Radar' : 'Music Taste Compatibility Radar'}</h3>
        <span className="tr-synergy-score">{matchScore}% {isOwnProfile ? 'Audio Alignment' : 'Synergy'}</span>
      </div>

      {/* Audio Feature Spectrum Bars */}
      <div className="tr-spectrum-list">
        {features.map((feat, idx) => (
          <div key={idx} className="tr-spectrum-row">
            <div className="tr-label-wrap">
              <span className="tr-feat-label">{feat.label}</span>
              <span className="tr-feat-vals">{isOwnProfile ? `${feat.u1}% (vs Avg ${feat.u2}%)` : `${feat.u1}% vs ${feat.u2}%`}</span>
            </div>
            <div className="tr-bar-track">
              <div className="tr-bar-fill u1" style={{ width: `${feat.u1}%` }}></div>
              <div className="tr-bar-fill u2" style={{ width: `${feat.u2}%` }}></div>
            </div>
          </div>
        ))}
      </div>

      {/* Overlapping Venn Diagram Visualizer */}
      <div className="tr-venn-wrapper">
        <div className="venn-circle circle-u1">
          <span>{user1.username}</span>
        </div>
        <div className="venn-circle circle-u2">
          <span>{user2.username}</span>
        </div>
        <div className="venn-overlap-badge">
          <span>🔥 {matchScore}% Overlap</span>
        </div>
      </div>
    </div>
  );
};

export default TasteRadar;
