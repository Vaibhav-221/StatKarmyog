/**
 * Authentication context — lightweight session management.
 *
 * Provides { user, setUser, logout } to the component tree.
 * Persists the logged-in officer to sessionStorage so page
 * refreshes don't drop the session during development.
 */

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'silp_auth_user';

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Sync to sessionStorage whenever user changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, [user]);

  const setUser = (userData) => {
    setUserState(userData);
  };

  const logout = () => {
    setUserState(null);
    sessionStorage.removeItem(SESSION_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 * @returns {{ user: object|null, setUser: function, logout: function }}
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
