import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles, TrendingUp, ShieldCheck, Target, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

export const Hero = () => {
  const { isAuthenticated } = useAuth();

  const handleScrollToHowItWorks = (e) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-section" aria-label="Talent Agent AI Overview">
      {/* Background ambient lighting */}
      <div className="hero-ambient-glow lavender-glow" />
      <div className="hero-ambient-glow lime-glow" />

      <div className="hero-grid-container">
        {/* Left Column: 55% */}
        <div className="hero-left-column">
          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <Sparkles size={13} className="hero-eyebrow-icon" />
            <span>AI CAREER AGENT</span>
          </div>

          {/* Main Headline */}
          <h1 className="hero-main-headline">
            Your career.<br />
            <span className="hero-lavender-accent">Decoded.</span>
          </h1>

          {/* Subtext */}
          <p className="hero-lead-paragraph">
            Talent Agent AI analyzes your resume, skills, experience, and goals to help you find the right opportunities and understand what to improve next.
          </p>

          {/* Action CTAs */}
          <div className="hero-cta-action-row">
            <Link
              to={isAuthenticated ? '/dashboard' : '/signup'}
              className="hero-primary-cta"
            >
              <span>{isAuthenticated ? 'Go to Dashboard' : 'Analyze My Profile'}</span>
              <ArrowRight size={17} className="hero-cta-arrow" />
            </Link>

            <a
              href="#how-it-works"
              onClick={handleScrollToHowItWorks}
              className="hero-secondary-cta"
            >
              <span>See How It Works</span>
            </a>
          </div>

          {/* Trust / Value points row */}
          <div className="hero-trust-value-row">
            <div className="hero-trust-item">
              <span className="hero-trust-check">
                <Check size={13} strokeWidth={3} />
              </span>
              <span>Resume Intelligence</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-check">
                <Check size={13} strokeWidth={3} />
              </span>
              <span>AI Job Matching</span>
            </div>
            <div className="hero-trust-item">
              <span className="hero-trust-check">
                <Check size={13} strokeWidth={3} />
              </span>
              <span>Skill Gap Analysis</span>
            </div>
          </div>
        </div>

        {/* Right Column: 45% Product Mockup */}
        <div className="hero-right-column">
          <div className="hero-mockup-wrapper">
            {/* Floating Card 1: 12 Skills Detected */}
            <div className="hero-floating-card floating-card-top">
              <div className="floating-card-icon-box lime-bg">
                <Layers size={14} className="text-black" />
              </div>
              <div className="floating-card-text">
                <span className="floating-card-title">12 skills detected</span>
                <span className="floating-card-sub">from uploaded profile</span>
              </div>
            </div>

            {/* Main Product Card: Career Snapshot */}
            <div className="hero-dashboard-card">
              {/* Card Top Header */}
              <div className="dashboard-card-header">
                <div>
                  <span className="dashboard-card-label">CAREER SNAPSHOT</span>
                  <h3 className="dashboard-card-role">Frontend Developer</h3>
                </div>
                <div className="dashboard-card-badge">
                  <span className="badge-live-pulse" />
                  <span>AI Calibrated</span>
                </div>
              </div>

              {/* Match Score Indicator Section */}
              <div className="dashboard-score-section">
                <div className="circular-score-ring">
                  <svg viewBox="0 0 100 100" className="score-svg-circle">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="score-circle-bg"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="score-circle-fill"
                      strokeDasharray="251.2"
                      strokeDashoffset="40.19" /* 84% filled */
                    />
                  </svg>
                  <div className="score-center-text">
                    <span className="score-number">84%</span>
                    <span className="score-unit">MATCH</span>
                  </div>
                </div>

                <div className="score-details-summary">
                  <span className="score-verdict-tag">High Compatibility</span>
                  <p className="score-verdict-desc">
                    Your skills closely match 42 active engineering requisitions.
                  </p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="dashboard-skills-breakdown">
                {/* Matching Skills */}
                <div className="skills-block">
                  <span className="skills-block-title">MATCHING SKILLS (4)</span>
                  <div className="skills-tags-wrap">
                    <span className="skill-chip match-chip">
                      <Check size={11} strokeWidth={3} className="skill-check-icon" /> React
                    </span>
                    <span className="skill-chip match-chip">
                      <Check size={11} strokeWidth={3} className="skill-check-icon" /> JavaScript
                    </span>
                    <span className="skill-chip match-chip">
                      <Check size={11} strokeWidth={3} className="skill-check-icon" /> CSS
                    </span>
                    <span className="skill-chip match-chip">
                      <Check size={11} strokeWidth={3} className="skill-check-icon" /> Figma
                    </span>
                  </div>
                </div>

                {/* Skill Gaps */}
                <div className="skills-block">
                  <span className="skills-block-title">SKILL GAPS (2)</span>
                  <div className="skills-tags-wrap">
                    <span className="skill-chip gap-chip">
                      <span className="gap-indicator-dot" /> TypeScript
                    </span>
                    <span className="skill-chip gap-chip">
                      <span className="gap-indicator-dot" /> Testing
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Best Move Insight */}
              <div className="dashboard-next-move-box">
                <div className="next-move-header">
                  <Sparkles size={13} className="next-move-sparkle" />
                  <span className="next-move-label">NEXT BEST MOVE</span>
                </div>
                <p className="next-move-text">
                  "Build one TypeScript project to improve your job readiness."
                </p>
              </div>
            </div>

            {/* Floating Card 2: 3 Skill Gaps */}
            <div className="hero-floating-card floating-card-bottom">
              <div className="floating-card-icon-box lavender-bg">
                <Target size={14} className="text-white" />
              </div>
              <div className="floating-card-text">
                <span className="floating-card-title">3 skill gaps</span>
                <span className="floating-card-sub">prioritized for closing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
