import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import {
  User,
  GraduationCap,
  Code,
  Briefcase,
  FolderGit2,
  Compass,
  Edit3,
  Save,
  Plus,
  Trash2,
  Check,
  Sparkles,
  MapPin,
  Mail,
  Phone,
  Clock,
  ExternalLink,
  X
} from 'lucide-react';
import { getUserDisplayName, getUserInitials, getUserAvatarUrl } from '../utils/userHelpers';
import './Profile.css';

export const Profile = () => {
  const { user } = useAuth();
  const {
    profile,
    skills,
    education,
    experience,
    projects,
    resume,
    profileCompletion,
    profileScore,
    updateProfile,
    addSkill,
    deleteSkill,
    addEducation,
    deleteEducation,
    addProject,
    deleteProject,
    addExperience,
    deleteExperience
  } = useCareer();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form State for Profile Details
  const [formData, setFormData] = useState({
    headline: '',
    phone: '',
    location: '',
    bio: '',
    career_goal: '',
    preferred_role: '',
    preferred_location: '',
    preferred_work_mode: 'Hybrid',
    years_experience: 0
  });

  // Modal / Form toggles for Add items
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill_name: '', proficiency: 80, skill_category: 'Technical' });

  const [showAddEdu, setShowAddEdu] = useState(false);
  const [newEdu, setNewEdu] = useState({ institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '' });

  const [showAddExp, setShowAddExp] = useState(false);
  const [newExp, setNewExp] = useState({ company: '', role: '', description: '', start_date: '', end_date: '', is_current: false });

  const [showAddProj, setShowAddProj] = useState(false);
  const [newProj, setNewProj] = useState({ title: '', description: '', technologies: '', project_url: '' });

  useEffect(() => {
    if (profile) {
      setFormData({
        headline: profile.headline || '',
        phone: profile.phone || '',
        location: profile.location || '',
        bio: profile.bio || '',
        career_goal: profile.career_goal || '',
        preferred_role: profile.preferred_role || '',
        preferred_location: profile.preferred_location || '',
        preferred_work_mode: profile.preferred_work_mode || 'Hybrid',
        years_experience: profile.years_experience || 0
      });
    }
  }, [profile]);

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.skill_name.trim()) return;
    try {
      await addSkill(newSkill);
      setNewSkill({ skill_name: '', proficiency: 80, skill_category: 'Technical' });
      setShowAddSkill(false);
    } catch (err) {
      console.error('Failed to add skill:', err);
    }
  };

  const handleCreateEdu = async (e) => {
    e.preventDefault();
    if (!newEdu.institution.trim() || !newEdu.degree.trim()) return;
    try {
      await addEducation(newEdu);
      setNewEdu({ institution: '', degree: '', field: '', start_year: '', end_year: '', grade: '' });
      setShowAddEdu(false);
    } catch (err) {
      console.error('Failed to add education:', err);
    }
  };

  const handleCreateExp = async (e) => {
    e.preventDefault();
    if (!newExp.company.trim() || !newExp.role.trim()) return;
    try {
      await addExperience(newExp);
      setNewExp({ company: '', role: '', description: '', start_date: '', end_date: '', is_current: false });
      setShowAddExp(false);
    } catch (err) {
      console.error('Failed to add experience:', err);
    }
  };

  const handleCreateProj = async (e) => {
    e.preventDefault();
    if (!newProj.title.trim()) return;
    try {
      await addProject(newProj);
      setNewProj({ title: '', description: '', technologies: '', project_url: '' });
      setShowAddProj(false);
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const displayName = getUserDisplayName(user, profile);
  const avatarInitials = getUserInitials(displayName);
  const avatarImage = getUserAvatarUrl(user, profile);

  return (
    <div className="profile-page-wrapper">
      {/* 1. TOP PROFILE HERO BANNER */}
      <div className="card profile-header-hero">
        <div className="hero-avatar-identity">
          <div className="profile-large-avatar">
            {avatarImage ? (
              <img src={avatarImage} alt={displayName} className="avatar-img-full" />
            ) : (
              <span className="avatar-initials-large">{avatarInitials}</span>
            )}
          </div>

          <div className="identity-details">
            <div className="identity-title-row">
              <h1 className="candidate-name">{displayName}</h1>
              <div className="readiness-score-tag">
                <Sparkles size={13} />
                <span>{profileScore || 75}% Readiness</span>
              </div>
            </div>

            <p className="candidate-headline">
              {profile?.headline || formData.headline || 'Software Engineering Professional'}
            </p>

            <div className="candidate-contact-chips">
              <span className="contact-chip">
                <Mail size={13} /> {user?.email || 'Candidate Account'}
              </span>
              {(profile?.location || formData.location) && (
                <span className="contact-chip">
                  <MapPin size={13} /> {profile?.location || formData.location}
                </span>
              )}
              {(profile?.phone || formData.phone) && (
                <span className="contact-chip">
                  <Phone size={13} /> {profile?.phone || formData.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="hero-action-buttons">
          <button
            type="button"
            onClick={() => (isEditing ? handleSaveProfile() : setIsEditing(true))}
            disabled={isSaving}
            className={`btn ${isEditing ? 'btn-primary' : 'btn-outline'}`}
          >
            {isEditing ? (
              <>
                <Save size={15} /> <span>{isSaving ? 'Saving...' : 'Save Profile'}</span>
              </>
            ) : (
              <>
                <Edit3 size={15} /> <span>Edit Details</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="profile-save-banner">
          <Check size={16} /> <span>Profile changes updated successfully!</span>
        </div>
      )}

      {/* 2. MAIN 2-COLUMN PROFILE CONTENT GRID */}
      <div className="profile-content-grid">
        {/* LEFT COLUMN: Personal, Career Preferences, Education */}
        <div className="profile-col-left">
          {/* Section: Professional Bio */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <User size={18} className="text-primary" />
                <h3 className="section-card-title">About & Summary</h3>
              </div>
            </div>

            {isEditing ? (
              <div className="form-group">
                <textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Summarize your professional engineering background, competencies, and goals..."
                  className="input-field textarea"
                />
              </div>
            ) : (
              <p className="profile-bio-text">
                {profile?.bio || 'No professional summary provided yet. Click "Edit Details" to add your bio.'}
              </p>
            )}
          </div>

          {/* Section: Career Preferences */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <Compass size={18} className="text-primary" />
                <h3 className="section-card-title">Career Preferences</h3>
              </div>
            </div>

            {isEditing ? (
              <div className="form-stack">
                <div className="form-group">
                  <label className="input-label">Target Role</label>
                  <input
                    type="text"
                    value={formData.preferred_role}
                    onChange={(e) => setFormData({ ...formData, preferred_role: e.target.value })}
                    placeholder="e.g. Lead Architect / Senior Full Stack Engineer"
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Preferred Location</label>
                  <input
                    type="text"
                    value={formData.preferred_location}
                    onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                    placeholder="e.g. Remote / San Francisco, CA"
                    className="input-field"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Work Mode</label>
                    <select
                      value={formData.preferred_work_mode}
                      onChange={(e) => setFormData({ ...formData, preferred_work_mode: e.target.value })}
                      className="input-field select"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="input-label">Years Experience</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="meta-keyvalue-list">
                <div className="keyvalue-row">
                  <span className="key-label">Target Role:</span>
                  <span className="val-text">{profile?.preferred_role || 'Not specified'}</span>
                </div>
                <div className="keyvalue-row">
                  <span className="key-label">Preferred Location:</span>
                  <span className="val-text">{profile?.preferred_location || profile?.location || 'Remote'}</span>
                </div>
                <div className="keyvalue-row">
                  <span className="key-label">Work Mode:</span>
                  <span className="val-text">{profile?.preferred_work_mode || 'Hybrid'}</span>
                </div>
                <div className="keyvalue-row">
                  <span className="key-label">Experience:</span>
                  <span className="val-text">{profile?.years_experience || 0} Years</span>
                </div>
              </div>
            )}
          </div>

          {/* Section: Education */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <GraduationCap size={18} className="text-primary" />
                <h3 className="section-card-title">Education</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEdu(!showAddEdu)}
                className="btn-add-item-sm"
              >
                <Plus size={14} /> <span>Add Degree</span>
              </button>
            </div>

            {showAddEdu && (
              <form onSubmit={handleCreateEdu} className="add-subform-box">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Institution / University (e.g. Stanford University)"
                    value={newEdu.institution}
                    onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Degree (e.g. B.S. in Computer Science)"
                    value={newEdu.degree}
                    onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Field of Study (e.g. Software Engineering)"
                    value={newEdu.field}
                    onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Start Year (e.g. 2018)"
                    value={newEdu.start_year}
                    onChange={(e) => setNewEdu({ ...newEdu, start_year: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Graduation Year (e.g. 2022)"
                    value={newEdu.end_year}
                    onChange={(e) => setNewEdu({ ...newEdu, end_year: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="subform-actions">
                  <button type="button" onClick={() => setShowAddEdu(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Degree</button>
                </div>
              </form>
            )}

            <div className="items-list-container">
              {education && education.length > 0 ? (
                education.map((edu) => (
                  <div key={edu.id} className="list-entry-item">
                    <div className="entry-main-info">
                      <h4 className="entry-title">{edu.degree}</h4>
                      <span className="entry-subtitle">{edu.institution}</span>
                      {edu.field && <span className="entry-field-tag">{edu.field}</span>}
                      {(edu.start_year || edu.end_year) && (
                        <span className="entry-meta-date">
                          {edu.start_year ? `${edu.start_year} – ` : ''}{edu.end_year || 'Present'}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteEducation(edu.id)}
                      className="btn-delete-entry"
                      title="Delete education record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-section-hint">No education records added yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Skills, Experience, Projects */}
        <div className="profile-col-right">
          {/* Section: Skills & Competencies */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <Code size={18} className="text-primary" />
                <h3 className="section-card-title">Skills & Proficiencies ({skills.length})</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddSkill(!showAddSkill)}
                className="btn-add-item-sm"
              >
                <Plus size={14} /> <span>Add Skill</span>
              </button>
            </div>

            {showAddSkill && (
              <form onSubmit={handleCreateSkill} className="add-subform-box">
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Skill name (e.g. TypeScript, Docker, React)"
                    value={newSkill.skill_name}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                    className="input-field"
                    required
                  />
                  <select
                    value={newSkill.skill_category}
                    onChange={(e) => setNewSkill({ ...newSkill, skill_category: e.target.value })}
                    className="input-field select"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Framework">Framework / Library</option>
                    <option value="Cloud">Cloud & DevOps</option>
                    <option value="Database">Database</option>
                  </select>
                </div>
                <div className="subform-actions">
                  <button type="button" onClick={() => setShowAddSkill(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Add Skill</button>
                </div>
              </form>
            )}

            <div className="skills-badge-wrap">
              {skills && skills.length > 0 ? (
                skills.map((s) => (
                  <div key={s.id || s.skill_name} className="skill-tag-pill">
                    <span className="skill-name-str">{s.skill_name}</span>
                    {s.proficiency && <span className="skill-pct-str">{s.proficiency}%</span>}
                    <button
                      type="button"
                      onClick={() => deleteSkill(s.id)}
                      className="skill-remove-x"
                      title="Remove skill"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-section-hint">No skills recorded yet. Add your key proficiencies to calculate job matches.</p>
              )}
            </div>
          </div>

          {/* Section: Experience */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <Briefcase size={18} className="text-primary" />
                <h3 className="section-card-title">Professional Experience</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddExp(!showAddExp)}
                className="btn-add-item-sm"
              >
                <Plus size={14} /> <span>Add Role</span>
              </button>
            </div>

            {showAddExp && (
              <form onSubmit={handleCreateExp} className="add-subform-box">
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Company (e.g. Stripe, Horizon Cloud)"
                    value={newExp.company}
                    onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                    className="input-field"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Role Title (e.g. Senior Frontend Architect)"
                    value={newExp.role}
                    onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>
                <div className="form-grid-2">
                  <input
                    type="text"
                    placeholder="Start Date (e.g. 2021)"
                    value={newExp.start_date}
                    onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="End Date (or 'Present')"
                    value={newExp.end_date}
                    onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <textarea
                  rows={3}
                  placeholder="Key contributions and achievements..."
                  value={newExp.description}
                  onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                  className="input-field textarea"
                />
                <div className="subform-actions">
                  <button type="button" onClick={() => setShowAddExp(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Experience</button>
                </div>
              </form>
            )}

            <div className="items-list-container">
              {experience && experience.length > 0 ? (
                experience.map((exp) => (
                  <div key={exp.id} className="list-entry-item">
                    <div className="entry-main-info">
                      <h4 className="entry-title">{exp.role}</h4>
                      <span className="entry-subtitle">{exp.company}</span>
                      {(exp.start_date || exp.end_date) && (
                        <span className="entry-meta-date">
                          {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date || 'Present'}
                        </span>
                      )}
                      {exp.description && <p className="entry-body-desc">{exp.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteExperience(exp.id)}
                      className="btn-delete-entry"
                      title="Delete experience record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-section-hint">No experience entries recorded yet.</p>
              )}
            </div>
          </div>

          {/* Section: Projects */}
          <div className="card profile-section-card">
            <div className="section-card-header">
              <div className="section-title-wrap">
                <FolderGit2 size={18} className="text-primary" />
                <h3 className="section-card-title">Featured Projects</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddProj(!showAddProj)}
                className="btn-add-item-sm"
              >
                <Plus size={14} /> <span>Add Project</span>
              </button>
            </div>

            {showAddProj && (
              <form onSubmit={handleCreateProj} className="add-subform-box">
                <input
                  type="text"
                  placeholder="Project Title (e.g. Distributed Analytics Engine)"
                  value={newProj.title}
                  onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                  className="input-field"
                  required
                />
                <input
                  type="text"
                  placeholder="Technologies Used (e.g. React, Python, PostgreSQL)"
                  value={newProj.technologies}
                  onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                  className="input-field"
                />
                <input
                  type="text"
                  placeholder="Project URL (e.g. https://github.com/user/project)"
                  value={newProj.project_url}
                  onChange={(e) => setNewProj({ ...newProj, project_url: e.target.value })}
                  className="input-field"
                />
                <textarea
                  rows={2}
                  placeholder="Project summary and architecture highlights..."
                  value={newProj.description}
                  onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                  className="input-field textarea"
                />
                <div className="subform-actions">
                  <button type="button" onClick={() => setShowAddProj(false)} className="btn btn-ghost btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save Project</button>
                </div>
              </form>
            )}

            <div className="items-list-container">
              {projects && projects.length > 0 ? (
                projects.map((proj) => (
                  <div key={proj.id} className="list-entry-item">
                    <div className="entry-main-info">
                      <div className="proj-title-row">
                        <h4 className="entry-title">{proj.title}</h4>
                        {proj.project_url && (
                          <a
                            href={proj.project_url}
                            target="_blank"
                            rel="noreferrer"
                            className="proj-ext-link"
                            title="Open project link"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                      {proj.technologies && <span className="entry-field-tag">{proj.technologies}</span>}
                      {proj.description && <p className="entry-body-desc">{proj.description}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteProject(proj.id)}
                      className="btn-delete-entry"
                      title="Delete project record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              ) : (
                <p className="empty-section-hint">No featured projects added yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
