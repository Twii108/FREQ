import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayback } from '../../context/PlaybackContext';

const PrivateRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { playTrack, currentTrack } = usePlayback();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('user'))?.username || 'you'; } catch { return 'you'; } })();

  useEffect(() => {
    fetchRoom();
    const interval = setInterval(fetchRoom, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const fetchRoom = async () => {
    try {
      const res = await fetch(\http://\:8000/api/social/rooms/\/\, {
        headers: { 'Authorization': \Bearer \\ }
      });
      if (res.ok) {
        const data = await res.json();
        setRoom(data);
        if (data.current_track && (!currentTrack || currentTrack.id !== data.current_track.id)) {
           playTrack({ ...data.current_track, is_live_sync: true });
        }
      } else {
        navigate('/');
      }
    } catch { }
    setLoading(false);
  };

  const handleApprove = async (reqId) => {
    await fetch(\http://\:8000/api/social/rooms/\/approve/\/\, {
      method: 'POST',
      headers: { 'Authorization': \Bearer \\ }
    });
    fetchRoom();
  };

  if (loading) return <div style={{ padding: '80px 20px', color: 'white' }}>Loading Room...</div>;
  if (!room) return null;

  const isOwner = currentUser === room.owner;

  return (
    <div style={{ padding: '80px 20px 100px 20px', color: 'var(--freq-text)', minHeight: '100vh', background: 'var(--freq-bg)' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'var(--freq-cyan)', marginBottom: '20px', cursor: 'pointer', fontWeight: 'bold' }}>&larr; Leave Room</button>
      
      <h1 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{room.name}</h1>
      <p style={{ color: 'var(--freq-text-secondary)', marginBottom: '24px' }}>Hosted by DJ {room.owner}</p>

      <div style={{ background: 'var(--freq-bg-card)', padding: '20px', borderRadius: '16px', marginBottom: '24px' }}>
        <h3 style={{ fontSize: '14px', color: 'var(--freq-text-dim)', marginBottom: '16px', textTransform: 'uppercase' }}>{isOwner ? 'Your Listeners' : 'In Room'}</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {room.guests.map(g => (
            <span key={g} style={{ background: 'var(--freq-bg-elevated)', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', fontWeight: 'bold' }}>{g}</span>
          ))}
        </div>
      </div>

      {isOwner && room.pending_requests && room.pending_requests.length > 0 && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', padding: '20px', borderRadius: '16px' }}>
          <h3 style={{ fontSize: '14px', color: '#EF4444', marginBottom: '16px', textTransform: 'uppercase', fontWeight: 'bold' }}>Track Requests</h3>
          {room.pending_requests.map(req => (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--freq-bg-input)', padding: '12px', borderRadius: '12px', marginBottom: '8px' }}>
              <div>
                <p style={{ fontWeight: 'bold', fontSize: '14px' }}>{req.track?.title}</p>
                <p style={{ fontSize: '12px', color: 'var(--freq-text-secondary)' }}>Requested by {req.requested_by}</p>
              </div>
              <button onClick={() => handleApprove(req.id)} style={{ background: 'var(--freq-gradient)', color: 'var(--freq-bg)', border: 'none', padding: '8px 16px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Approve</button>
            </div>
          ))}
        </div>
      )}

      {!isOwner && (
        <div style={{ textAlign: 'center', marginTop: '40px' }}>
          <p style={{ color: 'var(--freq-text-dim)' }}>You are a guest. To play music, go to Search and click Play to request a track.</p>
        </div>
      )}
    </div>
  );
};
export default PrivateRoom;
