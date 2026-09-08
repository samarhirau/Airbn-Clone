import { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Synchronize authenticated user profile from backend
  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me');
      const freshUser = response?.data?.user || response?.user || null;
      if (freshUser) {
        setUser(freshUser);
        localStorage.setItem('user', JSON.stringify(freshUser));
      }
    } catch (err) {
      // If unauthorized or token invalid, clear local auth
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Check auth session on mount
  useEffect(() => {
    refreshProfile();

    // Listen to token refresh expiry event dispatched by services/api.js
    const handleSessionExpired = () => {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      toast.error('Session expired. Please log in again.', {
        className: 'airbnb-toast',
      });
    };

    window.addEventListener('auth:session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth:session_expired', handleSessionExpired);
  }, [refreshProfile]);

  /**
   * Log in user with authenticated credentials & token
   */
  const login = useCallback((userData, accessToken) => {
    setUser(userData);
    setToken(accessToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', accessToken);
    localStorage.setItem('accessToken', accessToken);

    // Attach Authorization header default
    api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    toast.success(`Welcome back, ${userData.name.split(' ')[0]}!`, {
      className: 'airbnb-toast',
    });
  }, []);

  /**
   * Log out user from both backend session and frontend state
   */
  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      delete api.defaults.headers.common.Authorization;

      toast.success('Logged out successfully', {
        className: 'airbnb-toast',
      });
    }
  }, []);

  /**
   * Update current user profile in state & localStorage
   */
  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(user && token),
      role: user?.role || null,
      isCustomer: user?.role === 'customer',
      isOwner: user?.role === 'owner',
      isAdmin: user?.role === 'admin',
      login,
      logout,
      updateUser,
      refreshProfile,
    }),
    [user, token, loading, login, logout, updateUser, refreshProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
