import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserData } from '../api/auth';
import * as authApi from '../api/auth';

interface AuthState {
  user: UserData | null;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!token);

  const saveAuth = (t: string, u: UserData) => {
    localStorage.setItem('token', t);
    setToken(t);
    setUser(u);
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch {
      logout();
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      refreshProfile().finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loginFn = async (username: string, password: string) => {
    const data = await authApi.login(username, password);
    saveAuth(data.token, data.user);
  };

  const registerFn = async (username: string, password: string) => {
    const data = await authApi.register(username, password);
    saveAuth(data.token, data.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login: loginFn, register: registerFn, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
