import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const cachedUser = localStorage.getItem('user_data');
    if (cachedUser) {
      try {
        setUser(JSON.parse(cachedUser));
        setIsAuthenticated(true);
      } catch {}
    }
    if (token) { 
      fetchProfile(); 
    } else { 
      setLoading(false); 
    }
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await authAPI.getProfile();
      setUser(res.data);
      localStorage.setItem('user_data', JSON.stringify(res.data));
      setIsAuthenticated(true);
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        setIsAuthenticated(false);
      }
    } finally { 
      setLoading(false); 
    }
  };

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user_data', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    localStorage.setItem('access_token', res.data.access);
    localStorage.setItem('refresh_token', res.data.refresh);
    localStorage.setItem('user_data', JSON.stringify(res.data.user));
    setUser(res.data.user);
    setIsAuthenticated(true);
    return res;
  };


  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateProfile = async (data) => {
    const res = await authAPI.updateProfile(data);
    setUser(res.data);
    return res;
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated, login, register, logout, updateProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
