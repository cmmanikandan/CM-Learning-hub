import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_BASE } from '../config/api';

// Matches the backend UserProfile interface somewhat
export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: 'mentor' | 'student' | 'admin';
  name: string;
  photo_url?: string;
  school?: string;
  class_name?: string;
  section?: string;
  parent_contact?: string;
  mentor_id?: number;
  streak?: number;
  mentor_notes?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string, userData: AuthUser) => void;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('cm_jwt_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Rehydrate user profile if token exists on mount
  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    if (!token || token === 'undefined' || token === 'null') {
      logout();
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log("Profile response status:", response.status);
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token might be expired or invalid
        logout();
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // Don't logout on network error necessarily, but user might stay null
    } finally {
      setIsLoading(false);
    }
  };

  const login = (newToken: string, userData: AuthUser) => {
    localStorage.setItem('cm_jwt_token', newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('cm_jwt_token');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (response.status === 401) {
        const urlStr = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
        if (!urlStr.includes('/api/auth/login') && !urlStr.includes('/api/auth/register')) {
          console.warn("Session expired or unauthorized (401). Logging out...");
          logout();
        }
      }
      return response;
    };
    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
