import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { resumeAPI } from '../services/api';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Briefcase,
  GraduationCap,
  Wrench,
  FolderGit2,
  Award,
  Globe,
  Languages,
  Layout,
  Save,
  RefreshCw,
  Eye,
  Edit3,
  Target,
  Search,
  ExternalLink,
  Layers,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Palette,
  Check,
  User,
  SlidersHorizontal
} from 'lucide-react';
import './ATSResumeMaker.css';

const DEFAULT_RESUME_STATE = {
  name: 'Software Engineer Resume',
  template: 'modern',
  personal_info: {
    full_name: '',
    professional_title: '',
    email: '',
    phone: '',
    location: '',
    linkedin_url: '',
    github_url: '',
    portfolio_url: ''
  },
  summary: '',
  experience: [
    {
      id: 'exp-1',
      job_title: '',
      company: '',
      location: '',
      start_date: '',
      end_date: '',
      is_current: false,
      description: ''
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: '',
      institution: '',
      location: '',
      start_year: '',
      end_year: '',
      grade: '',
      description: ''
    }
  ],
  skills: {
    programming_languages: ['JavaScript', 'TypeScript', 'Python'],
    frameworks_libraries: ['React', 'Node.js', 'Express'],
    databases_cloud: ['PostgreSQL', 'MongoDB', 'Docker'],
    tools_methods: ['Git', 'REST APIs', 'Agile']
  },
  projects: [
    {
      id: 'proj-1',
      name: '',
      role: '',
      technologies: '',
      description: '',
      project_url: '',
      github_url: ''
    }
  ],
  certifications: [],
  achievements: [],
  languages: [],
  ats_score: null,
  ats_analysis: null
};

const stepsList = [
  null, // index 0 unused
  { label: 'Personal Info', icon: User },
  { label: 'Summary', icon: FileText },
  { label: 'Experience', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Skills', icon: Wrench },
  { label: 'Projects', icon: FolderGit2 },
  { label: 'Certifications', icon: Award },
  { label: 'Achievements', icon: Award },
  { label: 'Languages', icon: Globe },
  { label: 'ATS Score & Export', icon: Target }
];

const ATSResumeMaker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Core state
  const [resumeData, setResumeData] = useState({ ...DEFAULT_RESUME_STATE });
  const [resumeId, setResumeId] = useState(null);
  const [activeStep, setActiveStep] = useState(1);
  const [template, setTemplate] = useState('modern');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [mobileTab, setMobileTab] = useState('editor');

  // AI state
  const [improvingBulletIndex, setImprovingBulletIndex] = useState(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isAnalyzingATS, setIsAnalyzingATS] = useState(false);
  const [isMatchingJD, setIsMatchingJD] = useState(false);
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [jobMatchResult, setJobMatchResult] = useState(null);

  const saveTimerRef = useRef(null);

  // Load resume on mount
  useEffect(() => {
    const loadResume = async () => {
      const resumeIdParam = searchParams.get('id');
      if (resumeIdParam) {
        setIsLoading(true);
        try {
          const data = await resumeAPI.getResumeDetail(resumeIdParam);
          if (data && data.resume) {
            setResumeData({ ...DEFAULT_RESUME_STATE, ...data.resume });
            setResumeId(resumeIdParam);
            setTemplate(data.resume.template || 'modern');
          }
        } catch (err) {
          console.error('Failed to load resume:', err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadResume();
  }, [searchParams]);

  // Debounced auto-save
  const handleDataChange = useCallback((updates) => {
    setResumeData(prev => {
      const next = { ...prev, ...updates };
      // Debounce save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        autoSave(next);
      }, 2000);
      return next;
    });
  }, [resumeId]);

  const autoSave = async (data) => {
    if (!data || isSaving) return;
    setIsSaving(true);
    try {
      if (resumeId) {
        await resumeAPI.updateResume(resumeId, data);
      } else {
        const res = await resumeAPI.createResume(data);
        if (res?.resume?.id) setResumeId(res.resume.id);
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Update personal info field
  const updatePersonalInfo = (field, value) => {
    handleDataChange({
      personal_info: { ...resumeData.personal_info, [field]: value }
    });
  };

  // Add/remove/update dynamic items (experience, education, etc.)
  const addItem = (section, template) => {
    const items = [...(resumeData[section] || []), { ...template, id: `${section}-${Date.now()}` }];
    handleDataChange({ [section]: items });
  };

  const removeItem = (section, index) => {
    const items = [...(resumeData[section] || [])];
    items.splice(index, 1);
    handleDataChange({ [section]: items });
  };

  const updateItem = (section, index, field, value) => {
    const items = [...(resumeData[section] || [])];
    items[index] = { ...items[index], [field]: value };
    handleDataChange({ [section]: items });
  };

  // Update skills
  const updateSkills = (category, value) => {
    const skills = value.split(',').map(s => s.trim()).filter(Boolean);
    handleDataChange({
      skills: { ...resumeData.skills, [category]: skills }
    });
  };

  // AI: Improve experience bullets
  const handleImproveExperienceBullets = async (index) => {
    const exp = resumeData.experience?.[index];
    if (!exp?.description) return;
    setImprovingBulletIndex(index);
    try {
      const res = await resumeAPI.improveBullets({
        bullets: exp.description,
        job_title: exp.job_title,
        company: exp.company
      }, resumeId);
      if (res?.improved_bullets) {
        updateItem('experience', index, 'description', res.improved_bullets);
      }
    } catch (err) {
      console.error('Failed to improve bullets:', err);
    } finally {
      setImprovingBulletIndex(null);
    }
  };

  // AI: Generate summary
  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const res = await resumeAPI.generateSummary({
        personal_info: resumeData.personal_info,
        experience: resumeData.experience,
        skills: resumeData.skills,
        education: resumeData.education
      }, resumeId);
      if (res?.summary) {
        handleDataChange({ summary: res.summary });
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI: ATS Score Analysis
  const handleAnalyzeATS = async () => {
    setIsAnalyzingATS(true);
    try {
      const res = await resumeAPI.analyzeATS(resumeId, { resume_data: resumeData });
      if (res) {
        handleDataChange({
          ats_score: res.score || res.ats_score,
          ats_analysis: res.analysis || res
        });
      }
    } catch (err) {
      console.error('ATS analysis failed:', err);
    } finally {
      setIsAnalyzingATS(false);
    }
  };

  // AI: Job Match Analysis
  const handleAnalyzeJobMatch = async () => {
    if (!jobDescriptionInput.trim()) return;
    setIsMatchingJD(true);
    try {
      const res = await resumeAPI.analyzeJobATS(resumeId, {
        job_description: jobDescriptionInput,
        resume_data: resumeData
      });
      if (res) {
        setJobMatchResult(res);
      }
    } catch (err) {
      console.error('Job match analysis failed:', err);
    } finally {
      setIsMatchingJD(false);
    }
  };

  // Download handler
  const handleDownload = async (format = 'pdf') => {
    try {
      let blob;
      if (format === 'pdf') {
        blob = await resumeAPI.downloadPDF(resumeId, template);
      } else {
        blob = await resumeAPI.downloadDOCX(resumeId, template);
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resumeData.personal_info?.full_name || 'resume'}_${template}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
      // Fallback: try the export endpoint
      try {
        const blob = await resumeAPI.exportResume(format, resumeId, template);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resume.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } catch (fallbackErr) {
        console.error('Export fallback also failed:', fallbackErr);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="ats-loading-state">
        <RefreshCw size={24} className="animate-spin" />
        <p>Loading resume builder...</p>
      </div>
    );
  }

  return (
    <div className="ats-resume-maker-layout">
      {/* Top toolbar */}
      <header className="ats-top-toolbar">
        <div className="toolbar-left">
          <FileText size={20} />
          <h1 className="toolbar-title">ATS Resume Builder</h1>
          {isSaving && <span className="save-indicator"><RefreshCw size={12} className="animate-spin" /> Saving...</span>}
          {!isSaving && resumeId && <span className="save-indicator saved"><CheckCircle2 size={12} /> Saved</span>}
        </div>
        <div className="toolbar-actions">
          <button
            type="button"
            onClick={() => setShowMobilePreview(!showMobilePreview)}
            className="btn-secondary btn-sm mobile-preview-toggle"
          >
            <Eye size={16} />
            <span>{showMobilePreview ? 'Editor' : 'Preview'}</span>
          </button>
          <button
            type="button"
            onClick={() => handleDownload('pdf')}
            className="btn-primary btn-sm"
          >
            <Download size={16} />
            <span>Export PDF</span>
          </button>
        </div>
      </header>

      <main className="ats-main-grid">
        {/* LEFT COLUMN: STEP NAVIGATION */}
        <aside className="ats-steps-sidebar">
          <nav className="steps-nav">
            {stepsList.map((step, idx) => {
              if (idx === 0 || !step) return null;
              const StepIcon = step.icon;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`step-nav-btn ${activeStep === idx ? 'active' : ''} ${idx < activeStep ? 'completed' : ''}`}
                >
                  <span className="step-num">{idx}</span>
                  <span className="step-label">{step.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* CENTER COLUMN: FORM EDITOR */}
        <section className={`ats-editor-panel ${showMobilePreview ? 'hide-on-mobile' : ''}`}>

          {/* STEP 1: PERSONAL INFO */}
          {activeStep === 1 && (
            <div className="editor-card">
              <h2 className="editor-card-title">Personal Information</h2>
              <p className="editor-card-sub">Your contact details and professional identity.</p>
              <div className="form-group-grid">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.full_name || ''}
                    onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                    placeholder="e.g. John Doe"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Professional Title</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.professional_title || ''}
                    onChange={(e) => updatePersonalInfo('professional_title', e.target.value)}
                    placeholder="e.g. Senior Software Engineer"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    value={resumeData.personal_info?.email || ''}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    placeholder="john@example.com"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.phone || ''}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    value={resumeData.personal_info?.location || ''}
                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                    placeholder="San Francisco, CA"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">LinkedIn URL</label>
                  <input
                    type="url"
                    value={resumeData.personal_info?.linkedin_url || ''}
                    onChange={(e) => updatePersonalInfo('linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/johndoe"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">GitHub URL</label>
                  <input
                    type="url"
                    value={resumeData.personal_info?.github_url || ''}
                    onChange={(e) => updatePersonalInfo('github_url', e.target.value)}
                    placeholder="https://github.com/johndoe"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Portfolio URL</label>
                  <input
                    type="url"
                    value={resumeData.personal_info?.portfolio_url || ''}
                    onChange={(e) => updatePersonalInfo('portfolio_url', e.target.value)}
                    placeholder="https://johndoe.dev"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PROFESSIONAL SUMMARY */}
          {activeStep === 2 && (
            <div className="editor-card">
              <div className="editor-card-header-flex">
                <div>
                  <h2 className="editor-card-title">Professional Summary</h2>
                  <p className="editor-card-sub">A concise 3-4 sentence overview of your expertise and career goals.</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateSummary}
                  disabled={isGeneratingSummary}
                  className="btn-secondary btn-sm-inline"
                >
                  <Sparkles size={14} className={isGeneratingSummary ? 'animate-spin' : ''} />
                  <span>{isGeneratingSummary ? 'Generating...' : 'AI Generate'}</span>
                </button>
              </div>
              <textarea
                rows={6}
                value={resumeData.summary || ''}
                onChange={(e) => handleDataChange({ summary: e.target.value })}
                placeholder="Results-driven software engineer with 5+ years of experience building scalable web applications..."
                className="input-field"
              />
            </div>
          )}

          {/* STEP 3: EXPERIENCE */}
          {activeStep === 3 && (
            <div className="editor-card">
              <div className="editor-card-header-flex">
                <div>
                  <h2 className="editor-card-title">Work Experience</h2>
                  <p className="editor-card-sub">List your professional roles in reverse chronological order.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('experience', {
                    job_title: '',
                    company: '',
                    location: '',
                    start_date: '',
                    end_date: '',
                    is_current: false,
                    description: ''
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Role</span>
                </button>
              </div>

              {resumeData.experience?.map((exp, idx) => (
                <div key={exp.id || idx} className="dynamic-entry-card">
                  <div className="entry-card-header">
                    <span className="entry-idx-badge">Role #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('experience', idx)}
                      className="btn-delete-entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="form-group-grid">
                    <div className="form-group">
                      <label className="form-label">Job Title *</label>
                      <input
                        type="text"
                        value={exp.job_title || ''}
                        onChange={(e) => updateItem('experience', idx, 'job_title', e.target.value)}
                        placeholder="e.g. Senior Software Engineer"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Company *</label>
                      <input
                        type="text"
                        value={exp.company || ''}
                        onChange={(e) => updateItem('experience', idx, 'company', e.target.value)}
                        placeholder="e.g. Google"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => updateItem('experience', idx, 'location', e.target.value)}
                        placeholder="e.g. Mountain View, CA"
                        className="input-field"
                      />
                    </div>

                    <div className="form-group">
                      <div className="date-pair-row">
                        <div>
                          <label className="form-label">Start Date</label>
                          <input
                            type="text"
                            value={exp.start_date || ''}
                            onChange={(e) => updateItem('experience', idx, 'start_date', e.target.value)}
                            placeholder="e.g. Jan 2022"
                            className="input-field"
                          />
                        </div>
                        <div>
                          <label className="form-label">End Date</label>
                          <input
                            type="text"
                            value={exp.is_current ? 'Present' : (exp.end_date || '')}
                            disabled={exp.is_current}
                            onChange={(e) => updateItem('experience', idx, 'end_date', e.target.value)}
                            placeholder="e.g. Present"
                            className="input-field"
                          />
                        </div>
                      </div>
                      <label className="checkbox-control-label">
                        <input
                          type="checkbox"
                          checked={Boolean(exp.is_current)}
                          onChange={(e) => updateItem('experience', idx, 'is_current', e.target.checked)}
                        />
                        <span>Currently Working Here</span>
                      </label>
                    </div>

                    <div className="form-group full-width">
                      <div className="label-with-inline-action">
                        <label className="form-label">Key Responsibilities & Achievements (Bullets)</label>
                        <button
                          type="button"
                          onClick={() => handleImproveExperienceBullets(idx)}
                          disabled={improvingBulletIndex === idx}
                          className="btn-secondary btn-sm-inline"
                        >
                          <Sparkles size={12} className={improvingBulletIndex === idx ? 'animate-spin' : ''} />
                          <span>{improvingBulletIndex === idx ? 'Polishing...' : 'Improve with AI'}</span>
                        </button>
                      </div>
                      <textarea
                        rows={4}
                        value={exp.description || ''}
                        onChange={(e) => updateItem('experience', idx, 'description', e.target.value)}
                        placeholder={"• Architected real-time microservices handling 20,000+ RPS with 99.99% uptime.\n• Streamlined CI/CD pipeline, reducing deployment cycle duration by 45%.\n• Led a team of 4 frontend engineers building responsive design system."}
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {(!resumeData.experience || resumeData.experience.length === 0) && (
                <div className="empty-section-card">
                  <p>No work experience entries added yet.</p>
                  <button
                    type="button"
                    onClick={() => addItem('experience', {
                      job_title: '',
                      company: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      is_current: false,
                      description: ''
                    })}
                    className="btn-primary"
                    style={{ minHeight: '38px', padding: '0.45rem 1rem' }}
                  >
                    + Add Your First Role
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: EDUCATION */}
          {activeStep === 4 && (
            <div className="editor-card">
              <div className="editor-card-header-flex">
                <div>
                  <h2 className="editor-card-title">Education</h2>
                  <p className="editor-card-sub">Academic degrees, universities, colleges, and graduation details.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('education', {
                    degree: '',
                    institution: '',
                    location: '',
                    start_year: '',
                    end_year: '',
                    grade: '',
                    description: ''
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Education</span>
                </button>
              </div>

              {resumeData.education?.map((edu, idx) => (
                <div key={edu.id || idx} className="dynamic-entry-card">
                  <div className="entry-card-header">
                    <span className="entry-idx-badge">Education #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('education', idx)}
                      className="btn-delete-entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="form-group-grid">
                    <div className="form-group">
                      <label className="form-label">Degree *</label>
                      <input
                        type="text"
                        value={edu.degree || ''}
                        onChange={(e) => updateItem('education', idx, 'degree', e.target.value)}
                        placeholder="e.g. B.S. Computer Science"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Institution *</label>
                      <input
                        type="text"
                        value={edu.institution || ''}
                        onChange={(e) => updateItem('education', idx, 'institution', e.target.value)}
                        placeholder="e.g. MIT"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        type="text"
                        value={edu.location || ''}
                        onChange={(e) => updateItem('education', idx, 'location', e.target.value)}
                        placeholder="e.g. Cambridge, MA"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Graduation Year</label>
                      <input
                        type="text"
                        value={edu.end_year || ''}
                        onChange={(e) => updateItem('education', idx, 'end_year', e.target.value)}
                        placeholder="e.g. 2023"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GPA / Honours</label>
                      <input
                        type="text"
                        value={edu.grade || ''}
                        onChange={(e) => updateItem('education', idx, 'grade', e.target.value)}
                        placeholder="e.g. 3.8/4.0, Cum Laude"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 5: SKILLS */}
          {activeStep === 5 && (
            <div className="editor-card">
              <h2 className="editor-card-title">Technical Skills</h2>
              <p className="editor-card-sub">Group your skills by category. Separate skills with commas.</p>
              <div className="form-group-grid">
                <div className="form-group full-width">
                  <label className="form-label">Programming Languages</label>
                  <input
                    type="text"
                    value={(resumeData.skills?.programming_languages || []).join(', ')}
                    onChange={(e) => updateSkills('programming_languages', e.target.value)}
                    placeholder="JavaScript, TypeScript, Python, Go"
                    className="input-field"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Frameworks & Libraries</label>
                  <input
                    type="text"
                    value={(resumeData.skills?.frameworks_libraries || []).join(', ')}
                    onChange={(e) => updateSkills('frameworks_libraries', e.target.value)}
                    placeholder="React, Next.js, Node.js, Express, Django"
                    className="input-field"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Databases & Cloud</label>
                  <input
                    type="text"
                    value={(resumeData.skills?.databases_cloud || []).join(', ')}
                    onChange={(e) => updateSkills('databases_cloud', e.target.value)}
                    placeholder="PostgreSQL, MongoDB, AWS, Docker, Kubernetes"
                    className="input-field"
                  />
                </div>
                <div className="form-group full-width">
                  <label className="form-label">Tools & Methods</label>
                  <input
                    type="text"
                    value={(resumeData.skills?.tools_methods || []).join(', ')}
                    onChange={(e) => updateSkills('tools_methods', e.target.value)}
                    placeholder="Git, REST APIs, CI/CD, Agile, TDD"
                    className="input-field"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: PROJECTS */}
          {activeStep === 6 && (
            <div className="editor-card">
              <div className="editor-card-header-flex">
                <div>
                  <h2 className="editor-card-title">Key Projects</h2>
                  <p className="editor-card-sub">Showcase impactful projects with quantifiable results.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('projects', {
                    name: '',
                    role: '',
                    technologies: '',
                    description: '',
                    project_url: '',
                    github_url: ''
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Project</span>
                </button>
              </div>

              {resumeData.projects?.map((proj, idx) => (
                <div key={proj.id || idx} className="dynamic-entry-card">
                  <div className="entry-card-header">
                    <span className="entry-idx-badge">Project #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('projects', idx)}
                      className="btn-delete-entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="form-group-grid">
                    <div className="form-group">
                      <label className="form-label">Project Name *</label>
                      <input
                        type="text"
                        value={proj.name || ''}
                        onChange={(e) => updateItem('projects', idx, 'name', e.target.value)}
                        placeholder="e.g. Real-Time Analytics Dashboard"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Technologies</label>
                      <input
                        type="text"
                        value={proj.technologies || ''}
                        onChange={(e) => updateItem('projects', idx, 'technologies', e.target.value)}
                        placeholder="React, Node.js, PostgreSQL"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label className="form-label">Description</label>
                      <textarea
                        rows={3}
                        value={proj.description || ''}
                        onChange={(e) => updateItem('projects', idx, 'description', e.target.value)}
                        placeholder="• Built a dashboard processing 1M+ events per day..."
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Live URL</label>
                      <input
                        type="url"
                        value={proj.project_url || ''}
                        onChange={(e) => updateItem('projects', idx, 'project_url', e.target.value)}
                        placeholder="https://myproject.com"
                        className="input-field"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">GitHub URL</label>
                      <input
                        type="url"
                        value={proj.github_url || ''}
                        onChange={(e) => updateItem('projects', idx, 'github_url', e.target.value)}
                        placeholder="https://github.com/user/repo"
                        className="input-field"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 7: CERTIFICATIONS */}
          {activeStep === 7 && (
            <div className="editor-card">
              <div className="editor-card-header-flex">
                <div>
                  <h2 className="editor-card-title">Certifications</h2>
                  <p className="editor-card-sub">Professional certifications and credentials.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('certifications', {
                    name: '',
                    organization: '',
                    issue_date: '',
                    credential_id: '',
                    credential_url: ''
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Certification</span>
                </button>
              </div>

              {resumeData.certifications?.map((cert, idx) => (
                <div key={cert.id || idx} className="dynamic-entry-card">
                  <div className="entry-card-header">
                    <span className="entry-idx-badge">Certification #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('certifications', idx)}
                      className="btn-delete-entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="form-group-grid">
                    <div className="form-group">
                      <label>Certification Name *</label>
                      <input
                        type="text"
                        value={cert.name || ''}
                        onChange={(e) => updateItem('certifications', idx, 'name', e.target.value)}
                        placeholder="e.g. AWS Certified Solutions Architect"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Issuing Organization</label>
                      <input
                        type="text"
                        value={cert.organization || ''}
                        onChange={(e) => updateItem('certifications', idx, 'organization', e.target.value)}
                        placeholder="e.g. Amazon Web Services"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Issue Date</label>
                      <input
                        type="text"
                        value={cert.issue_date || ''}
                        onChange={(e) => updateItem('certifications', idx, 'issue_date', e.target.value)}
                        placeholder="e.g. Mar 2024"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Credential ID / URL</label>
                      <input
                        type="text"
                        value={cert.credential_id || ''}
                        onChange={(e) => updateItem('certifications', idx, 'credential_id', e.target.value)}
                        placeholder="e.g. AWS-1928374"
                        className="ats-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 8: ACHIEVEMENTS */}
          {activeStep === 8 && (
            <div className="step-card-content">
              <div className="step-header-with-action">
                <div>
                  <h2>Step 8 — Key Achievements & Awards</h2>
                  <p>Highlight hackathons, academic honours, competitive programming, or publications.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('achievements', {
                    title: '',
                    date: '',
                    description: ''
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Achievement</span>
                </button>
              </div>

              {resumeData.achievements?.map((ach, idx) => (
                <div key={ach.id || idx} className="dynamic-entry-card">
                  <div className="entry-card-header">
                    <span className="entry-idx-badge">Achievement #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeItem('achievements', idx)}
                      className="btn-delete-entry"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <div className="form-group-grid">
                    <div className="form-group">
                      <label>Title *</label>
                      <input
                        type="text"
                        value={ach.title || ''}
                        onChange={(e) => updateItem('achievements', idx, 'title', e.target.value)}
                        placeholder="e.g. Winner — Google Code Jam 2024"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Date</label>
                      <input
                        type="text"
                        value={ach.date || ''}
                        onChange={(e) => updateItem('achievements', idx, 'date', e.target.value)}
                        placeholder="e.g. Jun 2024"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group full-width">
                      <label>Description</label>
                      <textarea
                        rows={2}
                        value={ach.description || ''}
                        onChange={(e) => updateItem('achievements', idx, 'description', e.target.value)}
                        placeholder="Brief description of the achievement..."
                        className="ats-input"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 9: LANGUAGES */}
          {activeStep === 9 && (
            <div className="step-card-content">
              <div className="step-header-with-action">
                <div>
                  <h2>Step 9 — Languages</h2>
                  <p>List languages you speak and your proficiency level.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addItem('languages', {
                    language: '',
                    proficiency: 'Professional'
                  })}
                  className="btn-secondary btn-sm"
                >
                  <Plus size={15} />
                  <span>Add Language</span>
                </button>
              </div>

              {resumeData.languages?.map((lang, idx) => (
                <div key={lang.id || idx} className="dynamic-entry-card compact-entry">
                  <div className="form-group-grid compact-grid">
                    <div className="form-group">
                      <label>Language</label>
                      <input
                        type="text"
                        value={lang.language || ''}
                        onChange={(e) => updateItem('languages', idx, 'language', e.target.value)}
                        placeholder="e.g. English"
                        className="ats-input"
                      />
                    </div>
                    <div className="form-group">
                      <label>Proficiency</label>
                      <select
                        value={lang.proficiency || 'Professional'}
                        onChange={(e) => updateItem('languages', idx, 'proficiency', e.target.value)}
                        className="ats-input"
                      >
                        <option value="Native">Native</option>
                        <option value="Fluent">Fluent</option>
                        <option value="Professional">Professional</option>
                        <option value="Intermediate">Intermediate</option>
                        <option value="Basic">Basic</option>
                      </select>
                    </div>
                    <div className="form-group compact-actions">
                      <button
                        type="button"
                        onClick={() => removeItem('languages', idx)}
                        className="btn-delete-entry"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STEP 10: ATS SCORE & EXPORT */}
          {activeStep === 10 && (
            <div className="step-card-content">
              <div className="step-header">
                <h2>Step 10 — ATS Scorecard & Job Optimization</h2>
                <p>Run deep ATS diagnostics, test keyword alignment with target jobs, and download clean PDFs/DOCXs.</p>
              </div>

              {/* ATS Score Gauge Card */}
              <div className="ats-score-dashboard-card">
                <div className="ats-score-main-badge">
                  <div className="score-circle">
                    <span className="score-number">{resumeData.ats_score || 85}</span>
                    <span className="score-max">/100</span>
                  </div>
                  <div className="score-text-details">
                    <h3>TALENT AGENT AI ATS SCORE</h3>
                    <p>
                      {resumeData.ats_score >= 85
                        ? 'Excellent formatting and high machine readability. Ready for tier-1 recruiter pipelines.'
                        : 'Good foundation with actionable areas for keyword and structural improvement.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleAnalyzeATS}
                      disabled={isAnalyzingATS}
                      className="btn-primary btn-sm"
                    >
                      <RefreshCw size={14} className={isAnalyzingATS ? 'animate-spin' : ''} />
                      <span>{isAnalyzingATS ? 'Analyzing Diagnostics...' : 'Recalculate ATS Score'}</span>
                    </button>
                  </div>
                </div>

                {/* Breakdown Progress Bars */}
                {resumeData.ats_analysis?.breakdown && (
                  <div className="ats-breakdown-grid">
                    {Object.entries(resumeData.ats_analysis.breakdown).map(([cat, val]) => (
                      <div key={cat} className="breakdown-item">
                        <div className="breakdown-label-row">
                          <span className="breakdown-label">{cat.toUpperCase()}</span>
                          <span className="breakdown-val">{val}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${val}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {resumeData.ats_analysis?.recommendations && resumeData.ats_analysis.recommendations.length > 0 && (
                  <div className="ats-recs-block">
                    <h4>Actionable Recommendations</h4>
                    <ul>
                      {resumeData.ats_analysis.recommendations.map((rec, i) => (
                        <li key={i}><CheckCircle2 size={15} className="text-electric-blue" /> {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Optimize for a Specific Job */}
              <div className="ats-job-matcher-card">
                <div className="job-matcher-header">
                  <Target size={20} className="text-electric-blue" />
                  <div>
                    <h3>Optimize for a Target Job Requisition</h3>
                    <p>Paste a job description to calculate exact ATS keyword alignment and gaps.</p>
                  </div>
                </div>

                <textarea
                  rows={4}
                  value={jobDescriptionInput}
                  onChange={(e) => setJobDescriptionInput(e.target.value)}
                  placeholder="Paste Job Description here (e.g. Responsibilities, Required Skills, Tech Stack)..."
                  className="ats-textarea"
                />

                <div className="job-match-actions">
                  <button
                    type="button"
                    onClick={handleAnalyzeJobMatch}
                    disabled={isMatchingJD}
                    className="btn-ai-action"
                  >
                    <Search size={15} className={isMatchingJD ? 'animate-spin' : ''} />
                    <span>{isMatchingJD ? 'Analyzing Job Alignment...' : 'Analyze Match'}</span>
                  </button>
                </div>

                {/* Job Match Result Card */}
                {jobMatchResult && (
                  <div className="job-match-results-box">
                    <div className="match-score-badge">
                      <span>ATS Match:</span> <strong>{jobMatchResult.match_score}%</strong>
                    </div>

                    <div className="keywords-matched-row">
                      <h5>Matching Keywords:</h5>
                      <div className="tag-chips-wrap">
                        {jobMatchResult.matching_keywords?.map((kw, i) => (
                          <span key={i} className="badge-match-chip">✓ {kw}</span>
                        ))}
                      </div>
                    </div>

                    <div className="keywords-missing-row">
                      <h5>Missing Keywords:</h5>
                      <div className="tag-chips-wrap">
                        {jobMatchResult.missing_keywords?.map((kw, i) => (
                          <span key={i} className="badge-missing-chip">! {kw}</span>
                        ))}
                      </div>
                    </div>

                    {jobMatchResult.summary_recommendation && (
                      <div className="tweak-recommendation">
                        <strong>Recommended Summary Tweak:</strong>
                        <p>{jobMatchResult.summary_recommendation}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom Pagination Strip */}
          <div className="ats-bottom-actions-row">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev - 1)}
                className="btn-secondary"
              >
                <ChevronLeft size={16} />
                <span>Previous Step</span>
              </button>
            )}
            {activeStep < 10 ? (
              <button
                type="button"
                onClick={() => setActiveStep(prev => prev + 1)}
                className="btn-primary ml-auto"
              >
                <span>Continue</span>
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleDownload('pdf')}
                className="btn-primary ml-auto"
              >
                <Download size={16} />
                <span>Download ATS PDF</span>
              </button>
            )}
          </div>
        </section>

        {/* =========================================================================
        RIGHT COLUMN: LIVE REAL-TIME RESUME PREVIEW
        ========================================================================= */}
        <section className={`ats-preview-panel ${showMobilePreview ? 'active-mobile' : ''}`}>
          <div className="preview-sticky-wrapper">
            <div className="preview-controls-bar">
              <div className="template-switcher">
                <span className="template-label">TEMPLATE:</span>
                <button
                  type="button"
                  onClick={() => { setTemplate('modern'); handleDataChange({ template: 'modern' }); }}
                  className={`template-chip ${template === 'modern' ? 'active' : ''}`}
                >
                  Modern
                </button>
                <button
                  type="button"
                  onClick={() => { setTemplate('classic'); handleDataChange({ template: 'classic' }); }}
                  className={`template-chip ${template === 'classic' ? 'active' : ''}`}
                >
                  Classic
                </button>
                <button
                  type="button"
                  onClick={() => { setTemplate('minimal'); handleDataChange({ template: 'minimal' }); }}
                  className={`template-chip ${template === 'minimal' ? 'active' : ''}`}
                >
                  Minimal
                </button>
              </div>

              <div className="preview-export-quick">
                <button
                  type="button"
                  onClick={() => handleDownload('pdf')}
                  className="preview-btn-pdf"
                  title="Export PDF"
                >
                  <Download size={14} />
                </button>
              </div>
            </div>

            {/* Live Resume Document */}
            <div className={`resume-document-preview template-${template}`}>
              {/* Header / Personal Info */}
              <div className="doc-header-section">
                <h1 className="doc-name">{resumeData.personal_info?.full_name || 'Your Name'}</h1>
                {resumeData.personal_info?.professional_title && (
                  <p className="doc-title-line">{resumeData.personal_info.professional_title}</p>
                )}
                <div className="doc-contact-row">
                  {resumeData.personal_info?.email && <span>{resumeData.personal_info.email}</span>}
                  {resumeData.personal_info?.phone && <span>{resumeData.personal_info.phone}</span>}
                  {resumeData.personal_info?.location && <span>{resumeData.personal_info.location}</span>}
                </div>
              </div>

              {/* Summary */}
              {resumeData.summary && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">PROFESSIONAL SUMMARY</h3>
                  <p className="doc-body-text">{resumeData.summary}</p>
                </div>
              )}

              {/* Skills */}
              {resumeData.skills && Object.values(resumeData.skills).some(arr => arr?.length > 0) && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">TECHNICAL SKILLS</h3>
                  <div className="doc-skills-grid">
                    {Object.entries(resumeData.skills).map(([cat, items]) => (
                      items && items.length > 0 && (
                        <div key={cat} className="doc-skill-category">
                          <strong>{cat.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
                          <span>{items.join(', ')}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Experience */}
              {resumeData.experience && resumeData.experience.length > 0 && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">WORK EXPERIENCE</h3>
                  {resumeData.experience.map((exp, i) => (
                    <div key={i} className="doc-item-entry">
                      <div className="doc-item-header-row">
                        <span className="doc-item-title">
                          <strong>{exp.job_title || 'Job Title'}</strong> — {exp.company || 'Company'}
                        </span>
                        <span className="doc-item-dates">
                          {exp.start_date || 'Start'} – {exp.is_current ? 'Present' : (exp.end_date || 'End')}
                        </span>
                      </div>
                      {exp.location && <div className="doc-item-sub">{exp.location}</div>}
                      {exp.description && (
                        <div className="doc-bullets-wrap">
                          {exp.description.split('\n').filter(Boolean).map((bullet, bIdx) => (
                            <div key={bIdx} className="doc-bullet-line">
                              <span className="bullet-sym">•</span>
                              <span>{bullet.replace(/^[•\-\*]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Projects Section */}
              {resumeData.projects && resumeData.projects.length > 0 && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">KEY PROJECTS</h3>
                  {resumeData.projects.map((proj, i) => (
                    <div key={i} className="doc-item-entry">
                      <div className="doc-item-header-row">
                        <span className="doc-item-title">
                          <strong>{proj.name || 'Project Title'}</strong>
                          {proj.technologies && <em className="doc-tech-inline"> ({proj.technologies})</em>}
                        </span>
                        {proj.project_url && (
                          <span className="doc-item-link">{proj.project_url}</span>
                        )}
                      </div>
                      {proj.description && (
                        <div className="doc-bullets-wrap">
                          {proj.description.split('\n').filter(Boolean).map((bullet, bIdx) => (
                            <div key={bIdx} className="doc-bullet-line">
                              <span className="bullet-sym">•</span>
                              <span>{bullet.replace(/^[•\-\*]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Education Section */}
              {resumeData.education && resumeData.education.length > 0 && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">EDUCATION</h3>
                  {resumeData.education.map((edu, i) => (
                    <div key={i} className="doc-item-entry">
                      <div className="doc-item-header-row">
                        <span className="doc-item-title">
                          <strong>{edu.degree || 'Degree'}</strong> — {edu.institution || 'Institution'}
                        </span>
                        <span className="doc-item-dates">{edu.end_year || ''}</span>
                      </div>
                      {edu.grade && <div className="doc-item-sub">GPA / Honors: {edu.grade}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Certifications Section */}
              {resumeData.certifications && resumeData.certifications.length > 0 && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">CERTIFICATIONS</h3>
                  {resumeData.certifications.map((cert, i) => (
                    <div key={i} className="doc-bullet-line">
                      <span className="bullet-sym">•</span>
                      <span><strong>{cert.name}</strong> — {cert.organization} ({cert.issue_date})</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Languages Section */}
              {resumeData.languages && resumeData.languages.length > 0 && (
                <div className="doc-section">
                  <h3 className="doc-section-heading">LANGUAGES</h3>
                  <p className="doc-body-text">
                    {resumeData.languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ATSResumeMaker;
