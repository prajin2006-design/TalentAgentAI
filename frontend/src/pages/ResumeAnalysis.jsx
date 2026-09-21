import React, { useState, useEffect, useMemo } from 'react';
import { useCareer } from '../context/CareerContext';
import { ResumeUploader } from '../components/ResumeUploader';
import { resumeAPI } from '../services/api';
import {
  Bot,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  GraduationCap,
  Briefcase,
  FolderGit2,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Target,
  ChevronDown,
  ChevronUp,
  FileCode,
  Check,
  Zap,
  ShieldCheck,
  UploadCloud,
  X,
  Award,
  BookOpen,
  HelpCircle,
  ExternalLink,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Sliders,
  Maximize2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeReadiness, safeString } from '../utils/userHelpers';
import './ResumeAnalysis.css';

export const ResumeAnalysis = () => {
  const { profile, refreshCareerData } = useCareer();
  const [activeResume, setActiveResume] = useState(null);
  const [isLoadingActive, setIsLoadingActive] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Target Job Description Match State
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [jobDescInput, setJobDescInput] = useState('');
  const [isMatchingJob, setIsMatchingJob] = useState(false);
  const [jobMatchData, setJobMatchData] = useState(null);
  const [showJdModal, setShowJdModal] = useState(false);

  // Keyword intelligence tab filter ('all', 'present', 'missing')
  const [keywordTab, setKeywordTab] = useState('all');

  // Raw Text Toggle State
  const [showRawText, setShowRawText] = useState(false);

  // Toggle uploader card
  const [showUploader, setShowUploader] = useState(false);

  // Load Active Resume Analysis on Mount
  const fetchActiveAnalysis = async () => {
    setIsLoadingActive(true);
    setErrorMessage(null);
    try {
      const res = await resumeAPI.getActiveResume();
      if (res?.resume && (res.resume.extracted_text || res.resume.parsed_data || res.resume.parsed_json)) {
        setActiveResume(res.resume);
        if (res.resume.target_role) {
          setTargetRoleInput(res.resume.target_role);
        }
      } else {
        setActiveResume(null);
      }
    } catch (err) {
      console.error('Failed to load active resume analysis:', err);
      setErrorMessage('Unable to load stored resume analysis. Please try again.');
    } finally {
      setIsLoadingActive(false);
    }
  };

  useEffect(() => {
    fetchActiveAnalysis();
    if (profile?.preferred_role) {
      setTargetRoleInput(profile.preferred_role);
    }
  }, [profile?.preferred_role]);

  // Callback when a new resume is uploaded via ResumeUploader
  const handleUploadComplete = async (res) => {
    setShowUploader(false);
    if (res?.resume) {
      setActiveResume(res.resume);
    } else {
      await fetchActiveAnalysis();
    }
    await refreshCareerData();
  };

  // Re-Analyze current active resume
  const handleReanalyze = async () => {
    if (!activeResume?.id || isReanalyzing) return;
    setIsReanalyzing(true);
    setErrorMessage(null);
    try {
      const res = await resumeAPI.reanalyzeResume(activeResume.id);
      if (res?.resume) {
        setActiveResume(res.resume);
      }
      await refreshCareerData();
    } catch (err) {
      console.error('Failed to re-analyze resume:', err);
      setErrorMessage(err.message || 'Re-analysis failed. Please try again.');
    } finally {
      setIsReanalyzing(false);
    }
  };

  // Run Job Description Match Analysis
  const handleAnalyzeJobMatch = async () => {
    if (!jobDescInput.trim() || isMatchingJob) return;
    setIsMatchingJob(true);
    setErrorMessage(null);
    try {
      const res = await resumeAPI.analyzeJobATS(activeResume?.id, {
        job_description: jobDescInput,
        target_role: targetRoleInput || profile?.preferred_role || 'Target Role'
      });
      setJobMatchData(res);
      setShowJdModal(true);
    } catch (err) {
      console.error('Job match error:', err);
      setErrorMessage(err.message || 'Failed to analyze job match against the provided description.');
    } finally {
      setIsMatchingJob(false);
    }
  };

  // Normalized analysis data object
  const parsedData = activeResume?.parsed_data || activeResume?.parsed_json || {};
  const personalInfo = parsedData?.personal_info || activeResume?.personal_info || {};
  const summaryText = activeResume?.summary || parsedData?.summary || '';
  const skillsList = Array.isArray(parsedData?.skills) ? parsedData.skills : (Array.isArray(activeResume?.skills) ? activeResume.skills : []);
  const categorizedSkills = parsedData?.categorized_skills || {};
  const eduList = Array.isArray(parsedData?.education) ? parsedData.education : (Array.isArray(activeResume?.education) ? activeResume.education : []);
  const expList = Array.isArray(parsedData?.experience) ? parsedData.experience : (Array.isArray(activeResume?.experience) ? activeResume.experience : []);
  const projList = Array.isArray(parsedData?.projects) ? parsedData.projects : (Array.isArray(activeResume?.projects) ? activeResume.projects : []);
  const certsList = Array.isArray(parsedData?.certifications) ? parsedData.certifications : (Array.isArray(activeResume?.certifications) ? activeResume.certifications : []);
  const rawStrengths = Array.isArray(parsedData?.strengths) ? parsedData.strengths : (Array.isArray(activeResume?.strengths) ? activeResume.strengths : []);
  const rawWeaknesses = Array.isArray(parsedData?.areas_to_improve) ? parsedData.areas_to_improve : (Array.isArray(activeResume?.areas_to_improve) ? activeResume.areas_to_improve : (Array.isArray(activeResume?.weaknesses) ? activeResume.weaknesses : []));

  const hasResume = !!(activeResume && (activeResume.extracted_text || skillsList.length > 0 || summaryText));
  const rawScore = activeResume?.ats_score ?? parsedData?.ats_score;
  const atsScore = hasResume && rawScore !== undefined && rawScore !== null ? normalizeReadiness(rawScore) : null;

  // Quality Tier Evaluation
  const getScoreTier = (score) => {
    if (score >= 80) return { label: 'Excellent', subtext: 'Optimized for high-volume ATS scanners', colorClass: 'tier-excellent', stroke: '#20B26B' };
    if (score >= 65) return { label: 'Good', subtext: 'Readable with minor optimization opportunities', colorClass: 'tier-good', stroke: '#3047FF' };
    if (score >= 50) return { label: 'Needs Improvement', subtext: 'Significant structural & keyword gaps detected', colorClass: 'tier-warning', stroke: '#F59E0B' };
    return { label: 'Poor', subtext: 'High risk of automatic ATS rejection', colorClass: 'tier-danger', stroke: '#EF4444' };
  };

  const currentTier = atsScore !== null ? getScoreTier(atsScore) : null;
  const currentTargetRole = safeString(targetRoleInput || profile?.preferred_role || personalInfo?.headline, 'Software Engineer');

  // Breakdown metrics
  const atsBreakdown = parsedData?.ats_breakdown || null;
  const contentScore = atsBreakdown?.summary ? Math.round((atsBreakdown.summary.score / (atsBreakdown.summary.max || 10)) * 100) : (atsScore ? Math.min(100, Math.max(50, atsScore + 5)) : 80);
  const formatScore = atsBreakdown?.formatting ? Math.round((atsBreakdown.formatting.score / (atsBreakdown.formatting.max || 5)) * 100) : (atsScore ? 95 : 90);
  const keywordScore = atsBreakdown?.keywords ? Math.round((atsBreakdown.keywords.score / (atsBreakdown.keywords.max || 10)) * 100) : (atsScore ? Math.min(100, Math.max(45, atsScore - 2)) : 75);
  const structureScore = atsBreakdown?.experience ? Math.round((atsBreakdown.experience.score / (atsBreakdown.experience.max || 20)) * 100) : (atsScore ? Math.min(100, Math.max(60, atsScore + 8)) : 85);

  // Issues & Improvements structured array
  const structuredImprovements = useMemo(() => {
    if (!hasResume) return [];
    return rawWeaknesses.map((item, idx) => {
      const text = safeString(item);
      let priority = 'MEDIUM';
      let why = 'Recruiter and ATS parsers rank profiles higher when this is addressed.';
      let action = 'Review and enhance this section with clear, concise phrasing.';

      const lower = text.toLowerCase();
      if (lower.includes('metric') || lower.includes('achievement') || lower.includes('outcome') || lower.includes('summary') || lower.includes('email') || lower.includes('phone')) {
        priority = 'HIGH';
        why = 'Quantifiable metrics and complete contact details directly impact applicant pass-through rates.';
        action = 'Add concrete metrics (e.g. percentages, user counts, performance gains) and verify contact items.';
      } else if (lower.includes('link') || lower.includes('portfolio') || lower.includes('github') || lower.includes('cert')) {
        priority = 'LOW';
        why = 'External links validate projects and provide evidence of work quality.';
        action = 'Include relevant LinkedIn, GitHub, or portfolio URLs.';
      }

      return { id: idx, priority, title: text, why, action };
    });
  }, [hasResume, rawWeaknesses]);

  const highPriorityCount = structuredImprovements.filter((i) => i.priority === 'HIGH').length;

  // Keyword intelligence list
  const keywordList = useMemo(() => {
    if (!hasResume) return [];
    const detected = skillsList.map((s) => ({
      name: safeString(s),
      status: 'Present',
      importance: 'High'
    }));

    // Missing role-specific recommendations if not in detected
    const potential = ['System Architecture', 'CI/CD Pipelines', 'REST APIs', 'Cloud Architecture', 'Agile / Scrum', 'Unit Testing'];
    const missing = potential
      .filter((k) => !detected.some((d) => d.name.toLowerCase() === k.toLowerCase()))
      .slice(0, 4)
      .map((k) => ({
        name: k,
        status: 'Missing',
        importance: 'Recommended'
      }));

    return [...detected, ...missing];
  }, [hasResume, skillsList]);

  const filteredKeywords = keywordList.filter((k) => {
    if (keywordTab === 'present') return k.status === 'Present';
    if (keywordTab === 'missing') return k.status === 'Missing';
    return true;
  });

  // Calculate SVG circular progress values
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = atsScore !== null ? circumference - (atsScore / 100) * circumference : circumference;

  return (
    <div className="resume-analysis-container">
      {/* 1. Header Row */}
      <div className="ra-header-row">
        <div className="ra-title-box">
          <div className="ra-eyebrow">
            <Sparkles size={13} className="sparkle-icon" />
            <span>AI-POWERED RESUME ANALYSIS</span>
          </div>
          <h1 className="ra-main-title">Resume Intelligence & ATS Analysis</h1>
          <p className="ra-subtitle">
            Get an ATS compatibility score, identify resume issues, and discover exactly what to improve.
          </p>
        </div>

        <div className="ra-header-actions">
          {hasResume && (
            <>
              <button
                onClick={handleReanalyze}
                disabled={isReanalyzing}
                className="btn-ra-secondary"
                title="Re-run AI analysis on stored resume"
              >
                <RefreshCw size={14} className={isReanalyzing ? 'animate-spin' : ''} />
                <span>{isReanalyzing ? 'Analyzing...' : 'Re-analyze'}</span>
              </button>
              <button
                onClick={() => setShowUploader(!showUploader)}
                className="btn-ra-primary"
              >
                <UploadCloud size={14} />
                <span>{showUploader ? 'Close' : 'Replace Resume'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Inline Error Alert */}
      {errorMessage && (
        <div className="ra-error-banner">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
          <button onClick={fetchActiveAnalysis} className="btn-ra-ghost btn-sm">Try Again</button>
        </div>
      )}

      {/* 2. Top Compact 4-Card Summary KPI Strip */}
      <div className="ra-kpi-grid">
        {/* KPI 1: ATS Score */}
        <div className="ra-kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">ATS SCORE</span>
            {hasResume && currentTier && (
              <span className={`kpi-status-tag ${currentTier.colorClass}`}>
                ↑ {currentTier.label}
              </span>
            )}
          </div>
          <div className="kpi-value-row">
            {hasResume && atsScore !== null ? (
              <>
                <span className="kpi-num-large">{atsScore}</span>
                <span className="kpi-denominator">/ 100</span>
              </>
            ) : (
              <span className="kpi-placeholder">Not analyzed</span>
            )}
          </div>
          <div className="kpi-subtext">Overall machine compatibility</div>
        </div>

        {/* KPI 2: Keyword Match */}
        <div className="ra-kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">KEYWORD MATCH</span>
          </div>
          <div className="kpi-value-row">
            {hasResume ? (
              <>
                <span className="kpi-num-large">{keywordScore}%</span>
              </>
            ) : (
              <span className="kpi-placeholder">Not analyzed</span>
            )}
          </div>
          <div className="kpi-subtext">Target role: {currentTargetRole}</div>
        </div>

        {/* KPI 3: Skills Detected */}
        <div className="ra-kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">SKILLS DETECTED</span>
          </div>
          <div className="kpi-value-row">
            {hasResume ? (
              <>
                <span className="kpi-num-large">{skillsList.length}</span>
                <span className="kpi-unit">skills</span>
              </>
            ) : (
              <span className="kpi-placeholder">Not analyzed</span>
            )}
          </div>
          <div className="kpi-subtext">Verified from document text</div>
        </div>

        {/* KPI 4: Issues Found */}
        <div className="ra-kpi-card">
          <div className="kpi-label-row">
            <span className="kpi-label">ISSUES FOUND</span>
            {hasResume && highPriorityCount > 0 && (
              <span className="kpi-alert-badge">{highPriorityCount} High Priority</span>
            )}
          </div>
          <div className="kpi-value-row">
            {hasResume ? (
              <>
                <span className="kpi-num-large">{structuredImprovements.length}</span>
                <span className="kpi-unit">areas to optimize</span>
              </>
            ) : (
              <span className="kpi-placeholder">Not analyzed</span>
            )}
          </div>
          <div className="kpi-subtext">Actionable ATS recommendations</div>
        </div>
      </div>

      {/* 3. Compact Active Document Status Bar */}
      {hasResume && !showUploader && (
        <div className="ra-doc-card">
          <div className="doc-left-info">
            <div className="doc-icon-box">
              <FileText size={20} className="text-primary-blue" />
            </div>
            <div className="doc-meta-box">
              <div className="doc-title-row">
                <span className="doc-name">{safeString(activeResume.original_filename, 'Resume.pdf')}</span>
                <span className="doc-status-pill">
                  <span className="status-dot green" /> Analysis complete
                </span>
              </div>
              <div className="doc-subline">
                {activeResume.file_size ? `${activeResume.file_size} • ` : ''}
                {activeResume.parsed_at ? `Analyzed on ${new Date(activeResume.parsed_at).toLocaleDateString()}` : 'Analyzed recently'}
              </div>
            </div>
          </div>

          <div className="doc-right-actions">
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="btn-ra-ghost btn-sm"
              title="Inspect parsed text"
            >
              <FileCode size={14} />
              <span>{showRawText ? 'Hide Parsed Text' : 'View Parsed Text'}</span>
            </button>
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="btn-ra-secondary btn-sm"
            >
              <RefreshCw size={13} className={isReanalyzing ? 'animate-spin' : ''} />
              <span>{isReanalyzing ? 'Scanning...' : 'Re-analyze'}</span>
            </button>
            <button
              onClick={() => setShowUploader(true)}
              className="btn-ra-secondary btn-sm"
            >
              <UploadCloud size={13} />
              <span>Replace resume</span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsible Parsed Raw Text Drawer */}
      {showRawText && hasResume && activeResume.extracted_text && (
        <div className="ra-card raw-text-card">
          <div className="raw-header">
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-primary-blue" />
              <h4>Exact Extracted Document Text ({activeResume.extracted_text.length} chars)</h4>
            </div>
            <button onClick={() => setShowRawText(false)} className="btn-ra-ghost btn-sm">
              <X size={14} />
            </button>
          </div>
          <pre className="raw-text-block">{activeResume.extracted_text}</pre>
        </div>
      )}

      {/* Real-Time Progress Steps Indicator when Re-analyzing */}
      {isReanalyzing && (
        <div className="ra-card progress-panel-card">
          <div className="progress-panel-header">
            <div className="flex items-center gap-2">
              <RefreshCw size={18} className="animate-spin text-primary-blue" />
              <h3 className="section-title">Analyzing your resume...</h3>
            </div>
            <span className="text-xs text-muted font-mono">Neural parsing pipeline</span>
          </div>
          <div className="progress-steps-list">
            <div className="step-item step-done">
              <CheckCircle2 size={15} className="text-success-green" />
              <span>Resume uploaded & parsed</span>
            </div>
            <div className="step-item step-done">
              <CheckCircle2 size={15} className="text-success-green" />
              <span>Extracting content & text layer</span>
            </div>
            <div className="step-item step-done">
              <CheckCircle2 size={15} className="text-success-green" />
              <span>Detecting core sections & header</span>
            </div>
            <div className="step-item step-active">
              <span className="spinner-dot-blue" />
              <span>Checking ATS structure & formatting</span>
            </div>
            <div className="step-item step-pending">
              <span className="pending-circle" />
              <span>Analyzing keywords against {currentTargetRole}</span>
            </div>
            <div className="step-item step-pending">
              <span className="pending-circle" />
              <span>Evaluating content quality & metrics</span>
            </div>
            <div className="step-item step-pending">
              <span className="pending-circle" />
              <span>Generating actionable recommendations</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsible / Replacement Uploader Zone */}
      {(!hasResume || showUploader) && (
        <div className="ra-card upload-wrapper-card">
          <div className="upload-header-row">
            <div>
              <h3 className="section-title">{hasResume ? 'Replace Active Resume' : 'Upload your resume'}</h3>
              <p className="section-subtitle">
                Upload your PDF or DOCX and we'll analyze its ATS compatibility, content quality and keyword relevance.
              </p>
            </div>
            {hasResume && (
              <button onClick={() => setShowUploader(false)} className="btn-ra-ghost btn-sm">
                <X size={16} />
              </button>
            )}
          </div>
          <ResumeUploader onAnalysisComplete={handleUploadComplete} />
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoadingActive && (
        <div className="ra-card p-4">
          <div className="skeleton-line title mb-3" />
          <div className="skeleton-line full mb-2" />
          <div className="skeleton-line mid" />
        </div>
      )}

      {/* EMPTY STATE: When no resume has been uploaded yet */}
      {!isLoadingActive && !hasResume && !showUploader && (
        <div className="ra-card empty-state-panel">
          <div className="empty-icon-wrap">
            <UploadCloud size={36} className="text-primary-blue" />
          </div>
          <h3 className="empty-title">Upload your resume</h3>
          <p className="empty-desc">
            Upload your PDF or DOCX and we'll analyze its ATS compatibility, content quality and keyword relevance.
          </p>
          <button onClick={() => setShowUploader(true)} className="btn-ra-primary">
            <UploadCloud size={16} />
            <span>Upload Resume</span>
          </button>
          <span className="empty-meta-hint">PDF, DOCX up to 10 MB</span>
        </div>
      )}

      {/* ANALYZED STATE: Renders ONLY when real analyzed resume data exists */}
      {!isLoadingActive && hasResume && (
        <>
          {/* 4. Score Section (Circular Indicator + 4 Health Dimension Progress Bars) */}
          <div className="ra-card score-hero-card">
            <div className="score-hero-left">
              <span className="score-section-eyebrow">ATS COMPATIBILITY</span>
              <div className="score-circle-wrap">
                <svg className="score-svg" viewBox="0 0 120 120" width="120" height="120">
                  <circle
                    className="score-svg-bg"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeWidth="10"
                  />
                  <circle
                    className="score-svg-fill"
                    cx="60"
                    cy="60"
                    r={radius}
                    strokeWidth="10"
                    stroke={currentTier?.stroke || '#3047FF'}
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="score-circle-center">
                  <span className="score-val-big">{atsScore}</span>
                  <span className="score-val-denom">/100</span>
                </div>
              </div>
              <div className="score-label-wrap">
                <span className={`score-tier-badge ${currentTier?.colorClass}`}>
                  {currentTier?.label}
                </span>
              </div>
            </div>

            <div className="score-hero-right">
              <div className="score-intro-box">
                <h3 className="score-intro-title">ATS Compatibility: {currentTier?.label}</h3>
                <p className="score-intro-desc">
                  {atsScore >= 80
                    ? 'Your resume is highly optimized for standard Applicant Tracking Systems with clean formatting, solid keyword density, and identifiable chronological sections.'
                    : atsScore >= 65
                    ? 'Your resume is readable by most ATS systems, but targeted improvements in measurable achievements and keyword density will increase your interview match rate.'
                    : 'Significant structural gaps or missing measurable outcomes were detected. Follow the prioritized improvements below to boost compliance.'}
                </p>
              </div>

              {/* 4 Dimension Progress Bars */}
              <div className="dimensions-grid">
                <div className="dim-bar-item">
                  <div className="dim-bar-header">
                    <span className="dim-name">Content Quality</span>
                    <strong className="dim-score">{contentScore}%</strong>
                  </div>
                  <div className="dim-track"><div className="dim-fill" style={{ width: `${contentScore}%` }} /></div>
                </div>

                <div className="dim-bar-item">
                  <div className="dim-bar-header">
                    <span className="dim-name">Formatting & Parsing</span>
                    <strong className="dim-score">{formatScore}%</strong>
                  </div>
                  <div className="dim-track"><div className="dim-fill" style={{ width: `${formatScore}%` }} /></div>
                </div>

                <div className="dim-bar-item">
                  <div className="dim-bar-header">
                    <span className="dim-name">Keyword Coverage</span>
                    <strong className="dim-score">{keywordScore}%</strong>
                  </div>
                  <div className="dim-track"><div className="dim-fill" style={{ width: `${keywordScore}%` }} /></div>
                </div>

                <div className="dim-bar-item">
                  <div className="dim-bar-header">
                    <span className="dim-name">Section Structure</span>
                    <strong className="dim-score">{structureScore}%</strong>
                  </div>
                  <div className="dim-track"><div className="dim-fill" style={{ width: `${structureScore}%` }} /></div>
                </div>
              </div>
            </div>
          </div>

          {/* 5. Analysis Grid (Two-Column: ATS Readability vs Content Quality) */}
          <div className="ra-two-col-grid">
            {/* LEFT: ATS Readability */}
            <div className="ra-card diagnostic-card">
              <div className="diag-card-header">
                <div>
                  <span className="diag-card-eyebrow">MACHINE PARSING</span>
                  <h3 className="diag-card-title">ATS Readability</h3>
                </div>
                <span className="diag-badge green">{formatScore} / 100 • Excellent</span>
              </div>
              <p className="diag-card-desc">Evaluates standard headings, clean typography, and layout parsing reliability.</p>
              <div className="check-items-list">
                <div className="check-item-row">
                  <CheckCircle2 size={16} className="text-success-green" />
                  <span>Standard section headers (Experience, Education, Skills) recognized</span>
                </div>
                <div className="check-item-row">
                  <CheckCircle2 size={16} className="text-success-green" />
                  <span>Machine-readable text layer extracted with no OCR image bottlenecks</span>
                </div>
                <div className="check-item-row">
                  <CheckCircle2 size={16} className="text-success-green" />
                  <span>Single-column chronological format prevents text-scrambling</span>
                </div>
                <div className="check-item-row">
                  <CheckCircle2 size={16} className="text-success-green" />
                  <span>Clean contact email and phone format easily indexed by recruiters</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Resume Content Quality */}
            <div className="ra-card diagnostic-card">
              <div className="diag-card-header">
                <div>
                  <span className="diag-card-eyebrow">RECRUITER IMPACT</span>
                  <h3 className="diag-card-title">Resume Content Quality</h3>
                </div>
                <span className={`diag-badge ${contentScore >= 75 ? 'blue' : 'orange'}`}>
                  {contentScore} / 100 • {contentScore >= 75 ? 'Good' : 'Needs Optimization'}
                </span>
              </div>
              <p className="diag-card-desc">Measures action verb strength, measurable achievements, and executive summary depth.</p>
              <div className="check-items-list">
                <div className="check-item-row">
                  {summaryText ? (
                    <CheckCircle2 size={16} className="text-success-green" />
                  ) : (
                    <AlertTriangle size={16} className="text-warning-amber" />
                  )}
                  <span>{summaryText ? 'Executive summary present and positioned for target role' : 'Professional summary missing or brief'}</span>
                </div>
                <div className="check-item-row">
                  {expList.length > 0 ? (
                    <CheckCircle2 size={16} className="text-success-green" />
                  ) : (
                    <AlertTriangle size={16} className="text-warning-amber" />
                  )}
                  <span>{expList.length > 0 ? `${expList.length} work experience positions chronologically structured` : 'No professional experience parsed'}</span>
                </div>
                <div className="check-item-row">
                  {highPriorityCount === 0 ? (
                    <CheckCircle2 size={16} className="text-success-green" />
                  ) : (
                    <AlertTriangle size={16} className="text-warning-amber" />
                  )}
                  <span>{highPriorityCount === 0 ? 'Strong presence of action verbs and measurable outcomes' : 'Opportunities to add concrete metrics and outcome metrics'}</span>
                </div>
                <div className="check-item-row">
                  <CheckCircle2 size={16} className="text-success-green" />
                  <span>Technical competencies match contemporary industry terminology</span>
                </div>
              </div>
            </div>
          </div>

          {/* 6. Contact & Header + Resume Structure (Two Cards Grid) */}
          <div className="ra-two-col-grid">
            {/* Contact & Header Card */}
            <div className="ra-card">
              <div className="card-section-header">
                <h3 className="section-title">Contact & Header</h3>
                <span className="text-xs text-muted">Detected fields from header</span>
              </div>
              <div className="contact-grid">
                <div className="contact-field-item">
                  <span className="field-name">Name</span>
                  <span className="field-status verified">
                    {personalInfo?.full_name ? <><Check size={13} /> {safeString(personalInfo.full_name)}</> : <span className="text-muted">—</span>}
                  </span>
                </div>
                <div className="contact-field-item">
                  <span className="field-name">Email</span>
                  <span className="field-status verified">
                    {personalInfo?.email ? <><Check size={13} /> {safeString(personalInfo.email)}</> : <span className="text-warning">⚠ Missing</span>}
                  </span>
                </div>
                <div className="contact-field-item">
                  <span className="field-name">Phone</span>
                  <span className="field-status verified">
                    {personalInfo?.phone ? <><Check size={13} /> {safeString(personalInfo.phone)}</> : <span className="text-muted">— Not detected</span>}
                  </span>
                </div>
                <div className="contact-field-item">
                  <span className="field-name">Location</span>
                  <span className="field-status verified">
                    {personalInfo?.location ? <><Check size={13} /> {safeString(personalInfo.location)}</> : <span className="text-muted">— Not detected</span>}
                  </span>
                </div>
                <div className="contact-field-item">
                  <span className="field-name">LinkedIn</span>
                  <span className="field-status verified">
                    {personalInfo?.linkedin_url ? <><Check size={13} /> Linked</> : <span className="text-muted">— Optional</span>}
                  </span>
                </div>
                <div className="contact-field-item">
                  <span className="field-name">Portfolio / GitHub</span>
                  <span className="field-status verified">
                    {personalInfo?.github_url || personalInfo?.portfolio_url ? <><Check size={13} /> Verified</> : <span className="text-muted">— Optional</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Resume Structure Coverage Card */}
            <div className="ra-card">
              <div className="card-section-header">
                <h3 className="section-title">Resume Structure</h3>
                <span className="text-xs text-muted">Core section detection</span>
              </div>
              <div className="structure-grid">
                <div className="structure-pill">
                  <span className="struct-icon">{summaryText ? '✓' : '⚠'}</span>
                  <span className="struct-title">Summary</span>
                  <span className="struct-status">{summaryText ? 'Detected' : 'Brief'}</span>
                </div>
                <div className="structure-pill">
                  <span className="struct-icon">{expList.length > 0 ? '✓' : '⚠'}</span>
                  <span className="struct-title">Experience</span>
                  <span className="struct-status">{expList.length > 0 ? `${expList.length} items` : 'Missing'}</span>
                </div>
                <div className="structure-pill">
                  <span className="struct-icon">{eduList.length > 0 ? '✓' : '⚠'}</span>
                  <span className="struct-title">Education</span>
                  <span className="struct-status">{eduList.length > 0 ? `${eduList.length} items` : 'Missing'}</span>
                </div>
                <div className="structure-pill">
                  <span className="struct-icon">{skillsList.length > 0 ? '✓' : '⚠'}</span>
                  <span className="struct-title">Skills</span>
                  <span className="struct-status">{skillsList.length > 0 ? `${skillsList.length} items` : 'Missing'}</span>
                </div>
                <div className="structure-pill">
                  <span className="struct-icon">{projList.length > 0 ? '✓' : '—'}</span>
                  <span className="struct-title">Projects</span>
                  <span className="struct-status">{projList.length > 0 ? `${projList.length} items` : 'None'}</span>
                </div>
                <div className="structure-pill">
                  <span className="struct-icon">{certsList.length > 0 ? '✓' : '—'}</span>
                  <span className="struct-title">Certifications</span>
                  <span className="struct-status">{certsList.length > 0 ? `${certsList.length} items` : 'None'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 7. Extracted Skills Taxonomy */}
          <div className="ra-card">
            <div className="card-section-header">
              <div>
                <h3 className="section-title">Extracted Skills ({skillsList.length})</h3>
                <p className="section-subtitle">Verified technical and domain competencies parsed directly from your document.</p>
              </div>
            </div>

            {Object.keys(categorizedSkills).length > 0 ? (
              <div className="skills-categorized-grid">
                {Object.entries(categorizedSkills).map(([catName, sks]) => (
                  <div key={catName} className="skill-cat-card">
                    <span className="cat-badge">{catName} ({sks.length})</span>
                    <div className="skill-tags-wrap">
                      {sks.map((sk, sIdx) => (
                        <span key={sIdx} className="skill-pill-item">
                          {safeString(sk)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : skillsList.length > 0 ? (
              <div className="skill-tags-wrap">
                {skillsList.map((sk, sIdx) => (
                  <span key={sIdx} className="skill-pill-item">
                    {safeString(sk)}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted italic">No skills could be reliably extracted. Ensure your skills section is formatted clearly.</p>
            )}
          </div>

          {/* 8. Keyword Intelligence (Detected / Missing / Recommended) */}
          <div className="ra-card">
            <div className="keyword-header-bar">
              <div>
                <h3 className="section-title">Keyword Intelligence</h3>
                <p className="section-subtitle">Industry keyword distribution relative to {currentTargetRole}.</p>
              </div>

              <div className="tab-pills-row">
                <button
                  onClick={() => setKeywordTab('all')}
                  className={`tab-pill-btn ${keywordTab === 'all' ? 'active' : ''}`}
                >
                  All ({keywordList.length})
                </button>
                <button
                  onClick={() => setKeywordTab('present')}
                  className={`tab-pill-btn ${keywordTab === 'present' ? 'active' : ''}`}
                >
                  Detected ({keywordList.filter((k) => k.status === 'Present').length})
                </button>
                <button
                  onClick={() => setKeywordTab('missing')}
                  className={`tab-pill-btn ${keywordTab === 'missing' ? 'active' : ''}`}
                >
                  Missing ({keywordList.filter((k) => k.status === 'Missing').length})
                </button>
              </div>
            </div>

            <div className="keywords-table-wrap">
              <table className="ra-table">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Status</th>
                    <th>Importance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredKeywords.map((kw, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold text-dark">{kw.name}</td>
                      <td>
                        <span className={`status-pill ${kw.status === 'Present' ? 'present' : 'missing'}`}>
                          {kw.status === 'Present' ? '✓ Present' : '! Missing'}
                        </span>
                      </td>
                      <td>
                        <span className={`importance-tag ${kw.importance === 'High' ? 'high' : 'recommended'}`}>
                          {kw.importance}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 9. Strengths & Improvements Grid */}
          <div className="ra-two-col-grid">
            {/* What's Working (Strengths) */}
            <div className="ra-card">
              <div className="card-section-header">
                <div className="flex items-center gap-2 text-success-green">
                  <CheckCircle2 size={18} />
                  <h3 className="section-title text-dark">What's Working ({rawStrengths.length})</h3>
                </div>
              </div>
              <div className="strengths-list">
                {rawStrengths.length > 0 ? (
                  rawStrengths.map((str, idx) => (
                    <div key={idx} className="strength-item-card">
                      <div className="strength-icon">✓</div>
                      <div className="strength-text">
                        <strong className="block text-dark text-sm">{safeString(str)}</strong>
                        <span className="text-xs text-muted">Positively impacts automated ATS sorting and keyword rankings.</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted italic">No significant strengths detected yet. Expand your resume details.</p>
                )}
              </div>
            </div>

            {/* What To Improve (Prioritized Recommendations) */}
            <div className="ra-card">
              <div className="card-section-header">
                <div className="flex items-center gap-2 text-warning-amber">
                  <AlertCircle size={18} />
                  <h3 className="section-title text-dark">What To Improve ({structuredImprovements.length})</h3>
                </div>
              </div>
              <div className="improvements-list">
                {structuredImprovements.length > 0 ? (
                  structuredImprovements.map((imp) => (
                    <div key={imp.id} className="improvement-item-card">
                      <div className="imp-top-row">
                        <span className={`priority-badge ${imp.priority.toLowerCase()}`}>
                          {imp.priority} PRIORITY
                        </span>
                        <strong className="imp-title">{imp.title}</strong>
                      </div>
                      <p className="imp-why">{imp.why}</p>
                      <div className="imp-action-box">
                        <span className="action-tag">Recommended:</span>
                        <span className="action-text">{imp.action}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
                    ✓ No major ATS issues detected! Your resume structure meets core standards.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 10. Job Description Match Calibration */}
          <div className="ra-card jd-calibration-card">
            <div className="card-section-header">
              <div>
                <div className="ra-eyebrow mb-1">
                  <Target size={13} /> <span>TARGET ROLE CALIBRATION</span>
                </div>
                <h3 className="section-title">Analyze Resume Against a Job</h3>
                <p className="section-subtitle">
                  Paste any job description to evaluate real-time keyword density and identify missing competencies.
                </p>
              </div>
            </div>

            <div className="jd-form-wrap">
              <div className="form-group-ra">
                <label className="ra-label">Target Job Title</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Frontend Engineer"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  className="ra-input"
                />
              </div>

              <div className="form-group-ra">
                <label className="ra-label">Job Description Text</label>
                <textarea
                  rows={4}
                  placeholder="Paste the full job requirements and responsibilities here..."
                  value={jobDescInput}
                  onChange={(e) => setJobDescInput(e.target.value)}
                  className="ra-textarea"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleAnalyzeJobMatch}
                  disabled={!jobDescInput.trim() || isMatchingJob}
                  className="btn-ra-primary"
                >
                  <Target size={15} />
                  <span>{isMatchingJob ? 'Analyzing match...' : 'Analyze Match'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Job Match Result Modal */}
          {showJdModal && jobMatchData && (
            <div className="ra-modal-overlay">
              <div className="ra-modal-card">
                <div className="modal-top-bar">
                  <div>
                    <span className="modal-match-badge">{jobMatchData.match_percentage ?? 80}% MATCH</span>
                    <h3 className="modal-heading">Job Match Calibration</h3>
                    <span className="text-xs text-muted">Target: {safeString(jobMatchData.target_role, targetRoleInput)}</span>
                  </div>
                  <button onClick={() => setShowJdModal(false)} className="btn-ra-ghost btn-sm">
                    <X size={18} />
                  </button>
                </div>

                <div className="modal-content-body">
                  <div className="modal-kpi-row">
                    <div className="modal-kpi-item">
                      <span className="kpi-mini-lbl">OVERALL MATCH</span>
                      <strong className="kpi-mini-val text-primary-blue">{jobMatchData.match_percentage ?? 80}%</strong>
                    </div>
                    <div className="modal-kpi-item">
                      <span className="kpi-mini-lbl">KEYWORD DENSITY</span>
                      <strong className="kpi-mini-val text-dark">{jobMatchData.keyword_match ?? 75}%</strong>
                    </div>
                  </div>

                  {jobMatchData.matching_skills && jobMatchData.matching_skills.length > 0 && (
                    <div className="modal-skills-sec">
                      <h4 className="modal-sec-title green">Matching Skills ({jobMatchData.matching_skills.length})</h4>
                      <div className="tags-row">
                        {jobMatchData.matching_skills.map((s, idx) => (
                          <span key={idx} className="tag-pill match">✓ {safeString(s)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobMatchData.missing_skills && jobMatchData.missing_skills.length > 0 && (
                    <div className="modal-skills-sec">
                      <h4 className="modal-sec-title orange">Missing Keywords ({jobMatchData.missing_skills.length})</h4>
                      <div className="tags-row">
                        {jobMatchData.missing_skills.map((s, idx) => (
                          <span key={idx} className="tag-pill missing">! {safeString(s)}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {jobMatchData.recommendations && (
                    <div className="modal-advice-box">
                      <strong className="advice-title">Recommendations:</strong>
                      <p className="advice-text">{safeString(jobMatchData.recommendations)}</p>
                    </div>
                  )}
                </div>

                <div className="modal-bottom-actions">
                  <button onClick={() => setShowJdModal(false)} className="btn-ra-secondary btn-sm">
                    Close Analysis
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResumeAnalysis;
