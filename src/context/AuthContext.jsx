import { createContext, useContext, useState, useEffect } from 'react';
import api from '../lib/api';
import socket from '../lib/socket';
import { initPushNotifications, removePushSubscription } from '../lib/push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('worksyne_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('worksyne_token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          localStorage.setItem('worksyne_user', JSON.stringify(res.data));
          socket.connect();
          // Init push after token is set
          initPushNotifications().catch(() => {});
        })
        .catch(() => {
          localStorage.removeItem('worksyne_token');
          localStorage.removeItem('worksyne_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('worksyne_token', token);
    localStorage.setItem('worksyne_user', JSON.stringify(userData));
    setUser(userData);
    socket.connect();
    // Init push after login
    initPushNotifications().catch(() => {});
    return userData;
  };

  const logout = async () => {
    await removePushSubscription().catch(() => {});
    localStorage.removeItem('worksyne_token');
    localStorage.removeItem('worksyne_user');
    setUser(null);
    socket.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
