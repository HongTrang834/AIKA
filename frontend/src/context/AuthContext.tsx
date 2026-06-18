import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

interface User {
  id: number;
  username: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role?: 'admin' | 'user' | 'student';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, full_name: string) => Promise<any>;
  verifyEmail: (email: string, code: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Lấy token từ localStorage khi component mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
      // Gọi getProfile để lấy thông tin user kèm role
      api.getProfile(savedToken).then((data) => {
        console.log('AuthContext loaded profile:', {
          id: data?.id,
          username: data?.username,
          avatar_url: data?.avatar_url ? data.avatar_url.substring(0, 50) + '...' : 'null'
        });
        if (data && data.id) {
          setUser({
            id: data.id,
            username: data.username,
            email: data.email,
            full_name: data.full_name,
            avatar_url: data.avatar_url,
            role: data.role as 'admin' | 'user' | 'student',
          });
        } else {
          localStorage.removeItem('token');
          setToken(null);
        }
      }).catch((error) => {
        console.error('Error loading profile:', error);
        localStorage.removeItem('token');
        setToken(null);
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await api.login({ email, password });
    if (data.error) {
      const err = new Error(data.error) as any;
      err.code = data.code;
      err.email = data.email;
      throw err;
    }
    
    console.log('Login response - user data:', {
      id: data.user?.id,
      username: data.user?.username,
      avatar_url: data.user?.avatar_url ? data.user.avatar_url.substring(0, 50) + '...' : 'null'
    });

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const register = async (username: string, email: string, password: string, full_name: string) => {
    const data = await api.register({ username, email, password, full_name });
    if (data.error) throw new Error(data.error);
    return data;
  };

  const verifyEmail = async (email: string, code: string) => {
    const data = await api.verifyEmail(email, code);
    if (data.error) throw new Error(data.error);

    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, verifyEmail, logout, updateUser, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
