import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import api from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.exp * 1000 > Date.now()) {
          const meta = JSON.parse(localStorage.getItem('userMeta') || '{}');
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          setUser({ token, ...decoded, ...meta });
        } else { _clear(); }
      } catch { _clear(); }
    }
    setLoading(false);
  }, []);

  const _clear = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userMeta');
  };

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, profileComplete, email } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userMeta', JSON.stringify({ profileComplete, email }));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    const decoded = jwtDecode(token);
    setUser({ token, ...decoded, profileComplete, email });
    return res.data;
  };

  const register = async (username, email, password) => {
    return api.post('/auth/register', { username, email, password });
  };

  const logout = () => {
    _clear();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const markProfileComplete = () => {
    const meta = JSON.parse(localStorage.getItem('userMeta') || '{}');
    meta.profileComplete = true;
    localStorage.setItem('userMeta', JSON.stringify(meta));
    setUser(u => ({ ...u, profileComplete: true }));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, markProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
