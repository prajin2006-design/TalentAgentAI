import React from 'react';
import { Navbar } from '../components/Navbar';
import { BrainCircuit, ShieldCheck, Lock, Sparkles, Database, FileCheck } from 'lucide-react';

export const AIDataUse = () => {
  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ maxWidth: 860, margin: '4rem auto 6rem', padding: '0 1.5rem' }}>
        <div className="card" style={{ padding: '3rem', borderRadius: '16px' }}>
          <div className="badge badge-accent mb-3" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <BrainCircuit size={14} /> AI ETHICS & DATA PROCESSING DISCLOSURE
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem' }}>
            AI & Candidate Data Governance
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '2rem' }}>
            Clear disclosure on how your resumes, profile vectors, and AI interactions are processed.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: '1.7', color: '#334155' }}>
            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                1. How Resume Data Is Processed
              </h2>
              <p>
                When you upload a PDF or DOCX resume, our backend server processes the document using dedicated open-source text extraction libraries. Extracted sections (work experience, education, technical skills, projects) are structured deterministically into your candidate profile database.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                2. Real-Time AI Generation & Model Confidentiality
              </h2>
              <p>
                AI features — including AI Career Co-Pilot chat, ATS bullet point improvement, and mock interview evaluation — are dispatched securely through private backend API proxies. Candidate prompt payloads are not used to train public foundation models. All private API keys and database credentials reside exclusively on the server side and are never exposed to client browsers.
              </p>
            </section>

            <section>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
                3. User Control & Data Deletion
              </h2>
              <p>
                You retain complete ownership over your career data. You can delete uploaded resumes, clear conversation history, update profile information, or request full account removal at any time directly through your Account Settings.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDataUse;
