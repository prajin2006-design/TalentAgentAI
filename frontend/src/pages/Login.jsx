import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import './Auth.css';

export const Login = () => {
  const navigate = useNavigate();
  const { login, setPendingEmail } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setError('');
    setLoading(true);

    try {
      const res = await login(formData);
      navigate(res.redirect || (res.profile_complete ? '/dashboard' : '/profile/setup'));
    } catch (err) {
      if (err.data?.requires_verification) {
        setPendingEmail(formData.email);
        navigate('/verify-email');
      } else {
        setError(err.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        <div className="auth-brand-stack text-center">
          <Link to="/" className="auth-brand-logo">
            <span className="logo-dot" />
            <span className="logo-text">TALENT AGENT <span className="text-electric-blue">AI</span></span>
          </Link>
          <h1 className="auth-heading">Welcome back</h1>
          <p className="auth-subtext">Sign in to access your real-time career intelligence dashboard.</p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}

        {/* Real Google Sign In Button */}
        <GoogleSignInButton onError={(errText) => setError(errText)} label="Continue with Google" />

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form-stack">
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
                placeholder="you@university.edu"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div className="label-with-action">
              <label className="form-label" htmlFor="password">Password</label>
              <Link to="/forgot-password" tabIndex={-1} className="forgot-password-link">Forgot password?</Link>
            </div>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="password"
                type="password"
                required
                className="input-field-auth"
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!formData.email || !formData.password || loading}
            className="btn btn-accent btn-full auth-submit-btn"
          >
            {loading ? <span>Signing In...</span> : <><span>Sign In to Platform</span><ArrowRight size={17} /></>}
          </button>
        </form>

        <div className="auth-footer-text text-center">
          <span>Don't have an account? </span>
          <Link to="/signup" className="auth-link">Create Account</Link>
        </div>

        <div className="admin-access-hint text-center">
          <Link to="/admin/login" className="admin-hint-link">System Admin Gateway →</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
