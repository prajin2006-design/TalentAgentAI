import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User, LogOut, Sparkles, Menu, X, Zap } from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const navRef = useRef(null);
  const isNavScrollingRef = useRef(false);

  // 1. Measure Live Navbar Height & Propagate `--nav-h` to Root CSS Variable
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        // Comfortable clearance so section eyebrow badges land clearly below the fixed navbar
        const totalNavOffset = Math.round(rect.height + rect.top + 32);
        document.documentElement.style.setProperty('--nav-h', `${totalNavOffset}px`);
      }
    };

    updateNavHeight();
    window.addEventListener('resize', updateNavHeight);
    window.addEventListener('scroll', updateNavHeight, { passive: true });

    return () => {
      window.removeEventListener('resize', updateNavHeight);
      window.removeEventListener('scroll', updateNavHeight);
    };
  }, []);

  // 2. Track Window Scroll Position for Compact Glass Pill State
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 25);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll-Spy IntersectionObserver for Landing Page Nav Links
  useEffect(() => {
    if (isAuthenticated || location.pathname !== '/') return;

    const sectionsToObserve = [
      { id: 'features', labelId: 'features' },
      { id: 'ats-resume', labelId: 'ats-resume' },
      { id: 'how-it-works', labelId: 'how-it-works' },
      { id: 'job-intelligence', labelId: 'job-intelligence' },
      { id: 'jobs', labelId: 'job-intelligence' },
      { id: 'co-pilot', labelId: 'co-pilot' },
      { id: 'about', labelId: 'co-pilot' }
    ];

    const elements = sectionsToObserve
      .map(item => ({ el: document.getElementById(item.id), labelId: item.labelId }))
      .filter(item => item.el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // DO NOT OVERRIDE active section state if user is currently click-scrolling
        if (isNavScrollingRef.current) return;

        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const matched = sectionsToObserve.find(s => s.id === entry.target.id);
            if (matched) {
              setActiveSection(matched.labelId);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-20% 0px -45% 0px',
        threshold: 0.1
      }
    );

    elements.forEach(item => observer.observe(item.el));

    return () => observer.disconnect();
  }, [isAuthenticated, location.pathname]);

  // 4. Smooth Anchor Scroll Click Handler with Observer Lockout
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }

    const targetEl = document.getElementById(sectionId) ||
      (sectionId === 'job-intelligence' ? document.getElementById('jobs') : null) ||
      (sectionId === 'co-pilot' ? document.getElementById('about') : null);

    if (!targetEl) return;

    // Lock IntersectionObserver while click-scroll is executing
    isNavScrollingRef.current = true;
    setActiveSection(sectionId);

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Release lockout once smooth scroll settles
    let scrollTimeout;
    const unlockScroll = () => {
      isNavScrollingRef.current = false;
      window.removeEventListener('scrollend', unlockScroll);
      if (scrollTimeout) clearTimeout(scrollTimeout);
    };

    if ('onscrollend' in window) {
      window.addEventListener('scrollend', unlockScroll, { once: true });
    }
    scrollTimeout = setTimeout(unlockScroll, 750);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isCurrent = (path) => location.pathname === path;

  return (
    <div ref={navRef} className={`navbar-floating-container ${isScrolled ? 'scrolled' : ''}`}>
      <header className={`navbar-pill-bar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-logo-group">
          <span className="logo-brand-title font-display">
            TALENT AGENT <span className="logo-blue-badge">AI</span>
          </span>
          <span className="logo-live-pulse-dot" title="Neural Agent Live" />
        </Link>

        {/* Desktop Navigation Items */}
        <nav className="navbar-menu-items">
          {isAuthenticated ? (
            <>
              <Link
                to="/dashboard"
                className={`nav-pill-item ${isCurrent('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link
                to="/resume-maker"
                className={`nav-pill-item ${isCurrent('/resume-maker') ? 'active' : ''}`}
              >
                <Sparkles size={13} className="text-electric-blue" />
                <span>Resume Maker</span>
              </Link>
              <Link
                to="/job-matching"
                className={`nav-pill-item ${isCurrent('/job-matching') ? 'active' : ''}`}
              >
                Matches
              </Link>
              <Link
                to="/skill-gaps"
                className={`nav-pill-item ${isCurrent('/skill-gaps') ? 'active' : ''}`}
              >
                Skill Gaps
              </Link>
              <Link
                to="/career-path"
                className={`nav-pill-item ${isCurrent('/career-path') ? 'active' : ''}`}
              >
                Roadmap
              </Link>
              <Link
                to="/assistant"
                className={`nav-pill-item ${isCurrent('/assistant') ? 'active' : ''}`}
              >
                Co-Pilot
              </Link>
            </>
          ) : (
            <>
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, 'features')}
                className={`nav-pill-item ${activeSection === 'features' ? 'active' : ''}`}
              >
                Features
              </a>
              <a
                href="#ats-resume"
                onClick={(e) => handleNavClick(e, 'ats-resume')}
                className={`nav-pill-item highlighted-nav-link ${activeSection === 'ats-resume' ? 'active' : ''}`}
              >
                <Sparkles size={13} className="text-electric-blue" />
                <span>ATS Resume</span>
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleNavClick(e, 'how-it-works')}
                className={`nav-pill-item ${activeSection === 'how-it-works' ? 'active' : ''}`}
              >
                How It Works
              </a>
              <a
                href="#job-intelligence"
                onClick={(e) => handleNavClick(e, 'job-intelligence')}
                className={`nav-pill-item ${activeSection === 'job-intelligence' ? 'active' : ''}`}
              >
                Job Intelligence
              </a>
              <a
                href="#co-pilot"
                onClick={(e) => handleNavClick(e, 'co-pilot')}
                className={`nav-pill-item ${activeSection === 'co-pilot' ? 'active' : ''}`}
              >
                Co-Pilot
              </a>
            </>
          )}
        </nav>

        {/* Right CTA Actions */}
        <div className="navbar-cta-actions">
          {isAuthenticated ? (
            <div className="auth-user-nav-flex">
              <Link to="/profile" className="nav-profile-pill">
                <User size={15} />
                <span>{user?.full_name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button onClick={handleLogout} className="btn-logout-nav" title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <>
              <Link to="/resume-maker" className="nav-pill-item-accent hide-on-mobile">
                <Zap size={14} />
                <span>Build Resume</span>
              </Link>
              <Link to="/login" className="nav-login-btn">
                Sign In
              </Link>
              <Link to="/signup" className="btn btn-primary nav-cta-pill hover-expand">
                <span>Get Started</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            className="mobile-hamburger-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-drawer animate-fade-in">
          {isAuthenticated ? (
            <div className="mobile-nav-links">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/resume-maker" onClick={() => setIsMobileMenuOpen(false)}>ATS Resume Maker</Link>
              <Link to="/job-matching" onClick={() => setIsMobileMenuOpen(false)}>Job Matching</Link>
              <Link to="/skill-gaps" onClick={() => setIsMobileMenuOpen(false)}>Skill Gaps</Link>
              <Link to="/career-path" onClick={() => setIsMobileMenuOpen(false)}>Career Roadmap</Link>
              <Link to="/assistant" onClick={() => setIsMobileMenuOpen(false)}>AI Assistant</Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
              <button onClick={handleLogout} className="mobile-logout-btn">Sign Out</button>
            </div>
          ) : (
            <div className="mobile-nav-links">
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Platform Features</a>
              <a href="#ats-resume" onClick={(e) => handleNavClick(e, 'ats-resume')}>ATS Resume Maker</a>
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
              <a href="#job-intelligence" onClick={(e) => handleNavClick(e, 'job-intelligence')}>Job Intelligence</a>
              <a href="#co-pilot" onClick={(e) => handleNavClick(e, 'co-pilot')}>AI Career Co-Pilot</a>
              <div className="mobile-drawer-auth-actions">
                <Link to="/login" className="btn btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/signup" className="btn btn-primary w-full" onClick={() => setIsMobileMenuOpen(false)}>Get Started Free</Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
