import React, { useState } from 'react';
import { Navbar } from '../components/Navbar';
import {
  HelpCircle,
  MessageSquare,
  FileText,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import './Auth.css';

export const HelpSupport = () => {
  const [openFaq, setOpenFaq] = useState(0);
  const [ticketData, setTicketData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const faqs = [
    {
      q: "How does the ATS Resume Analyzer score my resume?",
      a: "Our ATS parser tests the structural hierarchy, section headers, quantifiable achievements (metrics/impact), contact completeness, and keyword density against top ATS parsers (Greenhouse, Lever, Workday). The score is calculated mathematically from actual parsed resume content without hardcoded placeholders."
    },
    {
      q: "Can I use Talent Agent AI without Google Sign-In?",
      a: "Yes! Email and password registration is fully independent from Google OAuth. You can sign up with your email, verify via a secure 6-digit OTP code, and log in at any time."
    },
    {
      q: "How do job match scores work?",
      a: "The match score compares your verified profile skills and resume experience against the employer's required and nice-to-have skills stored in the database. It highlights both matching capabilities and missing skills you should acquire."
    },
    {
      q: "How does the AI Mock Interview practice work?",
      a: "Select your target engineering role or paste a specific job description. Our AI interviewer generates 5 tailored technical and behavioral questions, evaluates your answers against industry hiring rubrics, and provides concrete improvement advice."
    },
    {
      q: "How can I export my resume?",
      a: "In the ATS Resume Maker, you can download your resume in pixel-perfect PDF format with selectable text or in an editable DOCX format across Modern, Classic, or Minimalist styling templates."
    }
  ];

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (!ticketData.name || !ticketData.email || !ticketData.message) return;
    setSubmitted(true);
  };

  return (
    <div className="landing-page-wrapper">
      <Navbar />
      <div className="container" style={{ maxWidth: 960, margin: '3.5rem auto 6rem', padding: '0 1.5rem' }}>
        {/* Header */}
        <div className="text-center" style={{ marginBottom: '3rem' }}>
          <div className="badge badge-accent mb-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={14} /> SUPPORT & HELP CENTER
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.75rem' }}>
            How Can We Assist You?
          </h1>
          <p style={{ color: '#64748B', fontSize: '1rem', maxWidth: 600, margin: '0 auto' }}>
            Answers to common questions about ATS resumes, job matching algorithms, AI co-pilot, and technical support.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="card" style={{ padding: '2rem', borderRadius: '16px', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '1.5rem' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  style={{
                    border: '1px solid #E2E8F0',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    transition: 'all 0.2s'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '1.1rem 1.25rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: isOpen ? '#F8FAFC' : '#FFFFFF',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 600,
                      color: '#0F172A',
                      fontSize: '0.95rem'
                    }}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      size={18}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s',
                        color: '#64748B'
                      }}
                    />
                  </button>
                  {isOpen && (
                    <div style={{ padding: '1rem 1.25rem 1.25rem', color: '#475569', fontSize: '0.9rem', lineHeight: '1.6', background: '#F8FAFC' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Support Form */}
        <div className="card" style={{ padding: '2.5rem', borderRadius: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.5rem' }}>
            Contact Platform Support
          </h2>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Have a question or encounter an issue? Send our engineering team a message directly.
          </p>

          {submitted ? (
            <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '1.5rem', borderRadius: '12px', textAlign: 'center' }}>
              <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Message Received!</h3>
              <p style={{ fontSize: '0.875rem' }}>Thank you, {ticketData.name}. Our support team will get back to you at {ticketData.email} shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Your Name</label>
                  <input
                    type="text"
                    required
                    value={ticketData.name}
                    onChange={(e) => setTicketData({ ...ticketData, name: e.target.value })}
                    placeholder="Alex Mercer"
                    className="input-field-auth"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={ticketData.email}
                    onChange={(e) => setTicketData({ ...ticketData, email: e.target.value })}
                    placeholder="alex@university.edu"
                    className="input-field-auth"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketData.subject}
                  onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                  placeholder="e.g. Question regarding ATS Resume parsing"
                  className="input-field-auth"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Details</label>
                <textarea
                  rows={4}
                  required
                  value={ticketData.message}
                  onChange={(e) => setTicketData({ ...ticketData, message: e.target.value })}
                  placeholder="Describe your question or issue in detail..."
                  className="input-field-auth"
                  style={{ height: 'auto', padding: '0.75rem 1rem', fontFamily: 'inherit' }}
                />
              </div>

              <button type="submit" className="btn btn-accent" style={{ alignSelf: 'flex-start', padding: '0.75rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                <Send size={15} />
                <span>Submit Inquiry</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpSupport;
