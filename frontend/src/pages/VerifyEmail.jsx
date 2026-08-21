import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Mail, RotateCw, CheckCircle2, ShieldCheck, Check } from 'lucide-react';
import './Auth.css';

export const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pendingEmail, verifyOtp, resendOtp, user } = useAuth();

  const targetEmail = location.state?.email || pendingEmail || user?.email || '';

  const [emailInput, setEmailInput] = useState(targetEmail);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(45);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Automatic focus movement to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await verifyOtp({ email: emailInput, otp: fullOtp });
      if (res && res.success) {
        setIsVerifiedSuccess(true);
        setTimeout(() => {
          navigate('/profile/setup');
        }, 1600);
      } else {
        setError(res.error || res.message || 'Invalid verification code.');
      }
    } catch (err) {
      setError(err.message || 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setMessage('');

    try {
      const res = await resendOtp(emailInput);
      if (res && res.success) {
        setMessage('A fresh verification code has been sent to your email.');
        setResendCooldown(45);
        setOtpDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      } else {
        setError(res.error || res.message || "Couldn't resend code. Please try again.");
      }
    } catch (err) {
      setError(err.message || "Couldn't resend code. Please try again.");
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card-wrapper">
        {/* Brand Header */}
        <div className="auth-brand-stack text-center">
          <div className="auth-icon-badge">
            <Mail size={28} className="text-electric-blue" />
          </div>
          <h1 className="auth-heading">Verify your email</h1>
          <p className="auth-subtext">
            We sent a 6-digit verification code to <br />
            <strong className="text-electric-blue">{emailInput || 'your email'}</strong>
          </p>
        </div>

        {error && <div className="auth-error-alert">{error}</div>}
        {message && <div className="auth-success-alert">{message}</div>}

        {isVerifiedSuccess ? (
          <div className="auth-success-card text-center">
            <div className="success-icon-badge">
              <Check size={32} />
            </div>
            <h2 className="success-heading">✓ Email verified</h2>
            <p className="success-subtext">Your account is ready.</p>
            <p className="redirect-note">Redirecting to profile setup...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-stack">
            {/* OTP 6-Box Input Grid */}
            <div className="otp-boxes-grid" onPaste={handlePaste}>
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className={`otp-digit-input ${digit ? 'filled' : ''}`}
                  autoFocus={idx === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={otpDigits.join('').length !== 6 || loading}
              className="btn btn-accent btn-full auth-submit-btn"
            >
              {loading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify Email</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {/* Resend Code Section */}
            <div className="resend-row text-center">
              <span className="text-muted text-sm me-2">Didn't receive the code? </span>
              {resendCooldown > 0 ? (
                <span className="resend-cooldown-text">
                  Resend in <strong className="text-electric-blue">{resendCooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  className="btn-resend-link"
                >
                  <RotateCw size={14} /> Resend code
                </button>
              )}
            </div>
          </form>
        )}

        <div className="auth-footer-text text-center">
          <Link to="/login" className="auth-link">← Back to Log In</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
