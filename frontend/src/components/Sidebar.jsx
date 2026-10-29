import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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

export const Sidebar = ({ isOpen = false, onClose }) => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const { profile } = useCareer();
  const navigate = useNavigate();

  const navGroups = [
    {
      label: '— career',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Profile', path: '/profile', icon: User },
        { label: 'Resume Maker', path: '/resume-maker', icon: Sparkles, badge: 'ATS v2.5' },
        { label: 'Job Matching', path: '/job-matching', icon: Briefcase, count: 3 },
        { label: 'Applications', path: '/applications', icon: Send },
        { label: 'Skill Gaps', path: '/skill-gaps', icon: Target },
        { label: 'AI Assistant', path: '/assistant', icon: MessageSquareCode }
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

  const handleLinkClick = () => {
    if (onClose) onClose();
  };

  const displayName = getUserDisplayName(user, profile);
  const displayRole = getUserRoleOrHeadline(user, profile);
  const avatarInitials = getUserInitials(displayName);
  const avatarImage = getUserAvatarUrl(user, profile);
  const displayEmail = typeof user?.email === 'string' ? user.email : (typeof profile?.email === 'string' ? profile.email : displayRole);
  const profilePercent = profile?.profile_completion !== undefined ? Number(profile.profile_completion) : (user?.profile_completion || 75);

  return (
    <>
      {isOpen && <div className="sidebar-mobile-backdrop" onClick={onClose} />}
      <aside className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-header">
          <NavLink to="/dashboard" className="sidebar-brand-link" onClick={handleLinkClick}>
            <img src="/logo.png" alt="Talent Agent AI" className="sidebar-logo-image" />
            <span className="brand-logo-text">
              TALENT AGENT
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
                      onClick={handleLinkClick}
                      className={({ isActive }) =>
                        `sidebar-nav-item ${isAssistant ? 'assistant-item' : ''} ${isActive ? 'active' : ''}`
                      }
                    >
                      <Icon size={17} className="item-icon" />
                      <span className="item-label">{item.label}</span>
                      {item.count && (
                        <span className="item-count-bubble">{item.count}</span>
                      )}
                      {item.badge && (
                        <span className="item-badge">{item.badge}</span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Utilities & User Account */}
        <div className="sidebar-bottom-utilities">
          <NavLink to="/settings" className="sidebar-utility-link" onClick={handleLinkClick}>
            <Settings size={16} />
            <span>Settings</span>
          </NavLink>
          {isAuthenticated && (
            <button onClick={handleLogout} className="sidebar-utility-link logout-btn" title="Sign Out">
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
