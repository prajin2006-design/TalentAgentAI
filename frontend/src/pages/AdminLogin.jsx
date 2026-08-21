import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import './Auth.css';

/*
 * DEV DEMO AUTHENTICATION CONFIGURATION
 * Note: In production, this frontend credential check is replaced by a POST request
 * to the Flask backend authentication endpoint (/api/admin/login) which sets a secure
 * HttpOnly JWT session cookie.
 */
const DEMO_ADMIN_CREDENTIALS = {
  email: 'admin@talentagent.ai',
  password: 'admin' // Demo password for local development
};

export const AdminLogin = () => {
  const [email, setEmail] = useState('admin@talentagent.ai');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check if already authenticated in session storage
    if (sessionStorage.getItem('talent_agent_admin_auth') === 'true') {
      navigate('/admin');
    }
  }, [navigate]);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Frontend validation logic (replaces backend POST /api/admin/login)
    if (
      email.trim().toLowerCase() === DEMO_ADMIN_CREDENTIALS.email &&
      password === DEMO_ADMIN_CREDENTIALS.password
    ) {
      sessionStorage.setItem('talent_agent_admin_auth', 'true');
      sessionStorage.setItem('talent_agent_admin_user', email);
      navigate('/admin');
    } else {
      setErrorMsg('Invalid admin credentials.');
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* Brand Header */}
        <div className="auth-brand-logo">
          <div className="logo-badge">
            <Sparkles size={16} className="logo-sparkle" />
          </div>
          <span className="logo-brand">
            TALENT AGENT <span className="logo-accent">AI</span>
          </span>
        </div>

        <div className="card auth-card">
          <div className="auth-header">
            <div className="badge badge-accent mb-2">
              <ShieldCheck size={14} /> SECURITY GATE
            </div>
            <h2 className="auth-title">ADMIN ACCESS</h2>
            <p className="auth-subtitle">Authorized administrator credentials required.</p>
          </div>

          {errorMsg && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="auth-form">
            <div className="form-group">
              <label className="input-label">Email / Username</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-left-icon" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@talentagent.ai"
                  className="input-field with-icon"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-left-icon" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field with-icon"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-full hover-expand">
              Enter Admin →
            </button>
          </form>

          <div className="auth-footer-note">
            Return to{' '}
            <a href="/" className="auth-switch-link">
              Main Site
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
