import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePlayback } from '../../context/PlaybackContext';
import { chatAPI, authAPI, concertAPI } from '../../services/api';
import './ChatRoom.css';

const BACKEND_HOST = window.location.hostname;
const WS_BASE = `ws://${BACKEND_HOST}:8000`;

const ChatRoom = () => {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentTrack } = usePlayback();

  const roomName = searchParams.get('name') || 'Chatroom';
  const otherUserId = searchParams.get('userId');

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [onlineCount, setOnlineCount] = useState(12);
  const [otherUser, setOtherUser] = useState(null);
  const [roomCover, setRoomCover] = useState('');
  const [inviteStatus, setInviteStatus] = useState({});
  const [attachedImage, setAttachedImage] = useState(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [roomMembers, setRoomMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(true);
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting | open | closed

  const messagesEndRef = useRef(null);
  const ws = useRef(null);
  const reconnectTimer = useRef(null);
  const pollTimer = useRef(null);
  const seenIds = useRef(new Set());   // deduplicate messages

  // ─── helpers ──────────────────────────────────────────────────────────
  const scrollToBottom = () => {
    const container = document.querySelector('.messages-list');
    if (container) container.scrollTop = container.scrollHeight;
    setTimeout(() => {
      const c = document.querySelector('.messages-list');
      if (c) c.scrollTop = c.scrollHeight;
    }, 120);
  };

  const addMessage = useCallback((msg) => {
    const senderName = msg.sender?.username || msg.username || 'unknown';
    const msgContent = (msg.content || msg.message || '').trim();
    // Unique key combines ID or sender+content signature to prevent duplicate displays
    const primaryKey = msg.id ? String(msg.id) : `${senderName}_${msgContent}`;
    const signatureKey = `${senderName}_${msgContent}`;
    
    if (seenIds.current.has(primaryKey) || seenIds.current.has(signatureKey)) return;
    
    seenIds.current.add(primaryKey);
    seenIds.current.add(signatureKey);

    setMessages(prev => [...prev, { ...msg, _key: primaryKey }]);
  }, []);


  const handleChatImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setAttachedImage(reader.result);
    reader.readAsDataURL(file);
  };

  // ─── fetch initial messages + other user profile ───────────────────────
  const fetchMessages = useCallback(async () => {
    try {
      if (otherUserId) {
        // DM: load history
        const res = await chatAPI.getDMsWith(otherUserId);
        seenIds.current.clear();
        const loaded = res.data || [];
        loaded.forEach(m => {
          const key = m.id || `${m.sender?.username}_${m.content}_${m.timestamp}`;
          seenIds.current.add(key);
        });
        setMessages(loaded);

        // Fetch fresh profile of the other user by username (roomName)
        try {
          const profileRes = await authAPI.getPublicProfile(roomName);
          setOtherUser(profileRes.data);
        } catch {
          // Resolve from history if profile endpoint fails
          const dmUser =
            loaded.find(m => m.sender?.id !== user?.id && m.sender?.username !== user?.username)?.sender ||
            loaded.find(m => m.receiver?.id !== user?.id && m.receiver?.username !== user?.username)?.receiver;
          if (dmUser) setOtherUser(dmUser);
        }
      } else {
        // Group chatroom
        const res = await chatAPI.getRoom(roomId);
        seenIds.current.clear();
        const loaded = res.data.messages || [];
        loaded.forEach(m => {
          const key = m.id || `${m.sender?.username}_${m.content}_${m.timestamp}`;
          seenIds.current.add(key);
        });
        setMessages(loaded);
        setRoomCover(res.data.cover_image_url);
        setIsJoined(res.data.is_joined ?? true);
        const mc = res.data.members_count || 0;
        setOnlineCount(Math.max(3, Math.min(mc, Math.round(mc * 0.18 + Math.random() * 3))));
      }
    } catch {
      if (otherUserId) {
        setMessages([
          { id: 1, sender: { username: roomName }, content: `Hey! Thanks for connecting on FREQ! What music are you listening to today? 🎧`, timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, sender: { username: 'You' }, content: `Hey ${roomName}! Just vibing to the new album releases and checking out taste matches! 🔥`, timestamp: new Date(Date.now() - 1800000).toISOString() },
          { id: 3, sender: { username: roomName }, content: `Awesome! The production on the acoustic tracks is so good. What is your favorite track so far? 🎵`, timestamp: new Date(Date.now() - 600000).toISOString() }
        ]);
      } else {
        setMessages([
          { id: 1, sender: { username: 'system' }, content: 'Welcome to the room! Keep discussions respectful.', timestamp: new Date(Date.now() - 3600000).toISOString() },
          { id: 2, sender: { username: 'alex_beats', avatar_url: '' }, content: 'Has anyone checked out the new synth remix drop?', timestamp: new Date(Date.now() - 1800000).toISOString() },
          { id: 3, sender: { username: 'melody_finder', avatar_url: '' }, content: 'Yes! The vocal harmonies and bassline are stellar.', timestamp: new Date(Date.now() - 1200000).toISOString() },
          { id: 4, sender: { username: 'tanvi_roliya', avatar_url: '' }, content: 'Loving the vibe in this lounge! What track are we playing next? 💖', timestamp: new Date(Date.now() - 600000).toISOString() }
        ]);
      }
    }
  }, [roomId, otherUserId, roomName, user]);

  // ─── poll for new DMs every 5 s (reliable fallback) ───────────────────
  const startDMPolling = useCallback(() => {
    if (!otherUserId) return;
    pollTimer.current = setInterval(async () => {
      try {
        const res = await chatAPI.getDMsWith(otherUserId);
        const loaded = res.data || [];
        loaded.forEach(m => addMessage(m));
      } catch {}
    }, 5000);
  }, [otherUserId, addMessage]);

  // ─── WebSocket setup with auto-reconnect ──────────────────────────────
  const setupWebSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = otherUserId
      ? `${WS_BASE}/ws/dm/${otherUserId}/?token=${token}`
      : `${WS_BASE}/ws/chat/${roomId}/?token=${token}`;

    if (ws.current) {
      ws.current.onclose = null; // prevent reconnect loop on intentional close
      ws.current.close();
    }

    const socket = new WebSocket(wsUrl);
    ws.current = socket;
    setWsStatus('connecting');

    socket.onopen = () => {
      setWsStatus('open');
      // Clear reconnect timer on successful connect
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'message' || data.type === 'dm') {
        addMessage({
          id: data.id || Date.now(),
          sender: { username: data.username, avatar_url: data.avatar_url, id: data.sender_id || data.user_id },
          content: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
        });
      }
    };

    socket.onerror = () => {
      setWsStatus('closed');
    };

    socket.onclose = () => {
      setWsStatus('closed');
      // Auto-reconnect after 3 seconds
      reconnectTimer.current = setTimeout(() => {
        setupWebSocket();
      }, 3000);
    };
  }, [roomId, otherUserId, addMessage]);

  // ─── Main mount/update effect ─────────────────────────────────────────
  useEffect(() => {
    seenIds.current.clear();
    setMessages([]);
    fetchMessages();
    setupWebSocket();
    if (otherUserId) startDMPolling();

    return () => {
      // Cleanup: close ws, clear timers
      if (ws.current) {
        ws.current.onclose = null; // prevent reconnect
        ws.current.close();
      }
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [roomId, otherUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // ─── other helpers ─────────────────────────────────────────────────────
  const handleOpenMembers = async () => {
    setIsMembersOpen(true);
    setMembersLoading(true);
    try {
      const res = await chatAPI.getRoomMembers(roomId);
      setRoomMembers(res.data);
    } catch {
      setRoomMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleToggleJoin = async () => {
    try {
      if (isJoined) {
        await chatAPI.leaveRoom(roomId);
        setIsJoined(false);
      } else {
        await chatAPI.joinRoom(roomId);
        setIsJoined(true);
      }
      const res = await chatAPI.getRoomMembers(roomId);
      setRoomMembers(res.data);
    } catch {}
  };

  const parseMessageContent = (content) => {
    let result = { text: content || '', image: null, concertInviteId: null };
    
    if (content && content.includes('[IMAGE]')) {
      const parts = content.split('[IMAGE]');
      result.text = parts[0];
      result.image = parts[1];
    }
    
    // Parse [CONCERT_INVITE:123]
    if (result.text && result.text.includes('[CONCERT_INVITE:')) {
      const match = result.text.match(/\[CONCERT_INVITE:([a-zA-Z0-9_-]+)\]/);
      if (match) {
        result.concertInviteId = match[1];
        result.text = result.text.replace(match[0], '').trim();
      }
    }
    
    return result;
  };

  const handleConcertRSVP = async (msgId, concertId, action) => {
    if (action === 'accept') {
      try {
        await concertAPI.toggleAttend(concertId);
        setInviteStatus(prev => ({ ...prev, [msgId]: 'accepted' }));
        
        if (window.confirm("Do you want to post about going to this concert to your friends or keep it a secret?\n\nClick OK to Post, Cancel to keep it secret.")) {
          try {
            const concertRes = await concertAPI.getConcert(concertId);
            const concert = concertRes.data;
            const { socialAPI } = await import('../../services/api');
            await socialAPI.createPost({
              content: `🎟️ I'm going to ${concert.title} at ${concert.venue}! Who else is coming?`,
              media_url: concert.image_url || '',
            });
            alert("Posted to your feed!");
          } catch (e) {
            console.error("Failed to post", e);
          }
        }
      } catch (err) {
        console.error('Failed to RSVP', err);
      }
    } else {
      setInviteStatus(prev => ({ ...prev, [msgId]: 'denied' }));
    }
  };

  // ─── send message ──────────────────────────────────────────────────────
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() && !attachedImage) return;

    const finalContent = attachedImage
      ? `${inputText.trim()} [IMAGE]${attachedImage}`
      : inputText.trim();

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      // Primary path: WebSocket (saves to DB in consumer)
      ws.current.send(JSON.stringify({ message: finalContent }));
      setInputText('');
      setAttachedImage(null);
    } else {
      // Fallback path: REST API (always saves to DB)
      // Optimistic local add only for non-WebSocket flow to avoid duplicate displays
      const optimisticMsg = {
        id: `opt_${Date.now()}`,
        sender: { username: user?.username || 'You', avatar_url: user?.avatar_url, id: user?.id },
        content: finalContent,
        timestamp: new Date().toISOString(),
      };
      addMessage(optimisticMsg);
      setInputText('');
      setAttachedImage(null);

      try {
        if (otherUserId) {
          await chatAPI.sendDM(otherUserId, finalContent);
        } else {
          await chatAPI.sendRoomMessage(roomId, finalContent);
        }
      } catch {}
    }
  };

  // ─── render ────────────────────────────────────────────────────────────
  return (
    <div className={`chatroom-page page-container ${currentTrack ? 'has-player' : ''}`}>
      <div className="chatroom-header freq-glass" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button className="back-btn" onClick={() => navigate('/chats')} style={{ paddingRight: '4px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
        </button>

        <div
          className="cr-header-avatar"
          onClick={() => otherUserId ? navigate(`/profile/${roomName}`) : handleOpenMembers()}
          style={{ width: '36px', height: '36px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid var(--freq-purple-light)', background: 'var(--freq-bg-elevated)', flexShrink: 0, cursor: 'pointer' }}
        >
          {otherUserId ? (
            otherUser?.avatar_url ? (
              <img src={otherUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient-purple)', color: 'white', fontSize: '12px', fontWeight: 700 }}>
                {(otherUser?.username || roomName)[0]?.toUpperCase()}
              </div>
            )
          ) : (
            roomCover ? (
              <img src={roomCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient-purple)', color: 'white', fontSize: '14px' }}>🎵</div>
            )
          )}
        </div>

        <div
          className="cr-header-info"
          onClick={() => otherUserId ? navigate(`/profile/${roomName}`) : handleOpenMembers()}
          style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
        >
          <h2 className="cr-name">{otherUser?.username || roomName}</h2>
          <span className="cr-online">
            {otherUserId
              ? wsStatus === 'open' ? '🟢 Online' : '🔵 Connecting...'
              : `🟢 ${onlineCount} online (Click for Info)`}
          </span>
        </div>

        {/* WS status dot */}
        {wsStatus === 'closed' && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', color: 'var(--freq-text-dim)', whiteSpace: 'nowrap' }}>
            ⚡ Reconnecting...
          </span>
        )}
      </div>

      <div className="messages-list">
        {messages.map((msg, idx) => {
          const isSystem = msg.sender?.username === 'system';
          const isMe = msg.sender?.username === user?.username || msg.sender?.username === 'You' || msg.sender?.id === user?.id;
          return (
            <div key={msg._key || msg.id || idx} className={`message-bubble-wrapper ${isSystem ? 'system' : isMe ? 'me' : 'other'}`}>
              {!isSystem && !isMe && (
                <div className="msg-avatar-container">
                  {msg.sender?.avatar_url ? (
                    <img src={msg.sender.avatar_url} alt="" className="msg-avatar" />
                  ) : (
                    <div className="msg-avatar-placeholder">{msg.sender?.username?.[0]?.toUpperCase()}</div>
                  )}
                </div>
              )}
              <div className="message-content-box">
                {!isSystem && !isMe && <span className="msg-sender-name">{msg.sender?.username}</span>}
                <div className="message-bubble">
                  {parseMessageContent(msg.content).text && <p>{parseMessageContent(msg.content).text}</p>}
                  {parseMessageContent(msg.content).image && (
                    <img
                      src={parseMessageContent(msg.content).image}
                      alt=""
                      style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '6px', maxHeight: '180px', objectFit: 'cover', display: 'block' }}
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {parseMessageContent(msg.content).concertInviteId && (
                    <div className="concert-invite-card" style={{ marginTop: '10px', background: 'rgba(29, 185, 84, 0.1)', border: '1px solid #1DB954', padding: '12px', borderRadius: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>🎟️</span>
                        <strong style={{ color: '#1DB954' }}>Concert Invitation</strong>
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem' }}>
                        {isMe ? 'You invited them to a concert!' : 'I invited you to a concert! Click below to see details and RSVP.'}
                      </p>
                      
                      {isMe ? (
                        <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: '#b3b3b3', fontStyle: 'italic' }}>
                          Waiting for their response...
                        </div>
                      ) : !inviteStatus[msg.id] ? (
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button 
                            onClick={() => handleConcertRSVP(msg.id, parseMessageContent(msg.content).concertInviteId, 'accept')}
                            style={{ flex: 1, padding: '8px', background: '#1DB954', color: 'black', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleConcertRSVP(msg.id, parseMessageContent(msg.content).concertInviteId, 'deny')}
                            style={{ flex: 1, padding: '8px', background: 'var(--freq-bg-input)', color: 'var(--freq-text)', border: '1px solid var(--freq-border)', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                          >
                            Deny
                          </button>
                        </div>
                      ) : (
                        <div style={{ padding: '8px', textAlign: 'center', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: inviteStatus[msg.id] === 'accepted' ? '#1DB954' : '#b3b3b3', fontWeight: 'bold' }}>
                          {inviteStatus[msg.id] === 'accepted' ? '✅ You accepted the invite!' : '❌ You declined the invite.'}
                        </div>
                      )}
                      
                      <button 
                        onClick={() => navigate('/concerts')}
                        style={{ width: '100%', padding: '8px', marginTop: '10px', background: 'transparent', color: '#1DB954', border: '1px solid #1DB954', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        View All Concerts
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-bar freq-glass" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {attachedImage && (
          <div className="attached-image-preview" style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', alignSelf: 'flex-start' }}>
            <div style={{ position: 'relative', width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden' }}>
              <img src={attachedImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <button type="button" onClick={() => setAttachedImage(null)} style={{ position: 'absolute', top: '1px', right: '1px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: '14px', height: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '8px', cursor: 'pointer' }}>✕</button>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--freq-text-dim)' }}>Media attached</span>
          </div>
        )}

        <div style={{ display: 'flex', width: '100%', gap: '10px', alignItems: 'center' }}>
          <button type="button" className="chat-media-btn" onClick={() => document.getElementById('chat-file-input').click()} style={{ background: 'none', display: 'flex', alignItems: 'center', padding: '8px', cursor: 'pointer' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--freq-text-dim)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
          </button>
          <input type="file" id="chat-file-input" accept="image/*" onChange={handleChatImageUpload} style={{ display: 'none' }} />
          <input
            type="text"
            className="freq-input chat-input-field"
            placeholder="Send a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />
          <button type="submit" className="chat-send-btn freq-btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="22 2 2 22 10 22 22 2"/></svg>
          </button>
        </div>
      </form>

      {/* Group Room Info & Members List Overlay */}
      {isMembersOpen && (
        <div className="modal-overlay fade-in" style={{ zIndex: 1200, display: 'flex', flexDirection: 'column', padding: 0 }}>
          <div className="settings-page" style={{ flex: 1, width: '100%', maxWidth: '480px', margin: '0 auto', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--freq-bg)', position: 'relative' }}>
            <header className="settings-header freq-glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <button className="settings-back-btn" onClick={() => setIsMembersOpen(false)} aria-label="Back">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <h1 className="settings-title" style={{ fontSize: '18px', fontWeight: 700 }}>{roomName.replace(' Chatroom', '')}</h1>
              <button className="settings-back-btn" style={{ padding: '8px' }} aria-label="More">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><circle cx="5" cy="12" r="1.5"/></svg>
              </button>
            </header>

            <div className="settings-content" style={{ flex: 1, overflowY: 'auto', paddingTop: '80px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '110px', height: '110px', borderRadius: '50%', overflow: 'hidden', border: '3px solid var(--freq-purple-light)', background: 'var(--freq-bg-elevated)', boxShadow: 'var(--freq-shadow-glow-purple)' }}>
                  {roomCover ? (
                    <img src={roomCover} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', color: 'white', fontSize: '32px' }}>🎵</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'center', marginTop: '4px' }}>
                  <button onClick={handleToggleJoin} className="freq-btn-primary" style={{ flex: '0 1 130px', padding: '10px 20px', borderRadius: 'var(--freq-radius-full)', fontWeight: 700, fontSize: '13px', backgroundColor: isJoined ? 'rgba(255,255,255,0.08)' : 'var(--freq-purple-light)', backgroundImage: isJoined ? 'none' : 'var(--freq-gradient)', border: isJoined ? '1px solid rgba(255,255,255,0.2)' : 'none', color: 'white', cursor: 'pointer' }}>
                    {isJoined ? 'FOLLOWING' : 'JOIN'}
                  </button>
                  <button onClick={() => { setIsMembersOpen(false); navigate(`/search?q=${roomName.replace(' Chatroom', '')}`); }} className="freq-btn-outline" style={{ flex: '0 1 130px', padding: '10px 20px', borderRadius: 'var(--freq-radius-full)', fontWeight: 700, fontSize: '13px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    PROFILE
                  </button>
                </div>
              </div>

              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginTop: '10px' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--freq-text-secondary)' }}>
                  Members ({roomMembers.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {membersLoading ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--freq-text-dim)', fontSize: '13px' }}>Loading members...</div>
                ) : roomMembers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--freq-text-dim)', fontSize: '13px' }}>No members in this room yet.</div>
                ) : (
                  roomMembers.map(member => (
                    <div key={member.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setIsMembersOpen(false); navigate(`/profile/${member.username}`); }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', border: '1.5px solid rgba(255,255,255,0.1)', background: 'var(--freq-bg-elevated)', flexShrink: 0 }}>
                          {member.avatar_url ? (
                            <img src={member.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                          ) : (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--freq-gradient)', color: 'white', fontWeight: 700, fontSize: '16px' }}>
                              {member.username[0]?.toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{member.username}</span>
                            {member.is_verified && <span style={{ color: 'var(--freq-cyan)', fontSize: '12px' }}>✓</span>}
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--freq-text-dim)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.status_text || member.bio || 'Listening to music'}
                          </span>
                        </div>
                      </div>
                      {member.username !== user?.username && (
                        <button
                          onClick={() => { setIsMembersOpen(false); navigate(`/chat/dm_${member.id}?userId=${member.id}&name=${member.username}`); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Direct Message"
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--freq-purple-light)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="22" y1="2" x2="11" y2="13"></line>
                            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                          </svg>
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
