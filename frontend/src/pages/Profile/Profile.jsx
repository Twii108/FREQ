import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, musicAPI, socialAPI, triviaAPI, userConcertsAPI } from '../../services/api';
import { usePlayback } from '../../context/PlaybackContext';
import PostCard from '../../components/PostCard/PostCard';
import PersonaCard from '../../components/PersonaCard/PersonaCard';
import AchievementBadges from '../../components/AchievementBadges/AchievementBadges';
import TasteRadar from '../../components/TasteRadar/TasteRadar';
import './Profile.css';




const Profile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, logout, updateProfile } = useAuth();
  const { playTrack } = usePlayback();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [tasteMatch, setTasteMatch] = useState(null);
  const [vinylWall, setVinylWall] = useState([]);
  const [attendingConcerts, setAttendingConcerts] = useState([]);
  const [favoriteArtists, setFavoriteArtists] = useState(['The Weeknd', 'Taylor Swift', 'SZA', 'Kendrick Lamar']);
  const [isManageArtistsOpen, setIsManageArtistsOpen] = useState(false);
  const [artistSearchInput, setArtistSearchInput] = useState('');
  
  const POPULAR_ARTISTS_PRESETS = [
    { name: 'The Weeknd', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/400x400bb.jpg' },
    { name: 'Taylor Swift', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg' },
    { name: 'SZA', image: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music122/v4/e5/22/aa/e522aa4d-d790-2139-38b4-250868fbc6c5/196587754323.jpg/200x200bb.jpg' },
    { name: 'Kendrick Lamar', image: 'https://images.weserv.nl/?url=is1-ssl.mzstatic.com/image/thumb/Music112/v4/a4/09/2d/a4092d6e-82ef-5f12-fa8a-6b834927cbcd/22UMGIM48126.rgb.jpg/200x200bb.jpg' },
    { name: 'Coldplay', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/f5/93/8c/f5938c49-964c-31d1-4b33-78b634f71fb7/190295978075.jpg/400x400bb.jpg' },
    { name: 'Arijit Singh', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music221/v4/15/4d/53/154d5368-2dda-23bd-6970-c0bd5c7f61c6/8313.jpg/400x400bb.jpg' },
    { name: 'Drake', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/51/61/f3/5161f3c4-2292-f035-eb68-6f95bbc9edd6/00602537542338.rgb.jpg/400x400bb.jpg' },
    { name: 'Dua Lipa', image: 'https://is1-ssl.mzstatic.com/image/thumb/Music116/v4/6c/11/d6/6c11d681-aa3a-d59e-4c2e-f77e181026ab/190295092665.jpg/400x400bb.jpg' }
  ];

  const handleAddArtist = async (artistInput) => {
    const nameStr = typeof artistInput === 'string' ? artistInput : artistInput.artist_name || artistInput.name;
    const preset = POPULAR_ARTISTS_PRESETS.find(p => p.name.toLowerCase() === nameStr.toLowerCase());
    const imgUrl = typeof artistInput === 'object' ? (artistInput.artist_image_url || artistInput.image_url || artistInput.image) : (preset?.image || '/default_track.jpg');
    
    const exists = favoriteArtists.some(a => (typeof a === 'string' ? a : a.artist_name || a.name).toLowerCase() === nameStr.toLowerCase());
    if (!exists) {
      const newObj = { name: nameStr, artist_name: nameStr, artist_image_url: imgUrl, image_url: imgUrl };
      const updated = [...favoriteArtists, newObj];
      setFavoriteArtists(updated);
      const userKey = currentUser?.username || profileUser?.username || 'guest_user';
      localStorage.setItem(`user_fav_artists_${userKey}`, JSON.stringify(updated));

      try {
        await authAPI.addFavoriteArtist({ artist_name: nameStr, artist_image_url: imgUrl });
      } catch (err) {
        console.error('Backend add artist sync failed:', err);
      }
    }
  };

  const handleRemoveArtist = async (artistInput) => {
    const nameStr = typeof artistInput === 'string' ? artistInput : artistInput.artist_name || artistInput.name;
    const updated = favoriteArtists.filter(a => (typeof a === 'string' ? a : a.artist_name || a.name).toLowerCase() !== nameStr.toLowerCase());
    setFavoriteArtists(updated);
    const userKey = currentUser?.username || profileUser?.username || 'guest_user';
    localStorage.setItem(`user_fav_artists_${userKey}`, JSON.stringify(updated));

    try {
      await authAPI.removeFavoriteArtist({ artist_name: nameStr });
    } catch (err) {
      console.error('Backend remove artist sync failed:', err);
    }
  };


  const [badges, setBadges] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState('grid'); // grid, list

  // Edit Profile States
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editBio, setEditBio] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editCountry, setEditCountry] = useState('');
  const [editFlag, setEditFlag] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editBackground, setEditBackground] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editGenderPref, setEditGenderPref] = useState('Both');

  // New Music Profile fields
  const [editFavoriteSong, setEditFavoriteSong] = useState(null);
  const [editMusicPrompts, setEditMusicPrompts] = useState([]);
  


  // Status modal states
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatusText, setNewStatusText] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Follow lists states
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTitle, setFollowModalTitle] = useState('');
  const [followModalUsers, setFollowModalUsers] = useState([]);
  const [followModalLoading, setFollowModalLoading] = useState(false);

  // Modal open states for sub-flows
  const [isSongSearchOpen, setIsSongSearchOpen] = useState(false);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [songSearchResults, setSongSearchResults] = useState([]);

  const [isPromptSelectOpen, setIsPromptSelectOpen] = useState(false);
  const [isPromptSearchOpen, setIsPromptSearchOpen] = useState(false);
  const [selectedPromptLabel, setSelectedPromptLabel] = useState('');
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [promptSearchResults, setPromptSearchResults] = useState([]);

  const PROMPT_OPTIONS = [
    '🎤 My go-to karaoke song',
    '💔 My heartbreak anthem',
    '🍷 A song for drunk texting',
    '💋 One-night stand anthem',
    '🕰️ A nostalgic track',
    '🎤 A song I know by heart',
    '☀️ My summer track',
    '🛌 A song for lazy Sundays',
    '⚰️ A song I would play at a funeral',
    '😈 A song that makes me feel like a villain',
    '👰 My non-traditional wedding song'
  ];

  const handleAvatarFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditBackground(reader.result); // Base64 Data URL
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      const updated = await updateProfile({
        bio: editBio,
        age: parseInt(editAge) || null,
        gender: editGender,
        gender_preference: editGenderPref,
        city: editCity,
        country: editCountry,
        country_flag: editFlag,
        avatar_url: editAvatar,
        background_url: editBackground,
        status_text: editStatus,
        favorite_song: editFavoriteSong?.id || null,
        music_prompts: editMusicPrompts
      });
      setProfileUser(updated.data);
      setIsEditOpen(false);
    } catch (err) {
      console.error(err);
      alert('Error updating profile settings.');
    }
  };

  // Add Vinyl States
  const [isAddVinylOpen, setIsAddVinylOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState(null);
  const [vinylSearchQuery, setVinylSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const isOwnProfile = !username || username === currentUser?.username;

  useEffect(() => {
    fetchProfileData();
  }, [username]);

  const fetchProfileData = async () => {
    setLoading(true);
    const targetUsername = username || currentUser?.username;
    if (!targetUsername) return;

    try {
      const userRes = await authAPI.getPublicProfile(targetUsername);
      setProfileUser(userRes.data);
      setIsFollowing(userRes.data.is_following);
      setTasteMatch(userRes.data.taste_match);
      setIsBlocked(userRes.data.is_blocked || false);

      // Prepopulate edit fields
      setEditBio(userRes.data.bio || '');
      setEditAge(userRes.data.age || '');
      setEditCity(userRes.data.city || '');
      setEditCountry(userRes.data.country || '');
      setEditFlag(userRes.data.country_flag || '🇮🇳');
      setEditAvatar(userRes.data.avatar_url || '');
      setEditBackground(userRes.data.background_url || '');
      setEditStatus(userRes.data.status_text || '');
      setEditGender(userRes.data.gender || 'Male');
      setEditGenderPref(userRes.data.gender_preference || 'Both');
      setEditFavoriteSong(userRes.data.favorite_song_detail || null);
      setEditMusicPrompts(userRes.data.music_prompts || []);

      // Fetch Vinyl Wall
      try {
        const vwRes = await musicAPI.getVinylWall(targetUsername);
        const wallItems = Array(9).fill(null);
        vwRes.data.forEach(item => {
          if (item.position >= 0 && item.position < 9) {
            wallItems[item.position] = item;
          }
        });
        setVinylWall(wallItems);
      } catch {
        const mockItems = Array(9).fill(null);
        mockItems[0] = { id: 1, position: 0, track: { title: 'Blinding Lights', album_art_url: 'https://i.scdn.co/image/ab67616d0000b2738863bc11d2aa12b54f5aeb36', artist_name: 'The Weeknd' } };
        mockItems[1] = { id: 2, position: 1, track: { title: 'Cruel Summer', album_art_url: 'https://i.scdn.co/image/ab67616d0000b273e787cffec20aa2a396a61647', artist_name: 'Taylor Swift' } };
        setVinylWall(mockItems);
      }

        // Fetch Concerts
        try {
          const concertsRes = await userConcertsAPI.getUserConcerts(targetUsername);
          setAttendingConcerts(concertsRes.data);
        } catch {
          setAttendingConcerts([]);
        }

        // Fetch Favorite Artists with localStorage persistence
        const savedFavs = localStorage.getItem(`user_fav_artists_${targetUsername}`);
      if (savedFavs) {
        try {
          const parsed = JSON.parse(savedFavs);
          setFavoriteArtists(parsed);
        } catch {
          setFavoriteArtists(userRes.data.favorite_artists || []);
        }
      } else {
        setFavoriteArtists(userRes.data.favorite_artists || []);
      }

      // Fetch Badges
      try {
        const badgeRes = await triviaAPI.getUserBadges(targetUsername);
        setBadges(badgeRes.data);
      } catch {
        setBadges([]);
      }

      // Fetch User Posts
      try {
        const postsRes = await socialAPI.getUserPosts(targetUsername);
        setPosts(postsRes.data);
      } catch {
        setPosts([]);
      }

    } catch (err) {
      console.error(err);
      // Fallback mock profile when backend is offline
      const mockProfile = {
        id: 1,
        username: targetUsername || 'guest_user',
        email: 'guest@freq.com',
        age: null,
        city: '',
        country: '',
        country_flag: '🌐',
        bio: 'Welcome to your Freq profile!',
        followers_count: 0,
        following_count: 0,
        friends_count: 12,
        is_following: false,
        taste_match: 85,
        avatar_url: '',
        background_url: '',
        favorite_genres: ['Pop', 'Rock', 'Electronic'],
        favorite_artists: [
          { name: 'Taylor Swift', image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg' },
          { name: 'Kendrick Lamar', image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/50/c2/cc/50c2cc95-3658-9417-0d4b-831abde44ba1/24UM1IM28978.rgb.jpg/400x400bb.jpg' }
        ],
        music_prompts: [
          { prompt: 'My vibe right now', title: 'Espresso', artist_name: 'Sabrina Carpenter', album_art_url: 'https://i.scdn.co/image/ab67616d0000b273659cd4673230913b3918e0d5' }
        ]
      };
      setProfileUser(mockProfile);
      const userKey = targetUsername || 'guest_user';
      const localFavs = localStorage.getItem(`user_fav_artists_${userKey}`);
      if (localFavs) {
        try {
          setFavoriteArtists(JSON.parse(localFavs));
        } catch {
          setFavoriteArtists(mockProfile.favorite_artists);
        }
      } else {
        setFavoriteArtists(mockProfile.favorite_artists);
      }
      setEditBio(mockProfile.bio);
      setEditAge(mockProfile.age);
      setEditCity(mockProfile.city);
      setEditCountry(mockProfile.country);
      setEditFlag(mockProfile.country_flag);
      setEditGender('Male');
      setEditGenderPref('Both');
      setEditMusicPrompts(mockProfile.music_prompts);
      setBadges([
        { id: 1, name: 'Swiftie Elite', icon: '✨', description: 'Top 1% Taylor Swift listener' }
      ]);
      setPosts([
        {
          id: 99,
          user: { username: mockProfile.username, is_verified: true },
          content: 'Just set up my new profile! Loving the new light theme.',
          time_ago: '2m',
          likes_count: 5,
          comments_count: 0,
          reposts_count: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (isOwnProfile || !profileUser) return;
    try {
      const res = await authAPI.followToggle(profileUser.id);
      setIsFollowing(res.data.is_following);
    } catch {}
  };

  const handleBlockToggle = async () => {
    if (isOwnProfile || !profileUser?.id) return;
    try {
      const res = await authAPI.blockToggle(profileUser.id);
      setIsBlocked(res.data.is_blocked);
      setIsMenuOpen(false);
      alert(res.data.is_blocked ? `${profileUser.username} has been blocked.` : `${profileUser.username} has been unblocked.`);
      if (res.data.is_blocked) {
        setIsFollowing(false);
      }
    } catch {
      alert('Failed to block/unblock user.');
    }
  };

  const handleShowFollowers = async () => {
    if (!isOwnProfile) return; // Prevent checking other users' followers
    setIsFollowModalOpen(true);
    setFollowModalTitle('Followers');
    setFollowModalUsers([]);
    setFollowModalLoading(true);
    try {
      const res = await authAPI.getFollowers(profileUser.username);
      setFollowModalUsers(res.data);
    } catch {
      setFollowModalUsers([
        { id: 'mock-f1', username: 'asap_riley', avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', is_verified: true },
        { id: 'mock-f2', username: 'kanye_west', avatar_url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', is_verified: false }
      ]);
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleShowFollowing = async () => {
    if (!isOwnProfile) return; // Prevent checking who other users follow
    setIsFollowModalOpen(true);
    setFollowModalTitle('Following');
    setFollowModalUsers([]);
    setFollowModalLoading(true);
    try {
      const res = await authAPI.getFollowing(profileUser.username);
      setFollowModalUsers(res.data);
    } catch {
      setFollowModalUsers([
        { id: 'mock-f3', username: 'taylorswift', avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', is_verified: true }
      ]);
    } finally {
      setFollowModalLoading(false);
    }
  };

  const handleEditStatusBubble = () => {
    if (!isOwnProfile) return;
    setNewStatusText(profileUser.status_text || '');
    setIsStatusModalOpen(true);
  };

  const handleVinylSlotClick = (index) => {
    if (!isOwnProfile) {
      const occupied = vinylWall[index];
      if (occupied) playTrack(occupied.track);
      return;
    }

    setActiveSlot(index);
    const existing = vinylWall[index];

    if (existing) {
      const act = window.confirm(`Manage Slot: Click OK to Play "${existing.track.title}" or CANCEL to Remove it.`);
      if (act) {
        playTrack(existing.track);
      } else {
        removeVinyl(existing.id, index);
      }
    } else {
      setIsAddVinylOpen(true);
      setSearchResults([]);
      setVinylSearchQuery('');
    }
  };

  const removeVinyl = async (itemId, index) => {
    try {
      await musicAPI.removeFromVinylWall(itemId);
      const nextWall = [...vinylWall];
      nextWall[index] = null;
      setVinylWall(nextWall);
    } catch {
      const nextWall = [...vinylWall];
      nextWall[index] = null;
      setVinylWall(nextWall);
    }
  };

  const handleVinylSearch = async (e) => {
    const q = e.target.value;
    setVinylSearchQuery(q);
    if (q.trim().length < 2) return;
    try {
      const res = await musicAPI.search(q);
      setSearchResults(res.data.tracks || []);
    } catch {}
  };

  const selectVinylTrack = async (track) => {
    try {
      const res = await musicAPI.addToVinylWall(track.id);
      const nextWall = [...vinylWall];
      nextWall[activeSlot] = {
        id: res.data.id || Date.now(),
        position: activeSlot,
        track: track
      };
      setVinylWall(nextWall);
    } catch {
      const nextWall = [...vinylWall];
      nextWall[activeSlot] = {
        id: Date.now(),
        position: activeSlot,
        track: track
      };
      setVinylWall(nextWall);
    }
    setIsAddVinylOpen(false);
  };

  // Favorite Song search flows
  const handleFavSongSearch = async (e) => {
    const q = e.target.value;
    setSongSearchQuery(q);
    if (q.trim().length < 2) return;
    try {
      const res = await musicAPI.search(q);
      setSongSearchResults(res.data.tracks || []);
    } catch {}
  };

  const selectFavoriteSong = (track) => {
    setEditFavoriteSong(track);
    setIsSongSearchOpen(false);
    setSongSearchQuery('');
    setSongSearchResults([]);
  };

  // Prompts search flows
  const handlePromptSearchInput = async (e) => {
    const q = e.target.value;
    setPromptSearchQuery(q);
    if (q.trim().length < 2) return;
    try {
      const res = await musicAPI.search(q);
      setPromptSearchResults(res.data.tracks || []);
    } catch {}
  };

  const selectPromptOption = (label) => {
    setSelectedPromptLabel(label);
    setIsPromptSelectOpen(false);
    setIsPromptSearchOpen(true);
    setPromptSearchQuery('');
    setPromptSearchResults([]);
  };

  const selectPromptTrack = (track) => {
    const newPromptObj = {
      prompt: selectedPromptLabel,
      id: track.id,
      title: track.title,
      artist_name: track.artist?.name || track.artist_name,
      album_art_url: track.album_art_url,
      preview_url: track.preview_url
    };
    setEditMusicPrompts([...editMusicPrompts, newPromptObj]);
    setIsPromptSearchOpen(false);
  };

  const removePrompt = (index) => {
    const nextPrompts = [...editMusicPrompts];
    nextPrompts.splice(index, 1);
    setEditMusicPrompts(nextPrompts);
  };

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (!profileUser) return <div className="loading-screen">User not found</div>;

  return (
    <div className="profile-page page-container">
      {/* Floating Settings button for own profile view */}
      {isOwnProfile && (
        <button 
          className="profile-settings-btn" 
          onClick={() => navigate('/settings')} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            zIndex: 110, 
            background: 'rgba(0,0,0,0.6)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          aria-label="Settings"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1.5" fill="white"></circle>
            <circle cx="12" cy="5" r="1.5" fill="white"></circle>
            <circle cx="12" cy="19" r="1.5" fill="white"></circle>
          </svg>
        </button>
      )}

      {!isOwnProfile && (
        <button 
          className="profile-settings-btn" 
          onClick={() => setIsMenuOpen(!isMenuOpen)} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            right: '20px', 
            zIndex: 110, 
            background: 'rgba(0,0,0,0.6)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
          aria-label="Options"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1.5" fill="white"></circle>
            <circle cx="12" cy="5" r="1.5" fill="white"></circle>
            <circle cx="12" cy="19" r="1.5" fill="white"></circle>
          </svg>
        </button>
      )}

      {/* Floating options dropdown menu for public profiles */}
      {isMenuOpen && !isOwnProfile && (
        <div 
          className="freq-glass fade-in" 
          style={{ 
            position: 'absolute', 
            top: '64px', 
            right: '20px', 
            zIndex: 120, 
            borderRadius: 'var(--freq-radius-md)', 
            padding: '6px', 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: '130px', 
            boxShadow: 'var(--freq-shadow-md)',
            background: 'rgba(26,26,46,0.95)'
          }}
        >
          <button 
            onClick={handleBlockToggle} 
            style={{ 
              background: 'none', 
              border: 'none', 
              color: isBlocked ? 'var(--freq-success)' : 'var(--freq-error)', 
              padding: '10px 14px', 
              fontSize: '13px', 
              fontWeight: 600, 
              cursor: 'pointer', 
              textAlign: 'left',
              width: '100%'
            }}
          >
            {isBlocked ? 'Unblock User' : 'Block User'}
          </button>
        </div>
      )}

      {/* Floating Back button for public profile views */}
      {!isOwnProfile && (
        <button 
          className="profile-back-btn" 
          onClick={() => navigate(-1)} 
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            zIndex: 110, 
            background: 'rgba(0,0,0,0.6)', 
            border: 'none', 
            borderRadius: '50%', 
            width: '36px', 
            height: '36px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
      )}
      {/* Background Cover Photo rendering */}
      <div 
        className="profile-smoke-header" 
        style={profileUser.background_url ? { 
          backgroundImage: `url(${profileUser.background_url})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          opacity: 0.9
        } : {}}
      >
        <div className="profile-smoke-overlay"></div>
      </div>

      <div className="profile-container fade-in">
        <div className="profile-avatar-row">
          <div className="profile-avatar-large">
            {profileUser.avatar_url ? (
              <img src={profileUser.avatar_url} alt="" />
            ) : (
              <div className="avatar-large-placeholder">{profileUser.username[0].toUpperCase()}</div>
            )}
          </div>
          {isOwnProfile ? (
            <div className="profile-action-buttons">
              <button className="freq-btn-outline" onClick={() => setIsEditOpen(true)}>Edit Profile</button>
              <button className="logout-btn" onClick={logout}>Log Out</button>
            </div>
          ) : (
            <div className="profile-action-buttons" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`freq-btn-primary ${isFollowing ? 'unfollow-btn' : ''}`} onClick={handleFollowToggle}>
                  {isFollowing ? 'Following' : 'Follow'}
                </button>
                <button 
                  className="freq-btn-outline" 
                  onClick={() => navigate(`/chat/dm?userId=${profileUser.id}&name=${profileUser.username}`)}
                  style={{ padding: '10px 20px', borderRadius: 'var(--freq-radius-full)', fontWeight: 600, fontSize: '14px' }}
                >
                  Message
                </button>
              </div>
              {tasteMatch != null && <div className="profile-taste-match" style={{ width: '100%', textAlign: 'center' }}>{tasteMatch}% match</div>}
            </div>
          )}
        </div>

        <div className="profile-info">
          <div className="profile-name-row">
            <h1 className="profile-username">{profileUser.username}</h1>
            {profileUser.is_verified && <span className="verified-badge-large">✓</span>}
          </div>
          <span className="profile-unique-id" style={{ fontSize: '10px', color: 'var(--freq-text-dim)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px', letterSpacing: '0.5px' }}>
            FREQ ID: #{profileUser.id}
          </span>
          <p className="profile-details-row">
            <span>🎂 {profileUser.age || 'N/A'} yrs</span>
            <span>📍 {profileUser.city || 'Somewhere'}, {profileUser.country || 'Earth'} {profileUser.country_flag}</span>
          </p>
          <div className="profile-thought-bubble" onClick={handleEditStatusBubble} style={{ cursor: isOwnProfile ? 'pointer' : 'default' }}>
            <span className="quote-marks">“</span>
            <span className="bubble-text">{profileUser.status_text || "What's on your mind?"}</span>
            <span className="quote-marks">”</span>
          </div>
          <p className="profile-bio">{profileUser.bio || "No bio added yet."}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-box" onClick={handleShowFollowers} style={isOwnProfile ? { cursor: 'pointer' } : {}}>
            <span className="stat-count">{profileUser.followers_count || 0}</span>
            <span className="stat-label">Followers</span>
          </div>
          <div className="stat-box" onClick={handleShowFollowing} style={isOwnProfile ? { cursor: 'pointer' } : {}}>
            <span className="stat-count">{profileUser.following_count || 0}</span>
            <span className="stat-label">Following</span>
          </div>
          <div className="stat-box">
            <span className="stat-count">{attendingConcerts ? attendingConcerts.length : 0}</span>
            <span className="stat-label">Concerts</span>
          </div>
        </div>

        {/* AI Music Persona Classifier */}
        <PersonaCard username={profileUser.username} />

        {/* Animated Glassmorphism Achievements & Streaks Badges */}
        <AchievementBadges badges={badges} />

        {/* Feature 2: AI Taste Compatibility Radar */}
        <TasteRadar 
          user1={{ username: isOwnProfile ? (currentUser?.username || 'You') : 'You' }} 
          user2={{ username: isOwnProfile ? 'Global Avg' : profileUser.username }} 
          matchScore={isOwnProfile ? 88 : (tasteMatch || 92)} 
          isOwnProfile={isOwnProfile}
        />




        {/* Featured Favorite Song Section */}
        {profileUser.favorite_song_detail && (
          <div className="favorite-song-featured freq-glass" style={{ margin: '18px 0', padding: '14px 16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '14px', border: '1px solid rgba(124,58,237,0.25)', background: 'linear-gradient(135deg, rgba(26,26,46,0.9), rgba(124,58,237,0.15))' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', background: '#121212', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
              <span style={{ fontSize: '20px' }}>🎵</span>
              <img 
                src={profileUser.favorite_song_detail.album_art_url} 
                alt="" 
                onError={(e) => { e.target.style.display = 'none'; }}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} 
              />
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
              <span style={{ fontSize: '10px', color: 'var(--freq-purple-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.7px' }}>Favorite Song</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{profileUser.favorite_song_detail.title}</span>
              <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>{profileUser.favorite_song_detail.artist?.name || profileUser.favorite_song_detail.artist_name}</span>
            </div>
            <button 
              className="np-play" 
              onClick={(e) => { e.stopPropagation(); playTrack(profileUser.favorite_song_detail); }}
              style={{ width: '32px', height: '32px', background: 'var(--freq-purple)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
            </button>
          </div>
        )}

        {/* Selected Music Prompts Section (Slangs) */}
        {profileUser.music_prompts && profileUser.music_prompts.map((p, idx) => (
          <div key={idx} className="music-prompt-card freq-card" style={{ margin: '14px 0', padding: '16px', borderRadius: '16px', textAlign: 'left' }}>
            <span style={{ fontSize: '11px', color: 'var(--freq-text-dim)', fontWeight: 700, display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{p.prompt}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#181818', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, position: 'relative' }}>
                <img 
                  src={p.album_art_url} 
                  alt="" 
                  onError={(e) => { e.target.style.display = 'none'; }}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }} 
                />
                <span style={{ fontSize: '16px', zIndex: 1 }}>🎵</span>
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--freq-text)' }}>{p.title}</span>
                <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>{p.artist_name}</span>
              </div>
              <button 
                className="np-play" 
                onClick={(e) => { e.stopPropagation(); playTrack(p); }}
                style={{ width: '28px', height: '28px', background: 'rgba(255,255,255,0.08)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="white"><polygon points="6,4 20,12 6,20"/></svg>
              </button>
            </div>
          </div>
        ))}

        {/* Favorite Artists Section with Add/Remove Manager */}
        <div className="favorite-artists-section" style={{ margin: '20px 0', textAlign: 'left' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--freq-text)' }}>⭐ Favorite Artists</h3>
            {isOwnProfile && (
              <button 
                onClick={() => setIsManageArtistsOpen(true)}
                style={{ background: 'var(--freq-bg-input)', border: '1px solid #E4DCD0', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, color: 'var(--freq-purple)' }}
              >
                + Manage Artists
              </button>
            )}
          </div>
          
          <div className="favorite-artists-scroll" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {favoriteArtists.length > 0 ? (
              favoriteArtists.map((artist, idx) => {
                const name = typeof artist === 'string' ? artist : artist.artist_name || artist.name;
                const img = typeof artist === 'object' ? artist.artist_image_url || artist.image_url : null;
                return (
                  <div key={idx} className="fav-artist-chip freq-glass" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 14px', background: 'var(--freq-bg-card)', borderRadius: '99px', border: '1px solid var(--freq-purple-light)', boxShadow: 'var(--freq-shadow-sm)' }}>
                    <div style={{ width: '22px', height: '22px', borderRadius: '50%', overflow: 'hidden', background: 'var(--freq-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '10px', fontWeight: 'bold', color: '#fff', position: 'relative' }}>
                      {img && (
                        <img 
                          src={img} 
                          alt="" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                        />
                      )}
                      <span style={{ zIndex: 1 }}>{name?.[0]}</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--freq-text)' }}>{name}</span>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--freq-text-secondary)' }}>No favorite artists added yet. Tap <strong>+ Manage Artists</strong> to add your favorites!</p>
            )}
          </div>
        </div>

        {/* Upcoming Concerts Section */}
        {attendingConcerts && attendingConcerts.length > 0 && (
          <div className="profile-section" style={{ marginTop: '30px' }}>
            <h3 className="section-title">🎟️ Upcoming Concerts</h3>
            <div className="concerts-list" style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
              {attendingConcerts.map(c => (
                <div key={c.id} className="concert-mini-card" style={{ minWidth: '250px', borderRadius: '15px', overflow: 'hidden', cursor: 'pointer', background: 'var(--freq-bg-card)', border: '1px solid var(--freq-purple-light)', boxShadow: 'var(--freq-shadow-sm)' }} onClick={() => navigate('/concerts')}>
                  <div className="concert-mini-img" style={{ height: '120px', backgroundImage: `url(${c.image_url})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                    <div className="concert-mini-date" style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'var(--freq-bg)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--freq-purple-light)', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                      {new Date(c.date_time).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="concert-mini-info" style={{ padding: '15px' }}>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: 'var(--freq-text)', fontWeight: 800 }}>{c.title}</h4>
                    <div style={{ fontSize: '0.9rem', color: 'var(--freq-text-secondary)' }}>{c.venue} • {c.city}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="profile-sub-tabs">
          <button className={`sub-tab-btn ${activeSubTab === 'grid' ? 'active' : ''}`} onClick={() => setActiveSubTab('grid')}>
            Vinyl Wall
          </button>
          <button className={`sub-tab-btn ${activeSubTab === 'list' ? 'active' : ''}`} onClick={() => setActiveSubTab('list')}>
            Posts
          </button>
        </div>


        <div className="profile-tab-content">
          {activeSubTab === 'grid' && (
            <div className="vinyl-grid">
              {vinylWall.map((item, index) => (
                <div key={index} className="vinyl-slot-wrapper" onClick={() => handleVinylSlotClick(index)}>
                  {item ? (
                    <div className="vinyl-slot occupied">
                      <div className="vinyl-album-art-wrapper" style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#121212', borderRadius: 'inherit', overflow: 'hidden' }}>
                        <img 
                          src={item.track.album_art_url} 
                          alt="" 
                          className="vinyl-album-art" 
                          onError={(e) => { e.target.style.display = 'none'; }}
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                        />
                        <span style={{ fontSize: '28px', zIndex: 1 }}>💿</span>
                      </div>
                      <div className="vinyl-overlay-disc">
                        <div className="vinyl-groove"></div>
                      </div>
                    </div>
                  ) : (
                    <div className="vinyl-slot empty">
                      <span className="plus">+</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSubTab === 'list' && (
            <div className="profile-posts">
              {posts.length === 0 ? (
                <p className="tab-empty">No posts yet.</p>
              ) : (
                posts.map(post => (
                  <PostCard key={post.id} post={post} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsEditOpen(false)}>
          <div className="profile-edit-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Settings</h2>
              <button className="close-btn" onClick={() => setIsEditOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleUpdateProfileSubmit} className="edit-form">
              <div className="input-group">
                <label>Profile Image:</label>
                {editAvatar && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <img src={editAvatar} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--freq-purple-light)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>Selected from storage</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="freq-input" onChange={handleAvatarFileUpload} style={{ padding: '8px 10px' }} />
              </div>

              {/* Background Photo selection */}
              <div className="input-group">
                <label>Background Cover Photo:</label>
                {editBackground && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                    <img src={editBackground} alt="" style={{ width: '80px', height: '44px', borderRadius: '4px', objectFit: 'cover', border: '1px solid var(--freq-purple-light)' }} />
                    <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>Selected from storage</span>
                  </div>
                )}
                <input type="file" accept="image/*" className="freq-input" onChange={handleBackgroundFileUpload} style={{ padding: '8px 10px' }} />
              </div>

              {/* Favorite Song Selector */}
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Featured Favorite Song:</label>
                {editFavoriteSong ? (
                  <div className="selected-track-badge" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--freq-bg-input)', padding: '8px 12px', borderRadius: '8px', marginBottom: '8px' }}>
                    <img src={editFavoriteSong.album_art_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '4px' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--freq-text)' }}>{editFavoriteSong.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--freq-text-secondary)' }}>{editFavoriteSong.artist?.name || editFavoriteSong.artist_name}</span>
                    </div>
                    <button type="button" onClick={() => setEditFavoriteSong(null)} style={{ background: 'none', color: 'var(--freq-error)', fontSize: '12px' }}>✕</button>
                  </div>
                ) : (
                  <button type="button" className="freq-btn-outline" onClick={() => { setIsSongSearchOpen(true); setSongSearchResults([]); setSongSearchQuery(''); }} style={{ width: '100%', marginBottom: '8px', padding: '10px' }}>
                    Select Favorite Song
                  </button>
                )}
              </div>

              {/* Music Prompts Manager (Slangs) */}
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Music Prompts (Slangs):</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                  {editMusicPrompts.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--freq-bg-input)', padding: '8px 12px', borderRadius: '8px' }}>
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', color: 'var(--freq-text-dim)', fontWeight: 700 }}>{p.prompt}</span>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--freq-text)' }}>{p.title} - {p.artist_name}</span>
                      </div>
                      <button type="button" onClick={() => removePrompt(idx)} style={{ background: 'none', color: 'var(--freq-error)', fontSize: '12px' }}>✕</button>
                    </div>
                  ))}
                </div>
                {editMusicPrompts.length < 3 && (
                  <button type="button" className="freq-btn-outline" onClick={() => setIsPromptSelectOpen(true)} style={{ width: '100%', padding: '10px' }}>
                    + Add Prompt (Slang)
                  </button>
                )}
              </div>

              <div className="input-group">
                <label>Status Bubble Text:</label>
                <input type="text" className="freq-input" value={editStatus} onChange={(e) => setEditStatus(e.target.value)} maxLength="60" placeholder="What's on your mind?" />
              </div>

              <div className="input-group">
                <label>Bio:</label>
                <textarea className="freq-input bio-textarea" value={editBio} onChange={(e) => setEditBio(e.target.value)} />
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Age:</label>
                  <input type="number" className="freq-input" value={editAge} onChange={(e) => setEditAge(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>City:</label>
                  <input type="text" className="freq-input" value={editCity} onChange={(e) => setEditCity(e.target.value)} />
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Gender:</label>
                  <select className="freq-input" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Match Preference:</label>
                  <select className="freq-input" value={editGenderPref} onChange={(e) => setEditGenderPref(e.target.value)}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>
              <div className="input-row">
                <div className="input-group">
                  <label>Country:</label>
                  <input type="text" className="freq-input" value={editCountry} onChange={(e) => setEditCountry(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Flag emoji:</label>
                  <input type="text" className="freq-input" value={editFlag} onChange={(e) => setEditFlag(e.target.value)} maxLength="4" />
                </div>
              </div>
              <button type="submit" className="freq-btn-primary save-btn">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* Select Favorite Song Modal Dialog */}
      {isSongSearchOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsSongSearchOpen(false)} style={{ zIndex: 1100 }}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Favorite Song</h2>
              <button className="close-btn" onClick={() => setIsSongSearchOpen(false)}>✕</button>
            </div>
            <input
              type="text"
              className="freq-input"
              placeholder="Search track title (via iTunes)..."
              value={songSearchQuery}
              onChange={handleFavSongSearch}
              autoFocus
            />
            <div className="search-results-list scrollable">
              {songSearchResults.map(track => (
                <div key={track.id} className="search-track-row" onClick={() => selectFavoriteSong(track)}>
                  <img src={track.album_art_url} alt="" className="str-art" />
                  <div className="str-info">
                    <span className="str-title">{track.title}</span>
                    <span className="str-artist">{track.artist?.name || track.artist_name}</span>
                  </div>
                  <span className="select-plus">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Prompt Label Sheet Dialog */}
      {isPromptSelectOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsPromptSelectOpen(false)} style={{ zIndex: 1100 }}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Select a Prompt (Slang)</h2>
              <button className="close-btn" onClick={() => setIsPromptSelectOpen(false)}>✕</button>
            </div>
            <div className="prompts-options-list scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', padding: '10px 0' }}>
              {PROMPT_OPTIONS.map((label, idx) => (
                <button 
                  key={idx} 
                  type="button" 
                  onClick={() => selectPromptOption(label)}
                  style={{ background: 'var(--freq-bg-input)', border: '1px solid #CBD5E1', color: 'var(--freq-text)', padding: '14px', borderRadius: '12px', textAlign: 'left', fontSize: '13px', fontWeight: 600, transition: 'background 0.2s' }}
                  onMouseEnter={(e) => e.target.style.background = '#E2E8F0'}
                  onMouseLeave={(e) => e.target.style.background = 'var(--freq-bg-input)'}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Select Prompt Attached Song Modal Dialog */}
      {isPromptSearchOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsPromptSearchOpen(false)} style={{ zIndex: 1100 }}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Music <span style={{ fontSize: '10px', opacity: 0.6, fontWeight: 'normal' }}>courtesy of iTunes</span></h2>
              <button className="close-btn" onClick={() => setIsPromptSearchOpen(false)}>✕</button>
            </div>
            <div style={{ background: 'rgba(124,58,237,0.1)', padding: '10px 14px', borderRadius: '8px', marginBottom: '12px', fontSize: '12px', color: 'var(--freq-purple-light)', fontWeight: 600 }}>
              {selectedPromptLabel}
            </div>
            <input
              type="text"
              className="freq-input"
              placeholder="Search a song..."
              value={promptSearchQuery}
              onChange={handlePromptSearchInput}
              autoFocus
            />
            <div className="search-results-list scrollable">
              {promptSearchResults.map(track => (
                <div key={track.id} className="search-track-row" onClick={() => selectPromptTrack(track)}>
                  <img src={track.album_art_url} alt="" className="str-art" />
                  <div className="str-info">
                    <span className="str-title">{track.title}</span>
                    <span className="str-artist">{track.artist?.name || track.artist_name}</span>
                  </div>
                  <span className="select-plus">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Custom Status Bubble Modal */}
      {isStatusModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsStatusModalOpen(false)}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '360px' }}>
            <div className="modal-header">
              <h2>Update Status</h2>
              <button className="close-btn" onClick={() => setIsStatusModalOpen(false)}>✕</button>
            </div>
            <div style={{ padding: '10px 0', textAlign: 'left' }}>
              <input
                type="text"
                className="freq-input"
                placeholder="What's on your mind?"
                value={newStatusText}
                onChange={(e) => setNewStatusText(e.target.value)}
                maxLength="60"
                style={{ width: '100%', marginBottom: '14px' }}
                autoFocus
              />
              <button 
                type="button" 
                className="freq-btn-primary" 
                onClick={async () => {
                  try {
                    const res = await updateProfile({ status_text: newStatusText });
                    setProfileUser(res.data);
                    setIsStatusModalOpen(false);
                  } catch {
                    alert('Failed to update status.');
                  }
                }}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Vinyl Modal Dialog */}
      {isAddVinylOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsAddVinylOpen(false)}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add to Vinyl Wall (Slot {activeSlot + 1})</h2>
              <button className="close-btn" onClick={() => setIsAddVinylOpen(false)}>✕</button>
            </div>
            <input
              type="text"
              className="freq-input"
              placeholder="Search track name or artist..."
              value={vinylSearchQuery}
              onChange={handleVinylSearch}
              autoFocus
            />
            <div className="search-results-list scrollable">
              {searchResults.map(track => (
                <div key={track.id} className="search-track-row" onClick={() => selectVinylTrack(track)}>
                  <img src={track.album_art_url} alt="" className="str-art" />
                  <div className="str-info">
                    <span className="str-title">{track.title}</span>
                    <span className="str-artist">{track.artist?.name || track.artist_name}</span>
                  </div>
                  <span className="select-plus">+</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Followers/Following Modal */}
      {isFollowModalOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsFollowModalOpen(false)}>
          <div className="custom-modal freq-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', width: '90%', borderRadius: '24px', padding: '24px', background: 'var(--freq-bg-card)' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
              <h3 className="freq-gradient-text" style={{ fontSize: '18px', fontWeight: 800 }}>{followModalTitle}</h3>
              <button className="close-btn" onClick={() => setIsFollowModalOpen(false)} style={{ background: 'none', color: 'var(--freq-text)', fontSize: '20px', cursor: 'pointer' }}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {followModalLoading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--freq-text-dim)' }}>Loading list...</div>
              ) : followModalUsers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--freq-text-dim)' }}>No users found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {followModalUsers.map(u => (
                    <div 
                      key={u.id} 
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px 12px', borderRadius: '12px', background: 'var(--freq-bg-input)', transition: 'var(--freq-transition)' }}
                      onClick={() => {
                        setIsFollowModalOpen(false);
                        navigate(`/profile/${u.username}`);
                      }}
                    >
                      <div style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--freq-purple-light)' }}>
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                        ) : (
                          <div className="avatar-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient-purple)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                            {u.username ? u.username[0].toUpperCase() : 'F'}
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--freq-text)' }}>{u.username}</span>
                        {u.is_verified && <span className="verified-badge" style={{ fontSize: '10px', background: 'var(--freq-purple)', color: 'white', width: '14px', height: '14px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✓</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manage Favorite Artists Modal Dialog */}

      {isManageArtistsOpen && (
        <div className="modal-overlay fade-in" onClick={() => setIsManageArtistsOpen(false)}>
          <div className="profile-edit-modal freq-glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>⭐ Manage Favorite Artists</h2>
              <button className="close-btn" onClick={() => setIsManageArtistsOpen(false)}>✕</button>
            </div>
            
            {/* Search or Quick Add Preset Artists */}
            <div style={{ textAlign: 'left', marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--freq-text)', display: 'block', marginBottom: '6px' }}>Add New Artist:</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  className="freq-input" 
                  placeholder="Type artist name (e.g. Drake, Dua Lipa)..." 
                  value={artistSearchInput}
                  onChange={(e) => setArtistSearchInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && artistSearchInput.trim()) {
                      e.preventDefault();
                      handleAddArtist(artistSearchInput.trim());
                      setArtistSearchInput('');
                    }
                  }}
                />
                <button 
                  className="freq-btn-primary" 
                  onClick={() => {
                    if (artistSearchInput.trim()) {
                      handleAddArtist(artistSearchInput.trim());
                      setArtistSearchInput('');
                    }
                  }}
                  style={{ padding: '0 18px', flexShrink: 0 }}
                >
                  Add
                </button>
              </div>
            </div>

            {/* Your Current Favorites */}
            <div style={{ textAlign: 'left', marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--freq-text)', display: 'block', marginBottom: '8px' }}>Your Selected Favorite Artists:</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', maxHeight: '160px', overflowY: 'auto', padding: '4px' }}>
                {favoriteArtists.map((artist, idx) => {
                  const name = typeof artist === 'string' ? artist : artist.artist_name || artist.name;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--freq-bg-input)', border: '1.5px solid #E4DCD0', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 700, color: 'var(--freq-text)' }}>
                      <span>🎵 {name}</span>
                      <button onClick={() => handleRemoveArtist(name)} style={{ background: 'none', border: 'none', color: 'var(--freq-error)', fontSize: '12px', cursor: 'pointer', padding: '0 2px' }}>✕</button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Presets Quick Pick */}
            <div style={{ textAlign: 'left' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--freq-text-secondary)', display: 'block', marginBottom: '8px' }}>Popular Presets (Tap to Add):</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {POPULAR_ARTISTS_PRESETS.map((preset, idx) => {
                  const isAdded = favoriteArtists.some(a => (typeof a === 'string' ? a : a.name || a.artist_name).toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      key={idx}
                      onClick={() => isAdded ? handleRemoveArtist(preset.name) : handleAddArtist(preset.name)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: '12px',
                        background: isAdded ? 'var(--freq-bg-elevated)' : 'var(--freq-bg-card)',
                        border: isAdded ? '1.5px solid var(--freq-purple)' : '1px solid var(--freq-purple-light)',
                        cursor: 'pointer',
                        textAlign: 'left'
                      }}
                    >
                      <img src={preset.image} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--freq-text)', flex: 1 }}>{preset.name}</span>
                      <span style={{ fontSize: '14px', color: isAdded ? 'var(--freq-purple)' : 'var(--freq-text-dim)' }}>{isAdded ? '✓' : '+'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;

