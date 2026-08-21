import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { User, Compass, Bell, ShieldCheck, Save, Check } from 'lucide-react';
import './Settings.css';

export const Settings = () => {
  const { user, profile, updateProfile } = useCareer();
  const [activeTab, setActiveTab] = useState('account');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Form State
  const [account, setAccount] = useState({
    name: profile.name,
    email: user.email,
    title: profile.title
  });

  const [preferences, setPreferences] = useState({
    targetRole: profile.preferences.targetRole,
    preferredLocation: profile.preferences.preferredLocation,
    workMode: profile.preferences.workMode,
    targetSalary: profile.preferences.targetSalary
  });

  const [notifications, setNotifications] = useState({
    emailMatches: true,
    weeklyReport: true,
    skillGapsReminders: false
  });

  const handleSave = (e) => {
    e.preventDefault();
    updateProfile({
      name: account.name,
      title: account.title,
      preferences: preferences
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="settings-page-wrapper">
      {/* Settings Navigation Tabs */}
      <div className="settings-tabs-bar">
        {[
          { id: 'account', label: 'Account', icon: User },
          { id: 'preferences', label: 'Career Preferences', icon: Compass },
          { id: 'notifications', label: 'Notifications', icon: Bell },
          { id: 'security', label: 'Security', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
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
            <Check size={16} /> Settings saved successfully!
          </div>
        )}

        {/* Tab 1: Account */}
        {activeTab === 'account' && (
          <div className="settings-section-pane">
            <h3 className="pane-title">Account Settings</h3>
            <p className="pane-sub">Manage your personal profile and display details.</p>

            <div className="form-group">
              <label className="input-label">Full Name</label>
              <input
                type="text"
                value={account.name}
                onChange={(e) => setAccount({ ...account, name: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Email Address</label>
              <input
                type="email"
                value={account.email}
                disabled
                className="input-field disabled"
              />
            </div>

            <div className="form-group">
              <label className="input-label">Professional Headline</label>
              <input
                type="text"
                value={account.title}
                onChange={(e) => setAccount({ ...account, title: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Tab 2: Career Preferences */}
        {activeTab === 'preferences' && (
          <div className="settings-section-pane">
            <h3 className="pane-title">Career Preferences</h3>
            <p className="pane-sub">Customize AI job matching criteria and search targets.</p>

            <div className="form-group">
              <label className="input-label">Target Role</label>
              <input
                type="text"
                value={preferences.targetRole}
                onChange={(e) => setPreferences({ ...preferences, targetRole: e.target.value })}
                className="input-field"
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">Preferred Location</label>
                <input
                  type="text"
                  value={preferences.preferredLocation}
                  onChange={(e) => setPreferences({ ...preferences, preferredLocation: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label">Work Mode</label>
                <select
                  value={preferences.workMode}
                  onChange={(e) => setPreferences({ ...preferences, workMode: e.target.value })}
                  className="input-field"
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="On-site">On-site</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="input-label">Target Salary Range</label>
              <input
                type="text"
                value={preferences.targetSalary}
                onChange={(e) => setPreferences({ ...preferences, targetSalary: e.target.value })}
                className="input-field"
              />
            </div>
          </div>
        )}

        {/* Tab 3: Notifications */}
        {activeTab === 'notifications' && (
          <div className="settings-section-pane">
            <h3 className="pane-title">Notification Preferences</h3>
            <p className="pane-sub">Choose when and how Talent Agent AI notifies you.</p>

            <div className="toggle-list">
              <div className="toggle-item">
                <div>
                  <div className="toggle-title">High-Match Job Alerts</div>
                  <div className="toggle-sub">Receive instant alerts when a role matches over 85% of your profile.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.emailMatches}
                  onChange={(e) => setNotifications({ ...notifications, emailMatches: e.target.checked })}
                  className="toggle-checkbox"
                />
              </div>

              <div className="toggle-item">
                <div>
                  <div className="toggle-title">Weekly Career Velocity Report</div>
                  <div className="toggle-sub">Summary of your skill progress, profile score trends, and market demand.</div>
                </div>
                <input
                  type="checkbox"
                  checked={notifications.weeklyReport}
                  onChange={(e) => setNotifications({ ...notifications, weeklyReport: e.target.checked })}
                  className="toggle-checkbox"
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Security */}
        {activeTab === 'security' && (
          <div className="settings-section-pane">
            <h3 className="pane-title">Security & Password</h3>
            <p className="pane-sub">Update your account password and security credentials.</p>

            <div className="form-group">
              <label className="input-label">Current Password</label>
              <input type="password" placeholder="••••••••••••" className="input-field" />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="input-label">New Password</label>
                <input type="password" placeholder="••••••••••••" className="input-field" />
              </div>
              <div className="form-group">
                <label className="input-label">Confirm New Password</label>
                <input type="password" placeholder="••••••••••••" className="input-field" />
              </div>
            </div>
          </div>
        )}

        <div className="settings-footer-row">
          <button type="submit" className="btn btn-accent hover-expand">
            <Save size={16} /> Save Settings
          </button>
        </div>
      </form>
    </div>
  );
};
