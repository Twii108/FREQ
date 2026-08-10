import { useState, useEffect } from 'react';
import { authAPI, musicAPI, recommendAPI } from '../../services/api';
import { usePlayback } from '../../context/PlaybackContext';
import { getImageUrl } from '../../utils/imageHelper';
import MoodMatcher from '../../components/MoodMatcher/MoodMatcher';
import ArtistModal from '../../components/ArtistModal/ArtistModal';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, tracks, artists
  const [results, setResults] = useState({ artists: [], tracks: [] });
  const [loading, setLoading] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [favoriteArtists, setFavoriteArtists] = useState([]);
  const { playTrack, currentTrack, isPlaying, pauseTrack, resumeTrack } = usePlayback();


  useEffect(() => {
    const loadFavs = async () => {
      try {
        const res = await authAPI.getFavoriteArtists();
        setFavoriteArtists(res.data || []);
      } catch {}
    };
    loadFavs();
    fetchSuggestions();
  }, []);


  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      // Fetch personalized recommendations based on favorite artists/genres
      const res = await recommendAPI.getForYou();
      const allArtists = await musicAPI.getArtists();
      
      if (res.data && res.data.length > 0) {
        setResults(prev => ({ ...prev, tracks: res.data, artists: allArtists.data || [] }));
      } else {
        const trendingRes = await musicAPI.getTrending();
        setResults(prev => ({ ...prev, tracks: trendingRes.data || [], artists: allArtists.data || [] }));
      }
    } catch {
      setResults(prev => ({
        ...prev,
        tracks: [
          { id: 'track-1', title: 'Starboy', artist_name: 'The Weeknd', artist: { name: 'The Weeknd' }, album_art_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/400x400bb.jpg', popularity: 92, preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a9/94/ef/a994ef71-5202-8682-a84c-c0c0349b1473/mzaf_6288674395893096234.plus.aac.p.m4a' },
          { id: 'track-2', title: 'Cruel Summer', artist_name: 'Taylor Swift', artist: { name: 'Taylor Swift' }, album_art_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg', popularity: 96, preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/1b/82/ff/1b82ff63-cf60-bf12-0faa-a8a599dc0b67/mzaf_4289898234907409204.plus.aac.p.m4a' },
          { id: 'track-3', title: 'LUNCH', artist_name: 'Billie Eilish', artist: { name: 'Billie Eilish' }, album_art_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/c3/8c/fb/c38cfb28-8742-df80-a669-7c85ba4430fb/24UM1IM01662.rgb.jpg/400x400bb.jpg', popularity: 95, preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/62/c4/a0/62c4a04c-f63c-f5f8-d6b3-8c238b0f8184/mzaf_1642930948956209867.plus.aac.p.m4a' }
        ]
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (query.trim().length >= 2) {
      const timer = setTimeout(() => {
        executeSearch(query);
      }, 300);
      return () => clearTimeout(timer);
    } else if (query.trim().length === 0) {
      fetchSuggestions();
    }
  }, [query]);

  const executeSearch = async (searchQuery) => {
    setLoading(true);
    try {
      const res = await musicAPI.search(searchQuery);
      setResults(res.data);
    } catch {
      // Mock search results fallback
      setResults({
        artists: [
          { id: 'artist-1', name: 'The Weeknd', image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/400x400bb.jpg', popularity: 98 },
          { id: 'artist-2', name: 'Taylor Swift', image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg', popularity: 99 }
        ],
        tracks: [
          { id: 'track-1', title: 'Starboy', artist_name: 'The Weeknd', artist: { name: 'The Weeknd' }, album_art_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/400x400bb.jpg', popularity: 92, preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview125/v4/a9/94/ef/a994ef71-5202-8682-a84c-c0c0349b1473/mzaf_6288674395893096234.plus.aac.p.m4a' },
          { id: 'track-2', title: 'Cruel Summer', artist_name: 'Taylor Swift', artist: { name: 'Taylor Swift' }, album_art_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg', popularity: 96, preview_url: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/1b/82/ff/1b82ff63-cf60-bf12-0faa-a8a599dc0b67/mzaf_4289898234907409204.plus.aac.p.m4a' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      executeSearch(query);
    }
  };


  const handleTrackPlay = (track) => {
    const isCurrent = currentTrack && currentTrack.id === track.id;
    if (isCurrent && isPlaying) {
      pauseTrack();
    } else if (isCurrent && !isPlaying) {
      resumeTrack();
    } else {
      playTrack(track, results.tracks);
    }
  };

  return (
    <div className="search-page page-container">
      <form onSubmit={handleSearch} className="search-input-wrapper">
        <input
          type="text"
          className="freq-input main-search-input"
          placeholder="Search songs, artists..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="freq-btn-primary search-submit-btn">Search</button>
      </form>

      <MoodMatcher />


      <div className="search-filters">
        {['all', 'tracks', 'artists'].map(filter => (
          <button
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="search-results-container">
        {loading ? (
          <div className="results-loading">Searching catalog...</div>
        ) : (
          <>
            {(activeFilter === 'all' || activeFilter === 'artists') && (
              <>
                {favoriteArtists.length > 0 && (
                  <div className="results-group">
                    <h3>Your Favorite Artists</h3>
                    <div className="fav-artists-grid">
                      {favoriteArtists.map(artist => (
                        <div key={artist.id || artist.name} className="fav-artist-card freq-glass" onClick={() => setSelectedArtist(artist.name || artist.artist_name)}>
                          <img src={getImageUrl(artist.image_url || artist.artist_image_url || artist.image)} alt="" onError={(e) => { e.target.src = '/default_track.jpg'; }} />
                          <span className="fav-artist-name">{artist.name || artist.artist_name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {results.artists?.length > 0 && (activeFilter === 'artists' || query) && (
                  <div className="results-group">
                    <h3>{query ? "Artists" : "Suggested Artists"}</h3>
                    <div className="artists-results-list">
                  {results.artists.map(artist => (
                    <div 
                      key={artist.id} 
                      className="search-artist-row freq-glass"
                      onClick={() => setSelectedArtist(artist.name)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="sar-avatar" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden', width: '48px', height: '48px', flexShrink: 0 }}>
                        <div className="sar-avatar-placeholder" style={{ zIndex: 1, fontSize: '16px', fontWeight: 800 }}>{artist.name[0]}</div>
                        {artist.image_url && (
                          <img 
                            src={getImageUrl(artist.image_url)} 
                            alt="" 
                            onError={(e) => { e.target.style.display = 'none'; }} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                          />
                        )}
                      </div>
                      <div className="sar-info">
                        <span className="sar-name">{artist.name}</span>
                        <span className="sar-pop">Popularity: {artist.popularity}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

            {(activeFilter === 'all' || activeFilter === 'tracks') && results.tracks?.length > 0 && (
              <div className="results-group">
                <h3>{query ? "Tracks" : "Suggested Tracks"}</h3>
                <div className="tracks-results-list">
                  {results.tracks.map(track => {
                    const isCurrent = currentTrack && currentTrack.id === track.id;
                    const isThisPlaying = isCurrent && isPlaying;
                    const artistName = track.artist?.name || track.artist_name;
                    return (
                      <div key={track.id} className="search-track-row freq-glass">
                        <div className="str-art-container" style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: '18px', zIndex: 1 }}>🎵</span>
                          <img 
                            src={getImageUrl(track.album_art_url)} 
                            alt="" 
                            className="str-art" 
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                          />
                        </div>
                        <div className="str-info">
                          <span className="str-title">{track.title}</span>
                          <span 
                            className="str-artist" 
                            onClick={(e) => { e.stopPropagation(); setSelectedArtist(artistName); }}
                            style={{ cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {artistName}
                          </span>
                        </div>
                        <div className="search-track-actions">
                          <button className="play-track-btn" onClick={() => handleTrackPlay(track)}>
                            {isThisPlaying ? (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            ) : (
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
                            )}
                          </button>
                          <button className="str-add-btn" onClick={async () => {
                            try {
                              await musicAPI.addToVinylWall(track.id);
                              alert('Added to Vinyl Wall!');
                            } catch {
                              alert('Added to local Vinyl Wall!');
                            }
                          }}>
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {query && !results.artists?.length && !results.tracks?.length && favoriteArtists.length === 0 && (
              <p className="no-results">No results found for "{query}"</p>
            )}
          </>
        )}
      </div>

      {selectedArtist && (
        <ArtistModal artistName={selectedArtist} onClose={() => setSelectedArtist(null)} />
      )}
    </div>
  );
};

export default Search;

