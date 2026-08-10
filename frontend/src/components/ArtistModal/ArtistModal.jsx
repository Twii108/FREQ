import { useState, useEffect } from 'react';
import { usePlayback } from '../../context/PlaybackContext';
import './ArtistModal.css';

const ArtistModal = ({ artistName, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayback();

  useEffect(() => {
    if (artistName) {
      fetchArtistDetails();
    }
  }, [artistName]);

  const fetchArtistDetails = async () => {
    setLoading(true);
    try {
      const encoded = encodeURIComponent(artistName);
      const res = await fetch(`http://127.0.0.1:8000/api/music/artists/${encoded}/`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        throw new Error();
      }
    } catch {
      // Fallback mock details for famous artists
      setData({
        name: artistName,
        image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/51/61/f3/5161f3c4-2292-f035-eb68-6f95bbc9edd6/00602537542338.rgb.jpg/400x400bb.jpg',
        genres: ['Pop', 'R&B', 'Synthwave'],
        popularity: 98,
        bio: `${artistName} is one of the world's most stream-dominated music icons, pushing boundaries in sound design, live stadium performances, and chart-topping synth aesthetics.`,
        albums: ['After Hours', 'Starboy', 'Dawn FM'],
        tracks: [
          {
            id: 't1',
            title: 'Blinding Lights',
            artist_name: artistName,
            album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/400x400bb.jpg',
            preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview211/v4/17/b4/8f/17b48f9a-0b93-6bb8-fe1d-3a16623c2cfb/mzaf_9560252727299052414.plus.aac.p.m4a'
          },
          {
            id: 't2',
            title: 'Starboy',
            artist_name: artistName,
            album_art_url: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music114/v4/cc/65/5f/cc655fe6-71d5-bc44-5d51-6df731f2cc05/20UMGIM81373.rgb.jpg/400x400bb.jpg',
            preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/bf/fb/1a/bffb1a8d-2947-8a62-9721-9a7c3666b607/mzaf_6493649514781488090.plus.aac.p.m4a'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (!artistName) return null;

  return (
    <div className="artist-modal-overlay fade-in" onClick={onClose}>
      <div className="artist-modal freq-glass slide-up" onClick={(e) => e.stopPropagation()}>
        
        <button className="am-close-btn" onClick={onClose}>✕</button>

        {loading ? (
          <div className="am-loading">
            <span>✨ Loading Artist Discography & Info...</span>
          </div>
        ) : data && (
          <div className="am-content">
            {/* Banner Header */}
            <div className="am-banner">
              <img src={data.image_url || 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/51/61/f3/5161f3c4-2292-f035-eb68-6f95bbc9edd6/00602537542338.rgb.jpg/400x400bb.jpg'} alt={data.name} className="am-banner-img" />
              <div className="am-banner-overlay">
                <span className="am-verified">VERIFIED ARTIST ✓</span>
                <h1 className="am-artist-name">{data.name}</h1>
                <div className="am-genres-tags">
                  <span className="am-genre-pill">🎵 {data.tracks?.length || 12} Top Tracks</span>
                  <span className="am-genre-pill" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>💿 {data.albums?.length || 4} Discography Albums</span>
                  <span className="am-popularity">🔥 {data.popularity || 98}% Popularity</span>
                </div>

              </div>
            </div>

            {/* Artist Bio */}
            <div className="am-section">
              <h3>🎙️ Artist Biography</h3>
              <p className="am-bio-text">{data.bio || `${data.name} is a top chart-topping global artist.`}</p>
            </div>

            {/* Top Songs */}
            <div className="am-section">
              <h3>🎵 Top Famous Songs</h3>
              <div className="am-tracks-list">
                {data.tracks && data.tracks.length > 0 ? (
                  data.tracks.map((t, idx) => {
                    const isThisPlaying = currentTrack?.id === t.id && isPlaying;
                    return (
                      <div key={t.id || idx} className="am-track-row" onClick={() => isThisPlaying ? pauseTrack() : playTrack(t, data.tracks)}>
                        <div className="am-tr-left">
                          <img src={t.album_art_url} alt="" className="am-tr-art" />
                          <div className="am-tr-info">
                            <span className="am-tr-title">{t.title}</span>
                            <span className="am-tr-album">{t.album_name || 'Single'}</span>
                          </div>
                        </div>
                        <button className="am-tr-play-btn">
                          {isThisPlaying ? (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                          ) : (
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                          )}
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>No tracks available.</p>
                )}
              </div>
            </div>

            {/* Albums & Discography */}
            {data.albums && data.albums.length > 0 && (
              <div className="am-section">
                <h3>💿 Discography & Albums</h3>
                <div className="am-albums-chips">
                  {data.albums.map((alb, i) => (
                    <span key={i} className="am-album-chip">💿 {alb}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ArtistModal;
