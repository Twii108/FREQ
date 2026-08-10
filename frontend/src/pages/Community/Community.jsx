import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, socialAPI } from '../../services/api';
import './Community.css';

const Community = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('discover'); // discover, leaderboard
  const [candidates, setCandidates] = useState([]);
  const [swipedIds, setSwipedIds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pre-configured fallback popular artist images to fill 5 orbits (local media files)
  const baseMedia = `http://${window.location.hostname}:8000/media/artists/`;
  const fallbackArtistImages = [
    `${baseMedia}the_weeknd.jpg`,
    `${baseMedia}taylor_swift.jpg`,
    `${baseMedia}billie_eilish.jpg`,
    `${baseMedia}lana_del_rey.jpg`,
    `${baseMedia}drake.jpg`,
  ];

  useEffect(() => {
    if (activeTab === 'discover') {
      fetchCandidates();
    } else {
      fetchLeaderboard();
    }
  }, [activeTab]);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const res = await authAPI.discoverUsers();
      // Keep track of swiped candidates
      const filtered = res.data.filter(u => !swipedIds.includes(u.id));
      setCandidates(filtered);
      setCurrentIndex(0);
    } catch {
      // Mock discovery candidates fallback
      const mockCandidates = [
        {
          id: '507f1f77bcf86cd799439011',
          username: 'tanvi_roliya',
          age: 21,
          city: 'Mumbai',
          country: 'India',
          country_flag: '🇮🇳',
          taste_match: 94,
          is_verified: true,
          status_text: 'Listening to Taylor & Arijit 💖',
          avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300',
          favorite_artists: [
            { artist_name: 'Taylor Swift', artist_image_url: `${baseMedia}taylor_swift.jpg` },
            { artist_name: 'Arijit Singh', artist_image_url: `${baseMedia}arijit_singh.jpg` }
          ]
        },
        {
          id: '507f1f77bcf86cd799439012',
          username: 'alex_beats',
          age: 24,
          city: 'San Francisco',
          country: 'United States',
          country_flag: '🇺🇸',
          taste_match: 88,
          is_verified: true,
          status_text: 'Synthwave & Midnight electronic vibes 🎧',
          avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=300',
          favorite_artists: [
            { artist_name: 'The Weeknd', artist_image_url: `${baseMedia}the_weeknd.jpg` },
            { artist_name: 'Alan Walker', artist_image_url: `${baseMedia}alan_walker.jpg` }
          ]
        }
      ];
      const filtered = mockCandidates.filter(u => !swipedIds.includes(u.id));
      setCandidates(filtered);
      setCurrentIndex(0);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getLeaderboard();
      setLeaderboard(res.data);
    } catch {
      // Mock leaderboard fallback
      setLeaderboard([
        { id: '1', username: 'alex_beats', avatar_url: '', listening_count: 142, is_verified: true },
        { id: '2', username: 'melody_finder', avatar_url: '', listening_count: 118, is_verified: false },
        { id: '3', username: 'groove_rider', avatar_url: '', listening_count: 95, is_verified: false },
        { id: '4', username: 'indie_ear', avatar_url: '', listening_count: 72, is_verified: false }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    if (currentIndex >= candidates.length) return;
    const target = candidates[currentIndex];
    
    setSwipedIds(prev => [...prev, target.id]);

    if (action === 'like') {
      try {
        await authAPI.followToggle(target.id);
      } catch (err) {
        console.warn('Error liking user:', err);
      }
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };


  const handleRewind = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      // Remove last swiped ID to make them reappear
      setSwipedIds(prev => prev.slice(0, -1));
    }
  };

  // Get exactly 5 orbit images for the current candidate
  const getOrbitImages = (target) => {
    const artistOrbits = target.favorite_artists || [];
    const orbits = [];
    for (let i = 0; i < 5; i++) {
      const artist = artistOrbits[i];
      const img = artist?.artist_image_url || artist?.image || fallbackArtistImages[i];
      orbits.push(img);
    }
    return orbits;
  };

  return (
    <div className="community-page page-container">
      <div className="community-header">
        <h1 className="community-title">Community Match</h1>
        
        {/* Toggle Pill Bar */}
        <div className="community-tabs">
          <button
            className={`comm-tab-btn ${activeTab === 'discover' ? 'active' : ''}`}
            onClick={() => setActiveTab('discover')}
          >
            👥 Discover Deck
          </button>
          <button
            className={`comm-tab-btn ${activeTab === 'leaderboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('leaderboard')}
          >
            🏆 Leaderboard
          </button>
        </div>
      </div>

      <div className="community-content">
        {loading ? (
          <div className="loading-screen">Loading...</div>
        ) : activeTab === 'discover' ? (
          <div className="discovery-deck">
            {currentIndex < candidates.length ? (
              (() => {
                const target = candidates[currentIndex];
                const orbits = getOrbitImages(target);
                
                return (
                  <div className="user-card-t equals-mustard-card slide-up">
                    
                    {/* Top Header Row */}
                    <div className="mustard-card-header">
                      <div className="mustard-user-info">
                        <h2>
                          {target.username}
                          {target.is_verified && <span className="mustard-verified-badge">✓</span>}
                          <span className="mustard-active-dot">●</span>
                        </h2>
                        <p>{target.age}, {target.city} {target.country_flag}</p>
                      </div>
                    </div>

                    {/* Central Orbit Circle Cluster */}
                    <div className="uc-avatars-cluster-mustard">
                      <div className="uc-avatar-central-mustard" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden' }}>
                        <div className="avatar-placeholder-big-mustard" style={{ zIndex: 1, fontSize: '32px', fontWeight: 800 }}>{target.username[0].toUpperCase()}</div>
                        {target.avatar_url && (
                          <img 
                            src={target.avatar_url} 
                            alt="" 
                            onError={(e) => { e.target.style.display = 'none'; }} 
                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                          />
                        )}
                        {/* Multiple Photo Stack Indicator overlay */}
                        <div className="photo-stack-indicator" style={{ zIndex: 3 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                            <rect x="2" y="6" width="16" height="16" rx="2" />
                            <path d="M6 2h14a2 2 0 0 1 2 2v14" opacity="0.5" />
                          </svg>
                        </div>
                      </div>

                      {/* 5 Orbiting Circles (Revolving around profile) */}
                      <div className="orbiting-stars-container">
                        {orbits.map((img, idx) => (
                          <div key={idx} className={`orbit-circle-mustard orbit-${idx}`}>
                            <div className="orbit-circle-image-wrapper" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient-purple)', borderRadius: '50%', overflow: 'hidden', width: '100%', height: '100%' }}>
                              <span style={{ fontSize: '10px', color: 'white', zIndex: 1 }}>🎵</span>
                              <img 
                                src={img} 
                                alt="" 
                                referrerPolicy="no-referrer" 
                                onError={(e) => { e.target.style.display = 'none'; }}
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Floating Thought status Bubble next to Orbit 2 */}
                      {target.status_text && (
                        <div className="mustard-thought-bubble">
                          {target.status_text}
                        </div>
                      )}
                    </div>

                    {/* Similarity & Rewind Row */}
                    <div className="mustard-similarity-bar">
                      <div className="similarity-meta">
                        <span className="match-percent-text">{target.taste_match}% similar</span>
                        <div className="mini-artist-chips">
                          {target.favorite_artists?.slice(0, 2).map((artist, idx) => (
                            <div key={idx} className="mini-chip-pill" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: '12px' }}>
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', overflow: 'hidden', background: 'var(--freq-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold', position: 'relative', flexShrink: 0 }}>
                                {artist.artist_image_url && (
                                  <img 
                                    src={artist.artist_image_url} 
                                    alt="" 
                                    referrerPolicy="no-referrer" 
                                    onError={(e) => { e.target.style.display = 'none'; }} 
                                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                                  />
                                )}
                                <span style={{ zIndex: 1 }}>{artist.artist_name[0]}</span>
                              </div>
                              <span>{artist.artist_name}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rewind Trigger */}
                      <button className="mustard-rewind-btn" onClick={handleRewind} disabled={currentIndex === 0}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" style={{ opacity: currentIndex === 0 ? 0.4 : 1 }}>
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                        <span>Rewind</span>
                      </button>
                    </div>

                    {/* Action buttons */}
                    <div className="mustard-deck-buttons">
                      <button className="mustard-btn add-friend" onClick={() => handleAction('like')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19" />
                          <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        <span>Add Friend</span>
                      </button>
                      
                      <button className="mustard-btn skip" onClick={() => handleAction('reject')}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polygon points="5 4 15 12 5 20 5 4" />
                          <line x1="19" y1="5" x2="19" y2="19" />
                        </svg>
                        <span>Skip</span>
                      </button>
                    </div>

                  </div>
                );
              })()
            ) : (
              <div className="deck-empty freq-glass fade-in">
                <span className="empty-globe">🌍</span>
                <h2>All caught up!</h2>
                <p>You have seen all matching listeners near you. Check back later!</p>
                <button className="freq-btn-primary reload-discover" onClick={fetchCandidates}>
                  Reload
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Leaderboard Tab Content */
          <div className="leaderboard-deck fade-in">
            <div className="leaderboard-card freq-glass">
              <h2>Top Listeners</h2>
              <p className="lb-subtitle">Ranked by total music play duration</p>

              <div className="leaderboard-list">
                {leaderboard.map((item, index) => {
                  const rank = index + 1;
                  let medal = '';
                  if (rank === 1) medal = '🥇';
                  else if (rank === 2) medal = '🥈';
                  else if (rank === 3) medal = '🥉';
                  else medal = `#${rank}`;

                  return (
                    <div key={item.id} className="leaderboard-row">
                      <div className="lb-rank">{medal}</div>
                      <div className="lb-avatar">
                        {item.avatar_url ? (
                          <img src={item.avatar_url} alt="" />
                        ) : (
                          <div className="lb-avatar-placeholder">{item.username[0].toUpperCase()}</div>
                        )}
                      </div>
                      <div className="lb-info">
                        <span className="lb-name">
                          {item.username}
                          {item.is_verified && <span className="verified-badge" style={{ marginLeft: '4px' }}>✓</span>}
                        </span>
                        <span className="lb-streams">{item.listening_count || 0} seconds listened</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Community;
