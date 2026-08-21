import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ArrowRight, Check, X, Lock, Mail, User } from 'lucide-react';
import './Auth.css';

export const Signup = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirm_password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Live password requirements
  const password = formData.password;
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=~/\\\[\]]/.test(password),
    match: password.length > 0 && password === formData.confirm_password
  };

  const isFormValid =
    formData.full_name.trim() !== '' &&
    formData.email.trim() !== '' &&
    checks.length &&
    checks.uppercase &&
    checks.lowercase &&
    checks.number &&
    checks.special &&
    checks.match;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError('');
    setLoading(true);

    try {
      await signup(formData);
      navigate('/verify-email', { state: { email: formData.email } });
    } catch (err) {
      setError(err.message || 'Failed to create account. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      {/* Background Subtle Ambience */}
      <div className="auth-canvas-bg" />

      <div className="auth-card-wrapper">
        {/* Brand Header */}
        <div className="auth-brand-stack text-center">
          <Link to="/" className="auth-brand-logo">
            <span className="logo-dot" />
            <span className="logo-text">TALENT AGENT <span className="text-electric-blue">AI</span></span>
          </Link>
          <h1 className="auth-heading">Create your candidate account</h1>
          <p className="auth-subtext">Unlock neural career matching, skill gap discovery, and AI profile calibration.</p>
        </div>

        {error && (
          <div className="auth-error-alert" role="alert">
            <span>{error}</span>
          </div>
        )}

        {/* Real Google Sign Up Button */}
        <GoogleSignInButton onError={(errText) => setError(errText)} label="Sign up with Google" />

        <div className="auth-divider">
          <span>or create account with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-stack">
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="full_name">Full Name</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="full_name"
                type="text"
                required
                className="input-field-auth"
                placeholder="e.g. Arjun Kumar"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="email"
                type="email"
                required
                className="input-field-auth"
                placeholder="you@university.edu or you@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                required
                className="input-field-auth"
                placeholder="Create a strong password (e.g. Talent@123)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="confirm_password">Confirm Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="confirm_password"
                type="password"
                required
                className="input-field-auth"
                placeholder="Re-enter password"
                value={formData.confirm_password}
                onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
              />
            </div>
          </div>

          {/* Interactive Password Requirements Checklist */}
          <div className="password-checklist-card">
            <span className="checklist-title">Password Security Requirements:</span>
            <div className="checklist-grid">
              <div className={`check-item ${checks.length ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.length ? <Check size={13} /> : <X size={13} />}</span>
                <span>At least 8 characters</span>
              </div>
              <div className={`check-item ${checks.uppercase ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.uppercase ? <Check size={13} /> : <X size={13} />}</span>
                <span>1 uppercase letter (A-Z)</span>
              </div>
              <div className={`check-item ${checks.lowercase ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.lowercase ? <Check size={13} /> : <X size={13} />}</span>
                <span>1 lowercase letter (a-z)</span>
              </div>
              <div className={`check-item ${checks.number ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.number ? <Check size={13} /> : <X size={13} />}</span>
                <span>1 number (0-9)</span>
              </div>
              <div className={`check-item ${checks.special ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.special ? <Check size={13} /> : <X size={13} />}</span>
                <span>1 special character (!@#$%^&*)</span>
              </div>
              <div className={`check-item ${checks.match ? 'satisfied' : ''}`}>
                <span className="check-icon">{checks.match ? <Check size={13} /> : <X size={13} />}</span>
                <span>Passwords match</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isFormValid || loading}
            className="btn btn-accent btn-full auth-submit-btn"
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>Continue to Verification</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        {/* Footer Navigation */}
        <div className="auth-footer-text text-center">
          <span>Already have an account? </span>
          <Link to="/login" className="auth-link">Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
