import React, { useState, useEffect } from 'react';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import { jobsAPI } from '../services/api';
import {
  Target,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Sparkles,
  BookOpen,
  X,
  ChevronRight,
  Zap,
  Briefcase,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { normalizeReadiness, safeString } from '../utils/userHelpers';
import './SkillGapAnalysis.css';

export const SkillGapAnalysis = () => {
  const { isAuthenticated } = useAuth();
  const { profile, skills, skillGaps: careerSkillGaps, profileScore } = useCareer();

  const [activeJobs, setActiveJobs] = useState([]);
  const [computedGaps, setComputedGaps] = useState([]);
  const [selectedSkillGap, setSelectedSkillGap] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const targetRole = profile?.preferred_role || 'Software Engineering Positions';

  useEffect(() => {
    let mounted = true;
    const fetchMatrix = async () => {
      setIsLoading(true);
      try {
        const jData = await jobsAPI.getJobs();
        if (mounted && jData && jData.jobs) {
          setActiveJobs(jData.jobs);

          // Build dynamic skill comparison from active jobs
          const candidateSkillsLower = new Set(
            (skills || []).map((s) => safeString(s).toLowerCase().trim()).filter(Boolean)
          );

          const requiredSkillCounts = {};
          jData.jobs.forEach((job) => {
            const req = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
            req.forEach((sk) => {
              if (typeof sk === 'string' && sk.trim()) {
                const normalized = sk.trim();
                requiredSkillCounts[normalized] = (requiredSkillCounts[normalized] || 0) + 1;
              }
            });
          });

          // Identify gaps and present skills
          const gapsList = Object.entries(requiredSkillCounts).map(([skillName, jobCount]) => {
            const userHas = candidateSkillsLower.has(skillName.toLowerCase());
            const priority = jobCount >= 3 ? 'HIGH' : jobCount >= 2 ? 'MEDIUM' : 'LOW';
            const impactPct = priority === 'HIGH' ? 12 : priority === 'MEDIUM' ? 8 : 4;
            const estimatedHours = priority === 'HIGH' ? 24 : 12;

            return {
              id: `gap-${skillName}`,
              skill_name: skillName,
              userHas,
              required: true,
              priority,
              impact_pct: impactPct,
              estimated_hours: estimatedHours,
              target_level: priority === 'HIGH' ? 'Advanced' : 'Intermediate',
              jobs_affected: jobCount,
              why_needed: `Required by ${jobCount} active market requisition(s) targeting ${targetRole}.`,
              learning_path: [
                `Core fundamentals & architecture in ${skillName}`,
                `Build a production project module demonstrating ${skillName}`,
                `Benchmark ATS resume integration with quantifiable impact bullets`
              ]
            };
          });

          // Sort: Missing skills first, then by priority/jobs affected
          gapsList.sort((a, b) => {
            if (a.userHas === b.userHas) {
              return b.jobs_affected - a.jobs_affected;
            }
            return a.userHas ? 1 : -1;
          });

          setComputedGaps(gapsList);
        }
      } catch (err) {
        console.error('Failed to calculate skill gap matrix:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchMatrix();
    }
  }, [isAuthenticated, skills, targetRole]);

  const missingGaps = computedGaps.filter((g) => !g.userHas);
  const presentSkills = computedGaps.filter((g) => g.userHas);

  return (
    <div className="skill-gaps-wrapper">
      {/* 1. OVERVIEW BANNER */}
      <div className="card gap-banner-card">
        <div className="banner-left-info">
          <div className="badge-gap-header">
            <Target size={14} /> <span>Skill Gap Diagnostics Matrix</span>
          </div>
          <h2 className="banner-heading">Technical Calibration for {targetRole}</h2>
          <p className="banner-sub">
            Benchmarked against <strong>{activeJobs.length} active database requisitions</strong>. Closing your top missing proficiencies directly elevates your candidate compatibility index.
          </p>
        </div>

        <div className="gap-metrics-strip">
          <div className="metric-box">
            <span className="metric-score-val">{missingGaps.length}</span>
            <span className="metric-score-label">IDENTIFIED GAPS</span>
          </div>
          <div className="metric-divider" />
          <div className="metric-box">
            <span className="metric-score-val text-green">{presentSkills.length}</span>
            <span className="metric-score-label">VERIFIED SKILLS</span>
          </div>
        </div>
      </div>

      {/* 2. GAP COMPARISON MATRIX TABLE */}
      <div className="card comparison-card">
        <div className="comparison-header">
          <div className="comp-title-wrap">
            <Sparkles size={18} className="text-primary" />
            <h3>Market Skills Alignment ({computedGaps.length} Evaluated)</h3>
          </div>
          <Link to="/profile" className="btn-edit-profile-link">
            <span>Manage Profile Skills</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        <div className="comparison-table-wrapper">
          {isLoading ? (
            <div className="table-loading-box">
              <div className="skeleton-row-line" />
              <div className="skeleton-row-line" />
              <div className="skeleton-row-line" />
            </div>
          ) : (
            <table className="comparison-table">
              <thead>
                <tr>
                  <th>Skill / Technology</th>
                  <th>Your Profile</th>
                  <th>Market Demand</th>
                  <th>Priority Impact</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {computedGaps.length > 0 ? (
                  computedGaps.map((item) => (
                    <tr key={item.id || item.skill_name} className={!item.userHas ? 'gap-row' : ''}>
                      <td className="skill-name-td">
                        <strong>{safeString(item.skill_name)}</strong>
                      </td>
                      <td>
                        {item.userHas ? (
                          <span className="status-pill match">
                            <CheckCircle2 size={12} /> Present
                          </span>
                        ) : (
                          <span className="status-pill gap">
                            <AlertCircle size={12} /> Missing
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="demand-text">
                          Required by <strong>{item.jobs_affected || 1}</strong> role(s)
                        </span>
                      </td>
                      <td>
                        {item.userHas ? (
                          <span className="verified-text">Match Verified ✓</span>
                        ) : (
                          <span className={`priority-tag ${safeString(item.priority, 'Medium').toLowerCase()}`}>
                            {safeString(item.priority, 'Medium')} PRIORITY (+{normalizeReadiness(item.impact_pct)}%)
                          </span>
                        )}
                      </td>
                      <td>
                        {!item.userHas ? (
                          <button
                            type="button"
                            onClick={() => setSelectedSkillGap(item)}
                            className="btn-inspect-path"
                          >
                            <span>Inspect Path</span>
                            <ChevronRight size={13} />
                          </button>
                        ) : (
                          <span className="text-muted text-xs">Profile Aligned</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="empty-table-row">
                      No active jobs or skill requirements found in database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 3. LEARNING PATH / DIAGNOSTIC MODAL */}
      {selectedSkillGap && (
        <div className="modal-backdrop-overlay" onClick={() => setSelectedSkillGap(null)}>
          <div className="modal-content-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header-row">
              <div className="modal-title-stack">
                <span className={`priority-tag ${selectedSkillGap.priority.toLowerCase()}`}>
                  {selectedSkillGap.priority} PRIORITY
                </span>
                <h3 className="modal-skill-title">{selectedSkillGap.skill_name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSkillGap(null)}
                className="btn-close-modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-stack">
              <div className="modal-meta-grid">
                <div className="modal-meta-card">
                  <span className="meta-card-label">Target Level</span>
                  <strong className="meta-card-val">{selectedSkillGap.target_level}</strong>
                </div>
                <div className="modal-meta-card">
                  <span className="meta-card-label">Est. Time</span>
                  <strong className="meta-card-val">~{selectedSkillGap.estimated_hours} Hours</strong>
                </div>
                <div className="modal-meta-card">
                  <span className="meta-card-label">Match Potential</span>
                  <strong className="meta-card-val text-green">+{selectedSkillGap.impact_pct}% Match</strong>
                </div>
              </div>

              <div className="why-needed-box">
                <h4>Market Rationale</h4>
                <p>{selectedSkillGap.why_needed}</p>
              </div>

              <div className="learning-path-section">
                <h4>Recommended Milestones</h4>
                <div className="milestones-steps-list">
                  {selectedSkillGap.learning_path?.map((step, idx) => (
                    <div key={idx} className="milestone-item">
                      <span className="milestone-num">{idx + 1}</span>
                      <span className="milestone-text">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="modal-footer-row">
              <Link
                to="/assistant"
                className="btn btn-primary"
                onClick={() => setSelectedSkillGap(null)}
              >
                <Sparkles size={15} />
                <span>Ask AI Assistant for Study Plan</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGapAnalysis;
