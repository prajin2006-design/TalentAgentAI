import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ArrowRight, Eye, EyeOff, Check, Sparkles } from 'lucide-react';
import './Auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login, setPendingEmail } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      setError('● Please enter your email address.');
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('● Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
      setError('● Please enter your password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login({
        email: trimmedEmail,
        password: formData.password
      });
      navigate(res.redirect || (res.profile_complete ? '/dashboard' : '/profile/setup'));
    } catch (err) {
      if (err.data?.requires_verification) {
        setPendingEmail(trimmedEmail);
        navigate('/verify-email');
      } else {
        const msg = err.message || '';
        if (msg.toLowerCase().includes('connect') || msg.toLowerCase().includes('reach') || msg.toLowerCase().includes('network') || msg.toLowerCase().includes('failed to fetch')) {
          setError('● Unable to connect to the server. Check that the backend is running.');
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('incorrect') || msg.toLowerCase().includes('password') || msg.toLowerCase().includes('credential')) {
          setError('● Incorrect email or password.');
        } else {
          setError(msg.startsWith('●') ? msg : `● ${msg}`);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* LEFT SIDE: Brand/Product Introduction (Desktop only) */}
      <aside className="auth-brand-panel" aria-label="Talent Agent AI Introduction">
        <div className="auth-brand-content">
          <div className="auth-brand-badge">
            <span className="brand-dot-lime" />
            <span className="brand-badge-label">AI CAREER AGENT</span>
          </div>

          <Link to="/" className="auth-brand-name">
            TALENT AGENT AI
          </Link>

          <h1 className="auth-brand-headline">
            Your career,<br />
            <span>understood.</span>
          </h1>

          <p className="auth-brand-subtext">
            Understand your skills, discover suitable opportunities, and find your next career move with AI.
          </p>

          <ul className="auth-benefits-list">
            <li className="auth-benefit-item">
              <span className="benefit-check-icon">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>Resume Intelligence</span>
            </li>
            <li className="auth-benefit-item">
              <span className="benefit-check-icon">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>AI Job Matching</span>
            </li>
            <li className="auth-benefit-item">
              <span className="benefit-check-icon">
                <Check size={14} strokeWidth={3} />
              </span>
              <span>Skill Gap Analysis</span>
            </li>
          </ul>

          {/* Subtle Career Insight Card */}
          <div className="auth-insight-preview-card" aria-hidden="true">
            <div className="insight-card-header">
              <div className="insight-icon-pill">
                <Sparkles size={14} className="insight-sparkle-icon" />
                <span>Career Signal</span>
              </div>
              <span className="insight-score-badge">94% Match</span>
            </div>
            <div className="insight-role-title">Software & AI Product Engineer</div>
            <div className="insight-metric-bar-bg">
              <div className="insight-metric-bar-fill" style={{ width: '94%' }} />
            </div>
            <div className="insight-card-footer">
              <span>Readiness: Senior Trajectory</span>
              <span className="insight-highlight">Verified Profile</span>
            </div>
          </div>
        </div>

        <div className="auth-brand-footer">
          <span>© 2026 Talent Agent AI Inc. All rights reserved.</span>
        </div>
      </aside>

      {/* RIGHT SIDE: Clean Sign In Panel */}
      <main className="auth-form-panel">
        <div className="auth-form-card">
          {/* Mobile brand header */}
          <div className="auth-mobile-header">
            <Link to="/" className="auth-mobile-logo">
              <span className="brand-dot-lime" />
              <span>TALENT AGENT AI</span>
            </Link>
          </div>

          <div className="auth-card-heading-group">
            <h2 className="auth-form-title">Welcome back</h2>
            <p className="auth-form-subtitle">
              Sign in to continue to your career dashboard.
            </p>
          </div>

          {/* Compact Error Alert */}
          {error && (
            <div className="auth-compact-error" role="alert">
              <span className="error-text">{error}</span>
            </div>
          )}

          {/* Google Sign In Component */}
          <GoogleSignInButton
            onError={(errText) => setError(errText.startsWith('●') ? errText : `● ${errText}`)}
            label="Continue with Google"
          />

          {/* Divider */}
          <div className="auth-clean-divider">
            <span className="divider-line" />
            <span className="divider-text">or sign in with email</span>
            <span className="divider-line" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="auth-clean-form" noValidate>
            {/* Email Field */}
            <div className="auth-input-group">
              <label htmlFor="login-email" className="auth-field-label">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                autoComplete="email"
                required
                className="auth-text-input"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div className="auth-input-group">
              <div className="auth-label-row">
                <label htmlFor="login-password" className="auth-field-label">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  tabIndex={0}
                  className="auth-forgot-link"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="auth-password-wrapper">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  autoComplete="current-password"
                  required
                  className="auth-text-input auth-password-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="auth-password-toggle-btn"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={0}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-primary-submit-btn"
            >
              {loading ? (
                <span className="btn-loading-flex">
                  <span className="auth-spinner" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="btn-content-flex">
                  <span>Sign in</span>
                  <ArrowRight size={18} className="btn-arrow-icon" />
                </span>
              )}
            </button>
          </form>

          {/* Create Account Link */}
          <div className="auth-bottom-nav">
            <span className="bottom-nav-muted">Don't have an account? </span>
            <Link to="/signup" className="auth-create-account-link">
              Create account →
            </Link>
          </div>

          {/* Admin Gateway Hint */}
          <div className="auth-admin-subtle">
            <Link to="/admin/login" className="auth-admin-link">
              Administrator Access →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
