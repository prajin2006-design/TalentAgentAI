import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
import './Auth.css';

export const AdminLogin = () => {
  const [email, setEmail] = useState('admin@talentagent.ai');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { adminLogin, isAdminAuthenticated } = useAuth();

  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin');
    }
  }, [isAdminAuthenticated, navigate]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setErrorMsg('');
    setLoading(true);

    try {
      await adminLogin({ email: email.trim().toLowerCase(), password });
      navigate('/admin');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid administrator credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        {/* Brand Header */}
        <div className="auth-brand-stack text-center">
          <Link to="/" className="auth-brand-logo">
            <span className="logo-dot" />
            <span className="logo-text">TALENT AGENT <span className="text-electric-blue">AI</span></span>
          </Link>
          <div className="badge badge-accent mb-2" style={{ alignSelf: 'center', marginTop: '0.5rem' }}>
            <ShieldCheck size={14} /> SECURITY GATE
          </div>
          <h1 className="auth-heading">Administrator Portal</h1>
          <p className="auth-subtext">Authorized credentials required for talent management access.</p>
        </div>

        {errorMsg && (
          <div className="auth-error-alert" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAdminLogin} className="auth-form-stack">
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">Admin Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="admin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@talentagent.ai"
                className="input-field-auth"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="admin-password">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="admin-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="input-field-auth"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!email || !password || loading}
            className="btn btn-accent btn-full auth-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight size={17} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer-text text-center">
          <Link to="/login" className="auth-link">
            ← Return to Candidate Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
