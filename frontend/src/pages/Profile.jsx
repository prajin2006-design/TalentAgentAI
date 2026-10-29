import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import {
  Briefcase,
  Star,
  Sparkles,
  ArrowRight,
  Edit3,
  Settings as SettingsIcon,
  MapPin,
  Mail,
  Phone,
  Clock,
  Plus,
  Trash2,
  Save,
  Check,
  ExternalLink,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  FolderGit2,
  CheckCircle2,
  Activity,
  User
} from 'lucide-react';
import {
  getUserDisplayName,
  getUserInitials,
  getUserAvatarUrl,
  normalizeReadiness
} from '../utils/userHelpers';
import './Profile.css';

// Technical domain categorization
const getSkillCategory = (skill) => {
  const name = (typeof skill === 'string' ? skill : (skill?.skill_name || skill?.name || skill?.skill || '')).toLowerCase();
  const explicit = skill?.skill_category;
  if (explicit && explicit !== 'Technical' && explicit !== 'General') return explicit;

  const designKeywords = ['framer', 'rive', 'photoshop', 'illustrator', 'indesign', 'figma', 'ui', 'ux', 'typography', 'color theory', 'layout', 'branding', 'sketch', 'design', 'graphic', 'wirefram', 'prototyp'];
  const frontendKeywords = ['react', 'typescript', 'javascript', 'vue', 'angular', 'next', 'html', 'css', 'tailwind', 'redux', 'svelte'];
  const backendKeywords = ['python', 'node', 'flask', 'express', 'django', 'fastapi', 'java', 'golang', 'c#', 'c++', 'ruby', 'php', 'rust', 'api', 'rest', 'graphql'];
  const dataCloudKeywords = ['sql', 'mysql', 'postgres', 'mongodb', 'docker', 'aws', 'gemini', 'azure', 'gcp', 'kubernetes', 'redis', 'database', 'ai', 'ml', 'machine learning', 'cloud'];

  if (designKeywords.some((k) => name.includes(k))) return 'Design & UI';
  if (frontendKeywords.some((k) => name.includes(k))) return 'Frontend';
  if (backendKeywords.some((k) => name.includes(k))) return 'Backend';
  if (dataCloudKeywords.some((k) => name.includes(k))) return 'Cloud & DB';
  return 'Core Systems';
};

export const Profile = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    profile,
    skills,
    education,
    experience,
    projects,
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
    deleteExperience,
    runAiAnalysis,
    isAnalyzing
  } = useCareer();

  // Modal / Drawer state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Expandable Credentials Section
  const [isCredentialsExpanded, setIsCredentialsExpanded] = useState(false);

  // Skills filter and search state
  const [skillSearch, setSkillSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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

  // Inline item creation forms
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState({ skill_name: '', proficiency: 85, skill_category: 'Technical' });

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
        years_experience: profile.years_experience !== undefined ? profile.years_experience : 0
      });
    }
  }, [profile]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      setToastMessage('');
    }, 3500);
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      setIsEditModalOpen(false);
      showToast('Profile specifications updated successfully.');
    } catch (err) {
      console.error('Failed to update profile:', err);
      showToast('Failed to save profile specifications.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSkill = async (e) => {
    e.preventDefault();
    if (!newSkill.skill_name.trim()) return;
    try {
      await addSkill(newSkill);
      setNewSkill({ skill_name: '', proficiency: 85, skill_category: 'Technical' });
      setShowAddSkill(false);
      showToast('Skill added to profile.');
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
      showToast('Academic credential added.');
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
      showToast('Work experience logged.');
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
      showToast('Project logged.');
    } catch (err) {
      console.error('Failed to add project:', err);
    }
  };

  const handleRunScan = async () => {
    if (runAiAnalysis) {
      try {
        await runAiAnalysis();
        showToast('AI profile audit complete. Readiness synchronized.');
      } catch (err) {
        console.error('AI scan error:', err);
      }
    }
  };

  const displayName = getUserDisplayName(user, profile);
  const avatarInitials = getUserInitials(displayName);
  const avatarImage = getUserAvatarUrl(user, profile);
  const readinessValue = normalizeReadiness(profileScore || profile?.readiness_score || 82);
  const completionValue = normalizeReadiness(profileCompletion || 75);

  // Categorized and filtered skills
  const skillsList = Array.isArray(skills) ? skills : [];
  
  const categories = useMemo(() => {
    const set = new Set();
    skillsList.forEach((s) => set.add(getSkillCategory(s)));
    return ['ALL', ...Array.from(set)];
  }, [skillsList]);

  const filteredSkills = useMemo(() => {
    return skillsList.filter((s) => {
      const name = typeof s === 'string' ? s : (s?.skill_name || s?.name || s?.skill || '');
      const matchSearch = !skillSearch.trim() || name.toLowerCase().includes(skillSearch.toLowerCase());
      const cat = getSkillCategory(s);
      const matchCategory = selectedCategory === 'ALL' || cat === selectedCategory;
      return matchSearch && matchCategory;
    });
  }, [skillsList, skillSearch, selectedCategory]);

  // Target role display
  const currentRole = profile?.preferred_role || formData.preferred_role || 'Software Engineer';
  const headlineDisplay = profile?.headline || formData.headline || currentRole;
  const locationDisplay = profile?.location || formData.location || 'Salem, Tamil Nadu';

  return (
    <div className="ref-profile-page-wrapper">
      {/* Toast Notification */}
      {saveSuccess && (
        <div className="ref-toast-pill" role="status">
          <span className="toast-dot"></span>
          <span className="toast-text">{toastMessage || 'PROFILE UPDATED SUCCESSFULLY'}</span>
        </div>
      )}

      {/* ====================================================================
          REFERENCE-BASED LAYERED PROFILE HERO SECTION
          Composition:
          - Tall rounded decorative panel (Electric Orange) behind card, offset left
          - Wide centered profile card with orange cover area
          - Overlapping circular avatar
          - Left identity + Right role & skills
          - 2 Action buttons (Edit Profile, Settings)
          - 3 Bottom info cards (Ready for work, Job Matches, Update)
          ==================================================================== */}
      <div className="ref-profile-stage-container">
        {/* Decorative Background Panel (Electric Orange, rounded rectangle offset to left) */}
        <div className="ref-bg-decorative-panel" aria-hidden="true"></div>

        {/* Main Layered Profile Card */}
        <div className="ref-profile-card">
          {/* 1. Profile Cover Area */}
          <div className="ref-profile-cover">
            {/* Cover Edit Action (Top Right Pen Icon) */}
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="ref-cover-edit-btn"
              title="Edit Profile"
              aria-label="Edit Profile"
            >
              <Edit3 size={17} />
            </button>
          </div>

          {/* 2. Overlapping Circular Avatar */}
          <div className="ref-avatar-overlap-wrapper">
            <div className="ref-avatar-circle">
              {avatarImage ? (
                <img src={avatarImage} alt={displayName} className="ref-avatar-img" />
              ) : (
                <span className="ref-avatar-monogram">{avatarInitials}</span>
              )}
            </div>
          </div>

          {/* 3. Profile Identity & Role/Skills Split Section */}
          <div className="ref-profile-info-grid">
            {/* Left Identity Column */}
            <div className="ref-identity-col">
              <h1 className="ref-candidate-name">{displayName}</h1>
              <p className="ref-candidate-title">{headlineDisplay}</p>
              <p className="ref-candidate-location">{locationDisplay}</p>

              {/* Action Buttons */}
              <div className="ref-action-buttons-row">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="ref-btn-primary"
                >
                  Edit Profile
                </button>
                <Link to="/settings" className="ref-btn-secondary">
                  Settings
                </Link>
              </div>
            </div>

            {/* Right Column: Current Role & Skills */}
            <div className="ref-role-skills-col">
              {/* Current Role Block */}
              <div className="ref-meta-block">
                <div className="ref-meta-header">
                  <span>Current role</span>
                  <Briefcase size={15} className="ref-meta-icon" />
                </div>
                <div className="ref-role-badge">
                  {currentRole}
                </div>
              </div>

              {/* Skills Block */}
              <div className="ref-meta-block">
                <div className="ref-meta-header">
                  <span>Skills</span>
                  <Star size={15} className="ref-meta-icon" />
                </div>
                <div className="ref-skills-tags-wrap">
                  {skillsList && skillsList.length > 0 ? (
                    skillsList.slice(0, 8).map((skill, sIdx) => {
                      const name = typeof skill === 'string' ? skill : (skill?.skill_name || skill?.name || skill?.skill || '');
                      return (
                        <span key={sIdx} className="ref-skill-tag">
                          {name}
                        </span>
                      );
                    })
                  ) : (
                    <>
                      <span className="ref-skill-tag">React</span>
                      <span className="ref-skill-tag">JavaScript</span>
                      <span className="ref-skill-tag">Figma</span>
                      <span className="ref-skill-tag">UI Design</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Three Bottom Information Cards */}
          <div className="ref-bottom-cards-grid">
            {/* Card 1: Ready for work (Career Readiness) */}
            <div
              className="ref-info-card"
              onClick={handleRunScan}
              title="Click to synchronize readiness score"
            >
              <div className="ref-info-card-text">
                <h3 className="ref-info-card-title">Ready for work</h3>
                <p className="ref-info-card-sub">
                  Show recruiters that you're ready for work.
                </p>
              </div>
              <button
                type="button"
                className="ref-card-arrow-btn"
                aria-label="Audit readiness score"
              >
                <ArrowRight size={15} />
              </button>
            </div>

            {/* Card 2: Job Matches */}
            <Link to="/matching" className="ref-info-card ref-info-card-link">
              <div className="ref-info-card-text">
                <h3 className="ref-info-card-title">Job Matches</h3>
                <p className="ref-info-card-sub">
                  Explore curated AI-matched positions for your profile.
                </p>
              </div>
              <div className="ref-card-arrow-btn">
                <ArrowRight size={15} />
              </div>
            </Link>

            {/* Card 3: Update / ATS Resume */}
            <div
              className="ref-info-card"
              onClick={() => setIsEditModalOpen(true)}
              title="Update profile details"
            >
              <div className="ref-info-card-text">
                <h3 className="ref-info-card-title">Update</h3>
                <p className="ref-info-card-sub">
                  Keep your profile updated so that recruiters know you better.
                </p>
              </div>
              <button
                type="button"
                className="ref-card-arrow-btn"
                aria-label="Open profile update modal"
              >
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ====================================================================
          DETAILED CREDENTIALS & PORTFOLIO DRAWER
          Preserves full access to Work Experience, Education, Projects &
          Skills Management while maintaining reference layout dominance
          ==================================================================== */}
      <div className="ref-credentials-accordion">
        <button
          type="button"
          onClick={() => setIsCredentialsExpanded(!isCredentialsExpanded)}
          className="ref-accordion-toggle-btn"
        >
          <div className="toggle-left-info">
            <Layers size={18} className="text-orange-accent" />
            <span className="toggle-title">Credentials, Experience & Portfolio Registry</span>
            <span className="toggle-badge">
              {experience.length} Exp · {education.length} Edu · {projects.length} Proj · {skillsList.length} Skills
            </span>
          </div>
          <div className="toggle-right-icon">
            {isCredentialsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </button>

        {isCredentialsExpanded && (
          <div className="ref-credentials-content-body animate-slide-down">
            {/* Experience Section */}
            <div className="ref-sub-section-card">
              <div className="ref-sub-section-header">
                <div className="sub-header-title-row">
                  <Briefcase size={18} />
                  <h3>Work Experience</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddExp(!showAddExp)}
                  className="ref-add-item-btn"
                >
                  <Plus size={14} /> Add Experience
                </button>
              </div>

              {showAddExp && (
                <form onSubmit={handleCreateExp} className="ref-item-form-drawer">
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Company Name *"
                      value={newExp.company}
                      onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Job Title / Role *"
                      value={newExp.role}
                      onChange={(e) => setNewExp({ ...newExp, role: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                  </div>
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Start Date (e.g. Jan 2024)"
                      value={newExp.start_date}
                      onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                      className="ref-drawer-input"
                    />
                    <input
                      type="text"
                      placeholder="End Date (e.g. Present)"
                      value={newExp.end_date}
                      onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                      className="ref-drawer-input"
                    />
                  </div>
                  <textarea
                    placeholder="Description of duties, achievements and impact..."
                    rows={3}
                    value={newExp.description}
                    onChange={(e) => setNewExp({ ...newExp, description: e.target.value })}
                    className="ref-drawer-textarea"
                  />
                  <div className="drawer-actions-row">
                    <button type="button" onClick={() => setShowAddExp(false)} className="ref-btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="ref-btn-submit">
                      Save Experience
                    </button>
                  </div>
                </form>
              )}

              <div className="ref-items-list">
                {experience && experience.length > 0 ? (
                  experience.map((exp, xIdx) => (
                    <div key={exp.id || xIdx} className="ref-item-row">
                      <div className="item-main-details">
                        <h4>{exp.role} <span className="item-company">@ {exp.company}</span></h4>
                        <span className="item-dates">{exp.start_date || '----'} — {exp.end_date || 'Present'}</span>
                        {exp.description && <p className="item-desc">{exp.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteExperience(exp.id)}
                        className="ref-btn-delete"
                        title="Delete Experience"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="ref-empty-text">No experience items registered yet.</p>
                )}
              </div>
            </div>

            {/* Education Section */}
            <div className="ref-sub-section-card">
              <div className="ref-sub-section-header">
                <div className="sub-header-title-row">
                  <GraduationCap size={18} />
                  <h3>Academic Credentials</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddEdu(!showAddEdu)}
                  className="ref-add-item-btn"
                >
                  <Plus size={14} /> Add Degree
                </button>
              </div>

              {showAddEdu && (
                <form onSubmit={handleCreateEdu} className="ref-item-form-drawer">
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Institution / University *"
                      value={newEdu.institution}
                      onChange={(e) => setNewEdu({ ...newEdu, institution: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                    <input
                      type="text"
                      placeholder="Degree Title *"
                      value={newEdu.degree}
                      onChange={(e) => setNewEdu({ ...newEdu, degree: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                  </div>
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Major Field"
                      value={newEdu.field}
                      onChange={(e) => setNewEdu({ ...newEdu, field: e.target.value })}
                      className="ref-drawer-input"
                    />
                    <input
                      type="text"
                      placeholder="Graduation Year (e.g. 2026)"
                      value={newEdu.end_year}
                      onChange={(e) => setNewEdu({ ...newEdu, end_year: e.target.value })}
                      className="ref-drawer-input"
                    />
                  </div>
                  <div className="drawer-actions-row">
                    <button type="button" onClick={() => setShowAddEdu(false)} className="ref-btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="ref-btn-submit">
                      Save Degree
                    </button>
                  </div>
                </form>
              )}

              <div className="ref-items-list">
                {education && education.length > 0 ? (
                  education.map((edu, eIdx) => (
                    <div key={edu.id || eIdx} className="ref-item-row">
                      <div className="item-main-details">
                        <h4>{edu.degree} {edu.field ? `— ${edu.field}` : ''}</h4>
                        <span className="item-company">{edu.institution} ({edu.start_year || '----'} — {edu.end_year || 'Present'})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteEducation(edu.id)}
                        className="ref-btn-delete"
                        title="Delete Degree"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="ref-empty-text">No education records registered yet.</p>
                )}
              </div>
            </div>

            {/* Projects Section */}
            <div className="ref-sub-section-card">
              <div className="ref-sub-section-header">
                <div className="sub-header-title-row">
                  <FolderGit2 size={18} />
                  <h3>Project Artifacts</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddProj(!showAddProj)}
                  className="ref-add-item-btn"
                >
                  <Plus size={14} /> Add Project
                </button>
              </div>

              {showAddProj && (
                <form onSubmit={handleCreateProj} className="ref-item-form-drawer">
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Project Title *"
                      value={newProj.title}
                      onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                    <input
                      type="url"
                      placeholder="Project URL (optional)"
                      value={newProj.project_url}
                      onChange={(e) => setNewProj({ ...newProj, project_url: e.target.value })}
                      className="ref-drawer-input"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Technologies (comma separated, e.g. React, Node, Figma)"
                    value={newProj.technologies}
                    onChange={(e) => setNewProj({ ...newProj, technologies: e.target.value })}
                    className="ref-drawer-input"
                  />
                  <textarea
                    placeholder="Brief description of the project..."
                    rows={3}
                    value={newProj.description}
                    onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                    className="ref-drawer-textarea"
                  />
                  <div className="drawer-actions-row">
                    <button type="button" onClick={() => setShowAddProj(false)} className="ref-btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="ref-btn-submit">
                      Save Project
                    </button>
                  </div>
                </form>
              )}

              <div className="ref-items-list">
                {projects && projects.length > 0 ? (
                  projects.map((proj, pIdx) => (
                    <div key={proj.id || pIdx} className="ref-item-row">
                      <div className="item-main-details">
                        <h4>
                          {proj.title}
                          {proj.project_url && (
                            <a href={proj.project_url} target="_blank" rel="noopener noreferrer" className="ref-proj-link">
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </h4>
                        {proj.technologies && <span className="item-stack">{proj.technologies}</span>}
                        {proj.description && <p className="item-desc">{proj.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => deleteProject(proj.id)}
                        className="ref-btn-delete"
                        title="Delete Project"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="ref-empty-text">No projects registered yet.</p>
                )}
              </div>
            </div>

            {/* Complete Skills Manager */}
            <div className="ref-sub-section-card">
              <div className="ref-sub-section-header">
                <div className="sub-header-title-row">
                  <Star size={18} />
                  <h3>Competencies & Skills ({skillsList.length})</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddSkill(!showAddSkill)}
                  className="ref-add-item-btn"
                >
                  <Plus size={14} /> Add Skill
                </button>
              </div>

              {showAddSkill && (
                <form onSubmit={handleCreateSkill} className="ref-item-form-drawer">
                  <div className="form-grid-2">
                    <input
                      type="text"
                      placeholder="Skill Name (e.g. React, Figma, Python) *"
                      value={newSkill.skill_name}
                      onChange={(e) => setNewSkill({ ...newSkill, skill_name: e.target.value })}
                      className="ref-drawer-input"
                      required
                    />
                    <select
                      value={newSkill.skill_category}
                      onChange={(e) => setNewSkill({ ...newSkill, skill_category: e.target.value })}
                      className="ref-drawer-select"
                    >
                      <option value="Technical">Technical</option>
                      <option value="Design & UI/UX">Design & UI/UX</option>
                      <option value="Frontend">Frontend & Web</option>
                      <option value="Backend">Backend & APIs</option>
                      <option value="Cloud">Cloud & Databases</option>
                    </select>
                  </div>
                  <div className="drawer-actions-row">
                    <button type="button" onClick={() => setShowAddSkill(false)} className="ref-btn-cancel">
                      Cancel
                    </button>
                    <button type="submit" className="ref-btn-submit">
                      Add Skill
                    </button>
                  </div>
                </form>
              )}

              <div className="ref-skills-manager-chips">
                {skillsList && skillsList.length > 0 ? (
                  skillsList.map((skill, sIdx) => {
                    const id = skill?.id || sIdx;
                    const name = typeof skill === 'string' ? skill : (skill?.skill_name || skill?.name || skill?.skill || '');
                    return (
                      <span key={id} className="ref-managed-skill-pill">
                        {name}
                        {skill?.id && (
                          <button
                            type="button"
                            onClick={() => deleteSkill(skill.id)}
                            className="ref-skill-remove-btn"
                            title="Remove skill"
                          >
                            ×
                          </button>
                        )}
                      </span>
                    );
                  })
                ) : (
                  <p className="ref-empty-text">No skills registered yet.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ====================================================================
          PROFILE EDIT MODAL DIALOG
          Preserves all existing fields and save functionality
          ==================================================================== */}
      {isEditModalOpen && (
        <div className="ref-modal-overlay animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="ref-modal-dialog animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="ref-modal-header">
              <h2>Edit Profile Information</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="ref-modal-close-btn"
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="ref-modal-form">
              <div className="ref-form-group">
                <label>Professional Title / Headline</label>
                <input
                  type="text"
                  value={formData.headline}
                  onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                  placeholder="e.g. UI/UX Designer / Software Engineer"
                  className="ref-form-input"
                />
              </div>

              <div className="form-grid-2">
                <div className="ref-form-group">
                  <label>Current Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Salem, Tamil Nadu"
                    className="ref-form-input"
                  />
                </div>
                <div className="ref-form-group">
                  <label>Contact Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9360844322"
                    className="ref-form-input"
                  />
                </div>
              </div>

              <div className="ref-form-group">
                <label>Executive Bio / About</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell recruiters about your background, expertise, and goals..."
                  className="ref-form-textarea"
                />
              </div>

              <div className="form-grid-2">
                <div className="ref-form-group">
                  <label>Target Role</label>
                  <input
                    type="text"
                    value={formData.preferred_role}
                    onChange={(e) => setFormData({ ...formData, preferred_role: e.target.value })}
                    placeholder="e.g. Software Engineer / UI Designer"
                    className="ref-form-input"
                  />
                </div>
                <div className="ref-form-group">
                  <label>Preferred Work Mode</label>
                  <select
                    value={formData.preferred_work_mode}
                    onChange={(e) => setFormData({ ...formData, preferred_work_mode: e.target.value })}
                    className="ref-form-select"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>
              </div>

              <div className="form-grid-2">
                <div className="ref-form-group">
                  <label>Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: parseFloat(e.target.value) || 0 })}
                    className="ref-form-input"
                  />
                </div>
                <div className="ref-form-group">
                  <label>Preferred Location</label>
                  <input
                    type="text"
                    value={formData.preferred_location}
                    onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                    placeholder="e.g. Remote / Bangalore"
                    className="ref-form-input"
                  />
                </div>
              </div>

              <div className="ref-form-group">
                <label>Career Goal</label>
                <input
                  type="text"
                  value={formData.career_goal}
                  onChange={(e) => setFormData({ ...formData, career_goal: e.target.value })}
                  placeholder="e.g. Senior Frontend Engineer"
                  className="ref-form-input"
                />
              </div>

              <div className="ref-modal-actions">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="ref-btn-cancel"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ref-btn-submit"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
