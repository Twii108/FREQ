import { useState, useEffect, useRef, useCallback } from 'react';
import { socialAPI, musicAPI } from '../../services/api';
import PostCard from '../../components/PostCard/PostCard';
import ListenTogether from '../../components/ListenTogether/ListenTogether';
import HotTakeArena from '../../components/HotTakeArena/HotTakeArena';
import './Home.jsx.css';

const Home = () => {
  const [activeTab, setActiveTab] = useState('foryou');
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [tracks, setTracks] = useState([]);
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const pollRef = useRef(null);

  // Silent background refresh (no loading spinner) — merges new posts
  const silentRefreshFeed = useCallback(async () => {
    try {
      const res = await socialAPI.getFeed(activeTab);
      setPosts(res.data);
    } catch {}
  }, [activeTab]);

  useEffect(() => {
    fetchFeed();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await socialAPI.getFeed(activeTab);
      setPosts(res.data);
    } catch {
      // Setup default mock posts if backend fails
      setPosts([
        {
          id: 3,
          user: { username: 'swiftie_forever', avatar_url: '', is_verified: false },
          content: 'Just saw Taylor Swift live! The Eras Tour is absolutely magical, I can\'t even process what I just witnessed 💜✨',
          time_ago: '1h',
          likes_count: 1420,
          comments_count: 320,
          reposts_count: 85,
          is_liked: true,
          is_bookmarked: false,
          music_match: 98,
          tagged_artist: { name: 'Suggested because you like Taylor Swift' },
          image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/39/ec/41/39ec417a-57b1-f0fa-3e61-a06530669d2d/24UM1IM02206.rgb.jpg/600x600bb.jpg',
          track: {
            title: 'I Can Do It With a Broken Heart',
            artist_name: 'Taylor Swift',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b2735a50d24495537554972d7331'
          }
        },
        {
          id: 4,
          user: { username: 'hiphop_head', avatar_url: '', is_verified: false },
          content: 'Kendrick Lamar\'s new verse just changed the entire industry again. The way he layers his lyrics is unmatched.',
          time_ago: '4h',
          likes_count: 890,
          comments_count: 120,
          reposts_count: 45,
          is_liked: false,
          is_bookmarked: true,
          is_hot_take: true,
          tagged_artist: { name: 'Suggested because you like Kendrick Lamar' },
          image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/8e/cb/54/8ecb5413-cff8-9128-e4b2-29fc2a05d6cb/24UM1IM03001.rgb.jpg/600x600bb.jpg',
          track: {
            title: 'Not Like Us',
            artist_name: 'Kendrick Lamar',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b27387cc3ea17b8f03ec9bcfe2fc'
          }
        },
        {
          id: 1,
          user: { username: 'music_guru', avatar_url: '', is_verified: true },
          content: 'This new Weeknd album is a masterpiece. The synths are incredible!',
          time_ago: '2h',
          likes_count: 24,
          comments_count: 5,
          reposts_count: 2,
          is_liked: false,
          is_bookmarked: false,
          music_match: 85,
          track: {
            title: 'Blinding Lights',
            artist_name: 'The Weeknd',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36'
          }
        },
        {
          id: 5,
          user: { username: 'pop_stan', avatar_url: '', is_verified: false },
          content: 'Sabrina Carpenter is having the best year ever. Espresso is literally the song of the summer! ☕💋',
          time_ago: '12h',
          likes_count: 1230,
          comments_count: 240,
          reposts_count: 31,
          is_liked: false,
          is_bookmarked: false,
          tagged_artist: { name: 'Suggested because you like Sabrina Carpenter' },
          image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/71/61/89/71618991-88fc-d138-16e6-1218778a3cbb/24UM1IM00742.rgb.jpg/600x600bb.jpg',
          track: {
            title: 'Espresso',
            artist_name: 'Sabrina Carpenter',
            album_art_url: 'https://i.scdn.co/image/ab67616d0000b273659cd4673230913b3918e0d5'
          }
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostText.trim() && !selectedTrack && !imageUrl) return;
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await socialAPI.createPost({
        content: newPostText,
        track_id: selectedTrack ? selectedTrack.id : null,
        image_url: imageUrl || null
      });
      setPosts([res.data, ...posts]);
      setNewPostText('');
      setSelectedTrack(null);
      setImageUrl('');
      setIsModalOpen(false);
    } catch {
      // Mock create post locally
      const mockNewPost = {
        id: Math.floor(Math.random() * 10000000).toString(16).padStart(24, 'a'),
        user: { username: 'You', avatar_url: '', is_verified: false },
        content: newPostText,
        image_url: imageUrl || null,
        time_ago: 'now',
        likes_count: 0,
        comments_count: 0,
        reposts_count: 0,
        is_liked: false,
        is_bookmarked: false,
        track: selectedTrack ? {
          title: selectedTrack.title,
          artist_name: selectedTrack.artist.name,
          album_art_url: selectedTrack.album_art_url
        } : null
      };
      setPosts([mockNewPost, ...posts]);
      setNewPostText('');
      setSelectedTrack(null);
      setImageUrl('');
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageUrl(reader.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  const handleSearchTrack = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (query.length < 2) {
      setTracks([]);
      return;
    }
    try {
      const res = await musicAPI.search(query);
      setTracks(res.data.tracks || []);
    } catch {
      // Mock tracks
      setTracks([
        { id: 1, title: 'Starboy', artist: { name: 'The Weeknd' }, album_art_url: 'https://i.scdn.co/image/ab67616d0000b2734718dec6954e4477d46a6590' },
        { id: 2, title: 'Die For You', artist: { name: 'The Weeknd' }, album_art_url: 'https://i.scdn.co/image/ab67616d0000b2734718dec6954e4477d46a6590' }
      ]);
    }
  };

  return (
    <div className="home-page page-container">

      <div className="feed-tabs">
        <button className={`feed-tab-btn ${activeTab === 'foryou' ? 'active' : ''}`} onClick={() => setActiveTab('foryou')}>
          For You
        </button>
        <button className={`feed-tab-btn ${activeTab === 'friends' ? 'active' : ''}`} onClick={() => setActiveTab('friends')}>
          Friends
        </button>
      </div>

      {/* Feature 1: Synchronized Listen Together Live Room */}
      <ListenTogether />

      {/* Feature 3: AI Hot Take Arena Debate */}
      <HotTakeArena />

      <div className="feed-posts">

        {loading ? (
          <div className="feed-loading">
            <div className="skeleton-post"></div>
            <div className="skeleton-post"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="feed-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 21a9 9 0 100-18 9 9 0 000 18zM12 8v4M12 16h.01"/>
            </svg>
            <p>No posts in feed yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map(post => (
            <PostCard key={post.id} post={post} onUpdate={fetchFeed} />
          ))
        )}
      </div>

      <button className="fab-post-btn" onClick={() => setIsModalOpen(true)} aria-label="Create post">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        </svg>
      </button>

      {isModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsModalOpen(false)}>
          <div className="post-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>New Post</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleCreatePost} className="post-form">
              <textarea
                className="post-textarea"
                placeholder="Share your thoughts or music takes..."
                value={newPostText}
                onChange={(e) => setNewPostText(e.target.value)}
                maxLength="300"
              />
              <div className="input-group" style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '11px', color: 'var(--freq-text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>ATTACH IMAGE / GIF:</label>
                {imageUrl && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <img src={imageUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--freq-purple-light)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>Selected from storage</span>
                    <button type="button" onClick={() => setImageUrl('')} style={{ background: 'none', color: 'var(--freq-error)', fontSize: '11px', fontWeight: 600, marginLeft: 'auto' }}>Remove</button>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="freq-input"
                  onChange={handlePostImageUpload}
                  style={{ padding: '8px 10px', width: '100%' }}
                />
              </div>

              {selectedTrack ? (
                <div className="selected-track-badge">
                  <img src={selectedTrack.album_art_url} alt="" />
                  <div className="stb-info">
                    <span className="stb-title">{selectedTrack.title}</span>
                    <span className="stb-artist">{selectedTrack.artist.name}</span>
                  </div>
                  <button type="button" className="remove-track" onClick={() => setSelectedTrack(null)}>✕</button>
                </div>
              ) : (
                <div className="track-search-box">
                  <input
                    type="text"
                    className="freq-input track-search-input"
                    placeholder="🎵 Attach a track..."
                    value={searchQuery}
                    onChange={handleSearchTrack}
                  />
                  {tracks.length > 0 && (
                    <div className="track-search-results">
                      {tracks.map(track => (
                        <div key={track.id} className="search-track-item" onClick={() => { setSelectedTrack(track); setTracks([]); setSearchQuery(''); }}>
                          <img src={track.album_art_url} alt="" />
                          <div className="sti-info">
                            <span className="sti-title">{track.title}</span>
                            <span className="sti-artist">{track.artist.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <button type="submit" className="freq-btn-primary submit-post-btn" disabled={(!newPostText.trim() && !selectedTrack && !imageUrl) || isSubmitting}>
                {isSubmitting ? 'Posting...' : 'Post to Feed'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Home;
