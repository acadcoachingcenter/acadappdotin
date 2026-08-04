import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient } from "@/api/apiClient";

// NOTE: apiClient's original AuthContext also checked an app-level "public settings"
// endpoint that could force login on every single page (authError: 'auth_required').
// That concept doesn't carry over -- this app has public marketing/browse pages
// (courses, offers, become-a-tutor) alongside pages that gate themselves with
// apiClient.auth.isAuthenticated() / redirectToLogin() individually. This context now
// just tracks "am I logged in" without ever forcing a redirect on load. If you want
// the whole app locked behind login, gate it in App.jsx instead.

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    setIsLoadingAuth(true);
    try {
      const currentUser = await apiClient.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      // Not being logged in is a normal state here, not an error to surface.
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    apiClient.auth.logout(shouldRedirect ? window.location.href : '/');
  };

  const navigateToLogin = () => {
    apiClient.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      navigateToLogin,
      checkAppState
    }}>
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
