import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import api from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password?: string) => Promise<void>;
  guestLogin: (emailOrUsername: string, password: string) => Promise<void>;
  setSession: (token: string, user: User) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('hms_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('hms_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to parse saved user state', e);
      }
    }
    setLoading(false);
  }, [token]);

  const setSession = (newToken: string, newUser: User) => {
    localStorage.setItem('hms_token', newToken);
    localStorage.setItem('hms_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const login = async (username: string, password?: string) => {
    try {
      const response = await api.post('/auth/login', { username, password: password || 'admin123' });
      const { token: jwtToken, user: loggedUser } = response.data;
      
      setSession(jwtToken, loggedUser);
    } catch (err: any) {
      const msg = err.response?.data?.error || (err.code === 'ERR_NETWORK' || !err.response 
        ? 'Cannot connect to backend server (port 5000). Please make sure to run "npm run dev" from the project ROOT folder.'
        : 'Login failed. Please check credentials.');
      throw new Error(msg);
    }
  };

  const guestLogin = async (emailOrUsername: string, password: string) => {
    try {
      const response = await api.post('/auth/guest-login', { emailOrUsername, password });
      const { token: jwtToken, user: loggedUser } = response.data;

      const activeUser: User = {
        id: loggedUser.id,
        username: loggedUser.username,
        role: 'Guest' as UserRole,
        name: loggedUser.name
      };

      setSession(jwtToken, activeUser);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Guest login failed. Please check credentials.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) return;
    const updatedUser: User = { ...user, role: newRole };
    setUser(updatedUser);
    localStorage.setItem('hms_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, guestLogin, setSession, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
