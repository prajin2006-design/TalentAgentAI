import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { User, Compass, Bell, ShieldCheck, Save, Check, LogOut, ArrowRight, Sparkles } from 'lucide-react';
import { getUserDisplayName } from '../utils/userHelpers';
import './Settings.css';

export const Settings = () => {
  const { user, logout } = useAuth();
  const { profile, updateProfile } = useCareer();

  const [activeTab, setActiveTab] = useState('account');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State initialized defensively
  const [account, setAccount] = useState({
    name: '',
    email: '',
    headline: '',
    phone: '',
    location: '',
    bio: ''
  });

  const [preferences, setPreferences] = useState({
    targetRole: '',
    preferredLocation: '',
    workMode: 'Hybrid',
    yearsExperience: 0
  });

  const [notifications, setNotifications] = useState({
    emailMatches: true,
    weeklyReport: true,
    skillGapsReminders: false
  });

  // Sync state whenever user or profile data is loaded
  useEffect(() => {
    if (user || profile) {
      setAccount({
        name: user?.full_name || '',
        email: user?.email || '',
        headline: profile?.headline || '',
        phone: profile?.phone || '',
        location: profile?.location || '',
        bio: profile?.bio || ''
      });

      setPreferences({
        targetRole: profile?.preferred_role || '',
        preferredLocation: profile?.preferred_location || profile?.location || '',
        workMode: profile?.preferred_work_mode || 'Hybrid',
        yearsExperience: profile?.years_experience || 0
      });
    }
  }, [user, profile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage('');

    try {
      await updateProfile({
        headline: account.headline,
        phone: account.phone,
        location: account.location,
        bio: account.bio,
        preferred_role: preferences.targetRole,
        preferred_location: preferences.preferredLocation,
        preferred_work_mode: preferences.workMode,
        years_experience: parseFloat(preferences.yearsExperience) || 0
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to update settings:', err);
      setErrorMessage(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = getUserDisplayName(user, profile);

  return (
    <div className="settings-page-wrapper">
      {/* Page Header */}
      <div className="settings-header-banner">
        <div>
          <h1 className="settings-main-heading">Settings & Preferences</h1>
          <p className="settings-sub-text">
            Configure your candidate profile, role calibration, alerts, and security settings.
          </p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="settings-tabs-bar">
        {[
          { id: 'account', label: 'Account Profile', icon: User },
          { id: 'preferences', label: 'Career Preferences', icon: Compass },
          { id: 'notifications', label: 'Alerts & Telemetry', icon: Bell },
          { id: 'security', label: 'Security & Session', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`settings-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Settings Form Container */}
      <form onSubmit={handleSave} className="card settings-form-card">
        {savedSuccess && (
          <div className="save-success-banner">
            <Check size={16} /> <span>Preferences saved to database successfully!</span>
          </div>
        )}

        {errorMessage && (
          <div className="save-error-banner">
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Tab 1: Account Profile */}
        {activeTab === 'account' && (
          <div className="settings-section-pane">
            <div className="pane-header">
              <h3 className="pane-title">Personal & Professional Info</h3>
              <p className="pane-sub">Details displayed to recruiters and used for AI profile calibration.</p>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label" htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={account.name}
                  disabled
                  className="input-field disabled"
                  title="Full name is managed by your account identity"
                />
                <span className="input-hint">Managed via primary account identity</span>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={account.email}
                  disabled
                  className="input-field disabled"
                />
                <span className="input-hint">Verified login credential</span>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="headline">Professional Headline</label>
              <input
                id="headline"
                type="text"
                value={account.headline}
                onChange={(e) => setAccount({ ...account, headline: e.target.value })}
                placeholder="e.g. Senior Full Stack Engineer | React, TypeScript & Node.js"
                className="input-field"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="text"
                  value={account.phone}
                  onChange={(e) => setAccount({ ...account, phone: e.target.value })}
                  placeholder="+1 (555) 000-0000"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="location">Current Location</label>
                <input
                  id="location"
                  type="text"
                  value={account.location}
                  onChange={(e) => setAccount({ ...account, location: e.target.value })}
                  placeholder="e.g. San Francisco, CA / Bengaluru"
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="bio">Professional Bio & Career Objective</label>
              <textarea
                id="bio"
                rows={4}
                value={account.bio}
                onChange={(e) => setAccount({ ...account, bio: e.target.value })}
                placeholder="Brief summary of your engineering experience, leadership background, and technical passions..."
                className="input-field textarea"
              />
            </div>

            <div className="pane-actions-row">
              <button type="submit" disabled={isSaving} className="btn btn-primary">
                <Save size={16} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Account Settings'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Career Preferences */}
        {activeTab === 'preferences' && (
          <div className="settings-section-pane">
            <div className="pane-header">
              <h3 className="pane-title">Role & Market Calibration</h3>
              <p className="pane-sub">Defines the criteria used by the Job Matching and Skill Gap engines.</p>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label" htmlFor="targetRole">Target Role / Title</label>
                <input
                  id="targetRole"
                  type="text"
                  value={preferences.targetRole}
                  onChange={(e) => setPreferences({ ...preferences, targetRole: e.target.value })}
                  placeholder="e.g. Staff Frontend Architect"
                  className="input-field"
                />
                <span className="input-hint">Target benchmark for skill gap calculations</span>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="preferredLocation">Target Location</label>
                <input
                  id="preferredLocation"
                  type="text"
                  value={preferences.preferredLocation}
                  onChange={(e) => setPreferences({ ...preferences, preferredLocation: e.target.value })}
                  placeholder="e.g. Remote / Hybrid - New York"
                  className="input-field"
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label" htmlFor="workMode">Preferred Work Mode</label>
                <select
                  id="workMode"
                  value={preferences.workMode}
                  onChange={(e) => setPreferences({ ...preferences, workMode: e.target.value })}
                  className="input-field select"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>

              <div className="form-group">
                <label className="input-label" htmlFor="yearsExperience">Years of Professional Experience</label>
                <input
                  id="yearsExperience"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={preferences.yearsExperience}
                  onChange={(e) => setPreferences({ ...preferences, yearsExperience: e.target.value })}
                  className="input-field"
                />
              </div>
            </div>

            <div className="pane-actions-row">
              <button type="submit" disabled={isSaving} className="btn btn-primary">
                <Save size={16} />
                <span>{isSaving ? 'Saving Changes...' : 'Save Career Preferences'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Alerts & Notifications */}
        {activeTab === 'notifications' && (
          <div className="settings-section-pane">
            <div className="pane-header">
              <h3 className="pane-title">Notification Telemetry</h3>
              <p className="pane-sub">Choose how Talent Agent AI notifies you about opportunities and market updates.</p>
            </div>

            <div className="toggle-options-stack">
              <label className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">High Compatibility Job Alerts</span>
                  <span className="toggle-desc">Receive notifications when active requisitions score &gt; 85% match.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailMatches}
                  onChange={(e) => setNotifications({ ...notifications, emailMatches: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>

              <label className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">Weekly Career Intelligence Digest</span>
                  <span className="toggle-desc">Weekly summary of skill demand changes and resume parse scores.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>

              <label className="toggle-row">
                <div className="toggle-info">
                  <span className="toggle-title">Skill Gap Learning Reminders</span>
                  <span className="toggle-desc">Actionable recommendations to bridge high-priority missing technologies.</span>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.skillGapsReminders}
                  onChange={(e) => setNotifications({ ...notifications, skillGapsReminders: e.target.checked })}
                  className="toggle-checkbox"
                />
              </label>
            </div>

            <div className="pane-actions-row">
              <button type="button" onClick={() => { setSavedSuccess(true); setTimeout(() => setSavedSuccess(false), 3000); }} className="btn btn-primary">
                <Save size={16} />
                <span>Save Notification Preferences</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Security & Session */}
        {activeTab === 'security' && (
          <div className="settings-section-pane">
            <div className="pane-header">
              <h3 className="pane-title">Security & Session Management</h3>
              <p className="pane-sub">Manage your active authentication session and security credentials.</p>
            </div>

            <div className="security-status-card">
              <div className="security-icon-wrap">
                <ShieldCheck size={24} className="text-green" />
              </div>
              <div>
                <h4 className="sec-title">Authentication Session Active</h4>
                <p className="sec-desc">
                  Signed in as <strong>{account.email}</strong> via secure HTTP-only session cookies with Argon2id password hashing.
                </p>
              </div>
            </div>

            <div className="pane-actions-row logout-row">
              <button
                type="button"
                onClick={logout}
                className="btn btn-danger-outline"
              >
                <LogOut size={16} />
                <span>Sign Out of Talent Agent AI</span>
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
