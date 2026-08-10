import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();
  const [username, setUsername] = useState(location.state?.username || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (location.state?.username) {
      setUsername(location.state.username);
    }
  }, [location.state]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login({ username: username.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setError('');
    setLoading(true);
    try {
      // Simulate guest access or use guest credentials
      await login({ username: 'guest_user', password: 'guest_password' });
      navigate('/');
    } catch {
      // Create guest profile if doesn't exist
      try {
        await register({
          username: 'guest_user',
          password: 'guest_password',
          email: 'guest@freq.com',
          age: 22,
          city: 'Mumbai',
          country: 'India',
          country_flag: '🇮🇳',
          favorite_genres: ['Pop', 'Rock', 'Electronic']
        });
        navigate('/');
      } catch {
        setError('Error creating guest session.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container freq-glass fade-in">
        <h1 className="login-logo freq-gradient-text">FREQ</h1>
        <p className="login-subtitle">Connect through your music taste</p>
        
        {error && <div className="login-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            className="freq-input"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoCapitalize="none"
          />
          <input
            type="password"
            className="freq-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="freq-btn-primary login-btn" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <button onClick={handleGuestLogin} className="freq-btn-outline guest-btn" disabled={loading}>
          Try Guest Account
        </button>
        
        <p className="login-footer">
          Don't have an account? <span className="auth-link" onClick={() => navigate('/register')}>Register</span>
        </p>
      </div>
    </div>
  );
};
export default Login;
