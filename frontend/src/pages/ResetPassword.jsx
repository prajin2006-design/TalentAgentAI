import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ArrowRight, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react';
import './Auth.css';

export const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const resetToken = location.state?.reset_token || '';
  const email = location.state?.email || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Redirect if no reset token
  if (!resetToken) {
    return (
      <div className="auth-page-container">
        <div className="auth-card-wrapper">
          <div className="auth-brand-stack text-center">
            <Link to="/" className="auth-brand-logo">
              <span className="logo-dot" />
              <span className="logo-text">TALENT AGENT <span className="text-electric-blue">AI</span></span>
            </Link>
            <h1 className="auth-heading">Invalid Reset Session</h1>
            <p className="auth-subtext">Your password reset session has expired or is invalid. Please request a new code.</p>
          </div>
          <div className="auth-footer-text text-center" style={{ marginTop: '1.5rem' }}>
            <Link to="/forgot-password" className="btn btn-accent btn-full auth-submit-btn" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Request New Code
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    match: password.length > 0 && password === confirmPassword,
  };

  const allValid = Object.values(passwordChecks).every(Boolean);

  const handleReset = async (e) => {
    e.preventDefault();
    if (!allValid) return;

    setError('');
    setLoading(true);

    try {
      await authAPI.resetPassword({ email, reset_token: resetToken, new_password: password });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Failed to reset password. The reset session may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="auth-page-container">
        <div className="auth-card-wrapper">
          <div className="auth-brand-stack text-center">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <CheckCircle2 size={48} color="#16A34A" />
            </div>
            <h1 className="auth-heading">Password Reset Complete</h1>
            <p className="auth-subtext">Your password has been successfully updated. You can now sign in with your new password.</p>
          </div>
          <Link
            to="/login"
            className="btn btn-accent btn-full auth-submit-btn"
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', marginTop: '1rem' }}
          >
            <span>Continue to Sign In</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-stack text-center">
          <Link to="/" className="auth-brand-logo">
            <span className="logo-dot" />
            <span className="logo-text">TALENT AGENT <span className="text-electric-blue">AI</span></span>
          </Link>
          <h1 className="auth-heading">Set new password</h1>
          <p className="auth-subtext">Create a strong password for your account.</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleReset} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label" htmlFor="new-password">New Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field-auth"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#667085', padding: '4px' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirm-password"
                type={showPassword ? 'text' : 'password'}
                required
                className="input-field-auth"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          {/* Password strength checklist */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '0.4rem 1rem',
            fontSize: '0.8rem',
            color: '#667085',
            marginBottom: '0.5rem'
          }}>
            {[
              { key: 'length', label: '8+ characters' },
              { key: 'uppercase', label: 'Uppercase letter' },
              { key: 'lowercase', label: 'Lowercase letter' },
              { key: 'number', label: 'Contains number' },
              { key: 'match', label: 'Passwords match' },
            ].map(({ key, label }) => (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', gap: '0.35rem',
                color: passwordChecks[key] ? '#16A34A' : '#98A2B3'
              }}>
                <CheckCircle2 size={14} />
                <span>{label}</span>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={!allValid || loading}
            className="btn btn-accent btn-full auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Resetting password...</span>
              </>
            ) : (
              <>
                <span>Reset Password</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text text-center">
          <Link to="/login" className="auth-link">Return to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
