import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminLoading, setIsAdminLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');

  // Initial check on application mount
  useEffect(() => {
    fetchCurrentUser();
    fetchCurrentAdmin();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoading(true);
      setAuthError(null);
      const res = await authAPI.getMe();
      if (res?.authenticated && res?.user) {
        setUser({
          ...res.user,
          profile_complete: Boolean(res.user.profile_complete ?? res.profile_complete),
          profile_completion: res.user.profile_completion ?? res.profile_completion ?? 0
        });
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      setUser(null);
      setIsAuthenticated(false);
      setAuthError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCurrentAdmin = async () => {
    try {
      setIsAdminLoading(true);
      const res = await adminAPI.getMe();
      if (res?.authenticated && res?.admin) {
        setAdminUser(res.admin);
      } else {
        setAdminUser(null);
      }
    } catch {
      setAdminUser(null);
    } finally {
      setIsAdminLoading(false);
    }
  };

  const signup = async ({ full_name, email, password, confirm_password }) => {
    const res = await authAPI.signup({ full_name, email, password, confirm_password });
    setPendingEmail(email);
    return res;
  };

  const verifyOtp = async ({ email, otp }) => {
    const res = await authAPI.verifyEmail({ email: email || pendingEmail, otp });
    if (res.user) {
      setUser({
        ...res.user,
        profile_complete: Boolean(res.user.profile_complete ?? res.profile_complete),
        profile_completion: res.user.profile_completion ?? res.profile_completion ?? 0
      });
      setIsAuthenticated(true);
      await fetchCurrentUser();
    }
    return res;
  };

  const resendOtp = async (email, purpose = 'email_verification') => {
    return await authAPI.resendOtp({ email: email || pendingEmail, purpose });
  };

  const login = async ({ email, password }) => {
    const res = await authAPI.login({ email, password });
    if (res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      await fetchCurrentUser();
    }
    return res;
  };

  const googleLogin = async (googleProfile) => {
    const res = await authAPI.googleAuth(googleProfile);
    if (res.user) {
      setUser(res.user);
      setIsAuthenticated(true);
      await fetchCurrentUser();
    }
    return res;
  };

  const forgotPassword = async (email) => {
    setPendingEmail(email);
    return await authAPI.forgotPassword({ email });
  };

  const resetPassword = async ({ email, otp, new_password, confirm_password, reset_token }) => {
    return await authAPI.resetPassword({
      email: email || pendingEmail,
      otp,
      new_password,
      confirm_password,
      reset_token
    });
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // Ignore network error on logout
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  // Admin Authentication
  const adminLogin = async ({ email, password }) => {
    const res = await adminAPI.login({ email, password });
    if (res.admin) {
      setAdminUser(res.admin);
    }
    return res;
  };

  const adminLogout = async () => {
    try {
      await adminAPI.logout();
    } catch {}
    setAdminUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isAuthenticated,
        isAdminAuthenticated: !!adminUser,
        isLoading,
        isAdminLoading,
        authError,
        pendingEmail,
        setPendingEmail,
        signup,
        verifyOtp,
        resendOtp,
        login,
        googleLogin,
        forgotPassword,
        resetPassword,
        logout,
        adminLogin,
        adminLogout,
        refreshUser: fetchCurrentUser,
        refreshAdmin: fetchCurrentAdmin
      }}
    >
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
