import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  Sparkles,
  TrendingUp,
  Target,
  ShieldCheck,
  Zap,
  FileText,
  Clock,
  ArrowUpRight,
  Terminal,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Hero.css';

export const Hero = () => {
  const { isAuthenticated } = useAuth();

  const handleScrollToDemo = (e) => {
    e.preventDefault();
    const el = document.getElementById('role-calibration') || document.getElementById('how-it-works') || document.getElementById('features');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="hero-arch-section" aria-label="Talent Agent AI Core Positioning">
      <div className="hero-arch-container">
        {/* ================================================================
            LEFT COLUMN: THE 4 PILLARS (WHAT / WHO / WHY / WHAT NEXT)
            ================================================================ */}
        <div className="hero-arch-left">
          {/* 1. WHAT IT IS (Eyebrow & System Code) */}
          <div className="hero-system-stencil font-mono">
            <span className="stencil-pulse-dot" />
            <span className="stencil-brand">SYSTEM // TALENT_AGENT_AI</span>
            <span className="stencil-sep">/</span>
            <span className="stencil-type">AUTONOMOUS_CAREER_COPILOT</span>
          </div>

          {/* 1. WHAT IT IS (Main Headline) */}
          <h1 className="hero-arch-headline">
            The Autonomous AI <span className="hero-highlight-orange">Career Agent</span> for Tech Professionals.
          </h1>

          {/* 1. WHAT IT IS (Core Definition) */}
          <p className="hero-arch-lead">
            Talent Agent AI audits your technical resume against live market benchmarks, 
            detects critical skill gaps, and generates ATS-proof applications and interview 
            roadmaps—eliminating the hiring black hole.
          </p>

          {/* 2. WHO IT IS FOR (Explicit Audience Matrix) */}
          <div className="hero-audience-card">
            <span className="audience-label font-mono">BUILT SPECIFICALLY FOR:</span>
            <div className="audience-tags-strip font-mono">
              <span className="aud-tag">[SOFTWARE ENGINEERS]</span>
              <span className="aud-tag">[UI/UX ARCHITECTS]</span>
              <span className="aud-tag">[CLOUD & DATA PRACTITIONERS]</span>
              <span className="aud-tag">[TECH APPLICANTS & LEADS]</span>
            </div>
          </div>

          {/* 3. WHY IT MATTERS (Concrete Comparative Value) */}
          <div className="hero-why-metrics-grid font-mono">
            <div className="metric-box">
              <span className="metric-num text-lime">94%</span>
              <span className="metric-lbl">ATS PASS-RATE</span>
              <span className="metric-sub">Semantic keyword alignment</span>
            </div>
            <div className="metric-box">
              <span className="metric-num">0%</span>
              <span className="metric-lbl">BLIND GUESSWORK</span>
              <span className="metric-sub">Instant missing skill alerts</span>
            </div>
            <div className="metric-box">
              <span className="metric-num text-orange">3X</span>
              <span className="metric-lbl">FASTER HIRES</span>
              <span className="metric-sub">Interactive mock coaching</span>
            </div>
          </div>

          {/* 4. WHAT TO DO NEXT (Primary & Secondary Action Suite) */}
          <div className="hero-action-block">
            <div className="hero-cta-cluster">
              <Link
                to={isAuthenticated ? '/resume-analysis' : '/signup'}
                className="hero-btn-commit font-mono"
                id="hero-primary-cta"
              >
                <span>[ ANALYZE YOUR RESUME FREE ↗ ]</span>
              </Link>

              <a
                href="#role-calibration"
                onClick={handleScrollToDemo}
                className="hero-btn-inspect font-mono"
                id="hero-secondary-cta"
              >
                <span>[ TEST ROLE CALIBRATION ↓ ]</span>
              </a>
            </div>

            {/* Friction Reducer */}
            <div className="hero-friction-hints font-mono">
              <span className="hint-item">✓ 30-SECOND UPLOAD</span>
              <span className="hint-pipe">|</span>
              <span className="hint-item">✓ INSTANT ATS SCORE</span>
              <span className="hint-pipe">|</span>
              <span className="hint-item">✓ NO CREDIT CARD</span>
            </div>
          </div>
        </div>

        {/* ================================================================
            RIGHT COLUMN: LIVE ABOVE-THE-FOLD PROOF TERMINAL
            Demonstrates What It Does in Real-Time
            ================================================================ */}
        <div className="hero-arch-right">
          <div className="hero-terminal-monolith">
            {/* Terminal Top Window Bar */}
            <div className="terminal-masthead font-mono">
              <div className="terminal-status-cell">
                <span className="terminal-live-beacon" />
                <span>TELEMETRY_MONITOR // REALTIME_AUDIT</span>
              </div>
              <span className="terminal-candidate-ref">SAMPLE // PRAJIN_S [UX.DSGN]</span>
            </div>

            {/* Terminal Calibration Display */}
            <div className="terminal-body-block">
              {/* Target Role & Match Status */}
              <div className="terminal-role-strip">
                <div>
                  <span className="terminal-micro-label font-mono">TARGET BENCHMARK:</span>
                  <h3 className="terminal-role-title">Frontend Developer / UI Engineer</h3>
                </div>
                <div className="terminal-score-gauge">
                  <div className="gauge-dial-num font-mono">84%</div>
                  <span className="gauge-status-tag font-mono">[HIGH_ALIGNMENT]</span>
                </div>
              </div>

              {/* Progress Rule */}
              <div className="terminal-rule-track">
                <div className="terminal-rule-bar" style={{ width: '84%' }}></div>
              </div>

              {/* Matching Skills */}
              <div className="terminal-spec-section">
                <div className="spec-heading-row font-mono">
                  <span className="spec-title">01 // VERIFIED COMPETENCIES:</span>
                  <span className="spec-count">[3 MATCHED]</span>
                </div>
                <div className="spec-tag-strip font-mono">
                  <span className="spec-matched-tag">
                    <Check size={11} strokeWidth={3} /> React
                  </span>
                  <span className="spec-matched-tag">
                    <Check size={11} strokeWidth={3} /> JavaScript
                  </span>
                  <span className="spec-matched-tag">
                    <Check size={11} strokeWidth={3} /> Figma / CSS
                  </span>
                </div>
              </div>

              {/* Identified Gaps */}
              <div className="terminal-spec-section">
                <div className="spec-heading-row font-mono">
                  <span className="spec-title text-amber">02 // MISSING MARKET GAPS:</span>
                  <span className="spec-count text-amber">[2 GAPS]</span>
                </div>
                <div className="spec-tag-strip font-mono">
                  <span className="spec-gap-tag">
                    ! TypeScript Generics
                  </span>
                  <span className="spec-gap-tag">
                    ! Jest / React Testing
                  </span>
                </div>
              </div>

              {/* Next Best Action Callout */}
              <div className="terminal-action-callout font-mono">
                <div className="callout-header">
                  <Zap size={12} className="text-lime" />
                  <span>RECOMMENDED_NEXT_MOVE:</span>
                </div>
                <p className="callout-msg">
                  "Closing TypeScript and Testing gaps increases your role match from 84% to 94%+."
                </p>
                <div className="callout-action-row">
                  <span className="callout-badge-link">
                    [ AUTO-OPTIMIZE RESUME ]
                  </span>
                  <span className="callout-badge-link">
                    [ LAUNCH MOCK INTERVIEW ]
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Stencil Footer */}
            <div className="terminal-footer-strip font-mono">
              <span>LATENCY: 180MS // MODEL: GEMINI_GROQ_HYBRID</span>
              <span>STATE: READY_FOR_APPLICATION</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
