import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { getImageUrl } from '../../utils/imageHelper';
import './Register.css';

const GENRES = ['Pop', 'Rock', 'Hip Hop', 'R&B', 'Electronic', 'Jazz', 'Indie', 'Metal', 'Classical', 'Country'];

const baseMedia = `http://${window.location.hostname}:8000/media/artists/`;

const ARTISTS_POOL = [
  { name: 'The Weeknd', spotify_id: '1XyoAEzJz3u1jUktRihNu6', image: `${baseMedia}the_weeknd.jpg` },
  { name: 'Taylor Swift', spotify_id: '06HL4z0CvFAxyCO2zG51rj', image: `${baseMedia}taylor_swift.jpg` },
  { name: 'Billie Eilish', spotify_id: '6qqNV0wWsnsqevQAea9Ijt', image: `${baseMedia}billie_eilish.jpg` },
  { name: 'Drake', spotify_id: '3TVXtAsRpaS47TqyEs6M0Y', image: `${baseMedia}drake.jpg` },
  { name: 'Bruno Mars', spotify_id: '0du5cEVh5yTK9QJap84zxp', image: `${baseMedia}bruno_mars.jpg` },
  { name: 'Ed Sheeran', spotify_id: '6eUKZXaK18OIee2g7wV34g', image: `${baseMedia}ed_sheeran.jpg` },
  { name: 'Justin Bieber', spotify_id: '1uNFoZAHBGcllz61jPklFc', image: `${baseMedia}justin_bieber.jpg` },
  { name: 'Ariana Grande', spotify_id: '66CXWjxzN0NS27tufdLfhf', image: `${baseMedia}ariana_grande.jpg` },
  { name: 'Eminem', spotify_id: '7dG12gQmdWZ7oJyiHJyTLm', image: `${baseMedia}eminem.jpg` },
  { name: 'Post Malone', spotify_id: '246iHwbM6Z60y47nO03Nax', image: `${baseMedia}post_malone.jpg` },
  { name: 'Dua Lipa', spotify_id: '6M2wZ9GZIrwlh2jQA48nFS', image: `${baseMedia}dua_lipa.jpg` },
  { name: 'Olivia Rodrigo', spotify_id: '1McMGCt02tBw6Dw7J36wSI', image: `${baseMedia}olivia_rodrigo.jpg` },
  { name: 'Arijit Singh', spotify_id: '4YRx371Pk31m4wqZgNaa7v', image: `${baseMedia}arijit_singh.jpg` },
  { name: 'A.R. Rahman', spotify_id: '1mYsTxNsw24w7zRkTT683z', image: `${baseMedia}ar_rahman.jpg` },
  { name: 'Diljit Dosanjh', spotify_id: '2aAI4OXTExLVrjrgzJ0uEg', image: `${baseMedia}diljit_dosanjh.jpg` },
  { name: 'Shreya Ghoshal', spotify_id: '0oOet2J4n583zS74hbbG7e', image: `${baseMedia}shreya_ghoshal.jpg` },
  { name: 'Lana Del Rey', spotify_id: '00FQwH6X5aN771mHmgGcjG', image: `${baseMedia}lana_del_rey.jpg` },
  { name: 'Kanye West', spotify_id: '5K4W6rqBFWDnAN63g7601Z', image: `${baseMedia}kanye_west.jpg` },
  { name: 'Kendrick Lamar', spotify_id: '2YZyvhA48upuw60nSZnsiY', image: `${baseMedia}kendrick_lamar.jpg` },
  { name: 'Coldplay', spotify_id: '4gzpq5DP86iySGVEXe750C', image: `${baseMedia}coldplay.jpg` },
  { name: 'Travis Scott', spotify_id: '0Y5tJX1MQlPlqiwlOH1tJY', image: `${baseMedia}travis_scott.jpg` },
  { name: 'Alan Walker', spotify_id: '7vk5e3PjzIOVvRh2gWhPaG', image: `${baseMedia}alan_walker.jpg` },
  { name: 'Marshmello', spotify_id: '64KE927xU30K67Jou6zB4Z', image: `${baseMedia}marshmello.jpg` },
  { name: 'Zayn Malik', spotify_id: '5ZsFI1Q6bbXQbsw975XKNV', image: `${baseMedia}zayn_malik.jpg` },
  { name: 'Badshah', spotify_id: '09Jn2n6xT6L11o234XYZabc', image: `${baseMedia}badshah.jpg` }
];

const COUNTRIES = [
  { name: 'India', flag: '🇮🇳', cities: ['Mumbai', 'Delhi', 'Bangalore', 'Greater Noida', 'Ahmadabad', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'] },
  { name: 'United States', flag: '🇺🇸', cities: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'San Francisco', 'Miami', 'Seattle'] },
  { name: 'United Kingdom', flag: '🇬🇧', cities: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow'] },
  { name: 'Canada', flag: '🇨🇦', cities: ['Toronto', 'Vancouver', 'Montreal', 'Ottawa', 'Calgary'] },
  { name: 'Australia', flag: '🇦🇺', cities: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'] },
  { name: 'France', flag: '🇫🇷', cities: ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice'] },
  { name: 'Germany', flag: '🇩🇪', cities: ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'] },
  { name: 'Japan', flag: '🇯🇵', cities: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama', 'Nagoya'] }
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    age: '',
    gender: 'Male',
    gender_preference: 'Both',
    city: '',
    country: '',
    country_flag: '',
    favorite_genres: [],
    favorite_artists: [] // list of objects from pool
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenreToggle = (genre) => {
    const nextGenres = formData.favorite_genres.includes(genre)
      ? formData.favorite_genres.filter(g => g !== genre)
      : [...formData.favorite_genres, genre];
    setFormData({ ...formData, favorite_genres: nextGenres });
  };

  const handleArtistToggle = (artist) => {
    const isSelected = formData.favorite_artists.some(a => a.spotify_id === artist.spotify_id);
    const nextArtists = isSelected
      ? formData.favorite_artists.filter(a => a.spotify_id !== artist.spotify_id)
      : [...formData.favorite_artists, artist];
    setFormData({ ...formData, favorite_artists: nextArtists });
  };

  const handleNext = (e) => {
    e.preventDefault();
    setError('');

    if (step === 2) {
      const ageNum = parseInt(formData.age, 10);
      if (isNaN(ageNum) || ageNum < 18) {
        setError('You must be 18 or older to register!');
        return;
      }
      if (!formData.country) {
        setError('Please select a country!');
        return;
      }
      if (!formData.city) {
        setError('Please specify your city!');
        return;
      }
    }

    if (step < 4) setStep(step + 1);
  };

  const handlePrev = () => {
    setError('');
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // 1. Submit standard register info
      await register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        age: parseInt(formData.age, 10) || null,
        gender: formData.gender,
        gender_preference: formData.gender_preference,
        city: formData.city,
        country: formData.country,
        country_flag: formData.country_flag,
        favorite_genres: formData.favorite_genres
      });

      // 2. Register favorite artists sequentially
      for (const artist of formData.favorite_artists) {
        try {
          await authAPI.addFavoriteArtist({
            artist_name: artist.name,
            artist_image_url: artist.image,
            spotify_id: artist.spotify_id
          });
        } catch (err) {
          console.warn('Error adding favorite artist during register:', err);
        }
      }

      navigate('/');
    } catch (err) {
      const data = err.response?.data || {};
      let msg = 'Registration failed.';

      if (data.username && Array.isArray(data.username)) {
        msg = `User '${formData.username}' is already registered in MongoDB!`;
      } else if (data.email && Array.isArray(data.email)) {
        msg = `Email '${formData.email}' is already registered in MongoDB!`;
      } else if (typeof data === 'string') {
        msg = data;
      } else if (data.detail) {
        msg = data.detail;
      } else if (data.age) {
        msg = data.age[0];
      }

      setError(msg);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page page-container">
      <div className="register-container freq-glass fade-in">
        <h1 className="register-logo freq-gradient-text" onClick={() => navigate('/login')}>FREQ</h1>
        <p className="register-step-title">Step {step} of 4</p>
        <div className="register-progress-bar">
          <div className="register-progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>

        {error && (
          <div className="register-error" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <span>{error}</span>
            {error.includes('already registered') && (
              <button 
                type="button" 
                onClick={() => navigate('/login', { state: { username: formData.username } })}
                style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.3)' }}
              >
                🔑 Click Here to Login directly
              </button>
            )}
          </div>
        )}


        <form onSubmit={step === 4 ? handleSubmit : handleNext} className="register-form">
          {step === 1 && (
            <div className="register-step fade-in">
              <input
                type="text"
                className="freq-input"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                autoCapitalize="none"
              />
              <input
                type="email"
                className="freq-input"
                placeholder="Email Address"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
              <input
                type="password"
                className="freq-input"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="register-step fade-in">
              <input
                type="number"
                className="freq-input"
                placeholder="Age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                required
              />
              
              <div className="input-row" style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', color: 'var(--freq-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Your Gender:</label>
                  <select
                    className="freq-input"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    style={{ padding: '10px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="input-group" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', color: 'var(--freq-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Prefer Friends:</label>
                  <select
                    className="freq-input"
                    value={formData.gender_preference}
                    onChange={(e) => setFormData({ ...formData, gender_preference: e.target.value })}
                    style={{ padding: '10px' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Both">Both</option>
                  </select>
                </div>
              </div>

              {/* Country Selection (auto calculates Flag emoji) */}
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', width: '100%', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--freq-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Country:</label>
                <select
                  className="freq-input"
                  value={formData.country}
                  onChange={(e) => {
                    const selectedCountry = COUNTRIES.find(c => c.name === e.target.value);
                    setFormData({
                      ...formData,
                      country: e.target.value,
                      country_flag: selectedCountry ? selectedCountry.flag : ''
                    });
                  }}
                  style={{ padding: '10px' }}
                  required
                >
                  <option value="">-- Select Country --</option>
                  {COUNTRIES.map(c => (
                    <option key={c.name} value={c.name}>{c.flag} {c.name}</option>
                  ))}
                </select>
              </div>

              {/* City Selection with Autocomplete datalist */}
              <div className="input-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left', width: '100%', marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: 'var(--freq-text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>City:</label>
                <input
                  type="text"
                  className="freq-input"
                  placeholder="Type or select your city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  list="cities-list"
                  required
                  style={{ width: '100%' }}
                />
                <datalist id="cities-list">
                  {formData.country && COUNTRIES.find(c => c.name === formData.country)?.cities.map(city => (
                    <option key={city} value={city} />
                  ))}
                </datalist>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="register-step fade-in">
              <p className="genre-instructions">Select your favorite music genres:</p>
              <div className="genre-grid">
                {GENRES.map(genre => (
                  <button
                    key={genre}
                    type="button"
                    className={`genre-chip ${formData.favorite_genres.includes(genre) ? 'active' : ''}`}
                    onClick={() => handleGenreToggle(genre)}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="register-step fade-in">
              <p className="genre-instructions">Select your favorite music artists:</p>
              <div className="artist-select-grid">
                {ARTISTS_POOL.map(artist => {
                  const isSelected = formData.favorite_artists.some(a => a.spotify_id === artist.spotify_id);
                  return (
                    <div
                      key={artist.spotify_id}
                      className={`artist-select-card ${isSelected ? 'active' : ''}`}
                      onClick={() => handleArtistToggle(artist)}
                    >
                      <div className="asc-img-container" style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '50%', overflow: 'hidden', background: 'var(--freq-gradient-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                        <img 
                          src={getImageUrl(artist.image)} 
                          alt="" 
                          className="asc-img" 
                          referrerPolicy="no-referrer" 
                          onError={(e) => { e.target.style.display = 'none'; }} 
                          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 2 }}
                        />
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'white', zIndex: 1 }}>{artist.name[0]}</span>
                      </div>
                      <span className="asc-name" style={{ marginTop: '4px' }}>{artist.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="register-actions">
            {step > 1 && (
              <button type="button" onClick={handlePrev} className="freq-btn-outline prev-btn">
                Back
              </button>
            )}
            <button type="submit" className="freq-btn-primary next-btn" disabled={loading}>
              {step === 4 ? (loading ? 'Creating...' : 'Register') : 'Next'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
