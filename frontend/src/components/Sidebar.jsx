import React from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  Sparkles,
  Target,
  MessageSquareCode,
  Settings,
  ShieldCheck,
  LogOut,
  LogIn,
  Send,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import {
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  getUserRoleOrHeadline
} from '../utils/userHelpers';
import './Sidebar.css';

export const Sidebar = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { profile } = useCareer();
  const navigate = useNavigate();

  const navGroups = [
    {
      label: 'MAIN',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Profile', path: '/profile', icon: User },
        { label: 'Resume Maker', path: '/resume-maker', icon: Sparkles, badge: 'ATS v2.5' },
        { label: 'Resume Analysis', path: '/resume-analysis', icon: FileText }
      ]
    },
    {
      label: 'CAREER INTELLIGENCE',
      items: [
        { label: 'Job Matching', path: '/job-matching', icon: Briefcase },
        { label: 'Applications', path: '/applications', icon: Send },
        { label: 'Skill Gaps', path: '/skill-gaps', icon: Target },
        { label: 'Interview Prep', path: '/interview', icon: Award },
        { label: 'AI Assistant', path: '/assistant', icon: MessageSquareCode }
      ]
    },
    {
      label: 'ACCOUNT',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings },
        ...(user?.role === 'admin'
          ? [{ label: 'Admin Panel', path: '/admin', icon: ShieldCheck }]
          : [])
      ]
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error('Logout error:', e);
    } finally {
      navigate('/login');
    }
  };

  const displayName = getUserDisplayName(user, profile);
  const displayRole = getUserRoleOrHeadline(user, profile);
  const avatarInitials = getUserInitials(displayName);
  const avatarImage = getUserAvatarUrl(user, profile);
  const displayEmail = typeof user?.email === 'string' ? user.email : (typeof profile?.email === 'string' ? profile.email : displayRole);
  const profilePercent = profile?.profile_completion !== undefined ? Number(profile.profile_completion) : (user?.profile_completion || 75);

  return (
    <aside className="sidebar-container">
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <NavLink to="/dashboard" className="sidebar-brand-link">
          <div className="brand-logo-icon">
            <Sparkles size={16} />
          </div>
          <span className="brand-logo-text">
            TALENT AGENT <span className="brand-logo-ai">AI</span>
          </span>
        </NavLink>
      </div>

      {/* Grouped Navigation Links */}
      <nav className="sidebar-navigation">
        {navGroups.map((group) => (
          <div key={group.label} className="nav-group-section">
            <span className="nav-group-heading">{group.label}</span>
            <div className="nav-group-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isAssistant = item.path === '/assistant';
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `sidebar-nav-item ${isAssistant ? 'assistant-item' : ''} ${isActive ? (isAssistant ? 'active-assistant' : 'active') : ''}`
                    }
                  >
                    <Icon size={17} className="item-icon" />
                    <span className="item-label">{item.label}</span>
                    {isAssistant && (
                      <span className="assistant-live-dot" title="AI Active" />
                    )}
                    {item.badge && !isAssistant && <span className="item-badge">{item.badge}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Footer Profile */}
      <div className="sidebar-account-footer">
        {isLoading ? (
          <div className="sidebar-skeleton-row" aria-label="Loading profile...">
            <div className="skeleton-avatar" />
            <div className="skeleton-lines">
              <div className="skeleton-line title" />
              <div className="skeleton-line sub" />
            </div>
          </div>
        ) : isAuthenticated && user ? (
          <div className="user-profile-card">
            <div className="user-avatar-element" title={displayName}>
              {avatarImage ? (
                <img
                  src={avatarImage}
                  alt={displayName}
                  className="user-avatar-photo"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <span className="avatar-initials">{avatarInitials}</span>
              )}
            </div>
            <div className="user-meta-details">
              <div className="user-display-name" title={displayName}>{displayName}</div>
              <div className="user-display-email" title={displayEmail}>
                {displayEmail}
              </div>
              <div className="sidebar-completion-bar-wrap" title={`Profile completion: ${profilePercent}%`}>
                <div className="sidebar-completion-bar-bg">
                  <div className="sidebar-completion-bar-fill" style={{ width: `${Math.min(100, Math.max(10, profilePercent))}%` }} />
                </div>
                <span className="sidebar-completion-text">{profilePercent}%</span>
              </div>
            </div>
            <button onClick={handleLogout} className="btn-sidebar-logout" title="Sign Out" aria-label="Sign Out">
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <div className="sidebar-guest-view">
            <div className="user-avatar-element guest">
              <User size={16} />
            </div>
            <div className="user-meta-details">
              <div className="user-display-name">Candidate</div>
              <div className="user-display-email">Not signed in</div>
            </div>
            <Link to="/login" className="btn-sidebar-login" title="Sign In">
              <LogIn size={16} />
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
