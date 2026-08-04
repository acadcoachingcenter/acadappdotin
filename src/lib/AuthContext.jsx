import React, {
  createContext,
  useState,
  useContext,
  useEffect
} from "react";

import { apiClient } from "@/api/apiClient";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Kept for compatibility with existing components
  const [isLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings] = useState(null);

  const checkAppState = async () => {
    setIsLoadingAuth(true);

    try {
      const currentUser = await apiClient.auth.me();

      setUser(currentUser);
      setIsAuthenticated(true);
      setAuthError(null);

      return currentUser;
    } catch (error) {
      // A 401 simply means the visitor is not logged in.
      setUser(null);
      setIsAuthenticated(false);

      if (error?.status && error.status !== 401) {
        console.error("Authentication check failed:", error);
        setAuthError(error);
      } else {
        setAuthError(null);
      }

      return null;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const logout = async (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthError(null);

    try {
      await apiClient.auth.logout(
        shouldRedirect ? window.location.origin : "/"
      );
    } catch (error) {
      console.error("Logout failed:", error);

      if (shouldRedirect) {
        window.location.href = "/";
      }
    }
  };

  const navigateToLogin = () => {
    apiClient.auth.redirectToLogin(window.location.href);
  };

  const refreshUser = async () => {
    return checkAppState();
  };

  const value = {
    user,
    setUser,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    logout,
    navigateToLogin,
    checkAppState,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
};

export default AuthContext;
