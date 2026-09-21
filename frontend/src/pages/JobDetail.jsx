import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { jobsAPI, resumeAPI } from '../services/api';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import {
  Briefcase,
  Building2,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Bookmark,
  Send,
  ArrowLeft,
  Share2,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  RefreshCw
} from 'lucide-react';
import './JobDetail.css';

export const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toggleSaveJob, applyToJob, skills } = useCareer();

  const [job, setJob] = useState(null);
  const [matchData, setMatchData] = useState(null);
  const [activeResume, setActiveResume] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [applySuccessMsg, setApplySuccessMsg] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobDetails();
  }, [id, isAuthenticated]);

  const fetchJobDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch Job Requisition
      const res = await jobsAPI.getJobDetail(id);
      setJob(res);

      // 2. Fetch Match Data if Authenticated
      if (isAuthenticated) {
        try {
          const matchRes = await jobsAPI.getJobMatches();
          const found = (matchRes.matches || []).find((m) => String(m.id) === String(id) || String(m.job_id) === String(id));
          if (found) {
            setMatchData(found);
            setIsSaved(Boolean(found.saved));
            setHasApplied(Boolean(found.applied || (found.application_status && found.application_status !== 'not_applied')));
          }
        } catch {}

        try {
          const rRes = await resumeAPI.getActiveResume();
          if (rRes?.resume) setActiveResume(rRes.resume);
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load job detail:', err);
      setError(err.message || 'Job requisition was not found or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    try {
      const res = await toggleSaveJob(Number(id));
      setIsSaved(Boolean(res?.saved));
    } catch (err) {
      console.error('Save job failed:', err);
    }
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    setIsApplying(true);
    setError(null);
    try {
      const res = await applyToJob(Number(id));
      setHasApplied(true);
      setApplySuccessMsg(res.message || 'Application submitted successfully!');
    } catch (err) {
      setError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="job-detail-page-container">
        <div className="card job-detail-skeleton">
          <div className="skeleton-line title" />
          <div className="skeleton-line subtitle" />
          <div className="skeleton-line content" />
          <div className="skeleton-line content" />
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page-container">
        <div className="card empty-state-card text-center">
          <AlertCircle size={44} className="text-warning mb-2" />
          <h2>Job Requisition Unavailable</h2>
          <p className="text-muted">{error || 'The requested job post could not be retrieved.'}</p>
          <Link to="/job-matching" className="btn btn-primary btn-sm mt-3">
            <ArrowLeft size={14} />
            <span>Return to Job Matches</span>
          </Link>
        </div>
      </div>
    );
  }

  const reqSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (Array.isArray(job.required_skills) ? job.required_skills : []);

  const matchingSkills = matchData?.matchingSkills || matchData?.matching_skills || [];
  const missingSkills = matchData?.missingSkills || matchData?.missing_skills || [];
  const matchPct = matchData?.matchPercentage || matchData?.match_percentage || 78;

  return (
    <div className="job-detail-page-container">
      {/* Top Breadcrumb Navigation */}
      <div className="breadcrumb-bar">
        <Link to="/job-matching" className="back-link">
          <ArrowLeft size={15} />
          <span>Back to Job Matches</span>
        </Link>
      </div>

      {/* Main Job Hero Header */}
      <div className="job-hero-card card">
        <div className="job-hero-main">
          <div className="job-brand-icon">
            <Building2 size={28} />
          </div>

          <div className="job-title-stack">
            <div className="job-badge-row">
              <span className="badge badge-accent">{job.department || 'Engineering'}</span>
              <span className="job-type-pill">{job.workType || job.work_mode || 'Full-time'}</span>
            </div>
            <h1 className="job-main-title">{job.title}</h1>
            <div className="job-meta-row">
              <span className="company-text">{job.company}</span>
              <span className="meta-bullet">•</span>
              <span className="location-text">
                <MapPin size={13} /> {job.location || 'Remote'}
              </span>
              <span className="meta-bullet">•</span>
              <span className="salary-text">
                <DollarSign size={13} /> {job.salary || 'Competitive'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="job-hero-actions">
          <button
            type="button"
            onClick={handleToggleSave}
            className={`btn btn-outline btn-save ${isSaved ? 'saved' : ''}`}
            title={isSaved ? 'Job Bookmarked' : 'Save Job'}
          >
            <Bookmark size={16} fill={isSaved ? 'currentColor' : 'none'} />
            <span>{isSaved ? 'Saved' : 'Save Role'}</span>
          </button>

          {hasApplied ? (
            <div className="applied-pill-tag">
              <CheckCircle2 size={16} />
              <span>Application Submitted</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              disabled={isApplying}
              className="btn btn-accent btn-apply"
            >
              {isApplying ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Apply with Talent Agent Resume</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {applySuccessMsg && (
        <div className="alert-success-box">
          <CheckCircle2 size={18} />
          <span>{applySuccessMsg} You can track progress in <Link to="/applications">Applications</Link>.</span>
        </div>
      )}

      {/* Grid Layout: Job Details & AI Match Evaluation */}
      <div className="job-detail-grid">
        {/* Left Column: Full Description & Requirements */}
        <div className="job-content-col card">
          <section className="detail-section">
            <h2>Role Overview</h2>
            <p className="job-desc-text">{job.description}</p>
          </section>

          <section className="detail-section">
            <h2>Required Technical Proficiencies</h2>
            <div className="skills-tags-wrapper">
              {reqSkills.map((sk, idx) => {
                const sName = typeof sk === 'string' ? sk : (sk?.name || sk?.skill_name || '');
                const isMatched = matchingSkills.some((m) =>
                  (typeof m === 'string' ? m : m.skill_name || m.name || '').toLowerCase() === sName.toLowerCase()
                );

                return (
                  <span
                    key={idx}
                    className={`skill-pill-tag ${isMatched ? 'matched' : 'standard'}`}
                  >
                    {isMatched && <Check size={12} />}
                    {sName}
                  </span>
                );
              })}
            </div>
          </section>

          {job.experienceRequired && (
            <section className="detail-section">
              <h2>Experience & Qualifications</h2>
              <p className="job-desc-text">Minimum experience required: {job.experienceRequired}</p>
            </section>
          )}

          <section className="detail-section interview-prep-cta">
            <div className="interview-cta-box">
              <div className="interview-cta-info">
                <h3>Prepare for this specific interview</h3>
                <p>Generate position-tailored questions and evaluate your responses with our AI interviewer.</p>
              </div>
              <Link to="/interview" className="btn btn-primary btn-sm">
                <Sparkles size={14} />
                <span>Launch Interview Simulator</span>
              </Link>
            </div>
          </section>
        </div>

        {/* Right Column: AI Match Matrix & Compatibility Breakdown */}
        <div className="job-sidebar-col">
          {/* AI Match Matrix Card */}
          <div className="card match-matrix-card">
            <div className="matrix-badge-header">
              <Sparkles size={14} className="text-electric-blue" />
              <span>AI COMPATIBILITY MATRIX</span>
            </div>

            <div className="match-radial-box">
              <div className="match-score-number">{matchPct}%</div>
              <span className="match-status-label">
                {matchPct >= 80 ? 'High Fit Candidate' : matchPct >= 60 ? 'Competitive Alignment' : 'Skill Alignment Needed'}
              </span>
            </div>

            {matchData?.whyRecommended && (
              <div className="why-recommended-box">
                <p>"{matchData.whyRecommended}"</p>
              </div>
            )}

            {/* Matched Skills */}
            {matchingSkills.length > 0 && (
              <div className="skills-breakdown-box">
                <h4>
                  <CheckCircle2 size={14} className="text-success" />
                  <span>Your Matching Capabilities ({matchingSkills.length})</span>
                </h4>
                <div className="matrix-tags-row">
                  {matchingSkills.map((sk, i) => (
                    <span key={i} className="badge badge-accent">
                      ✓ {typeof sk === 'string' ? sk : (sk.skill_name || sk.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Skills */}
            {missingSkills.length > 0 && (
              <div className="skills-breakdown-box">
                <h4>
                  <AlertCircle size={14} className="text-warning" />
                  <span>Key Requisition Gaps ({missingSkills.length})</span>
                </h4>
                <div className="matrix-tags-row">
                  {missingSkills.map((sk, i) => (
                    <span key={i} className="badge badge-warning">
                      + {typeof sk === 'string' ? sk : (sk.skill_name || sk.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link to="/skill-gaps" className="btn btn-outline btn-sm btn-full mt-3">
              <span>View Full Skill Gap Diagnostics</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {/* Active Resume Sync Status */}
          <div className="card resume-sync-card">
            <div className="sync-header">
              <FileText size={16} className="text-accent" />
              <h4>Resume on File</h4>
            </div>
            {activeResume ? (
              <div className="sync-details">
                <p className="resume-name">{activeResume.original_filename || 'ATS Resume v2'}</p>
                <span className="ats-score-tag">
                  ATS Score: {activeResume.ats_score || 85}%
                </span>
                <Link to="/resume-analysis" className="sync-link">
                  Inspect Resume Analysis →
                </Link>
              </div>
            ) : (
              <div className="sync-empty">
                <p className="text-muted">No resume uploaded yet.</p>
                <Link to="/resume-maker" className="btn btn-secondary btn-xs mt-2">
                  Create ATS Resume
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
