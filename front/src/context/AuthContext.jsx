import { createContext, useContext, useState, useEffect } from 'react';
import API from '../api/axiosConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate user from localStorage on first load
  useEffect(() => {
    const stored = localStorage.getItem('sabboora_user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('sabboora_user');
        localStorage.removeItem('sabboora_token');
      }
    }
    setLoading(false);
  }, []);

  const _persist = (data) => {
    localStorage.setItem('sabboora_token', data.token);
    localStorage.setItem('sabboora_user', JSON.stringify(data));
    setUser(data);
  };

  const login = async (email, password) => {
    const { data } = await API.post('/auth/login', { email, password });
    _persist(data);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await API.post('/auth/register', { name, email, password });
    _persist(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('sabboora_token');
    localStorage.removeItem('sabboora_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
