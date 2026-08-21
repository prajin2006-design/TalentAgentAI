import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export const GoogleSignInButton = ({ onError, label = 'Continue with Google' }) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();
  const [clientId, setClientId] = useState('');
  const [loading, setLoading] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Fetch Google Client ID from backend
    authAPI.getGoogleConfig()
      .then((res) => {
        if (res.client_id) {
          setClientId(res.client_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const handleCredentialResponse = async (response) => {
      if (!response.credential) return;
      setLoading(true);
      try {
        const res = await googleLogin({ credential: response.credential });
        const redirectUrl = res.redirect || (res.profile_complete ? '/dashboard' : '/profile/setup');
        navigate(redirectUrl);
      } catch (err) {
        if (onError) onError(err.message || 'Google authentication failed.');
      } finally {
        setLoading(false);
      }
    };

    const initGoogleGIS = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
          cancel_on_tap_outside: true
        });

        buttonRef.current.innerHTML = '';
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          type: 'standard',
          text: 'continue_with',
          width: 360,
          shape: 'rectangular',
          logo_alignment: 'left'
        });
      } catch (err) {
        console.error('GIS Error:', err);
      }
    };

    if (window.google?.accounts?.id) {
      initGoogleGIS();
    } else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleGIS();
      document.head.appendChild(script);
    }
  }, [clientId]);

  const handleClick = () => {
    if (!clientId) {
      if (onError) onError('Google Client ID is not configured on the server yet. Please add GOOGLE_CLIENT_ID to backend/.env.');
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="google-oauth-btn-container" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
      <div ref={buttonRef} style={{ display: clientId ? 'block' : 'none', width: '100%' }} />
      {!clientId && (
        <button
          type="button"
          onClick={handleClick}
          disabled={loading}
          className="google-oauth-btn"
          style={{ width: '100%' }}
        >
          <svg className="google-icon" viewBox="0 0 24 24" width="18" height="18">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{loading ? 'Authenticating with Google...' : label}</span>
        </button>
      )}
    </div>
  );
};

export default GoogleSignInButton;
