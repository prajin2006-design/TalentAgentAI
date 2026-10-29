import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const DEFAULT_CLIENT_ID = '231069201439-nn48c3s4vn08vrl3ih4l8t8tjgqf8hl4.apps.googleusercontent.com';

export const GoogleSignInButton = ({ onError, label = 'Continue with Google' }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState(import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID);
  const [loading, setLoading] = useState(false);
  const [isGisReady, setIsGisReady] = useState(false);
  const buttonRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Fetch Google Client ID from backend as source of truth if available
    authAPI.getGoogleConfig()
      .then((res) => {
        if (res?.client_id) {
          setClientId(res.client_id);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch Google config from backend, using fallback:', err);
      });
  }, []);

  useEffect(() => {
    const activeClientId = clientId || DEFAULT_CLIENT_ID;
    if (!activeClientId) return;

    let isMounted = true;

    const handleCredentialResponse = async (response) => {
      if (!response?.credential) return;
      setLoading(true);
      try {
        const res = await googleLogin({ credential: response.credential });
        const redirectUrl = res.redirect || (res.profile_complete ? '/dashboard' : '/profile/setup');
        navigate(redirectUrl);
      } catch (err) {
        let errorMsg = err.message || 'Google authentication failed.';
        if (err.status === 404 || errorMsg.trim() === 'Not Found') {
          errorMsg = 'Backend API service is unreachable (404 Not Found). Please verify that the backend server is deployed and running.';
        }
        if (onError) onError(errorMsg);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const renderGisButton = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const targetWidth = Math.min(400, Math.max(250, containerRef.current?.offsetWidth || 380));

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: label.toLowerCase().includes('sign up') ? 'signup_with' : 'continue_with',
          shape: 'pill',
          logo_alignment: 'left',
          width: targetWidth
        });

        if (isMounted) {
          setIsGisReady(true);
        }
      } catch (err) {
        console.error('Google GIS initialization error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      renderGisButton();
    } else {
      const existingScript = document.getElementById('google-gsi-script');
      if (existingScript) {
        existingScript.addEventListener('load', renderGisButton);
      } else {
        const script = document.createElement('script');
        script.id = 'google-gsi-script';
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = renderGisButton;
        document.head.appendChild(script);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [clientId, label]);

  return (
    <div ref={containerRef} className="google-oauth-wrapper">
      {/* Official Native Google GIS Button (Directly rendered, fully interactive) */}
      <div
        ref={buttonRef}
        className="google-gis-container"
        style={{ display: isGisReady ? 'flex' : 'none' }}
      />

      {/* Styled Placeholder shown while Google GIS script initializes */}
      {!isGisReady && (
        <button
          type="button"
          disabled={loading}
          className="google-custom-btn"
          aria-label={label}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span className="google-btn-text">
            {loading ? 'Signing in with Google...' : label}
          </span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
