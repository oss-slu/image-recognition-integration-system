// app/contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = Cookies.get('authToken');
      if (!token) {
        setLoading(false);
        return;
      }

      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // Invalid token, clear it
      Cookies.remove('authToken');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      const { user, token } = response.data;

      // Store token in cookie (HttpOnly would be better, but requires server-side)
      Cookies.set('authToken', token, { expires: 7, secure: true, sameSite: 'strict' });

      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      const response = await axios.post('/api/auth/register', { email, password, name });
      const { user, token } = response.data;

      // Store token in cookie
      Cookies.set('authToken', token, { expires: 7, secure: true, sameSite: 'strict' });

      // Set token in axios defaults
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Registration failed');
    }
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear token
      Cookies.remove('authToken');
      delete axios.defaults.headers.common['Authorization'];
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

