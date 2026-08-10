import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('flashbook_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [jwt, setJwt] = useState(() => localStorage.getItem('flashbook_jwt') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate state on mount
  useEffect(() => {
    try {
      const savedJwt = localStorage.getItem('flashbook_jwt');
      const savedUser = localStorage.getItem('flashbook_user');

      if (savedJwt && savedUser) {
        setJwt(savedJwt);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error('Error rehydrating auth state:', e);
      localStorage.removeItem('flashbook_jwt');
      localStorage.removeItem('flashbook_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    const token = data.jwt || data.token;
    const userData = data.user || { id: data.id, fullName: data.fullName, email: data.email, role: data.role };

    if (token && userData) {
      localStorage.setItem('flashbook_jwt', token);
      localStorage.setItem('flashbook_user', JSON.stringify(userData));
      setJwt(token);
      setUser(userData);
    }
    return data;
  }, []);

  const register = useCallback(async (fullName, email, password) => {
    const response = await api.post('/auth/register', { fullName, email, password });
    const data = response.data;
    const token = data.jwt || data.token;
    const userData = data.user || { id: data.id, fullName: data.fullName, email: data.email, role: data.role };

    if (token && userData) {
      localStorage.setItem('flashbook_jwt', token);
      localStorage.setItem('flashbook_user', JSON.stringify(userData));
      setJwt(token);
      setUser(userData);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('flashbook_jwt');
    localStorage.removeItem('flashbook_user');
    setJwt(null);
    setUser(null);
    window.location.href = '/login';
  }, []);

  const updateUser = useCallback((updatedUser) => {
    localStorage.setItem('flashbook_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, []);

  const hasRole = useCallback(
    (role) => {
      if (!user || !user.role) return false;
      if (Array.isArray(role)) {
        return role.includes(user.role);
      }
      return user.role === role;
    },
    [user]
  );

  const isAuthenticated = Boolean(jwt && user);

  const value = {
    user,
    jwt,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    hasRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
