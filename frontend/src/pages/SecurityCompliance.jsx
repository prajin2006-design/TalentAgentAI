import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Lock, Server, CheckCircle2, ArrowLeft } from 'lucide-react';
import './Auth.css';

export const SecurityCompliance = () => {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '6rem 2rem 4rem 2rem', maxWidth: '900px' }}>
        <Link to="/" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Platform
        </Link>

        <div className="card" style={{ padding: '3rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div className="badge badge-accent mb-3">
            <Lock size={14} /> ENTERPRISE SECURITY ARCHITECTURE
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Security & Compliance
          </h1>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            Infrastructure & Data Protection Standards
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7, color: '#333' }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                1. Data Encryption Standards
              </h2>
              <p>
                All network communication utilizes 256-bit SSL/TLS encryption. Database volumes and uploaded candidate files are encrypted at rest using AES-256 standards.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                2. Authentication & Role-Based Authorization
              </h2>
              <p>
                Strict multi-tenant security architecture enforces user isolation. Cryptographically signed JWT tokens with HTTP-only SameSite cookie policies prevent CSRF and XSS token interception. Administrative endpoints enforce strict role checks returning 403 Forbidden for unauthorized requests.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                3. Vulnerability Management & Auditing
              </h2>
              <p>
                Automated security metrics track API request velocity, rate-limits, and administrative actions. Real-time audit logs record authentication attempts for threat detection.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityCompliance;
