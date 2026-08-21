import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { ArrowRight, Mail, KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import './Auth.css';

export const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1); // 1: Send email, 2: Verify code
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e) => {
    e.preventDefault();
    if (!email) return;

    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      setSuccessMsg('A password reset code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send password reset code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    if (!email || !code) return;

    setError('');
    setLoading(true);

    try {
      // Direct call to verify-reset-code endpoint
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }

      if (data.reset_token) {
        // Redirect to reset password with the token in state
        navigate('/reset-password', { state: { reset_token: data.reset_token, email } });
      } else {
        throw new Error('Verification failed. Reset token not received.');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify code. Please check the code and try again.');
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
          <h1 className="auth-heading">Reset your password</h1>
          <p className="auth-subtext">
            {step === 1 
              ? "Enter your email address and we'll send you a 6-digit verification code." 
              : `Enter the 6-digit code sent to ${email}.`}
          </p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}
        {successMsg && <div className="auth-success-alert" style={{
          backgroundColor: '#ECFDF5',
          border: '1px solid #10B981',
          color: '#065F46',
          padding: '0.85rem',
          borderRadius: '8px',
          fontSize: '0.875rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>{successMsg}</div>}

        {step === 1 ? (
          <form onSubmit={handleSendCode} className="auth-form-stack">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!email || loading}
              className="btn btn-accent btn-full auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sending code...</span>
                </>
              ) : (
                <>
                  <span>Send Reset Code</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="auth-form-stack">
            <div className="form-group">
              <label className="form-label" htmlFor="code">6-Digit Verification Code</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon" />
                <input
                  id="code"
                  type="text"
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                  className="input-field-auth"
                  placeholder="Enter 6-digit OTP"
                  style={{ letterSpacing: '0.2em', textAlign: 'center', fontSize: '1.1rem' }}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={code.length !== 6 || loading}
              className="btn btn-accent btn-full auth-submit-btn"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying code...</span>
                </>
              ) : (
                <>
                  <span>Verify Code</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <button 
              type="button" 
              onClick={() => { setStep(1); setCode(''); }}
              className="btn btn-outline btn-full"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.75rem' }}
            >
              <ArrowLeft size={16} />
              <span>Back to Email</span>
            </button>
          </form>
        )}

        <div className="auth-footer-text text-center">
          <Link to="/login" className="auth-link">Return to Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
