import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, User, Mail, Lock } from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import './Auth.css';

export const Register = () => {
  const [fullName, setFullName] = useState('Alex Chen');
  const [email, setEmail] = useState('alex.chen@university.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [confirmPassword, setConfirmPassword] = useState('••••••••••••');
  const { login } = useCareer();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    login(email, password);
    navigate('/onboarding');
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-container">
        {/* Logo Brand Header */}
        <Link to="/" className="auth-brand-logo">
          <div className="logo-icon-box">
            <Sparkles size={20} className="text-accent" />
          </div>
          <span className="logo-text">
            TALENT AGENT <span className="logo-highlight">AI</span>
          </span>
        </Link>

        <div className="card auth-card">
          <div className="auth-header">
            <h2 className="auth-title">Create an account</h2>
            <p className="auth-subtitle">Start your intelligent AI career analysis journey today.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="input-label">Full Name</label>
              <div className="input-icon-wrapper">
                <User size={16} className="input-left-icon" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alex Chen"
                  className="input-field with-icon"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Email Address</label>
              <div className="input-icon-wrapper">
                <Mail size={16} className="input-left-icon" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@university.edu"
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

            <div className="form-group">
              <label className="input-label">Confirm Password</label>
              <div className="input-icon-wrapper">
                <Lock size={16} className="input-left-icon" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field with-icon"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-accent btn-full hover-expand">
              Create account →
            </button>
          </form>

          <div className="auth-footer-note">
            Already have an account?{' '}
            <Link to="/login" className="auth-switch-link">
              Login here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
