// AuthContext.js — Provides user auth state and helpers to the whole app

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem('agrilink_token'));
  const [loading, setLoading] = useState(true);

  // On mount, validate stored token
  useEffect(() => {
    async function validate() {
      if (!token) { setLoading(false); return; }
      try {
        const res  = await fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        if (json.success) setUser(json.user);
        else logout();
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, []); // eslint-disable-line

  function login(newToken, newUser) {
    localStorage.setItem('agrilink_token', newToken);
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem('agrilink_token');
    setToken(null);
    setUser(null);
  }

  // Attach Bearer token to every fetch automatically
  function authFetch(url, options = {}) {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
