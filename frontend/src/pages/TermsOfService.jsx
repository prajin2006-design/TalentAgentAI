import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { FileText, CheckCircle2, ArrowLeft } from 'lucide-react';
import './Auth.css';

export const TermsOfService = () => {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '6rem 2rem 4rem 2rem', maxWidth: '900px' }}>
        <Link to="/" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Platform
        </Link>

        <div className="card" style={{ padding: '3rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div className="badge badge-accent mb-3">
            <FileText size={14} /> TERMS OF SERVICE
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Terms of Service
          </h1>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            Last Updated: January 1, 2026
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7, color: '#333' }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                1. Acceptance of Terms
              </h2>
              <p>
                By registering or utilizing Talent Agent AI, you agree to comply with these Terms of Service. If you do not agree, please discontinue platform use immediately.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                2. User Account Responsibility
              </h2>
              <p>
                Candidates are responsible for maintaining account credentials securely. Users agree not to submit fraudulent profile information, false employment histories, or unauthorized intellectual property.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                3. AI Services & Disclaimers
              </h2>
              <p>
                Talent Agent AI provides AI-assisted resume formatting, job compatibility analytics, and career guidance. While our neural matching algorithms optimize ATS readability, hiring decisions remain at the sole discretion of employer recruiters.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                4. Acceptable Use Policy
              </h2>
              <p>
                Automated scraping, reverse engineering, rate-limit bypassing, or unauthorized access to system APIs is strictly prohibited and subject to account termination.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
