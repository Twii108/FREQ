import { useState, useEffect } from 'react';
import { concertAPI } from '../../services/api';
import './Concerts.css';

const Concerts = () => {
  const [concerts, setConcerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cityFilter, setCityFilter] = useState('');

  useEffect(() => {
    fetchConcerts();
  }, [cityFilter]);

  const fetchConcerts = async () => {
    setLoading(true);
    try {
      const res = await concertAPI.getConcerts(cityFilter);
      setConcerts(res.data);
    } catch (err) {
      console.error('Failed to fetch concerts', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAttend = async (concert) => {
    try {
      const res = await concertAPI.toggleAttend(concert.id);
      fetchConcerts(); // refresh to update attendees count
      
      if (!concert.is_attending && window.confirm("Do you want to post about going to this concert to your friends or keep it a secret?\n\nClick OK to Post, Cancel to keep it secret.")) {
        try {
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
      console.error('Failed to toggle attend', err);
    }
  };

  const handleInvite = async (id) => {
    const userId = prompt('Enter the User ID of the friend you want to invite (Check their profile URL):');
    if (userId) {
      try {
        await concertAPI.inviteFriend(id, userId);
        alert('Invitation sent via Direct Message!');
      } catch (err) {
        alert('Failed to send invitation. Ensure the User ID is correct.');
      }
    }
  };

  return (
    <div className="concerts-page fade-in">
      <div className="concerts-header">
        <h1 className="neon-text">Upcoming Concerts</h1>
        <p className="sub-text">See who's playing in your city and grab your friends.</p>
        
        <input 
          type="text" 
          className="city-search"
          placeholder="Filter by City (e.g., New York)" 
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading-spinner"></div>
      ) : (
        <div className="concerts-grid">
          {concerts.length === 0 ? (
            <div className="empty-state">No concerts found in this city.</div>
          ) : (
            concerts.map(c => (
              <div key={c.id} className="concert-card">
                <div className="concert-image" style={{ backgroundImage: `url(${c.image_url})` }}>
                  <div className="concert-date-badge">
                    {new Date(c.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
                <div className="concert-info">
                  <h3>{c.title}</h3>
                  <p className="concert-artist">{c.artist_name}</p>
                  <p className="concert-location">📍 {c.venue}, {c.city}</p>
                  
                  <div className="concert-attendees">
                    <span>{c.attendees_count} people going</span>
                    <div className="attendee-avatars">
                      {c.attending_friends?.map(f => (
                        <img key={f.id} src={f.avatar_url || '/default_avatar.png'} alt={f.username} title={f.username} />
                      ))}
                    </div>
                  </div>

                  <div className="concert-actions">
                    <button 
                      className={c.is_attending ? "btn-secondary" : "btn-primary"} 
                      onClick={() => handleAttend(c)}
                      style={c.is_attending ? { color: '#ef4444' } : {}}
                    >
                      {c.is_attending ? "I'm Not Going" : "I'm Going!"}
                    </button>
                    <button className="btn-secondary" onClick={() => handleInvite(c.id)}>
                      Invite Friend
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Concerts;
