import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { chatAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelper';
import './Chats.css';

const Chats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('messages'); // messages, requests
  const [rooms, setRooms] = useState([]);
  const [dms, setDms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [requests, setRequests] = useState([]);
  const [showAllRooms, setShowAllRooms] = useState(false);
  const [roomSearchQuery, setRoomSearchQuery] = useState('');

  // Track joined chatroom IDs in localStorage per user
  const userKey = user?.username || 'guest_user';
  const [joinedRoomIds, setJoinedRoomIds] = useState(() => {
    const saved = localStorage.getItem(`user_joined_rooms_${userKey}`);
    return saved ? JSON.parse(saved) : []; // Default empty until user joins
  });

  const handleJoinRoom = (roomId, e) => {
    if (e) e.stopPropagation();
    if (!joinedRoomIds.includes(roomId)) {
      const updated = [...joinedRoomIds, roomId];
      setJoinedRoomIds(updated);
      localStorage.setItem(`user_joined_rooms_${userKey}`, JSON.stringify(updated));
    }
  };

  const handleLeaveRoom = (roomId, e) => {
    if (e) e.stopPropagation();
    const updated = joinedRoomIds.filter(id => id !== roomId);
    setJoinedRoomIds(updated);
    localStorage.setItem(`user_joined_rooms_${userKey}`, JSON.stringify(updated));
  };

  const joinedRooms = rooms.filter(r => joinedRoomIds.includes(r.id));
  const suggestedRooms = rooms.filter(r => !joinedRoomIds.includes(r.id));

  useEffect(() => {
    fetchChatsData();
  }, [activeTab]);

  useEffect(() => {
    if (!showAllRooms) {
      setRoomSearchQuery('');
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await chatAPI.getRooms(roomSearchQuery);
        setRooms(res.data);
      } catch {}
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [roomSearchQuery, showAllRooms]);

  const fetchChatsData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'messages') {
        const roomsRes = await chatAPI.getRooms();
        setRooms(roomsRes.data);

        const dmsRes = await chatAPI.getDMs();
        setDms(dmsRes.data);
      } else {
        const reqRes = await chatAPI.getRequests();
        setRequests(reqRes.data);
      }
    } catch {
      // Mock chats data
      if (activeTab === 'messages') {
        setRooms([
          { id: 1, name: 'Taylor Swift Club', room_type: 'artist', cover_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music211/v4/2d/46/e0/2d46e0bc-8ab9-85dd-4b56-ee6951351034/25UM1IM19577.rgb.jpg/400x400bb.jpg', members_count: 142 },
          { id: 2, name: 'Indie Pop Heads', room_type: 'genre', cover_image_url: 'https://images.unsplash.com/photo-1493225457124-a1a2a5f52802?w=200', members_count: 356 },
          { id: 3, name: 'The Weeknd Tribe', room_type: 'artist', cover_image_url: 'https://is1-ssl.mzstatic.com/image/thumb/Music115/v4/2a/aa/b4/2aaab42a-a4cb-a600-4a25-d78961495960/18UMGIM17204.rgb.jpg/400x400bb.jpg', members_count: 89 },
        ]);

        setDms([
          {
            user: { id: 2, username: 'alex_beats', avatar_url: '', is_verified: true },
            last_message: 'Did you hear the new synth track? Incredible production.',
            timestamp: new Date().toISOString(),
            unread_count: 2
          },
          {
            user: { id: 3, username: 'melody_finder', avatar_url: '', is_verified: false },
            last_message: 'Yeah, let’s sync up tomorrow.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            unread_count: 0
          }
        ]);
      } else {
        setRequests([
          { id: 1, from_user: { id: 4, username: 'groove_rider', avatar_url: '', country_flag: '🇺🇸' } }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRespondRequest = async (id, action) => {
    try {
      await chatAPI.respondRequest(id, action);
      setRequests(requests.filter(r => r.id !== id));
    } catch {
      setRequests(requests.filter(r => r.id !== id));
    }
  };

  const handleBlast = () => {
    const text = prompt('Enter a blast message to send to all DM contacts:');
    if (!text) return;
    alert(`📢 Blast message sent to all active chats!`);
  };

  const filteredDMs = dms.filter(dm => 
    dm.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="chats-page page-container">
      <div className="chats-header">
        <h1 className="chats-title">
          Chats <span className="lightning-icon">⚡</span>
        </h1>
        <div className="chats-tab-toggle">
          <button className={`toggle-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>
            Messages
          </button>
          <button className={`toggle-btn ${activeTab === 'requests' ? 'active' : ''}`} onClick={() => setActiveTab('requests')}>
            Requests {requests.length > 0 && <span className="badge">{requests.length}</span>}
          </button>
        </div>
      </div>

      {activeTab === 'messages' ? (
        <>
          <div className="search-bar-container">
            <input
              type="text"
              className="freq-input search-chats"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* My Joined Chatrooms Section */}
          <div className="chatrooms-section" style={{ marginBottom: '20px' }}>
            <div className="section-header">
              <h3>My Joined Chatrooms</h3>
              <span className="show-all" onClick={() => setShowAllRooms(true)} style={{ cursor: 'pointer', color: 'var(--freq-purple)', fontWeight: 700 }}>Directory 🔍</span>
            </div>
            {joinedRooms.length > 0 ? (
              <div className="chatrooms-scroll">
                {joinedRooms.map(room => (
                  <div key={room.id} className="chatroom-circle-item" onClick={() => navigate(`/chat/${room.id}?name=${room.name}`)} style={{ position: 'relative' }}>
                    <div className="chatroom-circle" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', borderRadius: '50%', overflow: 'hidden' }}>
                      <div className="chatroom-placeholder" style={{ zIndex: 1, fontSize: '18px', fontWeight: 800 }}>{room.name[0]}</div>
                      {room.cover_image_url && (
                        <img 
                          src={getImageUrl(room.cover_image_url)} 
                          alt="" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                        />
                      )}
                    </div>
                    <button
                      title="Leave chatroom"
                      onClick={(e) => handleLeaveRoom(room.id, e)}
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '4px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#EF4444',
                        color: '#FFFFFF',
                        border: '2px solid #FFFFFF',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        zIndex: 5,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
                      }}
                    >
                      ✕
                    </button>
                    <span className="chatroom-name-lbl">{room.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '14px', background: 'var(--freq-bg-input)', borderRadius: '16px', border: '1px dashed var(--freq-border)', textAlign: 'left', margin: '8px 0' }}>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--freq-text-secondary)', fontWeight: 600 }}>
                  You haven't joined any chatrooms yet. Tap <strong>+ Join</strong> below on any suggested artist room!
                </p>
              </div>
            )}
          </div>

          {/* Suggested Artist Rooms Section */}
          {suggestedRooms.length > 0 && (
            <div className="suggested-rooms-section" style={{ margin: '20px 0', textAlign: 'left' }}>
              <div className="section-header" style={{ marginBottom: '10px' }}>
                <h3>✨ Suggested Artist Chatrooms</h3>
              </div>
              <div className="suggested-rooms-scroll" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                {suggestedRooms.map(room => (
                  <div 
                    key={room.id} 
                    className="suggested-room-card freq-card"
                    style={{ minWidth: '200px', maxWidth: '220px', padding: '14px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '10px', background: 'var(--freq-bg-card)', border: '1px solid var(--freq-border)', boxShadow: 'var(--freq-shadow-sm)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: 'var(--freq-purple)', flexShrink: 0, position: 'relative' }}>
                        {room.cover_image_url ? (
                          <img src={getImageUrl(room.cover_image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span style={{ color: '#fff', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>{room.name[0]}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--freq-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{room.name}</span>
                        <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>{room.members_count || 42} members</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleJoinRoom(room.id, e)}
                      style={{ width: '100%', padding: '8px', borderRadius: '12px', background: 'var(--freq-purple)', color: '#FFFFFF', border: 'none', fontWeight: 700, fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                    >
                      + JOIN CHATROOM
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="dms-section">
            <div className="section-header">
              <h3>Direct Messages</h3>
            </div>

            {loading ? (
              <div className="dms-loading">Loading conversations...</div>
            ) : filteredDMs.length === 0 ? (
              <div className="dms-empty">
                <p>Let's start chatting!</p>
              </div>
            ) : (
              <div className="dms-list">
                {filteredDMs.map(dm => (
                  <div key={dm.user.id} className="dm-row" onClick={() => navigate(`/chat/dm_${dm.user.id}?name=${dm.user.username}&userId=${dm.user.id}`)}>
                    <div className="dm-avatar-container" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient-purple)', borderRadius: '50%', overflow: 'hidden', width: '42px', height: '42px' }}>
                      <div className="dm-avatar-placeholder" style={{ zIndex: 1, fontSize: '14px', fontWeight: 800 }}>{dm.user.username[0].toUpperCase()}</div>
                      {dm.user.avatar_url && (
                        <img 
                          src={getImageUrl(dm.user.avatar_url)} 
                          alt="" 
                          className="dm-avatar" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                        />
                      )}
                      {dm.user.is_verified && <span className="dm-verified" style={{ zIndex: 3 }}>✓</span>}
                    </div>
                    <div className="dm-meta">
                      <div className="dm-name-row">
                        <span className="dm-username">{dm.user.username}</span>
                        <span className="dm-time">10m ago</span>
                      </div>
                      <p className="dm-last-msg">{dm.last_message}</p>
                    </div>
                    {dm.unread_count > 0 && (
                      <div className="dm-unread-badge">{dm.unread_count}</div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="requests-section">
          {loading ? (
            <div>Loading requests...</div>
          ) : requests.length === 0 ? (
            <p className="tab-empty">No pending requests</p>
          ) : (
            <div className="requests-list">
              {requests.map(req => (
                <div key={req.id} className="request-row freq-glass">
                  <div className="req-user-info">
                    <span className="req-name">{req.from_user.username}</span>
                    <span className="req-flag">{req.from_user.country_flag}</span>
                  </div>
                  <div className="req-actions">
                    <button className="freq-btn-primary accept-btn" onClick={() => handleRespondRequest(req.id, 'accept')}>Accept</button>
                    <button className="freq-btn-outline reject-btn" onClick={() => handleRespondRequest(req.id, 'reject')}>Ignore</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Show All Chatrooms Directory Modal */}
      {showAllRooms && (
        <div className="modal-overlay fade-in" onClick={() => setShowAllRooms(false)}>
          <div className="add-vinyl-modal freq-glass" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: '8px' }}>
              <h2>All Chatrooms</h2>
              <button className="close-btn" onClick={() => setShowAllRooms(false)}>✕</button>
            </div>
            <div style={{ padding: '0 0 12px 0' }}>
              <input
                type="text"
                className="freq-input"
                placeholder="🔍 Search other artists chatrooms..."
                value={roomSearchQuery}
                onChange={(e) => setRoomSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', fontSize: '13px' }}
              />
            </div>
            <div className="chatrooms-directory-list scrollable" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto', padding: '10px 0' }}>
              {rooms.map(room => {
                const isJoined = joinedRoomIds.includes(room.id);
                return (
                  <div 
                    key={room.id} 
                    className="chatroom-directory-row" 
                    onClick={() => {
                      if (isJoined) {
                        setShowAllRooms(false);
                        navigate(`/chat/${room.id}?name=${room.name}`);
                      }
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px', background: 'var(--freq-bg-card)', border: '1px solid var(--freq-border)', borderRadius: '12px', cursor: 'pointer' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', background: 'var(--freq-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {room.cover_image_url ? (
                        <img src={getImageUrl(room.cover_image_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ color: '#fff', fontWeight: 'bold' }}>{room.name[0]}</span>
                      )}
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--freq-text)' }}>{room.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--freq-text-secondary)' }}>{room.members_count || 42} active members</span>
                    </div>
                    {isJoined ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAllRooms(false);
                            navigate(`/chat/${room.id}?name=${room.name}`);
                          }}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '99px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid var(--freq-purple)',
                            background: 'transparent',
                            color: 'var(--freq-text)',
                            cursor: 'pointer'
                          }}
                        >
                          OPEN 💬
                        </button>
                        <button
                          onClick={(e) => handleLeaveRoom(room.id, e)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '99px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: '1px solid var(--freq-error)',
                            background: 'transparent',
                            color: 'var(--freq-error)',
                            cursor: 'pointer'
                          }}
                        >
                          LEAVE ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => handleJoinRoom(room.id, e)}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '99px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          background: 'var(--freq-purple)',
                          color: '#FFFFFF',
                          cursor: 'pointer'
                        }}
                      >
                        + JOIN
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chats;
