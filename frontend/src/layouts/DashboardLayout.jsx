import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, Navigate, Link, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { 
  Search, 
  Sparkles, 
  User, 
  LayoutDashboard, 
  FileText, 
  Target, 
  Cpu, 
  Briefcase, 
  Settings, 
  ArrowRight 
} from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../services/api';
import {
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  normalizeReadiness
} from '../utils/userHelpers';
import './DashboardLayout.css';

// Pre-defined static sections & tools
const tools = [
  { id: 'dashboard', name: 'Dashboard', path: '/dashboard', category: 'Tools', desc: 'Your career intelligence at a glance' },
  { id: 'profile', name: 'Profile', path: '/profile', category: 'Tools', desc: 'Manage your professional profile and resume' },
  { id: 'resume-maker', name: 'Resume Maker', path: '/resume-maker', category: 'Tools', desc: 'Create and optimize an ATS-friendly resume' },
  { id: 'resume-analysis', name: 'Resume Analysis', path: '/resume-analysis', category: 'Tools', desc: 'Get instant ATS calibration & feedback' },
  { id: 'job-matching', name: 'Job Matching', path: '/job-matching', category: 'Tools', desc: 'Find top positions matching your skillset' },
  { id: 'skill-gaps', name: 'Skill Gaps', path: '/skill-gaps', category: 'Tools', desc: 'Diagnose skill gaps and view learning paths' },
  { id: 'assistant', name: 'AI Assistant', path: '/assistant', category: 'Tools', desc: 'Get AI-powered career counseling' },
  { id: 'settings', name: 'Settings', path: '/settings', category: 'Tools', desc: 'Manage platform preferences and settings' }
];

const candidateSkills = [
  { name: 'Figma', path: '/profile', category: 'Skills', desc: 'UI/UX Design & prototyping' },
  { name: 'React', path: '/profile', category: 'Skills', desc: 'Frontend library for interactive web UIs' },
  { name: 'JavaScript', path: '/profile', category: 'Skills', desc: 'Core web programming language' },
  { name: 'Python', path: '/profile', category: 'Skills', desc: 'Backend development, AI & data science' },
  { name: 'SQL', path: '/profile', category: 'Skills', desc: 'Relational database query language' },
  { name: 'AWS', path: '/profile', category: 'Skills', desc: 'Cloud infrastructure & deployments' },
  { name: 'Docker', path: '/profile', category: 'Skills', desc: 'Containerization & local environment setup' }
];

const getResultIcon = (category, id) => {
  if (category === 'Skills') return <Cpu size={15} className="search-result-icon text-purple" />;
  if (category === 'Jobs') return <Briefcase size={15} className="search-result-icon text-green" />;

  switch (id) {
    case 'dashboard': return <LayoutDashboard size={15} className="search-result-icon text-blue" />;
    case 'profile': return <User size={15} className="search-result-icon text-blue" />;
    case 'resume-maker': return <FileText size={15} className="search-result-icon text-blue" />;
    case 'resume-analysis': return <Target size={15} className="search-result-icon text-blue" />;
    case 'job-matching': return <Briefcase size={15} className="search-result-icon text-blue" />;
    case 'skill-gaps': return <Cpu size={15} className="search-result-icon text-blue" />;
    case 'assistant': return <Sparkles size={15} className="search-result-icon text-electric-blue" />;
    case 'settings': return <Settings size={15} className="search-result-icon text-blue" />;
    default: return <FileText size={15} className="search-result-icon text-blue" />;
  }
};

export const DashboardLayout = () => {
  const { profileScore, profile } = useCareer();
  const { user, isAuthenticated, isLoading, authError } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Global Search State
  const [jobs, setJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);

  // Fetch jobs data on mount for searching
  useEffect(() => {
    let active = true;
    const fetchJobsData = async () => {
      try {
        const data = await jobsAPI.getJobs();
        if (active && data && data.jobs) {
          setJobs(data.jobs);
        }
      } catch (err) {
        console.error('Failed to load active jobs for search:', err);
      }
    };
    if (isAuthenticated) {
      fetchJobsData();
    }
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="dashboard-layout-wrapper">
          <Sidebar />
          <div className="dashboard-main-area">
            <div className="dashboard-loading-screen">
              <div className="loading-spinner-box">
                <div className="spinner-orbit" />
                <p className="loading-text">Verifying secure session...</p>
              </div>
            </div>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (authError) {
    return (
      <ErrorBoundary>
        <div className="dashboard-loading-screen">
          <div className="loading-spinner-box">
            <p className="loading-text">Unable to verify your session. Please try again.</p>
            <button className="btn btn-accent" onClick={() => window.location.reload()}>
              Try again
            </button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (user && !user.email_verified) {
    return <Navigate to="/verify-email" state={{ email: user.email }} replace />;
  }

  if (!user?.profile_complete) {
    return <Navigate to="/profile/setup" state={{ from: location }} replace />;
  }

  const getPageTitle = (path) => {
    switch (path) {
      case '/dashboard': return 'Dashboard';
      case '/profile': return 'Candidate Profile';
      case '/resume-maker': return 'ATS Resume Maker';
      case '/ats-resume-maker': return 'ATS Resume Maker';
      case '/resume-analysis': return 'Resume Intelligence & ATS Analysis';
      case '/job-matching': return 'Job Matching Matrix';
      case '/job-recommendations': return 'Curated Job Recommendations';
      case '/skill-gaps': return 'Skill Gap Diagnostics';
      case '/assistant': return 'AI Career Assistant';
      case '/settings': return 'Platform & Account Settings';
      default: return 'Talent Agent AI';
    }
  };

  const displayName = getUserDisplayName(user, profile);
  const avatarInitials = getUserInitials(displayName);
  const avatarImage = getUserAvatarUrl(user, profile);

  // Search filter implementation
  const cleanQuery = searchQuery.trim().toLowerCase();

  let results = [];
  if (!cleanQuery) {
    // Default Quick Access tools
    results = tools.slice(0, 4); // Dashboard, Profile, Resume Maker, Resume Analysis
  } else {
    // Filter Tools
    const matchedTools = tools.filter(t => 
      t.name.toLowerCase().includes(cleanQuery) || 
      t.desc.toLowerCase().includes(cleanQuery)
    );

    // Filter Skills
    const matchedSkills = candidateSkills.filter(s => 
      s.name.toLowerCase().includes(cleanQuery) || 
      s.desc.toLowerCase().includes(cleanQuery)
    );

    // Filter Jobs
    const matchedJobs = (Array.isArray(jobs) ? jobs : []).filter(j => 
      (j.title || '').toLowerCase().includes(cleanQuery) ||
      (j.company || '').toLowerCase().includes(cleanQuery) ||
      (j.description || '').toLowerCase().includes(cleanQuery) ||
      (j.location || '').toLowerCase().includes(cleanQuery) ||
      (Array.isArray(j.requiredSkills) && j.requiredSkills.some(skill => (typeof skill === 'string' ? skill : (skill?.skill_name || '')).toLowerCase().includes(cleanQuery)))
    ).map(j => ({
      id: `job-${j.id}`,
      name: j.title || 'Job Opportunity',
      path: '/job-matching',
      category: 'Jobs',
      desc: `${j.company || 'Tech Company'} • ${j.location || 'Remote'}`
    }));

    results = [...matchedTools, ...matchedSkills, ...matchedJobs];
  }

  const handleKeyDown = (e) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        const item = results[selectedIndex];
        navigate(item.path);
        setIsDropdownOpen(false);
        setSearchQuery('');
        setSelectedIndex(-1);
        e.target.blur();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsDropdownOpen(false);
      setSelectedIndex(-1);
      e.target.blur();
    }
  };

  const handleItemClick = (path) => {
    navigate(path);
    setIsDropdownOpen(false);
    setSearchQuery('');
    setSelectedIndex(-1);
  };

  return (
    <ErrorBoundary>
      <div className="dashboard-layout-wrapper">
        <Sidebar />
        <div className="dashboard-main-area">
          {/* Top Header Navigation matching Reference UI */}
          <header className="dashboard-top-nav">
            <div className="top-nav-left">
              <h1 className="page-header-title">{getPageTitle(location.pathname)}</h1>
            </div>

            <div className="top-nav-right">
              {/* Search Bar container with dropdown */}
              <div className="search-bar-box" ref={searchContainerRef}>
                <Search size={15} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search jobs, skills, tools..."
                  className="top-search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                    setSelectedIndex(-1);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Real-time drop-down search list */}
                {isDropdownOpen && (
                  <div className="search-dropdown-menu">
                    {!cleanQuery && <div className="search-dropdown-section-title">Quick Access</div>}
                    {cleanQuery && results.length > 0 && <div className="search-dropdown-section-title">Matches</div>}

                    {results.length > 0 ? (
                      results.map((item, idx) => (
                        <div
                          key={item.id || item.name}
                          className={`search-dropdown-item ${selectedIndex === idx ? 'selected' : ''}`}
                          onClick={() => handleItemClick(item.path)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                        >
                          {getResultIcon(item.category, item.id)}
                          <div className="search-item-info">
                            <span className="search-item-name">{item.name}</span>
                            <span className="search-item-desc">{item.desc}</span>
                          </div>
                          <span className={`search-item-badge ${item.category.toLowerCase()}`}>
                            {item.category}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="search-empty-state">
                        <p className="search-empty-primary">No results found</p>
                        <p className="search-empty-secondary">Try searching for a job, skill, or career tool.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Readiness Score Badge */}
              <div className="readiness-pill-badge">
                <Sparkles size={13} className="pill-sparkle" />
                <span className="pill-label">Readiness:</span>
                <span className="pill-score">{normalizeReadiness(profileScore)}%</span>
              </div>

              {/* User Account Quick Link */}
              <Link to="/profile" className="top-user-chip" title="View Profile">
                <div className="top-avatar-wrap">
                  {avatarImage ? (
                    <img src={avatarImage} alt={displayName} className="top-avatar-photo" />
                  ) : (
                    <span className="top-avatar-text">{avatarInitials}</span>
                  )}
                </div>
                <span className="top-user-name">{displayName}</span>
              </Link>
            </div>
          </header>

          {/* Dynamic Page Content Protected by ErrorBoundary */}
          <main className="dashboard-content-body">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
