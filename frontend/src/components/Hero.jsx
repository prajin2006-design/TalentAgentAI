import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Target
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

export const Hero = () => {
  const { isAuthenticated } = useAuth();

  const handleScrollToExplore = (e) => {
    e.preventDefault();
    const el = document.getElementById('how-it-works') || document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-section" aria-label="Talent Agent AI Career Intelligence">
      <div className="hero-container">
        {/* Left Column: Hero Content */}
        <div className="hero-left-col">
          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <span className="hero-eyebrow-pill">
              <Sparkles size={13} className="hero-eyebrow-sparkle" />
              <span>AI CAREER AGENT</span>
            </span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            Your career,<br />
            <span className="hero-headline-italic">decoded.</span>
          </h1>

          {/* Description */}
          <p className="hero-description">
            Understand your skills, discover suitable job opportunities, identify skill gaps, and find your next career move with AI.
          </p>

          {/* Buttons Row */}
          <div className="hero-btn-row">
            <Link
              to={isAuthenticated ? '/resume-analysis' : '/signup'}
              className="hero-btn-primary"
              id="hero-primary-cta"
            >
              <span>Analyze My Profile</span>
              <ArrowRight size={16} className="hero-btn-arrow" />
            </Link>

            <a
              href="#how-it-works"
              onClick={handleScrollToExplore}
              className="hero-btn-secondary"
              id="hero-secondary-cta"
            >
              <span>Explore Talent Agent AI</span>
            </a>
          </div>

          {/* 3 Compact Benefits Below Buttons */}
          <div className="hero-benefits-row">
            <div className="hero-benefit-item">
              <span className="hero-benefit-check">
                <Check size={11} strokeWidth={3} />
              </span>
              <span>Resume Intelligence</span>
            </div>
            <div className="hero-benefit-item">
              <span className="hero-benefit-check">
                <Check size={11} strokeWidth={3} />
              </span>
              <span>AI Job Matching</span>
            </div>
            <div className="hero-benefit-item">
              <span className="hero-benefit-check">
                <Check size={11} strokeWidth={3} />
              </span>
              <span>Skill Gap Analysis</span>
            </div>
          </div>
        </div>

        {/* Right Column: Product Visual Mockup */}
        <div className="hero-right-col">
          {/* Subtle Lavender Background Panel */}
          <div className="hero-visual-panel">
            {/* Diamond Grid Wireframe Pattern */}
            <svg
              className="hero-panel-diamond-pattern"
              xmlns="http://www.w3.org/2000/svg"
              width="100%"
              height="100%"
              aria-hidden="true"
            >
              <defs>
                <pattern
                  id="blueDiamondGrid"
                  width="52"
                  height="52"
                  patternUnits="userSpaceOnUse"
                  patternTransform="rotate(45)"
                >
                  <rect
                    width="52"
                    height="52"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.18)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#blueDiamondGrid)" />
            </svg>

            {/* Supporting Insight Card 1 (Top / Lime match indicator) */}
            <div className="hero-supporting-card supporting-card-top">
              <div className="supporting-card-icon lime-bg">
                <TrendingUp size={13} className="text-black" />
              </div>
              <div className="supporting-card-text">
                <span className="supporting-card-title">+18% Match Potential</span>
                <span className="supporting-card-subtitle">Closing 2 gaps unlocks 90%+</span>
              </div>
            </div>

            {/* Clean White Dashboard Card */}
            <div className="hero-dashboard-card">
              {/* Card Header */}
              <div className="card-top-header">
                <div className="card-header-left">
                  <span className="card-eyebrow-label">CAREER INTELLIGENCE</span>
                  <span className="card-illustrative-badge">Illustrative</span>
                </div>
                <div className="card-header-right">
                  <span className="card-live-pulse" />
                  <span className="card-live-text">AI Calibrated</span>
                </div>
              </div>

              {/* Target Role & Match Score */}
              <div className="card-role-score-section">
                <div className="card-role-info">
                  <span className="card-field-sub">Target Role</span>
                  <h3 className="card-role-name">Frontend Developer</h3>
                </div>

                <div className="card-score-pill-wrap">
                  <div className="card-score-ring">
                    <svg viewBox="0 0 40 40" className="score-ring-svg">
                      <circle cx="20" cy="20" r="16" className="score-ring-bg" />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        className="score-ring-fill"
                        strokeDasharray="100.5"
                        strokeDashoffset="16.08" /* 84% */
                      />
                    </svg>
                    <span className="score-ring-value">84%</span>
                  </div>
                  <div className="card-score-label-group">
                    <span className="card-score-tag">Match Score</span>
                    <span className="card-score-status">High Alignment</span>
                  </div>
                </div>
              </div>

              {/* Matching Skills */}
              <div className="card-skills-block">
                <div className="card-skills-block-header">
                  <span className="card-skills-title">MATCHING SKILLS</span>
                  <span className="card-skills-count lime-pill">3 Matched</span>
                </div>
                <div className="card-skills-tags">
                  <span className="card-skill-chip chip-match">
                    <Check size={11} strokeWidth={3} className="chip-check-icon" /> React
                  </span>
                  <span className="card-skill-chip chip-match">
                    <Check size={11} strokeWidth={3} className="chip-check-icon" /> JavaScript
                  </span>
                  <span className="card-skill-chip chip-match">
                    <Check size={11} strokeWidth={3} className="chip-check-icon" /> CSS
                  </span>
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="card-skills-block">
                <div className="card-skills-block-header">
                  <span className="card-skills-title">SKILL GAPS</span>
                  <span className="card-skills-count gap-pill">2 Gaps</span>
                </div>
                <div className="card-skills-tags">
                  <span className="card-skill-chip chip-gap">
                    <span className="chip-gap-dot" /> TypeScript
                  </span>
                  <span className="card-skill-chip chip-gap">
                    <span className="chip-gap-dot" /> Testing
                  </span>
                </div>
              </div>

              {/* Next Best Move */}
              <div className="card-next-move-box">
                <div className="card-next-move-header">
                  <Sparkles size={13} className="next-move-sparkle-icon" />
                  <span className="card-next-move-label">NEXT BEST MOVE</span>
                </div>
                <p className="card-next-move-quote">
                  "Improve TypeScript fundamentals to strengthen your profile."
                </p>
              </div>

              {/* Interactive cursor detail mirroring reference screenshot */}
              <div className="card-interactive-cursor" aria-hidden="true">
                <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                  <path
                    d="M1 1L7.5 20.5L10.5 13L17 10L1 1Z"
                    fill="#111111"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Supporting Insight Card 2 (Bottom / Lavender secondary highlight) */}
            <div className="hero-supporting-card supporting-card-bottom">
              <div className="supporting-card-icon lavender-bg">
                <Target size={13} className="text-white" />
              </div>
              <div className="supporting-card-text">
                <span className="supporting-card-title">Priority Milestone</span>
                <span className="supporting-card-subtitle">TypeScript practice roadmap</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
