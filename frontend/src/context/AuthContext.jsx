import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI, adminAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
const [adminUser, setAdminUser] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [isAuthenticated, setIsAuthenticated] = useState(false);
const [authError, setAuthError] = useState(null);
const [pendingEmail, setPendingEmail] = useState('');

// Initial check on application mount
useEffect(() => {
fetchCurrentUser();
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
if (res.token) {
localStorage.setItem('talent_agent_token', res.token);
}
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
if (res.token) {
localStorage.setItem('talent_agent_token', res.token);
}
await fetchCurrentUser();
}
return res;
};

const googleLogin = async (googleProfile) => {
const res = await authAPI.googleAuth(googleProfile);
if (res.user) {
setUser(res.user);
setIsAuthenticated(true);
if (res.token) {
localStorage.setItem('talent_agent_token', res.token);
}
await fetchCurrentUser();
}
return res;
};

const forgotPassword = async (email) => {
setPendingEmail(email);
return await authAPI.forgotPassword({ email });
};

const resetPassword = async ({ email, otp, new_password, confirm_password }) => {
return await authAPI.resetPassword({
email: email || pendingEmail,
otp,
new_password,
confirm_password
});
};

const logout = async () => {
try {
await authAPI.logout();
} catch (e) {
// Ignore network error on logout
}
localStorage.removeItem('talent_agent_token');
setUser(null);
setIsAuthenticated(false);
};

// Admin Authentication
const adminLogin = async ({ email, password }) => {
const res = await adminAPI.login({ email, password });
if (res.admin) {
setAdminUser(res.admin);
if (res.token) {
localStorage.setItem('talent_agent_admin_token', res.token);
}
}
return res;
};

const adminLogout = async () => {
try {
await adminAPI.logout();
} catch (e) {}
localStorage.removeItem('talent_agent_admin_token');
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
refreshUser: fetchCurrentUser
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
