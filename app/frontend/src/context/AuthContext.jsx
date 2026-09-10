import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchCurrentUser, login as apiLogin, logout as apiLogout } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkSession = useCallback(async () => {
    const res = await fetchCurrentUser();
    setUser(res.authenticated ? { email: res.email } : null);
    setLoading(false);
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = async (email, password) => {
    const res = await apiLogin(email, password);
    if (res.success) {
      setUser({ email: res.data.email });
    }
    return res;
  };

  // Called after a successful signup+verify flow, since that also
  // establishes a session on the backend.
  const setSessionUser = (email) => setUser({ email });

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setSessionUser, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
