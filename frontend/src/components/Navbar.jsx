import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, User, LogOut, Menu, X, Sparkles } from 'lucide-react';
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

  // 1. Measure Live Navbar Height & Propagate `--nav-h`
  useEffect(() => {
    const updateNavHeight = () => {
      if (navRef.current) {
        const rect = navRef.current.getBoundingClientRect();
        const totalNavOffset = Math.round(rect.height + rect.top + 24);
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

  // 2. Track Window Scroll Position
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Scroll-Spy IntersectionObserver for Landing Page Nav Links
  useEffect(() => {
    if (isAuthenticated || location.pathname !== '/') return;

    const sectionsToObserve = [
      { id: 'features', labelId: 'features' },
      { id: 'how-it-works', labelId: 'how-it-works' },
      { id: 'job-intelligence', labelId: 'job-intelligence' },
      { id: 'co-pilot', labelId: 'co-pilot' }
    ];

    const elements = sectionsToObserve
      .map(item => ({ el: document.getElementById(item.id), labelId: item.labelId }))
      .filter(item => item.el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
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

  // 4. Smooth Anchor Scroll Click Handler
  const handleNavClick = (e, sectionId) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);

    if (location.pathname !== '/') {
      navigate(`/#${sectionId}`);
      return;
    }

    const targetEl = document.getElementById(sectionId);
    if (!targetEl) return;

    isNavScrollingRef.current = true;
    setActiveSection(sectionId);

    targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });

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
    <div ref={navRef} className={`navbar-wrapper ${isScrolled ? 'is-scrolled' : ''}`}>
      <header className="navbar-container">
        {/* Left: Brand Logo */}
        <Link to={isAuthenticated ? '/dashboard' : '/'} className="navbar-brand">
          <div className="brand-logo-mark">
            <Sparkles size={16} className="brand-sparkle-icon" />
          </div>
          <span className="brand-text">
            Talent Agent <span className="brand-ai-badge">AI</span>
          </span>
        </Link>

        {/* Center: Desktop Navigation */}
        <nav className="navbar-center-nav">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={`nav-link ${isCurrent('/dashboard') ? 'active' : ''}`}>
                Dashboard
              </Link>
              <Link to="/resume-maker" className={`nav-link ${isCurrent('/resume-maker') ? 'active' : ''}`}>
                Resume Maker
              </Link>
              <Link to="/job-matching" className={`nav-link ${isCurrent('/job-matching') ? 'active' : ''}`}>
                Job Matches
              </Link>
              <Link to="/skill-gaps" className={`nav-link ${isCurrent('/skill-gaps') ? 'active' : ''}`}>
                Skill Gaps
              </Link>
              <Link to="/career-path" className={`nav-link ${isCurrent('/career-path') ? 'active' : ''}`}>
                Roadmap
              </Link>
              <Link to="/assistant" className={`nav-link ${isCurrent('/assistant') ? 'active' : ''}`}>
                AI Assistant
              </Link>
            </>
          ) : (
            <>
              <a
                href="#features"
                onClick={(e) => handleNavClick(e, 'features')}
                className={`nav-link ${activeSection === 'features' ? 'active' : ''}`}
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={(e) => handleNavClick(e, 'how-it-works')}
                className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
              >
                How It Works
              </a>
              <a
                href="#job-intelligence"
                onClick={(e) => handleNavClick(e, 'job-intelligence')}
                className={`nav-link ${activeSection === 'job-intelligence' ? 'active' : ''}`}
              >
                Job Intelligence
              </a>
              <a
                href="#co-pilot"
                onClick={(e) => handleNavClick(e, 'co-pilot')}
                className={`nav-link ${activeSection === 'co-pilot' ? 'active' : ''}`}
              >
                AI Assistant
              </a>
            </>
          )}
        </nav>

        {/* Right: Auth & Action CTAs */}
        <div className="navbar-right-actions">
          {isAuthenticated ? (
            <div className="navbar-auth-user">
              <Link to="/profile" className="nav-profile-btn">
                <User size={15} />
                <span>{user?.full_name?.split(' ')[0] || 'Profile'}</span>
              </Link>
              <button onClick={handleLogout} className="nav-logout-btn" title="Sign Out">
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div className="navbar-public-actions">
              <Link to="/login" className="nav-signin-link">
                Sign In
              </Link>
              <Link to="/signup" className="nav-getstarted-btn">
                <span>Get Started</span>
                <ArrowRight size={14} className="nav-btn-arrow" />
              </Link>
            </div>
          )}

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="navbar-mobile-drawer animate-fade-in">
          {isAuthenticated ? (
            <div className="mobile-nav-links">
              <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/resume-maker" onClick={() => setIsMobileMenuOpen(false)}>Resume Maker</Link>
              <Link to="/job-matching" onClick={() => setIsMobileMenuOpen(false)}>Job Matches</Link>
              <Link to="/skill-gaps" onClick={() => setIsMobileMenuOpen(false)}>Skill Gaps</Link>
              <Link to="/career-path" onClick={() => setIsMobileMenuOpen(false)}>Career Roadmap</Link>
              <Link to="/assistant" onClick={() => setIsMobileMenuOpen(false)}>AI Assistant</Link>
              <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>My Profile</Link>
              <button onClick={handleLogout} className="mobile-logout-btn">Sign Out</button>
            </div>
          ) : (
            <div className="mobile-nav-links">
              <a href="#features" onClick={(e) => handleNavClick(e, 'features')}>Features</a>
              <a href="#how-it-works" onClick={(e) => handleNavClick(e, 'how-it-works')}>How It Works</a>
              <a href="#job-intelligence" onClick={(e) => handleNavClick(e, 'job-intelligence')}>Job Intelligence</a>
              <a href="#co-pilot" onClick={(e) => handleNavClick(e, 'co-pilot')}>AI Assistant</a>
              <div className="mobile-drawer-cta-group">
                <Link to="/login" className="btn btn-secondary w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  Sign In
                </Link>
                <Link to="/signup" className="nav-getstarted-btn w-full text-center" onClick={() => setIsMobileMenuOpen(false)}>
                  <span>Get Started Free</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Navbar;
