import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { CareerNetwork3D } from './CareerNetwork3D';
import './Hero.css';

/**
 * HeroHeadline — Progressive Line-by-Line Character Reveal
 * Line 1: "Your career,"
 * Line 2: "powered by"
 * Line 3: "intelligence." (with text-gradient-intelligence class)
 * Zero layout shift via ghost character geometry reservation.
 * Converts to static <h1> once animation completes.
 */
const HeroHeadline = ({ onComplete }) => {
  const lines = [
    { text: "Your career,", isGradient: false },
    { text: "powered by", isGradient: false },
    { text: "intelligence.", isGradient: true }
  ];

  const [lineProgress, setLineProgress] = useState([0, 0, 0]);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setLineProgress([lines[0].text.length, lines[1].text.length, lines[2].text.length]);
      setIsFinished(true);
      if (onComplete) onComplete();
      return;
    }

    let lineIdx = 0;
    let charIdx = 0;
    let timeoutId = null;

    const startTimeout = setTimeout(() => {
      const typeNextChar = () => {
        if (lineIdx >= lines.length) {
          setIsFinished(true);
          if (onComplete) onComplete();
          return;
        }

        const currentTarget = lines[lineIdx].text;
        charIdx++;

        setLineProgress(prev => {
          const next = [...prev];
          next[lineIdx] = charIdx;
          return next;
        });

        if (charIdx < currentTarget.length) {
          const isComma = currentTarget[charIdx - 1] === ',';
          timeoutId = setTimeout(typeNextChar, isComma ? 120 : 38);
        } else {
          lineIdx++;
          charIdx = 0;
          timeoutId = setTimeout(typeNextChar, 140);
        }
      };

      typeNextChar();
    }, 300);

    return () => {
      clearTimeout(startTimeout);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  if (isFinished) {
    return (
      <h1 className="hero-headline">
        Your career,<br />
        powered by <span className="text-gradient-intelligence">intelligence</span>.
      </h1>
    );
  }

  return (
    <h1 className="hero-headline" aria-label="Your career, powered by intelligence.">
      <span className="hero-headline-line">
        <span className="typed-visible">{lines[0].text.slice(0, lineProgress[0])}</span>
        <span className="typed-ghost" aria-hidden="true">{lines[0].text.slice(lineProgress[0])}</span>
      </span>
      <br />
      <span className="hero-headline-line">
        <span className="typed-visible">{lines[1].text.slice(0, lineProgress[1])}</span>
        <span className="typed-ghost" aria-hidden="true">{lines[1].text.slice(lineProgress[1])}</span>
      </span>
      {' '}
      <span className="hero-headline-line">
        <span className={`typed-visible ${lineProgress[2] > 0 ? 'text-gradient-intelligence' : ''}`}>
          {lines[2].text.slice(0, lineProgress[2])}
        </span>
        <span className="typed-ghost text-gradient-intelligence" aria-hidden="true">
          {lines[2].text.slice(lineProgress[2])}
        </span>
      </span>
    </h1>
  );
};

export const Hero = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isBadgeVisible, setIsBadgeVisible] = useState(false);
  const [isSubtextVisible, setIsSubtextVisible] = useState(false);
  const [isCtaVisible, setIsCtaVisible] = useState(false);
  const [isTrustVisible, setIsTrustVisible] = useState(false);
  const [isVisualVisible, setIsVisualVisible] = useState(false);

  const heroRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsBadgeVisible(true);
      setIsSubtextVisible(true);
      setIsCtaVisible(true);
      setIsTrustVisible(true);
      setIsVisualVisible(true);
      return;
    }

    // Sequence timing
    const t1 = setTimeout(() => setIsBadgeVisible(true), 150);
    const t2 = setTimeout(() => setIsSubtextVisible(true), 1800);
    const t3 = setTimeout(() => setIsCtaVisible(true), 2100);
    const t4 = setTimeout(() => setIsTrustVisible(true), 2300);
    const t5 = setTimeout(() => setIsVisualVisible(true), 2400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, []);

  const handleMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  const handleHeadlineComplete = () => {
    setIsSubtextVisible(true);
    setIsCtaVisible(true);
    setIsTrustVisible(true);
    setIsVisualVisible(true);
  };

  return (
    <section
      ref={heroRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="hero-section"
      aria-label="Talent Agent AI Hero"
    >
      <div className="container-wide hero-layout-grid">
        {/* Left: Typography & Actions */}
        <div className="hero-text-col">
          {/* Eyebrow badge */}
          <div className={`hero-eyebrow-chip ${isBadgeVisible ? 'revealed' : ''}`}>
            <span className="eyebrow-dot" />
            <span>Autonomous Career Intelligence Platform</span>
          </div>

          {/* Headline */}
          <HeroHeadline onComplete={handleHeadlineComplete} />

          {/* Supporting Copy */}
          <p className={`hero-subtext ${isSubtextVisible ? 'revealed' : ''}`}>
            AI-driven career matching, resume intelligence, skill-gap analysis, and career guidance for the next generation of professionals.
          </p>

          {/* Call-to-Action Group */}
          <div className={`hero-cta-group ${isCtaVisible ? 'revealed' : ''}`}>
            <Link to="/signup" className="btn btn-primary btn-lg hero-cta-primary">
              <span>Get started</span>
              <ArrowRight size={17} />
            </Link>

            <a href="#how-it-works" className="btn btn-secondary btn-lg hero-cta-secondary">
              <span>Explore Talent Agent AI</span>
            </a>
          </div>

          {/* Trust Validation Indicators */}
          <div className={`hero-trust-indicators ${isTrustVisible ? 'revealed' : ''}`}>
            <div className="trust-indicator-item">
              <CheckCircle2 size={15} className="text-electric-blue" />
              <span>100% Machine-Readable ATS Resumes</span>
            </div>
            <div className="trust-indicator-item">
              <CheckCircle2 size={15} className="text-electric-blue" />
              <span>Multi-Dimensional Job Scoring</span>
            </div>
            <div className="trust-indicator-item">
              <CheckCircle2 size={15} className="text-electric-blue" />
              <span>Personalized Skill Gap Roadmaps</span>
            </div>
          </div>
        </div>

        {/* Right: 3D Interactive Career Intelligence Visual */}
        <div className={`hero-visual-col ${isVisualVisible ? 'revealed' : ''}`}>
          <CareerNetwork3D mousePos={mousePos} />
        </div>
      </div>
    </section>
  );
};

export default Hero;
