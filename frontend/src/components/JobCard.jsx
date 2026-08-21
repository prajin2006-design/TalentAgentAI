import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import {
  Building2,
  MapPin,
  Briefcase,
  DollarSign,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import './JobCard.css';

export const JobCard = ({ job }) => {
  const { toggleSaveJob } = useCareer();
  const [showMatchModal, setShowMatchModal] = useState(false);

  const getMatchBadgeClass = (score) => {
    if (score >= 88) return 'badge-accent';
    if (score >= 75) return 'badge-primary';
    return 'badge-muted';
  };

  return (
    <>
      <div className="card job-card hover-expand">
        <div className="job-card-header">
          <div>
            <div className="job-company-row">
              <Building2 size={15} className="company-icon text-electric-blue" />
              <span className="job-company">{job.company}</span>
              <span className="job-worktype">{job.workType}</span>
            </div>
            <h3 className="job-title">{job.title}</h3>
          </div>

          <div className={`badge ${getMatchBadgeClass(job.matchPercentage)} match-badge-pill`}>
            <Sparkles size={13} /> {job.matchPercentage}% MATCH
          </div>
        </div>

        <div className="job-details-row">
          <div className="job-detail-item">
            <MapPin size={14} /> {job.location}
          </div>
          {job.salary && (
            <div className="job-detail-item salary">
              <DollarSign size={14} /> {job.salary}
            </div>
          )}
        </div>

        {/* AI Rationale Summary */}
        <div className="job-recommend-box">
          <Sparkles size={15} className="recommend-icon text-electric-blue" />
          <p className="recommend-text">{job.whyRecommended}</p>
        </div>

        {/* Skills Breakdown */}
        <div className="job-skills-breakdown">
          <div className="skills-group">
            <span className="group-label success">MATCHING SKILLS ({job.matchingSkills?.length || 0})</span>
            <div className="tags-flex">
              {job.matchingSkills?.map((s) => (
                <span key={s} className="badge badge-accent">✓ {s}</span>
              ))}
            </div>
          </div>

          {job.missingSkills && job.missingSkills.length > 0 && (
            <div className="skills-group">
              <span className="group-label gap">SKILL GAPS ({job.missingSkills.length})</span>
              <div className="tags-flex">
                {job.missingSkills.map((s) => (
                  <span key={s} className="badge badge-muted">! {s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="job-card-actions">
          <button
            onClick={() => toggleSaveJob(job.id)}
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

          <button className="btn btn-primary btn-sm apply-btn hover-expand">
            <span>Apply Now</span>
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
                <span className="badge badge-accent mb-1">{job.matchPercentage}% MATCH SCORE</span>
                <h2>{job.title}</h2>
                <p className="text-muted text-sm">{job.company} • {job.location}</p>
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
                    {job.matchingSkills?.map((s) => (
                      <span key={s} className="badge badge-accent">✓ {s}</span>
                    ))}
                  </div>
                </div>

                {job.missingSkills && (
                  <div className="detail-block mt-2">
                    <span className="block-label">SKILL GAPS TO BRIDGE</span>
                    <div className="tags-flex mt-1">
                      {job.missingSkills.map((s) => (
                        <span key={s} className="badge badge-muted">! {s}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="detail-block mt-3">
                  <span className="block-label">AI COMPATIBILITY EXPLANATION</span>
                  <p className="block-text">{job.whyRecommended} Adding missing skills will boost compatibility score above 95%.</p>
                </div>

                <div className="detail-block mt-3">
                  <span className="block-label">JOB DESCRIPTION</span>
                  <p className="block-text">{job.description}</p>
                </div>

                <div className="modal-actions-row">
                  <button onClick={() => setShowMatchModal(false)} className="btn btn-outline">
                    Close Detail
                  </button>
                  <button className="btn btn-primary hover-expand">
                    Apply for Position <ArrowRight size={15} />
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
