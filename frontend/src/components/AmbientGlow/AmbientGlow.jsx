import { usePlayback } from '../../context/PlaybackContext';
import './AmbientGlow.css';

const GENRE_PALETTES = {
  pop: ['#475569', '#374151'],
  rock: ['#ef4444', '#f97316'],
  'hip-hop': ['#eab308', '#4b5563'],
  rap: ['#f43f5e', '#6366f1'],
  'r&b': ['#4b5563', '#64748b'],
  house: ['#10b981', '#475569'],
  dance: ['#64748b', '#374151'],
  acoustic: ['#10b981', '#f59e0b'],
  country: ['#f59e0b', '#84cc16'],
  default: ['#374151', '#1f2937']
};

const AmbientGlow = () => {
  const { currentTrack, isPlaying } = usePlayback();

  let colors = GENRE_PALETTES.default;

  if (currentTrack) {
    const genres = (currentTrack.genres || []).map(g => g.toLowerCase());
    let matched = false;
    for (const g of genres) {
      for (const key in GENRE_PALETTES) {
        if (g.includes(key)) {
          colors = GENRE_PALETTES[key];
          matched = true;
          break;
        }
      }
      if (matched) break;
    }
  }

  return (
    <div className="ambient-glow-background" style={{ opacity: isPlaying ? 0.35 : 0.2 }}>
      <div 
        className="glow-orb glow-orb-1" 
        style={{ background: colors[0] }} 
      />
      <div 
        className="glow-orb glow-orb-2" 
        style={{ background: colors[1] }} 
      />
    </div>
  );
};

export default AmbientGlow;
