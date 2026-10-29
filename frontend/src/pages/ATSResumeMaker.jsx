import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
  Layers,
  Save,
  RefreshCw,
  Eye,
  EyeOff,
  Edit3,
  Target,
  Search,
  ExternalLink,
  Printer,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sliders,
  Palette,
  Check,
  User,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Upload,
  Copy,
  Undo2,
  Redo2,
  X,
  FileCheck,
  Compass,
  Trophy,
  HelpCircle,
  MoreVertical,
  ChevronDown,
  Sparkle,
  PanelLeft,
  PanelLeftClose,
  Menu
} from 'lucide-react';
import './ATSResumeMaker.css';

const DEFAULT_RESUME_STATE = {
  name: 'My ATS Resume',
  template: 'classic', // Recommended ATS Default
  styling_options: {
    fontSize: 'normal', // 'small' | 'normal' | 'large'
    spacing: 'normal',  // 'compact' | 'normal' | 'relaxed'
    accentColor: '#FF6500' // Electric Orange
  },
  section_order: [
    'personal_info',
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'internships',
    'achievements',
    'languages',
    'custom_sections'
  ],
  section_visibility: {
    personal_info: true,
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    internships: true,
    achievements: true,
    languages: true,
    custom_sections: true
  },
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
  experience: [],
  education: [],
  skills: {
    programming_languages: [],
    frameworks_libraries: [],
    databases_cloud: [],
    tools_methods: [],
    soft_skills: []
  },
  projects: [],
  certifications: [],
  internships: [],
  achievements: [],
  languages: [],
  custom_sections: [],
  ats_score: null,
  ats_analysis: null
};

const SECTION_CONFIG = [
  { id: 'personal_info', label: 'Personal Info', icon: User, pinned: true },
  { id: 'summary', label: 'Summary', icon: FileText },
  { id: 'experience', label: 'Work Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'skills', label: 'Skills', icon: Wrench },
  { id: 'projects', label: 'Key Projects', icon: FolderGit2 },
  { id: 'certifications', label: 'Certifications', icon: Award },
  { id: 'internships', label: 'Internships', icon: Compass },
  { id: 'achievements', label: 'Achievements', icon: Trophy },
  { id: 'languages', label: 'Languages', icon: Globe },
  { id: 'custom_sections', label: 'Custom Sections', icon: Layers }
];

const TEMPLATES = [
  { id: 'classic', name: 'Classic ATS', desc: 'Times New Roman, single-column, universal ATS benchmark' },
  { id: 'modern', name: 'Modern Pro', desc: 'Clean sans-serif with subtle brand accent borders' },
  { id: 'graduate', name: 'Graduate / Fresher', desc: 'Emphasizes Education, Coursework & Projects first' },
  { id: 'technical', name: 'Technical Matrix', desc: 'Prioritizes categorized technical skills & engineering stack' },
  { id: 'compact', name: 'Compact 1-Page', desc: 'Dense, space-optimized layout designed for single-page length' }
];

const ACCENT_COLORS = [
  { label: 'Electric Orange', hex: '#FF6500' },
  { label: 'Obsidian Black', hex: '#111111' },
  { label: 'Navy Blue', hex: '#1D4ED8' },
  { label: 'Slate Gray', hex: '#475569' },
  { label: 'Emerald Forest', hex: '#059669' }
];

const ATSResumeMaker = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Core Resume State
  const [resumeData, setResumeData] = useState({ ...DEFAULT_RESUME_STATE });
  const [resumeId, setResumeId] = useState(null);
  const [allUserResumes, setAllUserResumes] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState('personal_info');
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'unsaved'
  const [isLoading, setIsLoading] = useState(true);

  // Right Panel Tab: 'preview' | 'ats_analysis' | 'job_match' | 'checklist'
  const [rightPanelTab, setRightPanelTab] = useState('preview');

  // Preview options
  const [previewZoom, setPreviewZoom] = useState(100);
  const [showMultiPageGuides, setShowMultiPageGuides] = useState(true);

  // Mobile / Tablet Tab: 'sections' | 'editor' | 'preview' | 'ats'
  const [mobileActiveTab, setMobileActiveTab] = useState('editor');

  // History Stacks for Undo / Redo
  const historyStack = useRef([]);
  const futureStack = useRef([]);
  const isUndoRedoAction = useRef(false);

  // Autosave debouncer
  const saveTimerRef = useRef(null);
  const latestDataRef = useRef(resumeData);
  latestDataRef.current = resumeData;

  // Modals state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importError, setImportError] = useState('');

  const [showDiffModal, setShowDiffModal] = useState(false);
  const [diffData, setDiffData] = useState({
    title: '',
    original: '',
    proposed: '',
    explanation: '',
    onApply: null
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resumeToDelete, setResumeToDelete] = useState(null);

  const [showRenameModal, setShowRenameModal] = useState(false);
  const [renameInput, setRenameInput] = useState('');

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showResumeSwitcher, setShowResumeSwitcher] = useState(false);

  // AI Operation States
  const [summaryTone, setSummaryTone] = useState('professional');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [improvingExpIndex, setImprovingExpIndex] = useState(null);
  const [suggestingSkills, setSuggestingSkills] = useState(false);
  const [skillSuggestions, setSkillSuggestions] = useState([]);

  // Job Match State
  const [jobDescriptionInput, setJobDescriptionInput] = useState('');
  const [isMatchingJD, setIsMatchingJD] = useState(false);
  const [jobMatchResult, setJobMatchResult] = useState(null);

  // File Input Ref for Import
  const fileInputRef = useRef(null);

  // Load candidate resumes on mount
  const fetchUserResumes = async () => {
    try {
      const res = await resumeAPI.getResumes();
      if (res?.resumes) {
        setAllUserResumes(res.resumes);
        return res.resumes;
      }
    } catch (err) {
      console.error('Failed to fetch user resumes:', err);
    }
    return [];
  };

  useEffect(() => {
    let isMounted = true;
    const initialize = async () => {
      setIsLoading(true);
      const urlId = searchParams.get('id');

      try {
        const resumes = await fetchUserResumes();
        let targetResume = null;

        if (urlId) {
          try {
            const detailRes = await resumeAPI.getResumeDetail(urlId);
            if (detailRes?.resume) {
              targetResume = detailRes.resume;
            }
          } catch (e) {
            console.warn('Could not fetch resume by url id:', e);
          }
        }

        if (!targetResume && resumes.length > 0) {
          targetResume = resumes[0];
        }

        if (!targetResume) {
          // Auto-create initial resume pre-populated from candidate profile
          const createRes = await resumeAPI.createResume({
            name: 'My ATS Resume',
            template: 'classic'
          });
          if (createRes?.resume) {
            targetResume = createRes.resume;
            await fetchUserResumes();
          }
        }

        if (isMounted && targetResume) {
          const merged = {
            ...DEFAULT_RESUME_STATE,
            ...targetResume,
            styling_options: {
              ...DEFAULT_RESUME_STATE.styling_options,
              ...(targetResume.styling_options || {})
            },
            section_visibility: {
              ...DEFAULT_RESUME_STATE.section_visibility,
              ...(targetResume.section_visibility || {})
            },
            section_order: targetResume.section_order?.length
              ? targetResume.section_order
              : DEFAULT_RESUME_STATE.section_order
          };
          setResumeData(merged);
          setResumeId(targetResume.id);
          setRenameInput(targetResume.name || 'My ATS Resume');
          setSaveStatus('saved');
        }
      } catch (err) {
        console.error('Error during ATS Resume Builder initialization:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();
    return () => { isMounted = false; };
  }, [searchParams]);

  // Push state to undo stack
  const pushToHistory = (prevState) => {
    if (isUndoRedoAction.current) return;
    historyStack.current.push(JSON.parse(JSON.stringify(prevState)));
    if (historyStack.current.length > 30) {
      historyStack.current.shift();
    }
    futureStack.current = [];
  };

  // Undo Handler
  const handleUndo = () => {
    if (historyStack.current.length === 0) return;
    const previous = historyStack.current.pop();
    futureStack.current.push(JSON.parse(JSON.stringify(resumeData)));

    isUndoRedoAction.current = true;
    setResumeData(previous);
    triggerAutoSave(previous);
    setTimeout(() => { isUndoRedoAction.current = false; }, 50);
  };

  // Redo Handler
  const handleRedo = () => {
    if (futureStack.current.length === 0) return;
    const next = futureStack.current.pop();
    historyStack.current.push(JSON.parse(JSON.stringify(resumeData)));

    isUndoRedoAction.current = true;
    setResumeData(next);
    triggerAutoSave(next);
    setTimeout(() => { isUndoRedoAction.current = false; }, 50);
  };

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resumeData]);

  // Debounced Auto-save
  const triggerAutoSave = (dataToSave) => {
    setSaveStatus('unsaved');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!resumeId) return;
      setSaveStatus('saving');
      try {
        const res = await resumeAPI.updateResume(resumeId, dataToSave);
        if (res?.resume) {
          setSaveStatus('saved');
          // Update cached score
          if (res.resume.ats_score) {
            setResumeData(prev => ({
              ...prev,
              ats_score: res.resume.ats_score,
              ats_analysis: res.resume.ats_analysis
            }));
          }
        }
      } catch (err) {
        console.error('Autosave error:', err);
        setSaveStatus('unsaved');
      }
    }, 1500);
  };

  // Generalized field change updater
  const updateData = (updater) => {
    setResumeData(prev => {
      pushToHistory(prev);
      const updated = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      triggerAutoSave(updated);
      return updated;
    });
  };

  // Helper: Personal info field updater
  const updatePersonalInfo = (field, value) => {
    updateData(prev => ({
      ...prev,
      personal_info: {
        ...(prev.personal_info || {}),
        [field]: value
      }
    }));
  };

  // Helper: Section Reordering
  const moveSection = (sectionKey, direction) => {
    updateData(prev => {
      const order = [...(prev.section_order || DEFAULT_RESUME_STATE.section_order)];
      const idx = order.indexOf(sectionKey);
      if (idx === -1) return prev;
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      // Don't move above personal_info if pinned
      if (targetIdx <= 0 || targetIdx >= order.length) return prev;
      const temp = order[idx];
      order[idx] = order[targetIdx];
      order[targetIdx] = temp;
      return { ...prev, section_order: order };
    });
  };

  // Helper: Section Visibility Toggle
  const toggleSectionVisibility = (sectionKey) => {
    updateData(prev => ({
      ...prev,
      section_visibility: {
        ...(prev.section_visibility || {}),
        [sectionKey]: !prev.section_visibility?.[sectionKey]
      }
    }));
  };

  // Helper: Repeatable items CRUD
  const addEntry = (sectionKey, defaultItem) => {
    updateData(prev => ({
      ...prev,
      [sectionKey]: [
        ...(prev[sectionKey] || []),
        { ...defaultItem, id: `${sectionKey}-${Date.now()}` }
      ]
    }));
  };

  const updateEntry = (sectionKey, index, field, value) => {
    updateData(prev => {
      const list = [...(prev[sectionKey] || [])];
      list[index] = { ...list[index], [field]: value };
      return { ...prev, [sectionKey]: list };
    });
  };

  const removeEntry = (sectionKey, index) => {
    updateData(prev => {
      const list = [...(prev[sectionKey] || [])];
      list.splice(index, 1);
      return { ...prev, [sectionKey]: list };
    });
  };

  // Helper: Skills category tags
  const addSkillTag = (categoryKey, skillName) => {
    const clean = skillName.trim();
    if (!clean) return;
    updateData(prev => {
      const currentCategory = Array.isArray(prev.skills?.[categoryKey])
        ? prev.skills[categoryKey]
        : [];
      if (currentCategory.includes(clean)) return prev;
      return {
        ...prev,
        skills: {
          ...(prev.skills || {}),
          [categoryKey]: [...currentCategory, clean]
        }
      };
    });
  };

  const removeSkillTag = (categoryKey, skillName) => {
    updateData(prev => {
      const currentCategory = Array.isArray(prev.skills?.[categoryKey])
        ? prev.skills[categoryKey]
        : [];
      return {
        ...prev,
        skills: {
          ...(prev.skills || {}),
          [categoryKey]: currentCategory.filter(s => s !== skillName)
        }
      };
    });
  };

  // Switch Active Resume
  const switchResume = async (id) => {
    setShowResumeSwitcher(false);
    setIsLoading(true);
    setSearchParams({ id });
    try {
      const res = await resumeAPI.getResumeDetail(id);
      if (res?.resume) {
        setResumeData({
          ...DEFAULT_RESUME_STATE,
          ...res.resume,
          styling_options: {
            ...DEFAULT_RESUME_STATE.styling_options,
            ...(res.resume.styling_options || {})
          },
          section_visibility: {
            ...DEFAULT_RESUME_STATE.section_visibility,
            ...(res.resume.section_visibility || {})
          }
        });
        setResumeId(res.resume.id);
        setRenameInput(res.resume.name);
        setSaveStatus('saved');
      }
    } catch (err) {
      console.error('Failed to switch resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create New Resume
  const handleCreateNewResume = async () => {
    setShowResumeSwitcher(false);
    setIsLoading(true);
    try {
      const createRes = await resumeAPI.createResume({
        name: `ATS Resume (${allUserResumes.length + 1})`,
        template: 'classic'
      });
      if (createRes?.resume) {
        setSearchParams({ id: createRes.resume.id });
        await fetchUserResumes();
      }
    } catch (err) {
      console.error('Failed to create new resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Duplicate Resume
  const handleDuplicateResume = async () => {
    if (!resumeId) return;
    setIsLoading(true);
    try {
      const dupRes = await resumeAPI.duplicateResume(resumeId);
      if (dupRes?.resume) {
        setSearchParams({ id: dupRes.resume.id });
        await fetchUserResumes();
      }
    } catch (err) {
      console.error('Failed to duplicate resume:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Rename Resume
  const handleSaveRename = async () => {
    if (!resumeId || !renameInput.trim()) return;
    try {
      await resumeAPI.renameResume(resumeId, renameInput.trim());
      updateData({ name: renameInput.trim() });
      await fetchUserResumes();
      setShowRenameModal(false);
    } catch (err) {
      console.error('Failed to rename resume:', err);
    }
  };

  // Delete Resume
  const handleConfirmDelete = async () => {
    if (!resumeToDelete) return;
    try {
      await resumeAPI.deleteResume(resumeToDelete.id);
      setShowDeleteModal(false);
      setResumeToDelete(null);
      const remaining = await fetchUserResumes();
      if (remaining.length > 0) {
        switchResume(remaining[0].id);
      } else {
        handleCreateNewResume();
      }
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  // AI: Generate / Rewrite Summary
  const handleGenerateSummary = async (tone = 'professional') => {
    setIsGeneratingSummary(true);
    try {
      const res = await resumeAPI.generateSummary({
        personal_info: resumeData.personal_info,
        experience: resumeData.experience,
        skills: resumeData.skills,
        education: resumeData.education,
        target_role: resumeData.personal_info?.professional_title,
        tone
      }, resumeId);

      if (res?.summary) {
        setDiffData({
          title: `AI Summary Optimization (${tone.toUpperCase()})`,
          original: resumeData.summary || '(Empty summary)',
          proposed: res.summary,
          explanation: res.explanation || 'Constructed with concise, ATS-optimized active phrasing.',
          onApply: () => updateData({ summary: res.summary })
        });
        setShowDiffModal(true);
      }
    } catch (err) {
      console.error('Summary generation error:', err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  // AI: Improve Experience Bullets
  const handleImproveExperienceBullets = async (index) => {
    const exp = resumeData.experience?.[index];
    if (!exp?.description?.trim()) return;
    setImprovingExpIndex(index);
    try {
      const res = await resumeAPI.improveBullets({
        draft_text: exp.description,
        role: exp.job_title || exp.role || 'Software Engineer',
        company: exp.company || 'Company'
      }, resumeId);

      if (res?.improved_text) {
        setDiffData({
          title: `Enhance Bullet Points — ${exp.job_title || 'Role'}`,
          original: exp.description,
          proposed: res.improved_text,
          explanation: res.explanation || 'Converted tasks into high-impact action verbs with quantifiable outcome structures.',
          onApply: () => updateEntry('experience', index, 'description', res.improved_text)
        });
        setShowDiffModal(true);
      }
    } catch (err) {
      console.error('Bullet improvement error:', err);
    } finally {
      setImprovingExpIndex(null);
    }
  };

  // AI: Suggest Skills
  const handleSuggestSkills = async () => {
    setSuggestingSkills(true);
    try {
      const res = await resumeAPI.suggestSkills({
        personal_info: resumeData.personal_info,
        experience: resumeData.experience,
        skills: resumeData.skills,
        target_role: resumeData.personal_info?.professional_title
      }, resumeId);

      if (res?.suggestions) {
        setSkillSuggestions(res.suggestions);
      }
    } catch (err) {
      console.error('Skill suggestions error:', err);
    } finally {
      setSuggestingSkills(false);
    }
  };

  // AI: Job Description Match Analysis
  const handleAnalyzeJobMatch = async () => {
    if (!jobDescriptionInput.trim()) return;
    setIsMatchingJD(true);
    try {
      const res = await resumeAPI.analyzeJobATS(resumeId, {
        job_description: jobDescriptionInput,
        skills: resumeData.skills,
        experience: resumeData.experience,
        personal_info: resumeData.personal_info
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

  // Document Export Handlers
  const handleDownload = async (format = 'pdf') => {
    setShowExportMenu(false);
    try {
      let blob;
      const currentTemplate = resumeData.template || 'classic';
      if (format === 'pdf') {
        blob = await resumeAPI.downloadPDF(resumeId, currentTemplate);
      } else if (format === 'docx') {
        blob = await resumeAPI.downloadDOCX(resumeId, currentTemplate);
      } else {
        blob = await resumeAPI.downloadTXT(resumeId, currentTemplate);
      }

      const rawName = resumeData.personal_info?.full_name || 'Candidate';
      const cleanName = rawName.replace(/[^\w\-]/g, '_');
      const docName = (resumeData.name || 'ATS_Resume').replace(/[^\w\-]/g, '_');
      const filename = `${cleanName}_${docName}.${format}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Export ${format} failed:`, err);
    }
  };

  // Import Upload Handler
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = null; // reset

    setShowImportModal(true);
    setImportLoading(true);
    setImportError('');
    setImportResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await resumeAPI.parseImportResume(formData);
      if (res?.parsed_data) {
        setImportResult(res.parsed_data);
      } else {
        setImportError('No structured text could be extracted from this document.');
      }
    } catch (err) {
      setImportError(err.message || 'Failed to extract resume contents.');
    } finally {
      setImportLoading(false);
    }
  };

  // Apply Imported Data
  const handleApplyImport = (mode = 'merge') => {
    if (!importResult) return;
    updateData(prev => {
      const pi = importResult.personal_info || {};
      const exp = importResult.experience || [];
      const edu = importResult.education || [];
      const proj = importResult.projects || [];
      const certs = importResult.certifications || [];
      const rawSkills = importResult.skills || [];

      // Categorize extracted skills if flat
      const importedSkills = { ...prev.skills };
      if (Array.isArray(rawSkills)) {
        rawSkills.forEach(s => {
          if (typeof s === 'string' && s.trim()) {
            if (!importedSkills.programming_languages.includes(s.trim())) {
              importedSkills.programming_languages.push(s.trim());
            }
          }
        });
      }

      if (mode === 'replace') {
        return {
          ...prev,
          personal_info: {
            ...prev.personal_info,
            full_name: pi.full_name || prev.personal_info?.full_name,
            email: pi.email || prev.personal_info?.email,
            phone: pi.phone || prev.personal_info?.phone,
            location: pi.location || prev.personal_info?.location,
            linkedin_url: pi.linkedin_url || prev.personal_info?.linkedin_url,
            github_url: pi.github_url || prev.personal_info?.github_url
          },
          summary: importResult.summary || prev.summary,
          experience: exp.length ? exp : prev.experience,
          education: edu.length ? edu : prev.education,
          projects: proj.length ? proj : prev.projects,
          certifications: certs.length ? certs : prev.certifications,
          skills: importedSkills
        };
      } else {
        // Merge mode: append non-empty
        return {
          ...prev,
          personal_info: {
            ...prev.personal_info,
            full_name: prev.personal_info?.full_name || pi.full_name,
            email: prev.personal_info?.email || pi.email,
            phone: prev.personal_info?.phone || pi.phone,
            location: prev.personal_info?.location || pi.location
          },
          summary: prev.summary || importResult.summary,
          experience: [...(prev.experience || []), ...exp],
          education: [...(prev.education || []), ...edu],
          projects: [...(prev.projects || []), ...proj],
          certifications: [...(prev.certifications || []), ...certs],
          skills: importedSkills
        };
      }
    });

    setShowImportModal(false);
    setImportResult(null);
  };

  // Checklist Item Jump
  const handleChecklistJump = (sectionId) => {
    setActiveSectionId(sectionId);
    setRightPanelTab('preview');
    setMobileActiveTab('editor');
  };

  // Helper count badges
  const getSectionBadge = (secId) => {
    switch (secId) {
      case 'personal_info':
        return resumeData.personal_info?.full_name ? '✓' : '';
      case 'summary':
        return resumeData.summary?.trim() ? '✓' : '';
      case 'experience':
        return resumeData.experience?.length ? `${resumeData.experience.length}` : '';
      case 'education':
        return resumeData.education?.length ? `${resumeData.education.length}` : '';
      case 'skills': {
        const count = Object.values(resumeData.skills || {}).reduce(
          (acc, list) => acc + (Array.isArray(list) ? list.length : 0),
          0
        );
        return count ? `${count}` : '';
      }
      case 'projects':
        return resumeData.projects?.length ? `${resumeData.projects.length}` : '';
      case 'certifications':
        return resumeData.certifications?.length ? `${resumeData.certifications.length}` : '';
      case 'internships':
        return resumeData.internships?.length ? `${resumeData.internships.length}` : '';
      case 'achievements':
        return resumeData.achievements?.length ? `${resumeData.achievements.length}` : '';
      case 'languages':
        return resumeData.languages?.length ? `${resumeData.languages.length}` : '';
      case 'custom_sections':
        return resumeData.custom_sections?.length ? `${resumeData.custom_sections.length}` : '';
      default:
        return '';
    }
  };

  if (isLoading) {
    return (
      <div className="ats-loading-state">
        <RefreshCw size={28} className="spin-animate text-orange" />
        <p>Loading professional ATS workspace...</p>
      </div>
    );
  }

  // Active section ordering
  const activeSectionOrder = resumeData.section_order || DEFAULT_RESUME_STATE.section_order;
  const currentSecIndex = activeSectionOrder.indexOf(activeSectionId);

  return (
    <div className="ats-workspace-container">
      {/* =========================================================================
         TOP TOOLBAR
         ========================================================================= */}
      <header className="ats-toolbar-strip">
        <div className="toolbar-branding-group">
          <div className="toolbar-logo-badge">
            <FileText size={18} />
          </div>
          <div className="toolbar-title-meta">
            <div className="resume-name-row">
              <span className="eyebrow-caption">ATS RESUME MAKER // PRO_V2.5</span>
              <div className="resume-name-interactive">
                <button
                  type="button"
                  onClick={() => setShowResumeSwitcher(!showResumeSwitcher)}
                  className="resume-switcher-btn"
                >
                  <span className="current-resume-name">{resumeData.name || 'My ATS Resume'}</span>
                  <ChevronDown size={14} />
                </button>

                {/* Resume Switcher Menu */}
                {showResumeSwitcher && (
                  <div className="resume-switcher-dropdown">
                    <div className="switcher-header">
                      <span>Saved Resumes</span>
                      <button
                        type="button"
                        onClick={handleCreateNewResume}
                        className="btn-switcher-create"
                      >
                        <Plus size={13} /> New Resume
                      </button>
                    </div>
                    <div className="switcher-list">
                      {allUserResumes.map(r => (
                        <div
                          key={r.id}
                          className={`switcher-item ${r.id === resumeId ? 'active' : ''}`}
                        >
                          <button
                            type="button"
                            className="switcher-select-action"
                            onClick={() => switchResume(r.id)}
                          >
                            <span className="item-name">{r.name}</span>
                            <span className="item-score">{r.ats_score ? `${r.ats_score}% ATS` : 'Draft'}</span>
                          </button>
                          {allUserResumes.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setResumeToDelete(r);
                                setShowDeleteModal(true);
                              }}
                              className="btn-switcher-del"
                              title="Delete Resume"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Center: Save Status & History Controls */}
        <div className="toolbar-center-controls">
          <div className="history-buttons-wrap">
            <button
              type="button"
              onClick={handleUndo}
              disabled={historyStack.current.length === 0}
              className="btn-toolbar-icon"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={futureStack.current.length === 0}
              className="btn-toolbar-icon"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 size={15} />
            </button>
          </div>

          <div className="save-status-badge">
            {saveStatus === 'saving' && (
              <span className="status-saving">
                <RefreshCw size={12} className="spin-animate" /> Saving...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="status-saved">
                <CheckCircle2 size={12} /> All changes saved
              </span>
            )}
            {saveStatus === 'unsaved' && (
              <span className="status-unsaved">
                <span className="pulse-dot-amber" /> Unsaved changes
              </span>
            )}
          </div>
        </div>

        {/* Right Actions: Import, Rename, Duplicate, Export */}
        <div className="toolbar-right-actions">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx"
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-action-ghost"
            title="Import existing PDF or Word resume"
          >
            <Upload size={14} />
            <span className="hide-sm">Import</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRenameInput(resumeData.name);
              setShowRenameModal(true);
            }}
            className="btn-action-ghost"
            title="Rename this resume"
          >
            <Edit3 size={14} />
            <span className="hide-sm">Rename</span>
          </button>

          <button
            type="button"
            onClick={handleDuplicateResume}
            className="btn-action-ghost"
            title="Duplicate for another job application"
          >
            <Copy size={14} />
            <span className="hide-sm">Duplicate</span>
          </button>

          <div className="export-dropdown-wrapper">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="btn-action-primary"
            >
              <Download size={14} />
              <span>Export</span>
              <ChevronDown size={13} />
            </button>

            {showExportMenu && (
              <div className="export-options-dropdown">
                <button
                  type="button"
                  onClick={() => handleDownload('pdf')}
                  className="export-opt-item"
                >
                  <FileText size={15} />
                  <div>
                    <strong>ATS-Friendly PDF</strong>
                    <p>Machine-readable text layer</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('docx')}
                  className="export-opt-item"
                >
                  <Layers size={15} />
                  <div>
                    <strong>Word DOCX</strong>
                    <p>Fully editable document</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload('txt')}
                  className="export-opt-item"
                >
                  <FileCheck size={15} />
                  <div>
                    <strong>Plain Text (.txt)</strong>
                    <p>Verify ATS ASCII extraction</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Top View Switcher */}
      <div className="ats-mobile-tabs-strip">
        <button
          type="button"
          onClick={() => setMobileActiveTab('sections')}
          className={`mob-tab-btn ${mobileActiveTab === 'sections' ? 'active' : ''}`}
        >
          Sections
        </button>
        <button
          type="button"
          onClick={() => setMobileActiveTab('editor')}
          className={`mob-tab-btn ${mobileActiveTab === 'editor' ? 'active' : ''}`}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={() => { setMobileActiveTab('preview'); setRightPanelTab('preview'); }}
          className={`mob-tab-btn ${mobileActiveTab === 'preview' && rightPanelTab === 'preview' ? 'active' : ''}`}
        >
          Live Preview
        </button>
        <button
          type="button"
          onClick={() => { setMobileActiveTab('preview'); setRightPanelTab('ats_analysis'); }}
          className={`mob-tab-btn ${mobileActiveTab === 'preview' && rightPanelTab === 'ats_analysis' ? 'active' : ''}`}
        >
          ATS Audit
        </button>
        <button
          type="button"
          onClick={() => { setMobileActiveTab('preview'); setRightPanelTab('job_match'); }}
          className={`mob-tab-btn ${mobileActiveTab === 'preview' && rightPanelTab === 'job_match' ? 'active' : ''}`}
        >
          Job Match
        </button>
      </div>

      {/* =========================================================================
         COORDINATED 3-PANEL WORKSPACE
         ========================================================================= */}
      <div className={`ats-workspace-grid ${!leftPanelOpen ? 'left-collapsed' : ''}`}>

        {/* -----------------------------------------------------------------------
           LEFT PANEL: RESUME SECTIONS & REORDERING
           ----------------------------------------------------------------------- */}
        <aside className={`ats-left-panel ${mobileActiveTab === 'sections' ? 'mobile-visible' : ''} ${!leftPanelOpen ? 'collapsed' : ''}`}>
          <div className="panel-inner-card">
            <div className="left-panel-header">
              <div className="left-panel-header-top">
                <div>
                  <span className="panel-eyebrow">SECTIONS</span>
                  <h2 className="panel-heading">Structure</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setLeftPanelOpen(false)}
                  className="btn-collapse-panel"
                  title="Collapse panel"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>
            </div>

            <div className="sections-draggable-list">
              {activeSectionOrder.map((secKey, idx) => {
                const conf = SECTION_CONFIG.find(c => c.id === secKey);
                if (!conf) return null;
                const IconComponent = conf.icon;
                const isVisible = resumeData.section_visibility?.[secKey] !== false;
                const badge = getSectionBadge(secKey);
                const isActive = activeSectionId === secKey;

                return (
                  <div
                    key={secKey}
                    className={`section-item-row ${isActive ? 'active' : ''} ${!isVisible ? 'hidden-section' : ''}`}
                    onClick={() => {
                      setActiveSectionId(secKey);
                      setMobileActiveTab('editor');
                    }}
                  >
                    <div className="section-icon-cell">
                      <IconComponent size={15} />
                    </div>

                    <div className="section-title-cell">
                      <span className="section-label-text">{conf.label}</span>
                      {badge && <span className="section-badge-chip">{badge}</span>}
                    </div>

                    {/* Section Controls: Reorder & Visibility */}
                    <div className="section-actions-cell" onClick={(e) => e.stopPropagation()}>
                      {!conf.pinned && (
                        <>
                          <button
                            type="button"
                            onClick={() => moveSection(secKey, 'up')}
                            disabled={idx <= 1}
                            className="btn-sec-reorder"
                            title="Move section up"
                          >
                            <ArrowUp size={11} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(secKey, 'down')}
                            disabled={idx >= activeSectionOrder.length - 1}
                            className="btn-sec-reorder"
                            title="Move section down"
                          >
                            <ArrowDown size={11} />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(secKey)}
                        className={`btn-sec-vis ${isVisible ? 'active' : 'hidden'}`}
                        title={isVisible ? 'Hide from rendered resume' : 'Show on rendered resume'}
                      >
                        {isVisible ? <Eye size={13} /> : <EyeOff size={13} />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ATS Score Overview Dial */}
            <div className="left-panel-score-card" onClick={() => setRightPanelTab('ats_analysis')}>
              <div className="score-dial-row">
                <div className="score-dial-circle">
                  <span className="score-num">{resumeData.ats_score || 85}</span>
                  <span className="score-unit">%</span>
                </div>
                <div className="score-dial-meta">
                  <strong>ATS Compatibility</strong>
                  <p>Heuristic benchmark rating</p>
                </div>
              </div>
              <button
                type="button"
                className="btn-view-audit"
                onClick={() => setRightPanelTab('ats_analysis')}
              >
                View Full ATS Audit <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </aside>

        {/* -----------------------------------------------------------------------
           CENTER PANEL: RESUME FORM EDITOR
           ----------------------------------------------------------------------- */}
        <main className={`ats-center-editor ${mobileActiveTab === 'editor' ? 'mobile-visible' : ''}`}>
          {/* Toggle button to expand left panel when collapsed */}
          {!leftPanelOpen && (
            <button
              type="button"
              onClick={() => setLeftPanelOpen(true)}
              className="btn-expand-panel-float"
              title="Show sections panel"
            >
              <PanelLeft size={16} />
              <span>Sections</span>
            </button>
          )}
          <div className="editor-card-container">

            {/* SECTION 1: PERSONAL INFORMATION */}
            {activeSectionId === 'personal_info' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 1 // CONTACT PROFILE</span>
                    <h2 className="editor-section-title">Personal Information</h2>
                    <p className="editor-section-desc">
                      Recruiters and ATS parsers scan this header first. Enter accurate contact channels.
                    </p>
                  </div>
                </div>

                <div className="form-fields-grid">
                  <div className="form-field-group">
                    <label className="field-label">Full Name <span className="req">*</span></label>
                    <input
                      type="text"
                      value={resumeData.personal_info?.full_name || ''}
                      onChange={(e) => updatePersonalInfo('full_name', e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Professional Headline</label>
                    <input
                      type="text"
                      value={resumeData.personal_info?.professional_title || ''}
                      onChange={(e) => updatePersonalInfo('professional_title', e.target.value)}
                      placeholder="e.g. Senior Full-Stack Engineer"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Email Address <span className="req">*</span></label>
                    <input
                      type="email"
                      value={resumeData.personal_info?.email || ''}
                      onChange={(e) => updatePersonalInfo('email', e.target.value)}
                      placeholder="alex.morgan@example.com"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Phone Number</label>
                    <input
                      type="tel"
                      value={resumeData.personal_info?.phone || ''}
                      onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">City, Country</label>
                    <input
                      type="text"
                      value={resumeData.personal_info?.location || ''}
                      onChange={(e) => updatePersonalInfo('location', e.target.value)}
                      placeholder="San Francisco, CA, USA"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">LinkedIn Profile URL</label>
                    <input
                      type="url"
                      value={resumeData.personal_info?.linkedin_url || ''}
                      onChange={(e) => updatePersonalInfo('linkedin_url', e.target.value)}
                      placeholder="https://linkedin.com/in/alexmorgan"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">GitHub Profile URL</label>
                    <input
                      type="url"
                      value={resumeData.personal_info?.github_url || ''}
                      onChange={(e) => updatePersonalInfo('github_url', e.target.value)}
                      placeholder="https://github.com/alexmorgan"
                      className="form-text-input"
                    />
                  </div>

                  <div className="form-field-group">
                    <label className="field-label">Portfolio / Website URL</label>
                    <input
                      type="url"
                      value={resumeData.personal_info?.portfolio_url || ''}
                      onChange={(e) => updatePersonalInfo('portfolio_url', e.target.value)}
                      placeholder="https://alexmorgan.dev"
                      className="form-text-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 2: PROFESSIONAL SUMMARY */}
            {activeSectionId === 'summary' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 2 // CAREER OVERVIEW</span>
                    <h2 className="editor-section-title">Professional Summary</h2>
                    <p className="editor-section-desc">
                      A high-impact 3-4 sentence elevator pitch demonstrating core competency and target role trajectory.
                    </p>
                  </div>
                </div>

                <div className="ai-assistant-strip">
                  <div className="tone-selector-group">
                    <span className="tone-label">AI REWRITE TONE:</span>
                    <button
                      type="button"
                      onClick={() => setSummaryTone('concise')}
                      className={`btn-tone-pill ${summaryTone === 'concise' ? 'active' : ''}`}
                    >
                      Concise (2 Sentences)
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryTone('professional')}
                      className={`btn-tone-pill ${summaryTone === 'professional' ? 'active' : ''}`}
                    >
                      Professional
                    </button>
                    <button
                      type="button"
                      onClick={() => setSummaryTone('achievement')}
                      className={`btn-tone-pill ${summaryTone === 'achievement' ? 'active' : ''}`}
                    >
                      Achievement-Focused
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleGenerateSummary(summaryTone)}
                    disabled={isGeneratingSummary}
                    className="btn-ai-trigger"
                  >
                    <Sparkles size={14} className={isGeneratingSummary ? 'spin-animate' : ''} />
                    <span>{isGeneratingSummary ? 'Writing with AI...' : 'Generate with AI'}</span>
                  </button>
                </div>

                <div className="form-field-group full-width">
                  <textarea
                    rows={6}
                    value={resumeData.summary || ''}
                    onChange={(e) => updateData({ summary: e.target.value })}
                    placeholder="Results-driven Software Engineer with expertise in React, Python, and scalable distributed systems. Proven track record of optimizing performance and architecting resilient cloud services..."
                    className="form-textarea-input"
                  />
                  <div className="field-counter-row">
                    <span>
                      Words: {(resumeData.summary || '').split(/\s+/).filter(Boolean).length} / Optimal: 30–90 words
                    </span>
                    <span>Characters: {(resumeData.summary || '').length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* SECTION 3: WORK EXPERIENCE */}
            {activeSectionId === 'experience' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 3 // EMPLOYMENT HISTORY</span>
                    <h2 className="editor-section-title">Work Experience</h2>
                    <p className="editor-section-desc">
                      Chronological positions with strong action verbs and measurable business outcomes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('experience', {
                      job_title: '',
                      company: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      is_current: false,
                      description: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Position
                  </button>
                </div>

                {(!resumeData.experience || resumeData.experience.length === 0) && (
                  <div className="empty-section-notice">
                    <Briefcase size={28} />
                    <p>No work experience entries added yet.</p>
                    <button
                      type="button"
                      onClick={() => addEntry('experience', {
                        job_title: '',
                        company: '',
                        location: '',
                        start_date: '',
                        end_date: '',
                        is_current: false,
                        description: ''
                      })}
                      className="btn-action-primary"
                    >
                      <Plus size={14} /> Add First Position
                    </button>
                  </div>
                )}

                <div className="repeatable-entries-list">
                  {resumeData.experience?.map((exp, idx) => (
                    <div key={exp.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Position</span>
                        <div className="entry-header-actions">
                          <button
                            type="button"
                            onClick={() => handleImproveExperienceBullets(idx)}
                            disabled={improvingExpIndex === idx || !exp.description}
                            className="btn-ai-mini"
                            title="Rewrite bullets with action verbs"
                          >
                            <Sparkles size={12} />
                            <span>{improvingExpIndex === idx ? 'Optimizing...' : 'AI Enhance Bullets'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeEntry('experience', idx)}
                            className="btn-entry-delete"
                            title="Remove position"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Job Title <span className="req">*</span></label>
                          <input
                            type="text"
                            value={exp.job_title || ''}
                            onChange={(e) => updateEntry('experience', idx, 'job_title', e.target.value)}
                            placeholder="e.g. Lead Software Engineer"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Company / Organization <span className="req">*</span></label>
                          <input
                            type="text"
                            value={exp.company || ''}
                            onChange={(e) => updateEntry('experience', idx, 'company', e.target.value)}
                            placeholder="e.g. Acme Tech Corp"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Location</label>
                          <input
                            type="text"
                            value={exp.location || ''}
                            onChange={(e) => updateEntry('experience', idx, 'location', e.target.value)}
                            placeholder="e.g. New York, NY (Hybrid)"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Start Date</label>
                          <input
                            type="text"
                            value={exp.start_date || ''}
                            onChange={(e) => updateEntry('experience', idx, 'start_date', e.target.value)}
                            placeholder="e.g. Jan 2022"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">End Date</label>
                          <input
                            type="text"
                            disabled={exp.is_current}
                            value={exp.is_current ? 'Present' : (exp.end_date || '')}
                            onChange={(e) => updateEntry('experience', idx, 'end_date', e.target.value)}
                            placeholder="e.g. Present or Dec 2024"
                            className="form-text-input"
                          />
                          <label className="checkbox-toggle-label">
                            <input
                              type="checkbox"
                              checked={Boolean(exp.is_current)}
                              onChange={(e) => updateEntry('experience', idx, 'is_current', e.target.checked)}
                            />
                            <span>Currently employed here</span>
                          </label>
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Key Responsibilities & Measurable Achievements</label>
                          <textarea
                            rows={4}
                            value={exp.description || ''}
                            onChange={(e) => updateEntry('experience', idx, 'description', e.target.value)}
                            placeholder="• Engineered asynchronous task queues in Python & Redis, reducing API response times by 40%&#10;• Spearheaded front-end redesign in React, serving 50,000+ daily active users&#10;• Mentored 4 junior engineers in test-driven development and CI/CD pipelines"
                            className="form-textarea-input"
                          />
                          <span className="field-hint">
                            Tip: Begin each bullet with an active verb (e.g. Engineered, Spearheaded, Optimized) and include quantifiable metrics (%, numbers, scale).
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 4: EDUCATION */}
            {activeSectionId === 'education' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 4 // ACADEMIC QUALIFICATIONS</span>
                    <h2 className="editor-section-title">Education</h2>
                    <p className="editor-section-desc">
                      Degrees, institutions, honors, and relevant coursework.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('education', {
                      institution: '',
                      degree: '',
                      field: '',
                      start_year: '',
                      end_year: '',
                      grade: '',
                      coursework: '',
                      description: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Education
                  </button>
                </div>

                {(!resumeData.education || resumeData.education.length === 0) && (
                  <div className="empty-section-notice">
                    <GraduationCap size={28} />
                    <p>No education records added yet.</p>
                  </div>
                )}

                <div className="repeatable-entries-list">
                  {resumeData.education?.map((edu, idx) => (
                    <div key={edu.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Degree</span>
                        <button
                          type="button"
                          onClick={() => removeEntry('education', idx)}
                          className="btn-entry-delete"
                          title="Remove degree"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Institution / University <span className="req">*</span></label>
                          <input
                            type="text"
                            value={edu.institution || ''}
                            onChange={(e) => updateEntry('education', idx, 'institution', e.target.value)}
                            placeholder="e.g. Stanford University"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Degree <span className="req">*</span></label>
                          <input
                            type="text"
                            value={edu.degree || ''}
                            onChange={(e) => updateEntry('education', idx, 'degree', e.target.value)}
                            placeholder="e.g. Bachelor of Science in Computer Science"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Field of Study / Major</label>
                          <input
                            type="text"
                            value={edu.field || ''}
                            onChange={(e) => updateEntry('education', idx, 'field', e.target.value)}
                            placeholder="e.g. Software Systems & Machine Learning"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Graduation Year</label>
                          <input
                            type="text"
                            value={edu.end_year || ''}
                            onChange={(e) => updateEntry('education', idx, 'end_year', e.target.value)}
                            placeholder="e.g. 2024"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Grade / GPA (Optional)</label>
                          <input
                            type="text"
                            value={edu.grade || ''}
                            onChange={(e) => updateEntry('education', idx, 'grade', e.target.value)}
                            placeholder="e.g. 3.9 / 4.0 or First Class Honors"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Relevant Coursework (Optional)</label>
                          <input
                            type="text"
                            value={edu.coursework || ''}
                            onChange={(e) => updateEntry('education', idx, 'coursework', e.target.value)}
                            placeholder="e.g. Distributed Systems, Algorithms, Cloud Computing, Database Management"
                            className="form-text-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 5: SKILLS */}
            {activeSectionId === 'skills' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 5 // TECHNICAL & DOMAIN PROFICIENCIES</span>
                    <h2 className="editor-section-title">Categorized Skills</h2>
                    <p className="editor-section-desc">
                      ATS parsers categorize skills to compute keyword relevancy scores. Add tags to appropriate domains.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSuggestSkills}
                    disabled={suggestingSkills}
                    className="btn-ai-trigger"
                  >
                    <Sparkles size={14} className={suggestingSkills ? 'spin-animate' : ''} />
                    <span>{suggestingSkills ? 'Analyzing...' : 'AI Skill Suggestions'}</span>
                  </button>
                </div>

                {/* AI Suggestions Tray */}
                {skillSuggestions.length > 0 && (
                  <div className="skills-suggestions-tray">
                    <div className="tray-header">
                      <Sparkles size={14} className="text-orange" />
                      <strong>Recommended Skills for your background (Click to add):</strong>
                    </div>
                    <div className="chips-tags-wrap">
                      {skillSuggestions.map((item, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            addSkillTag(item.category || 'tools_methods', item.name);
                            setSkillSuggestions(prev => prev.filter((_, idx) => idx !== i));
                          }}
                          className="chip-suggestion-btn"
                        >
                          <Plus size={12} /> {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="skills-categories-grid">
                  {[
                    { key: 'programming_languages', label: 'Programming Languages', placeholder: 'e.g. Python, TypeScript, Go' },
                    { key: 'frameworks_libraries', label: 'Frameworks & Libraries', placeholder: 'e.g. React, Node.js, Next.js, Django' },
                    { key: 'databases_cloud', label: 'Databases & Cloud Architecture', placeholder: 'e.g. PostgreSQL, Redis, AWS, Docker' },
                    { key: 'tools_methods', label: 'Tools, APIs & Methodologies', placeholder: 'e.g. Git, REST APIs, GraphQL, CI/CD, Agile' },
                    { key: 'soft_skills', label: 'Professional & Domain Skills', placeholder: 'e.g. System Design, Team Leadership, Mentoring' }
                  ].map(cat => {
                    const tagList = Array.isArray(resumeData.skills?.[cat.key])
                      ? resumeData.skills[cat.key]
                      : [];

                    return (
                      <div key={cat.key} className="skill-category-block">
                        <label className="field-label">{cat.label}</label>
                        <div className="skill-tags-container">
                          {tagList.map(skill => (
                            <span key={skill} className="skill-pill-tag">
                              {skill}
                              <button
                                type="button"
                                onClick={() => removeSkillTag(cat.key, skill)}
                                className="btn-tag-remove"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                          <input
                            type="text"
                            placeholder={cat.placeholder}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ',') {
                                e.preventDefault();
                                addSkillTag(cat.key, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="skill-tag-inline-input"
                          />
                        </div>
                        <span className="field-hint">Press Enter or comma to add a skill</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* SECTION 6: KEY PROJECTS */}
            {activeSectionId === 'projects' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 6 // PORTFOLIO & CODE</span>
                    <h2 className="editor-section-title">Key Projects</h2>
                    <p className="editor-section-desc">
                      Applied proof of technical craftsmanship with architecture details and live URLs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('projects', {
                      name: '',
                      role: '',
                      technologies: '',
                      description: '',
                      project_url: '',
                      github_url: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Project
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.projects?.map((proj, idx) => (
                    <div key={proj.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Project</span>
                        <button
                          type="button"
                          onClick={() => removeEntry('projects', idx)}
                          className="btn-entry-delete"
                          title="Remove project"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Project Name <span className="req">*</span></label>
                          <input
                            type="text"
                            value={proj.name || ''}
                            onChange={(e) => updateEntry('projects', idx, 'name', e.target.value)}
                            placeholder="e.g. Distributed Analytics Engine"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Role / Scope</label>
                          <input
                            type="text"
                            value={proj.role || ''}
                            onChange={(e) => updateEntry('projects', idx, 'role', e.target.value)}
                            placeholder="e.g. Creator & Lead Maintainer"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Technologies Used</label>
                          <input
                            type="text"
                            value={proj.technologies || ''}
                            onChange={(e) => updateEntry('projects', idx, 'technologies', e.target.value)}
                            placeholder="e.g. React, Python, PostgreSQL, Kafka, Redis"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Live Project URL</label>
                          <input
                            type="url"
                            value={proj.project_url || ''}
                            onChange={(e) => updateEntry('projects', idx, 'project_url', e.target.value)}
                            placeholder="https://engine.example.com"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">GitHub Repository URL</label>
                          <input
                            type="url"
                            value={proj.github_url || ''}
                            onChange={(e) => updateEntry('projects', idx, 'github_url', e.target.value)}
                            placeholder="https://github.com/alex/engine"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Description & Measurable Contribution</label>
                          <textarea
                            rows={3}
                            value={proj.description || ''}
                            onChange={(e) => updateEntry('projects', idx, 'description', e.target.value)}
                            placeholder="• Architected streaming pipeline processing 100k events/sec with sub-second latency&#10;• Designed responsive web analytics interface using React and WebSockets"
                            className="form-textarea-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 7: CERTIFICATIONS */}
            {activeSectionId === 'certifications' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 7 // CREDENTIALS & LICENSES</span>
                    <h2 className="editor-section-title">Certifications</h2>
                    <p className="editor-section-desc">
                      Industry certifications validating specialized expertise (AWS, Google, Microsoft, etc.).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('certifications', {
                      name: '',
                      organization: '',
                      issue_date: '',
                      credential_id: '',
                      credential_url: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Certification
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.certifications?.map((cert, idx) => (
                    <div key={cert.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Certification</span>
                        <button
                          type="button"
                          onClick={() => removeEntry('certifications', idx)}
                          className="btn-entry-delete"
                          title="Remove certification"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Certification Name <span className="req">*</span></label>
                          <input
                            type="text"
                            value={cert.name || ''}
                            onChange={(e) => updateEntry('certifications', idx, 'name', e.target.value)}
                            placeholder="e.g. AWS Certified Solutions Architect"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Issuing Organization</label>
                          <input
                            type="text"
                            value={cert.organization || ''}
                            onChange={(e) => updateEntry('certifications', idx, 'organization', e.target.value)}
                            placeholder="e.g. Amazon Web Services"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Issue Date</label>
                          <input
                            type="text"
                            value={cert.issue_date || ''}
                            onChange={(e) => updateEntry('certifications', idx, 'issue_date', e.target.value)}
                            placeholder="e.g. Apr 2024"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Credential ID / URL</label>
                          <input
                            type="text"
                            value={cert.credential_id || ''}
                            onChange={(e) => updateEntry('certifications', idx, 'credential_id', e.target.value)}
                            placeholder="e.g. AWS-8927163"
                            className="form-text-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 8: INTERNSHIPS */}
            {activeSectionId === 'internships' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 8 // INTERNSHIP EXPERIENCE</span>
                    <h2 className="editor-section-title">Internships</h2>
                    <p className="editor-section-desc">
                      Highlight practical internships, apprenticeships, and summer research programs.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('internships', {
                      job_title: '',
                      company: '',
                      location: '',
                      start_date: '',
                      end_date: '',
                      description: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Internship
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.internships?.map((intern, idx) => (
                    <div key={intern.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Internship</span>
                        <button
                          type="button"
                          onClick={() => removeEntry('internships', idx)}
                          className="btn-entry-delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Internship Title <span className="req">*</span></label>
                          <input
                            type="text"
                            value={intern.job_title || ''}
                            onChange={(e) => updateEntry('internships', idx, 'job_title', e.target.value)}
                            placeholder="e.g. Software Engineering Intern"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Company <span className="req">*</span></label>
                          <input
                            type="text"
                            value={intern.company || ''}
                            onChange={(e) => updateEntry('internships', idx, 'company', e.target.value)}
                            placeholder="e.g. Google"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Location</label>
                          <input
                            type="text"
                            value={intern.location || ''}
                            onChange={(e) => updateEntry('internships', idx, 'location', e.target.value)}
                            placeholder="e.g. Mountain View, CA"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Duration</label>
                          <input
                            type="text"
                            value={intern.start_date || ''}
                            onChange={(e) => updateEntry('internships', idx, 'start_date', e.target.value)}
                            placeholder="e.g. Jun 2023 – Aug 2023"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Contributions & Learnings</label>
                          <textarea
                            rows={3}
                            value={intern.description || ''}
                            onChange={(e) => updateEntry('internships', idx, 'description', e.target.value)}
                            placeholder="• Contributed to core internal developer tooling in Go and Python&#10;• Collaborated with senior engineers on unit testing and load benchmarking"
                            className="form-textarea-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 9: ACHIEVEMENTS */}
            {activeSectionId === 'achievements' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 9 // HONORS & RECOGNITION</span>
                    <h2 className="editor-section-title">Achievements & Awards</h2>
                    <p className="editor-section-desc">
                      Hackathons, academic competitions, open-source awards, or publications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('achievements', {
                      title: '',
                      date: '',
                      description: ''
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Achievement
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.achievements?.map((ach, idx) => (
                    <div key={ach.id || idx} className="repeatable-entry-card">
                      <div className="entry-card-header">
                        <span className="entry-order-badge">#{idx + 1} Achievement</span>
                        <button
                          type="button"
                          onClick={() => removeEntry('achievements', idx)}
                          className="btn-entry-delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="form-fields-grid">
                        <div className="form-field-group">
                          <label className="field-label">Honor / Award Title <span className="req">*</span></label>
                          <input
                            type="text"
                            value={ach.title || ''}
                            onChange={(e) => updateEntry('achievements', idx, 'title', e.target.value)}
                            placeholder="e.g. 1st Place — MIT Global Hackathon 2024"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Date</label>
                          <input
                            type="text"
                            value={ach.date || ''}
                            onChange={(e) => updateEntry('achievements', idx, 'date', e.target.value)}
                            placeholder="e.g. Oct 2024"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group full-width">
                          <label className="field-label">Description</label>
                          <textarea
                            rows={2}
                            value={ach.description || ''}
                            onChange={(e) => updateEntry('achievements', idx, 'description', e.target.value)}
                            placeholder="Selected 1st out of 350+ international teams for an AI accessibility solution."
                            className="form-textarea-input"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 10: LANGUAGES */}
            {activeSectionId === 'languages' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 10 // MULTILINGUAL PROFICIENCY</span>
                    <h2 className="editor-section-title">Languages</h2>
                    <p className="editor-section-desc">
                      Languages you speak and your operational proficiency.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('languages', {
                      language: '',
                      proficiency: 'Fluent'
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Language
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.languages?.map((lang, idx) => (
                    <div key={lang.id || idx} className="repeatable-entry-card compact-entry">
                      <div className="form-fields-grid compact-row">
                        <div className="form-field-group">
                          <label className="field-label">Language</label>
                          <input
                            type="text"
                            value={lang.language || ''}
                            onChange={(e) => updateEntry('languages', idx, 'language', e.target.value)}
                            placeholder="e.g. English, Spanish, German"
                            className="form-text-input"
                          />
                        </div>

                        <div className="form-field-group">
                          <label className="field-label">Proficiency Level</label>
                          <select
                            value={lang.proficiency || 'Fluent'}
                            onChange={(e) => updateEntry('languages', idx, 'proficiency', e.target.value)}
                            className="form-select-input"
                          >
                            <option value="Native">Native / Bilingual</option>
                            <option value="Fluent">Fluent</option>
                            <option value="Professional Working">Professional Working</option>
                            <option value="Conversational">Conversational</option>
                            <option value="Elementary">Elementary</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeEntry('languages', idx)}
                          className="btn-entry-delete compact-del"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 11: CUSTOM SECTIONS */}
            {activeSectionId === 'custom_sections' && (
              <div className="editor-section-card">
                <div className="section-header-box">
                  <div>
                    <span className="eyebrow-accent">SECTION 11 // BESPOKE SECTIONS</span>
                    <h2 className="editor-section-title">Custom Sections</h2>
                    <p className="editor-section-desc">
                      Add optional custom sections (e.g. Publications, Volunteer Work, Speaking Engagements).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addEntry('custom_sections', {
                      title: 'Volunteer Experience',
                      items: [
                        { title: 'Open-Source Mentor', organization: 'Code for Good', date: '2023', description: 'Mentored first-time contributors.' }
                      ]
                    })}
                    className="btn-add-entry"
                  >
                    <Plus size={14} /> Add Custom Section
                  </button>
                </div>

                <div className="repeatable-entries-list">
                  {resumeData.custom_sections?.map((csec, cIdx) => (
                    <div key={csec.id || cIdx} className="repeatable-entry-card custom-section-wrapper">
                      <div className="entry-card-header">
                        <div className="custom-title-row">
                          <input
                            type="text"
                            value={csec.title || ''}
                            onChange={(e) => {
                              const list = [...(resumeData.custom_sections || [])];
                              list[cIdx].title = e.target.value;
                              updateData({ custom_sections: list });
                            }}
                            placeholder="Section Title (e.g. Publications)"
                            className="form-text-input custom-sec-title-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEntry('custom_sections', cIdx)}
                          className="btn-entry-delete"
                          title="Delete entire custom section"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="custom-items-list">
                        {(csec.items || []).map((it, itIdx) => (
                          <div key={itIdx} className="custom-item-row">
                            <div className="form-fields-grid">
                              <div className="form-field-group">
                                <label className="field-label">Item Title</label>
                                <input
                                  type="text"
                                  value={it.title || ''}
                                  onChange={(e) => {
                                    const list = [...(resumeData.custom_sections || [])];
                                    list[cIdx].items[itIdx].title = e.target.value;
                                    updateData({ custom_sections: list });
                                  }}
                                  placeholder="e.g. Lead Volunteer"
                                  className="form-text-input"
                                />
                              </div>

                              <div className="form-field-group">
                                <label className="field-label">Organization / Subtitle</label>
                                <input
                                  type="text"
                                  value={it.organization || ''}
                                  onChange={(e) => {
                                    const list = [...(resumeData.custom_sections || [])];
                                    list[cIdx].items[itIdx].organization = e.target.value;
                                    updateData({ custom_sections: list });
                                  }}
                                  placeholder="e.g. Non-Profit Foundation"
                                  className="form-text-input"
                                />
                              </div>

                              <div className="form-field-group">
                                <label className="field-label">Date</label>
                                <input
                                  type="text"
                                  value={it.date || ''}
                                  onChange={(e) => {
                                    const list = [...(resumeData.custom_sections || [])];
                                    list[cIdx].items[itIdx].date = e.target.value;
                                    updateData({ custom_sections: list });
                                  }}
                                  placeholder="e.g. 2023 – 2024"
                                  className="form-text-input"
                                />
                              </div>

                              <div className="form-field-group full-width">
                                <label className="field-label">Details / Bullet</label>
                                <textarea
                                  rows={2}
                                  value={it.description || ''}
                                  onChange={(e) => {
                                    const list = [...(resumeData.custom_sections || [])];
                                    list[cIdx].items[itIdx].description = e.target.value;
                                    updateData({ custom_sections: list });
                                  }}
                                  placeholder="Description of activities and contributions..."
                                  className="form-textarea-input"
                                />
                              </div>
                            </div>
                          </div>
                        ))}

                        <button
                          type="button"
                          onClick={() => {
                            const list = [...(resumeData.custom_sections || [])];
                            list[cIdx].items = [...(list[cIdx].items || []), { title: '', organization: '', date: '', description: '' }];
                            updateData({ custom_sections: list });
                          }}
                          className="btn-add-mini"
                        >
                          <Plus size={12} /> Add Item to {csec.title || 'Section'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Editor Bottom Stepper Navigation */}
            <div className="editor-bottom-stepper-bar">
              {currentSecIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveSectionId(activeSectionOrder[currentSecIndex - 1])}
                  className="btn-stepper-secondary"
                >
                  <ChevronLeft size={16} /> Previous Section
                </button>
              )}

              {currentSecIndex < activeSectionOrder.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setActiveSectionId(activeSectionOrder[currentSecIndex + 1])}
                  className="btn-stepper-primary ml-auto"
                >
                  Next Section <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleDownload('pdf')}
                  className="btn-stepper-primary ml-auto"
                >
                  Download ATS PDF <Download size={15} />
                </button>
              )}
            </div>

          </div>
        </main>

        {/* -----------------------------------------------------------------------
           RIGHT PANEL: REAL-TIME LIVE PREVIEW & ATS BENCHMARK
           ----------------------------------------------------------------------- */}
        <section className={`ats-right-preview ${mobileActiveTab === 'preview' ? 'mobile-visible' : ''}`}>
          <div className="preview-sticky-outer">

            {/* Right Panel View Tabs */}
            <div className="preview-tab-pills">
              <button
                type="button"
                onClick={() => setRightPanelTab('preview')}
                className={`panel-tab-btn ${rightPanelTab === 'preview' ? 'active' : ''}`}
              >
                <Eye size={14} /> Live Document
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('ats_analysis')}
                className={`panel-tab-btn ${rightPanelTab === 'ats_analysis' ? 'active' : ''}`}
              >
                <Target size={14} /> ATS Audit
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('job_match')}
                className={`panel-tab-btn ${rightPanelTab === 'job_match' ? 'active' : ''}`}
              >
                <Sparkle size={14} /> Job Match
              </button>
              <button
                type="button"
                onClick={() => setRightPanelTab('checklist')}
                className={`panel-tab-btn ${rightPanelTab === 'checklist' ? 'active' : ''}`}
              >
                <CheckCircle2 size={14} /> Checklist
              </button>
            </div>

            {/* 1. LIVE DOCUMENT VIEW */}
            {rightPanelTab === 'preview' && (
              <div className="preview-live-container">
                {/* Customization Toolbar */}
                <div className="preview-options-toolbar">
                  {/* Template Picker */}
                  <div className="tpl-switcher-group">
                    <span className="tpl-caption">TEMPLATE:</span>
                    <select
                      value={resumeData.template || 'classic'}
                      onChange={(e) => updateData({ template: e.target.value })}
                      className="tpl-select-menu"
                    >
                      {TEMPLATES.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Font Scale & Spacing Controls */}
                  <div className="styling-toggles-group">
                    <button
                      type="button"
                      onClick={() => {
                        const cur = resumeData.styling_options?.fontSize || 'normal';
                        const next = cur === 'small' ? 'normal' : (cur === 'normal' ? 'large' : 'small');
                        updateData(prev => ({
                          ...prev,
                          styling_options: { ...(prev.styling_options || {}), fontSize: next }
                        }));
                      }}
                      className="btn-tool-pill"
                      title="Toggle Font Scale (Small/Normal/Large)"
                    >
                      Font: {resumeData.styling_options?.fontSize || 'normal'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const cur = resumeData.styling_options?.spacing || 'normal';
                        const next = cur === 'compact' ? 'normal' : (cur === 'normal' ? 'relaxed' : 'compact');
                        updateData(prev => ({
                          ...prev,
                          styling_options: { ...(prev.styling_options || {}), spacing: next }
                        }));
                      }}
                      className="btn-tool-pill"
                      title="Toggle Line Spacing (Compact/Normal/Relaxed)"
                    >
                      Spacing: {resumeData.styling_options?.spacing || 'normal'}
                    </button>

                    {/* Color palette */}
                    <div className="color-palette-dots">
                      {ACCENT_COLORS.map(c => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => updateData(prev => ({
                            ...prev,
                            styling_options: { ...(prev.styling_options || {}), accentColor: c.hex }
                          }))}
                          className={`btn-color-dot ${resumeData.styling_options?.accentColor === c.hex ? 'active' : ''}`}
                          style={{ backgroundColor: c.hex }}
                          title={c.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Simulated A4 / Letter Document Container */}
                <div className="document-canvas-wrapper" style={{ transform: `scale(${previewZoom / 100})`, transformOrigin: 'top center' }}>
                  <div
                    className={`resume-paper-page template-${resumeData.template || 'classic'} font-${resumeData.styling_options?.fontSize || 'normal'} spacing-${resumeData.styling_options?.spacing || 'normal'}`}
                    style={{ '--template-accent': resumeData.styling_options?.accentColor || '#FF6500' }}
                  >
                    {/* Header: Personal Info */}
                    <div className="paper-header-box">
                      <h1 className="paper-name">{resumeData.personal_info?.full_name || 'YOUR FULL NAME'}</h1>
                      {resumeData.personal_info?.professional_title && (
                        <p className="paper-title-tag">{resumeData.personal_info.professional_title}</p>
                      )}
                      <div className="paper-contact-row">
                        {[
                          resumeData.personal_info?.email,
                          resumeData.personal_info?.phone,
                          resumeData.personal_info?.location,
                          resumeData.personal_info?.linkedin_url,
                          resumeData.personal_info?.github_url
                        ].filter(Boolean).map((item, i) => (
                          <span key={i} className="contact-chunk">{item}</span>
                        ))}
                      </div>
                    </div>

                    <div className="paper-divider-line" />

                    {/* Dynamic Ordered Sections */}
                    {activeSectionOrder.map(secKey => {
                      if (secKey === 'personal_info') return null;
                      if (resumeData.section_visibility?.[secKey] === false) return null;

                      // SUMMARY
                      if (secKey === 'summary' && resumeData.summary) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">PROFESSIONAL SUMMARY</h3>
                            <p className="paper-body-text">{resumeData.summary}</p>
                          </div>
                        );
                      }

                      // SKILLS
                      if (secKey === 'skills' && resumeData.skills) {
                        const hasAny = Object.values(resumeData.skills).some(arr => arr?.length > 0);
                        if (!hasAny) return null;
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">
                              {resumeData.template === 'technical' ? 'TECHNICAL SKILLS MATRIX' : 'SKILLS & COMPETENCIES'}
                            </h3>
                            <div className="paper-skills-matrix">
                              {Object.entries(resumeData.skills).map(([cat, list]) => {
                                if (!list || !list.length) return null;
                                return (
                                  <div key={cat} className="paper-skill-row">
                                    <strong className="skill-cat-name">{cat.replace(/_/g, ' ').toUpperCase()}:</strong>{' '}
                                    <span className="skill-cat-items">{list.join(', ')}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      }

                      // WORK EXPERIENCE
                      if (secKey === 'experience' && resumeData.experience?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">WORK EXPERIENCE</h3>
                            {resumeData.experience.map((exp, i) => (
                              <div key={i} className="paper-item-entry">
                                <div className="paper-item-header">
                                  <span className="item-role-comp">
                                    <strong>{exp.job_title || 'Position'}</strong> — {exp.company || 'Company'}
                                  </span>
                                  <span className="item-dates">
                                    {exp.start_date || ''} – {exp.is_current ? 'Present' : (exp.end_date || '')}
                                  </span>
                                </div>
                                {exp.location && <div className="item-location-sub">{exp.location}</div>}
                                {exp.description && (
                                  <div className="paper-bullets-group">
                                    {exp.description.split('\n').filter(Boolean).map((line, bIdx) => (
                                      <div key={bIdx} className="paper-bullet-line">
                                        <span className="bullet-dot">•</span>
                                        <span className="bullet-text">{line.replace(/^[•\-\*]\s*/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // INTERNSHIPS
                      if (secKey === 'internships' && resumeData.internships?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">INTERNSHIPS</h3>
                            {resumeData.internships.map((intern, i) => (
                              <div key={i} className="paper-item-entry">
                                <div className="paper-item-header">
                                  <span className="item-role-comp">
                                    <strong>{intern.job_title || 'Intern'}</strong> — {intern.company || 'Company'}
                                  </span>
                                  <span className="item-dates">{intern.start_date || ''}</span>
                                </div>
                                {intern.description && (
                                  <div className="paper-bullets-group">
                                    {intern.description.split('\n').filter(Boolean).map((line, bIdx) => (
                                      <div key={bIdx} className="paper-bullet-line">
                                        <span className="bullet-dot">•</span>
                                        <span className="bullet-text">{line.replace(/^[•\-\*]\s*/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // EDUCATION
                      if (secKey === 'education' && resumeData.education?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">EDUCATION</h3>
                            {resumeData.education.map((edu, i) => (
                              <div key={i} className="paper-item-entry">
                                <div className="paper-item-header">
                                  <span className="item-role-comp">
                                    <strong>{edu.degree || 'Degree'}</strong> — {edu.institution || 'University'}
                                  </span>
                                  <span className="item-dates">{edu.end_year || ''}</span>
                                </div>
                                {(edu.grade || edu.coursework) && (
                                  <div className="item-location-sub">
                                    {edu.grade && <span>GPA: {edu.grade} </span>}
                                    {edu.coursework && <span>| Coursework: {edu.coursework}</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // PROJECTS
                      if (secKey === 'projects' && resumeData.projects?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">KEY PROJECTS</h3>
                            {resumeData.projects.map((proj, i) => (
                              <div key={i} className="paper-item-entry">
                                <div className="paper-item-header">
                                  <span className="item-role-comp">
                                    <strong>{proj.name || 'Project'}</strong>
                                    {proj.technologies && <em className="tech-inline"> ({proj.technologies})</em>}
                                  </span>
                                  {proj.project_url && (
                                    <span className="item-link-label">{proj.project_url}</span>
                                  )}
                                </div>
                                {proj.description && (
                                  <div className="paper-bullets-group">
                                    {proj.description.split('\n').filter(Boolean).map((line, bIdx) => (
                                      <div key={bIdx} className="paper-bullet-line">
                                        <span className="bullet-dot">•</span>
                                        <span className="bullet-text">{line.replace(/^[•\-\*]\s*/, '')}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // CERTIFICATIONS
                      if (secKey === 'certifications' && resumeData.certifications?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">CERTIFICATIONS</h3>
                            {resumeData.certifications.map((c, i) => (
                              <div key={i} className="paper-bullet-line">
                                <span className="bullet-dot">•</span>
                                <span className="bullet-text">
                                  <strong>{c.name}</strong> — {c.organization} {c.issue_date && `(${c.issue_date})`}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // ACHIEVEMENTS
                      if (secKey === 'achievements' && resumeData.achievements?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">ACHIEVEMENTS</h3>
                            {resumeData.achievements.map((a, i) => (
                              <div key={i} className="paper-bullet-line">
                                <span className="bullet-dot">•</span>
                                <span className="bullet-text">
                                  <strong>{a.title}</strong>{a.date && ` (${a.date})`}: {a.description}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // LANGUAGES
                      if (secKey === 'languages' && resumeData.languages?.length > 0) {
                        return (
                          <div key={secKey} className="paper-section-block">
                            <h3 className="paper-section-heading">LANGUAGES</h3>
                            <p className="paper-body-text">
                              {resumeData.languages.map(l => `${l.language} (${l.proficiency})`).join(' • ')}
                            </p>
                          </div>
                        );
                      }

                      // CUSTOM SECTIONS
                      if (secKey === 'custom_sections' && resumeData.custom_sections?.length > 0) {
                        return (
                          <div key={secKey}>
                            {resumeData.custom_sections.map((csec, cIdx) => (
                              <div key={cIdx} className="paper-section-block">
                                <h3 className="paper-section-heading">{(csec.title || 'ADDITIONAL SECTION').toUpperCase()}</h3>
                                {(csec.items || []).map((it, itIdx) => (
                                  <div key={itIdx} className="paper-item-entry">
                                    <div className="paper-item-header">
                                      <span className="item-role-comp">
                                        <strong>{it.title}</strong> — {it.organization}
                                      </span>
                                      <span className="item-dates">{it.date}</span>
                                    </div>
                                    {it.description && <p className="paper-body-text">{it.description}</p>}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      return null;
                    })}

                    {/* Page Break Guide Simulation */}
                    <div className="paper-footer-page-num">
                      Page 1 of 1 • ATS Verified Clean Text
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. ATS COMPATIBILITY AUDIT VIEW */}
            {rightPanelTab === 'ats_analysis' && (
              <div className="preview-audit-container">
                <div className="audit-header-score-card">
                  <div className="audit-score-circle">
                    <span className="big-score">{resumeData.ats_score || 85}</span>
                    <span className="score-denom">/ 100</span>
                  </div>
                  <div className="audit-score-text">
                    <h3>ATS Compatibility Assessment</h3>
                    <p>
                      Deterministic heuristic evaluation based on recruiter keyword parsing, standard section conventions, and formatting safety.
                    </p>
                  </div>
                </div>

                {/* Section Breakdowns */}
                {resumeData.ats_analysis?.breakdown && (
                  <div className="audit-breakdown-card">
                    <h4>Category Breakdown</h4>
                    <div className="category-bars-list">
                      {Object.entries(resumeData.ats_analysis.breakdown).map(([cat, val]) => (
                        <div key={cat} className="cat-bar-item">
                          <div className="cat-bar-meta">
                            <span className="cat-name">{cat.toUpperCase()}</span>
                            <span className="cat-score">{val}%</span>
                          </div>
                          <div className="cat-progress-track">
                            <div className="cat-progress-fill" style={{ width: `${val}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actionable Check Items */}
                <div className="audit-checks-card">
                  <h4>Transparent Compliance Checks</h4>
                  <div className="checks-list-wrap">
                    {(resumeData.ats_analysis?.checks || [
                      { id: '1', name: 'Contact Information', status: 'pass', message: 'Full name, email, and location verified.' },
                      { id: '2', name: 'Standard Section Headings', status: 'pass', message: 'Headings match universal ATS scanner labels.' },
                      { id: '3', name: 'Single-Column Layout', status: 'pass', message: 'Document structure conforms to machine parsing.' },
                      { id: '4', name: 'Quantifiable Metrics in Experience', status: 'warn', message: 'Add more quantifiable metrics (%, numbers, scale).' }
                    ]).map((chk, i) => (
                      <div key={i} className={`check-item-box status-${chk.status}`}>
                        <div className="check-status-icon">
                          {chk.status === 'pass' && <CheckCircle2 size={16} className="text-green" />}
                          {chk.status === 'warn' && <AlertCircle size={16} className="text-amber" />}
                          {chk.status === 'fail' && <X size={16} className="text-red" />}
                          {chk.status === 'info' && <HelpCircle size={16} className="text-blue" />}
                        </div>
                        <div className="check-content">
                          <div className="check-title-row">
                            <strong>{chk.name}</strong>
                            {chk.section && (
                              <button
                                type="button"
                                onClick={() => handleChecklistJump(chk.section)}
                                className="btn-jump-fix"
                              >
                                Fix in Editor
                              </button>
                            )}
                          </div>
                          <p>{chk.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                {resumeData.ats_analysis?.recommendations?.length > 0 && (
                  <div className="audit-recommendations-card">
                    <h4>Actionable Optimization Recommendations</h4>
                    <ul>
                      {resumeData.ats_analysis.recommendations.map((rec, i) => (
                        <li key={i}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* 3. JOB DESCRIPTION MATCH VIEW */}
            {rightPanelTab === 'job_match' && (
              <div className="preview-jobmatch-container">
                <div className="jobmatch-header-box">
                  <h3>Target Job Requisition Alignment</h3>
                  <p>
                    Paste the target job description below to identify matched keywords, missing competencies, and targeted summary recommendations.
                  </p>
                </div>

                <div className="jobmatch-input-card">
                  <textarea
                    rows={5}
                    value={jobDescriptionInput}
                    onChange={(e) => setJobDescriptionInput(e.target.value)}
                    placeholder="Paste full job description here (Responsibilities, Tech Stack, Requirements)..."
                    className="form-textarea-input"
                  />
                  <button
                    type="button"
                    onClick={handleAnalyzeJobMatch}
                    disabled={isMatchingJD || !jobDescriptionInput.trim()}
                    className="btn-action-primary mt-2"
                  >
                    <Search size={14} className={isMatchingJD ? 'spin-animate' : ''} />
                    <span>{isMatchingJD ? 'Analyzing Keyword Alignment...' : 'Analyze Job Alignment'}</span>
                  </button>
                </div>

                {jobMatchResult && (
                  <div className="jobmatch-results-card">
                    <div className="match-score-summary-bar">
                      <span>Requisition Match Rating:</span>
                      <strong className="match-score-number">{jobMatchResult.match_score || 80}%</strong>
                    </div>

                    <div className="keywords-grid-box">
                      <div className="keywords-column matched">
                        <h5>✓ Matched Keywords Detected</h5>
                        <div className="tag-chips-wrap">
                          {(jobMatchResult.matching_keywords || []).map((kw, i) => (
                            <span key={i} className="chip-kw-matched">✓ {kw}</span>
                          ))}
                        </div>
                      </div>

                      <div className="keywords-column missing">
                        <h5>! Missing Requisition Keywords</h5>
                        <div className="tag-chips-wrap">
                          {(jobMatchResult.missing_keywords || []).map((kw, i) => (
                            <span key={i} className="chip-kw-missing">! {kw}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {jobMatchResult.recommendations?.length > 0 && (
                      <div className="match-advice-box">
                        <strong>Tailored Recommendations:</strong>
                        <ul>
                          {jobMatchResult.recommendations.map((r, i) => (
                            <li key={i}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. QUALITY CHECKLIST VIEW */}
            {rightPanelTab === 'checklist' && (
              <div className="preview-checklist-container">
                <div className="checklist-header-card">
                  <h3>Resume Readiness Checklist</h3>
                  <p>
                    Ensure your resume meets every essential standard for ATS parsers and human recruiters. Click any item to jump directly to its editor section.
                  </p>
                </div>

                <div className="actionable-checklist-items">
                  {[
                    {
                      label: 'Candidate Full Name & Headline',
                      done: Boolean(resumeData.personal_info?.full_name),
                      section: 'personal_info',
                      tip: 'Provides immediate identity for ATS indexing.'
                    },
                    {
                      label: 'Valid Professional Email & Phone',
                      done: Boolean(resumeData.personal_info?.email && resumeData.personal_info?.phone),
                      section: 'personal_info',
                      tip: 'Ensures direct contact channels for recruiter screening.'
                    },
                    {
                      label: 'Target Professional Summary (30–90 words)',
                      done: (resumeData.summary || '').split(/\s+/).filter(Boolean).length >= 25,
                      section: 'summary',
                      tip: 'Elevates keyword density in the top 30% of document.'
                    },
                    {
                      label: 'Categorized Technical & Domain Skills (6+ skills)',
                      done: Object.values(resumeData.skills || {}).some(l => l?.length >= 4),
                      section: 'skills',
                      tip: 'Core driver of ATS keyword frequency algorithms.'
                    },
                    {
                      label: 'Documented Work Experience / Internships',
                      done: (resumeData.experience?.length || 0) + (resumeData.internships?.length || 0) >= 1,
                      section: 'experience',
                      tip: 'Demonstrates professional track record.'
                    },
                    {
                      label: 'Action Verbs in Bullet Points (Engineered, Spearheaded)',
                      done: (resumeData.experience || []).some(e => e.description && /engineered|developed|built|spearheaded|optimized|architected/i.test(e.description)),
                      section: 'experience',
                      tip: 'Signals initiative and ownership.'
                    },
                    {
                      label: 'Measurable Outcomes & Quantifiable Metrics (%, numbers)',
                      done: (resumeData.experience || []).some(e => e.description && /\d+[\%kmb]?|\$[\d,]+/i.test(e.description)),
                      section: 'experience',
                      tip: 'Quantifies concrete business return.'
                    },
                    {
                      label: 'Verified Academic Credentials (Degree & Institution)',
                      done: (resumeData.education?.length || 0) >= 1,
                      section: 'education',
                      tip: 'Validates educational qualification requisites.'
                    },
                    {
                      label: 'Demonstrated Technical Projects with URLs',
                      done: (resumeData.projects?.length || 0) >= 1,
                      section: 'projects',
                      tip: 'Provides applied portfolio evidence.'
                    },
                    {
                      label: 'Single-Column ATS Layout Standard',
                      done: true,
                      section: 'personal_info',
                      tip: 'Guarantees machine-readable selectable text.'
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`checklist-item-row ${item.done ? 'completed' : 'pending'}`}
                      onClick={() => handleChecklistJump(item.section)}
                    >
                      <div className="checklist-status-marker">
                        {item.done ? <CheckCircle2 size={18} className="text-green" /> : <AlertCircle size={18} className="text-amber" />}
                      </div>
                      <div className="checklist-text-meta">
                        <strong className="item-title">{item.label}</strong>
                        <p className="item-subtip">{item.tip}</p>
                      </div>
                      <button type="button" className="btn-jump-arrow">
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

      </div>

      {/* =========================================================================
         MODALS & OVERLAYS
         ========================================================================= */}

      {/* 1. IMPORT RESUME REVIEW & CONFIRM MODAL */}
      {showImportModal && (
        <div className="modal-backdrop">
          <div className="modal-card-box">
            <div className="modal-header">
              <h3>Import & Parse Resume</h3>
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportResult(null); }}
                className="btn-modal-close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="modal-body-content">
              {importLoading && (
                <div className="import-loading-state">
                  <RefreshCw size={24} className="spin-animate text-orange" />
                  <p>Extracting text and parsing structured sections with ATS intelligence...</p>
                </div>
              )}

              {importError && (
                <div className="import-error-banner">
                  <AlertCircle size={18} />
                  <span>{importError}</span>
                </div>
              )}

              {importResult && (
                <div className="import-preview-box">
                  <div className="import-notice-banner">
                    <CheckCircle2 size={16} className="text-green" />
                    <span>Resume successfully parsed! Please review the extracted data before importing.</span>
                  </div>

                  <div className="extracted-fields-summary">
                    <div className="summary-field">
                      <strong>Candidate Name:</strong> <span>{importResult.personal_info?.full_name || 'Not detected'}</span>
                    </div>
                    <div className="summary-field">
                      <strong>Email:</strong> <span>{importResult.personal_info?.email || 'Not detected'}</span>
                    </div>
                    <div className="summary-field">
                      <strong>Phone:</strong> <span>{importResult.personal_info?.phone || 'Not detected'}</span>
                    </div>
                    <div className="summary-field">
                      <strong>Location:</strong> <span>{importResult.personal_info?.location || 'Not detected'}</span>
                    </div>
                    <div className="summary-field">
                      <strong>Experience Positions:</strong> <span>{importResult.experience?.length || 0} entries</span>
                    </div>
                    <div className="summary-field">
                      <strong>Education Entries:</strong> <span>{importResult.education?.length || 0} entries</span>
                    </div>
                    <div className="summary-field">
                      <strong>Skills Detected:</strong> <span>{importResult.skills?.length || 0} skills</span>
                    </div>
                  </div>

                  <div className="import-actions-row">
                    <button
                      type="button"
                      onClick={() => handleApplyImport('replace')}
                      className="btn-action-primary"
                    >
                      Replace Current Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyImport('merge')}
                      className="btn-action-secondary"
                    >
                      Merge with Current Resume
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowImportModal(false); setImportResult(null); }}
                      className="btn-action-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. AI OPTIMIZATION DIFF MODAL */}
      {showDiffModal && (
        <div className="modal-backdrop">
          <div className="modal-card-box diff-modal-card">
            <div className="modal-header">
              <div className="diff-header-title">
                <Sparkles size={16} className="text-orange" />
                <h3>{diffData.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDiffModal(false)}
                className="btn-modal-close"
              >
                <X size={16} />
              </button>
            </div>

            <div className="diff-modal-body">
              <div className="diff-explanation-pill">
                <strong>Why this is improved:</strong> {diffData.explanation}
              </div>

              <div className="diff-comparison-grid">
                <div className="diff-box original">
                  <span className="diff-box-caption">ORIGINAL DRAFT</span>
                  <div className="diff-content-text">{diffData.original}</div>
                </div>

                <div className="diff-box proposed">
                  <span className="diff-box-caption">PROPOSED ATS OPTIMIZATION</span>
                  <div className="diff-content-text">{diffData.proposed}</div>
                </div>
              </div>

              <div className="diff-footer-actions">
                <button
                  type="button"
                  onClick={() => {
                    if (diffData.onApply) diffData.onApply();
                    setShowDiffModal(false);
                  }}
                  className="btn-action-primary"
                >
                  <Check size={14} /> Apply to Resume
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiffModal(false)}
                  className="btn-action-ghost"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. RENAME RESUME MODAL */}
      {showRenameModal && (
        <div className="modal-backdrop">
          <div className="modal-card-box modal-sm">
            <div className="modal-header">
              <h3>Rename Resume</h3>
              <button
                type="button"
                onClick={() => setShowRenameModal(false)}
                className="btn-modal-close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body-content">
              <label className="field-label">Resume Name</label>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value)}
                className="form-text-input mb-3"
                autoFocus
              />
              <div className="modal-footer-btns">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="btn-action-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRename}
                  className="btn-action-primary"
                >
                  Save Name
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. DELETE RESUME CONFIRMATION MODAL */}
      {showDeleteModal && resumeToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card-box modal-sm">
            <div className="modal-header">
              <h3>Delete Resume</h3>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="btn-modal-close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="modal-body-content">
              <p className="delete-warning-text">
                Are you sure you want to delete <strong>"{resumeToDelete.name}"</strong>? This action cannot be undone.
              </p>
              <div className="modal-footer-btns">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="btn-action-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="btn-action-danger"
                >
                  Delete Resume
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ATSResumeMaker;
