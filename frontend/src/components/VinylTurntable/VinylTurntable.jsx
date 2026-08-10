import { getImageUrl } from '../../utils/imageHelper';
import './VinylTurntable.css';

const DEFAULT_ART = '/default_track.jpg';

const VinylTurntable = ({ track, isPlaying }) => {
  const rawArt = track?.album_art_url || track?.album_art || track?.cover_image_url || track?.image_url || track?.image;
  const albumArt = rawArt ? getImageUrl(rawArt) : DEFAULT_ART;

  return (
    <div className="turntable-deck">
      {/* Vinyl Record Disc */}
      <div className={`vinyl-record ${isPlaying ? 'spinning' : ''}`}>
        <div className="vinyl-label">
          <img 
            src={albumArt} 
            alt={track?.title || "Vinyl Art"} 
            className="vinyl-label-art" 
            onError={(e) => {
              e.target.src = DEFAULT_ART;
            }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', zIndex: 2 }}
          />
        </div>
        <div className="vinyl-spindle-hole"></div>
      </div>

      {/* Tonearm Needle Assembly */}
      <div className="tonearm-assembly">
        <div className="tonearm-base"></div>
        <div className={`tonearm-arm ${isPlaying ? 'playing' : ''}`}>
          <div className="tonearm-cartridge"></div>
        </div>
      </div>
    </div>
  );
};

export default VinylTurntable;
