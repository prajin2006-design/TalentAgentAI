import React from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { ShieldCheck, Lock, Eye, FileText, ArrowLeft } from 'lucide-react';
import './Auth.css';

export const PrivacyPolicy = () => {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ padding: '6rem 2rem 4rem 2rem', maxWidth: '900px' }}>
        <Link to="/" className="btn btn-ghost btn-sm mb-4" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowLeft size={16} /> Back to Platform
        </Link>

        <div className="card" style={{ padding: '3rem', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E5E7EB' }}>
          <div className="badge badge-accent mb-3">
            <ShieldCheck size={14} /> PRIVACY & DATA GOVERNANCE
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '1rem', letterSpacing: '-0.03em' }}>
            Privacy Policy
          </h1>
          <p className="text-muted" style={{ fontSize: '0.95rem', marginBottom: '2rem' }}>
            Effective Date: January 1, 2026 • Version 2.4
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7, color: '#333' }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                1. Information We Collect
              </h2>
              <p>
                Talent Agent AI processes candidate profile information, uploaded resume documents (PDF, DOCX), skills, experience details, and job search preferences strictly to deliver personalized career recommendations, ATS optimization, and matching services.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                2. Use of Artificial Intelligence Models
              </h2>
              <p>
                AI analysis (powered by Google Gemini API) evaluates resume content against job market standards. Candidate data is transferred securely server-side and is never used to train public LLM foundational models without explicit user opt-in.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                3. Data Storage & Security
              </h2>
              <p>
                All user passwords are encrypted using Argon2id / bcrypt hashing algorithms. Transport Layer Security (TLS 1.3) encrypts all data in transit. Sensitive server credentials and API keys remain isolated in server environment parameters.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                4. Your Data Rights
              </h2>
              <p>
                Candidates retain 100% ownership of their uploaded resumes and profile data. You may export your generated resumes or request complete data deletion at any time through your Account Settings.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: '#0000FF' }}>
                5. Contact Privacy Office
              </h2>
              <p>
                For privacy inquiries or data subject access requests, contact our compliance team at <strong>privacy@talentagent.ai</strong>.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
