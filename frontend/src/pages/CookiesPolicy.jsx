import React from 'react';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Cookie, Info, Lock } from 'lucide-react';
import './Auth.css';

export const CookiesPolicy = () => {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ maxWidth: 860, margin: '4rem auto 6rem', padding: '0 1.5rem' }}>
        <div className="card" style={{ padding: '3rem', borderRadius: '16px' }}>
          <div className="badge badge-accent mb-3" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <Cookie size={14} /> COOKIE & SESSION POLICY
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
            Cookie & Local Storage Policy
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Last Updated: January 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: '1.7', color: '#334155' }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                1. How We Use Cookies
              </h2>
              <p>
                Talent Agent AI strictly uses essential HTTP-only session cookies and minimal local storage to maintain secure candidate authentication, manage active sessions, and preserve user interface preferences. We do not employ third-party advertising cookies or cross-site tracking pixels.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                2. Categories of Cookies Used
              </h2>
              <ul style={{ paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li>
                  <strong>Strictly Necessary Authentication Cookies:</strong> <code style={{ background: '#F1F5F9', padding: '0.2rem 0.4rem', borderRadius: 4 }}>talent_agent_token</code> and <code style={{ background: '#F1F5F9', padding: '0.2rem 0.4rem', borderRadius: 4 }}>talent_agent_admin_token</code> ensure encrypted, tamper-proof user authentication.
                </li>
                <li>
                  <strong>Security & CSRF Protection:</strong> Validates origin headers and prevents unauthorized cross-site scripting attacks.
                </li>
                <li>
                  <strong>Local Interface Storage:</strong> Saves theme preferences, resume editor drafts, and filter selections locally in your browser.
                </li>
              </ul>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                3. Managing Your Cookie Preferences
              </h2>
              <p>
                You can configure or disable cookies via your browser settings. However, disabling strictly necessary authentication cookies will prevent you from signing in to your Talent Agent AI dashboard.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPolicy;
