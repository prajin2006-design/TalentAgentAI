import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { normalizeReadiness, safeString } from '../utils/userHelpers';
import './JobCard.css';

export const JobCard = ({ job = {} }) => {
  const { toggleSaveJob, applyToJob } = useCareer();
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const matchScore = normalizeReadiness(job.matchPercentage ?? job.match_percentage ?? 75);

  const getMatchBadgeClass = (score) => {
    if (score >= 88) return 'badge-accent';
    if (score >= 75) return 'badge-primary';
    return 'badge-muted';
  };

  const matchingSkills = Array.isArray(job.matchingSkills)
    ? job.matchingSkills
    : Array.isArray(job.matching_skills)
    ? job.matching_skills
    : [];

  const missingSkills = Array.isArray(job.missingSkills)
    ? job.missingSkills
    : Array.isArray(job.missing_skills)
    ? job.missing_skills
    : [];

  const renderSkillTag = (skill, isGap = false) => {
    const text = typeof skill === 'string' ? skill : (skill?.skill_name || skill?.name || skill?.skill || '');
    if (!text) return null;
    return (
      <span key={text} className={`badge ${isGap ? 'badge-muted' : 'badge-accent'}`}>
        {isGap ? '! ' : '✓ '}{text}
      </span>
    );
  };

  const handleApply = async () => {
    if (isApplying || job.applied) return;
    setIsApplying(true);
    try {
      if (applyToJob) {
        await applyToJob(job.id);
      }
    } catch (e) {
      console.error('Failed to apply:', e);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <>
      <div className="card job-card hover-expand">
        <div className="job-card-header">
          <div>
            <div className="job-company-row">
              <Building2 size={15} className="company-icon text-electric-blue" />
              <span className="job-company">{safeString(job.company, 'Tech Company')}</span>
              <span className="job-worktype">{safeString(job.workType || job.work_mode, 'Hybrid')}</span>
            </div>
            <h3 className="job-title">{safeString(job.title, 'Software Engineer')}</h3>
          </div>

          <div className={`badge ${getMatchBadgeClass(matchScore)} match-badge-pill`}>
            <Sparkles size={13} /> {matchScore}% MATCH
          </div>
        </div>

        <div className="job-details-row">
          <div className="job-detail-item">
            <MapPin size={14} /> {safeString(job.location, 'Remote')}
          </div>
          {job.salary && (
            <div className="job-detail-item salary">
              <DollarSign size={14} /> {safeString(job.salary)}
            </div>
          )}
        </div>

        {/* AI Rationale Summary */}
        {job.whyRecommended && (
          <div className="job-recommend-box">
            <Sparkles size={15} className="recommend-icon text-electric-blue" />
            <p className="recommend-text">{safeString(job.whyRecommended)}</p>
          </div>
        )}

        {/* Skills Breakdown */}
        <div className="job-skills-breakdown">
          <div className="skills-group">
            <span className="group-label success">MATCHING SKILLS ({matchingSkills.length})</span>
            <div className="tags-flex">
              {matchingSkills.map((s) => renderSkillTag(s, false))}
            </div>
          </div>

          {missingSkills.length > 0 && (
            <div className="skills-group">
              <span className="group-label gap">SKILL GAPS ({missingSkills.length})</span>
              <div className="tags-flex">
                {missingSkills.map((s) => renderSkillTag(s, true))}
              </div>
            </div>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="job-card-actions">
          <button
            onClick={() => toggleSaveJob && toggleSaveJob(job.id)}
            className={`btn btn-ghost save-btn ${job.saved ? 'saved' : ''}`}
            title={job.saved ? 'Saved' : 'Save Job'}
          >
            <Bookmark size={17} fill={job.saved ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={() => setShowMatchModal(true)}
            className="btn btn-outline btn-sm"
          >
            View Match Detail
          </button>

          <button
            onClick={handleApply}
            disabled={isApplying || job.applied}
            className="btn btn-primary btn-sm apply-btn hover-expand"
          >
            <span>{job.applied ? 'Applied' : isApplying ? 'Applying...' : 'Apply Now'}</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* FULL MATCH EXPLANATION MODAL */}
      {showMatchModal && (
        <div className="admin-modal-overlay">
          <div className="card admin-modal-card">
            <div className="modal-header">
              <div>
                <span className="badge badge-accent mb-1">{matchScore}% MATCH SCORE</span>
                <h2>{safeString(job.title)}</h2>
                <p className="text-muted text-sm">{safeString(job.company)} • {safeString(job.location)}</p>
              </div>
              <button onClick={() => setShowMatchModal(false)} className="icon-action-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="modal-info-stack">
                <div className="detail-block">
                  <span className="block-label">WHY YOU'RE A MATCH</span>
                  <div className="tags-flex mt-1">
                    {matchingSkills.map((s) => renderSkillTag(s, false))}
                  </div>
                </div>

                {missingSkills.length > 0 && (
                  <div className="detail-block mt-2">
                    <span className="block-label">SKILL GAPS TO BRIDGE</span>
                    <div className="tags-flex mt-1">
                      {missingSkills.map((s) => renderSkillTag(s, true))}
                    </div>
                  </div>
                )}

                <div className="detail-block mt-3">
                  <span className="block-label">AI COMPATIBILITY EXPLANATION</span>
                  <p className="block-text">{safeString(job.whyRecommended)} Addressing missing competencies will boost alignment.</p>
                </div>

                {job.description && (
                  <div className="detail-block mt-3">
                    <span className="block-label">JOB DESCRIPTION</span>
                    <p className="block-text">{safeString(job.description)}</p>
                  </div>
                )}

                <div className="modal-actions-row">
                  <button onClick={() => setShowMatchModal(false)} className="btn btn-outline">
                    Close Detail
                  </button>
                  <button
                    onClick={() => { handleApply(); setShowMatchModal(false); }}
                    disabled={isApplying || job.applied}
                    className="btn btn-primary hover-expand"
                  >
                    {job.applied ? 'Already Applied' : isApplying ? 'Submitting...' : 'Apply for Position'} <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JobCard;
