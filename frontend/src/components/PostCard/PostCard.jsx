import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { socialAPI } from '../../services/api';
import { usePlayback } from '../../context/PlaybackContext';
import { useAuth } from '../../context/AuthContext';
import ArtistModal from '../ArtistModal/ArtistModal';
import './PostCard.css';

const PostCard = ({ post, onUpdate }) => {
  const navigate = useNavigate();
  const { currentTrack, isPlaying, playTrack, pauseTrack, resumeTrack } = usePlayback();
  const { user } = useAuth();

  const isThisTrackActive = currentTrack?.id === post.track?.id;
  const isThisTrackPlaying = isThisTrackActive && isPlaying;

  const handlePlayClick = () => {
    if (isThisTrackPlaying) {
      pauseTrack();
    } else if (isThisTrackActive && !isPlaying) {
      resumeTrack();
    } else {
      playTrack(post.track);
    }
  };

  // Interaction States
  const [liked, setLiked] = useState(post.is_liked);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);
  const [bookmarked, setBookmarked] = useState(post.is_bookmarked);
  
  const [reposted, setReposted] = useState(post.is_reposted);
  const [repostsCount, setRepostsCount] = useState(post.reposts_count || 0);
  const [selectedArtist, setSelectedArtist] = useState(null);

  // Comments Overlay States
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');

  const handleDeletePost = async () => {
    if (window.confirm("Are you sure you want to delete this post?")) {
      try {
        await socialAPI.deletePost(post.id);
        if (onUpdate) onUpdate();
      } catch (err) {
        alert("Failed to delete post.");
      }
    }
  };


  const handleLike = async () => {
    // Optimistic UI updates
    const nextLiked = !liked;
    setLiked(nextLiked);
    setLikesCount(prev => nextLiked ? prev + 1 : Math.max(0, prev - 1));
    try {
      await socialAPI.toggleLike(post.id);
    } catch {}
  };

  const handleBookmark = async () => {
    setBookmarked(!bookmarked);
    try {
      await socialAPI.toggleBookmark(post.id);
    } catch {}
  };

  const handleRepost = async () => {
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setRepostsCount(prev => nextReposted ? prev + 1 : Math.max(0, prev - 1));
    try {
      await socialAPI.toggleRepost(post.id);
    } catch {}
  };

  const fetchComments = async () => {
    try {
      const res = await socialAPI.getComments(post.id);
      setComments(res.data);
    } catch {
      // Mock comments fallback
      setComments([
        { id: 1, user: { username: 'alex_beats' }, content: 'Absolute jam! Agreed.', created_at: new Date().toISOString() },
        { id: 2, user: { username: 'melody_finder' }, content: 'The bass is heavy here.', created_at: new Date(Date.now() - 3600000).toISOString() }
      ]);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const res = await socialAPI.addComment(post.id, newComment);
      setComments([...comments, res.data]);
      setNewComment('');
      if (onUpdate) onUpdate();
    } catch {
      // Local fallback
      const mockComment = {
        id: Date.now(),
        user: { username: 'You' },
        content: newComment,
        created_at: new Date().toISOString()
      };
      setComments([...comments, mockComment]);
      setNewComment('');
    }
  };

  const handleOpenComments = () => {
    setIsCommentsOpen(true);
    fetchComments();
  };

  return (
    <>
      <div className="post-card fade-in">
        <div className="post-header">
          <div className="post-avatar" onClick={() => navigate(`/profile/${post.user?.username || ''}`)} style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden', width: '40px', height: '40px' }}>
            <div className="avatar-mini" style={{ zIndex: 1, fontSize: '14px', fontWeight: 800 }}>{post.user?.username?.[0]?.toUpperCase()}</div>
            {post.user?.avatar_url && (
              <img 
                src={post.user.avatar_url} 
                alt="" 
                onError={(e) => { e.target.style.display = 'none'; }} 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
              />
            )}
          </div>
          <div className="post-meta">
            <div className="post-user-row">
              <span className="post-username" onClick={() => navigate(`/profile/${post.user?.username || ''}`)}>{post.user?.username}</span>
              {post.user?.is_verified && <span className="verified-badge">✓</span>}
              {post.tagged_artist && <span className="post-artist-tag"> &gt; {post.tagged_artist.name}</span>}
            </div>
            <div className="post-time-row">
              <span className="post-time">{post.time_ago}</span>
              {post.music_match != null && <span className="post-match">{post.music_match}% match</span>}
            </div>
          </div>
          {post.is_hot_take && <span className="hot-take-badge">🔥</span>}
          {user?.username === post.user?.username && (
            <button className="post-delete-btn" onClick={handleDeletePost} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', marginLeft: 'auto', padding: '4px' }} title="Delete Post">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          )}
        </div>
        <div className="post-content">{post.content}</div>
        {post.rating && (
          <div className="post-rating">
            {[...Array(5)].map((_, i) => <span key={i} className={i < post.rating ? 'star filled' : 'star'}>★</span>)}
          </div>
        )}
        {post.track && (
          <div className="post-track-card">
            <div className="ptc-art-container" style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '4px', overflow: 'hidden', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '18px', zIndex: 1 }}>🎵</span>
              <img 
                src={post.track.album_art_url} 
                alt="" 
                className="ptc-art" 
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
              />
            </div>
            <div className="ptc-info">
              <span className="ptc-title">{post.track.title}</span>
              <span className="ptc-artist" onClick={(e) => { e.stopPropagation(); setSelectedArtist(post.track.artist_name || post.track.artist?.name); }} style={{ cursor: 'pointer', textDecoration: 'underline' }}>
                {post.track.artist_name || post.track.artist?.name}
              </span>
            </div>
            <button className="ptc-play" onClick={handlePlayClick} aria-label={isThisTrackPlaying ? "Pause" : "Play"}>
              {isThisTrackPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>
          </div>
        )}
        {post.image_url && (
          <img 
            src={post.image_url} 
            alt="" 
            className="post-image" 
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        )}
        <div className="post-actions">
          <button className={`action-btn ${liked ? 'liked' : ''}`} onClick={handleLike}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={liked ? '#EC4899' : 'none'} stroke={liked ? '#EC4899' : 'currentColor'} strokeWidth="1.5">
              <path d="M12 21s-7-4.35-9-8c-1.5-4.5 1-8 4-8 1.74 0 3.41.81 4.5 2.09A6.09 6.09 0 0116 5c3 0 5.5 3.5 4 8-2 3.65-9 8-9 8z"/>
            </svg>
            <span>{likesCount}</span>
          </button>
          <button className="action-btn" onClick={handleOpenComments}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
            <span>{post.comments_count || comments.length}</span>
          </button>
          <button className={`action-btn ${reposted ? 'reposted' : ''}`} onClick={handleRepost}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            <span>{repostsCount}</span>
          </button>
          <button className={`action-btn ${bookmarked ? 'bookmarked' : ''}`} onClick={handleBookmark}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked ? '#374151' : 'none'} stroke={bookmarked ? '#374151' : 'currentColor'} strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>
          </button>
        </div>
      </div>

      {selectedArtist && (
        <ArtistModal artistName={selectedArtist} onClose={() => setSelectedArtist(null)} />
      )}


      {/* Comments overlay modal */}
      {isCommentsOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsCommentsOpen(false)}>
          <div className="comments-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Comments</h2>
              <button className="close-btn" onClick={() => setIsCommentsOpen(false)}>✕</button>
            </div>
            
            <div className="comments-list scrollable">
              {comments.length === 0 ? (
                <p className="comments-empty">No comments yet. Share your thoughts!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="comment-item">
                    <div className="comment-meta">
                      <strong>{c.user?.username}</strong>
                      <span className="comment-time">just now</span>
                    </div>
                    <p className="comment-content">{c.content}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleCommentSubmit} className="comment-form">
              <input
                type="text"
                className="freq-input"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                required
              />
              <button type="submit" className="freq-btn-primary comment-submit-btn">Send</button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PostCard;
