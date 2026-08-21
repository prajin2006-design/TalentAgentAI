import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { Target, CheckCircle2, Clock, TrendingUp, Sparkles, BookOpen, X, ChevronRight, Zap } from 'lucide-react';
import './SkillGapAnalysis.css';

export const SkillGapAnalysis = () => {
  const { profile, skillGaps } = useCareer();
  const targetRole = profile.preferences.targetRole;
  const [selectedSkillGap, setSelectedSkillGap] = useState(null);

  const comparisonSkills = [
    { name: 'React.js', userHas: true, required: true },
    { name: 'JavaScript (ES6+)', userHas: true, required: true },
    { name: 'HTML5 & CSS3', userHas: true, required: true },
    { name: 'Git / GitHub', userHas: true, required: true },
    { name: 'Figma to Code Translation', userHas: true, required: true },
    { name: 'TypeScript', userHas: false, required: true, priority: 'HIGH' },
    { name: 'React Testing Library', userHas: false, required: true, priority: 'MEDIUM' },
    { name: 'Next.js App Router', userHas: false, required: true, priority: 'MEDIUM' },
    { name: 'REST API Optimization', userHas: false, required: true, priority: 'LOW' }
  ];

  return (
    <div className="skill-gaps-wrapper">
      {/* Overview Banner */}
      <div className="card gap-banner-card">
        <div className="banner-left-info">
          <div className="badge badge-accent">
            <Target size={14} /> Gap Intelligence Matrix
          </div>
          <h2 className="banner-heading">Target Role Skill Gap Breakdown</h2>
          <p className="banner-sub">
            Targeting <span className="text-electric-blue font-bold">{targetRole}</span>. Closing 2 high-impact skill gaps will elevate your profile match score from 82% to 95%.
          </p>
        </div>

        <div className="gap-summary-metric">
          <span className="metric-score-val">{skillGaps.length}</span>
          <span className="metric-score-label">IDENTIFIED GAPS</span>
        </div>
      </div>

      {/* Comparison Matrix Table */}
      <div className="card comparison-card">
        <div className="comparison-header">
          <Sparkles size={18} className="text-electric-blue" />
          <h3>YOUR SKILLS vs REQUIRED SKILLS ({targetRole})</h3>
        </div>

        <div className="comparison-table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Skill / Technology</th>
                <th>Your Profile</th>
                <th>Required for Role</th>
                <th>Priority Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {comparisonSkills.map((item) => {
                const gapMatch = skillGaps.find((g) => g.skill.toLowerCase().includes(item.name.toLowerCase().split(' ')[0]));
                return (
                  <tr key={item.name} className={!item.userHas ? 'gap-row' : ''}>
                    <td className="skill-name-td">{item.name}</td>
                    <td>
                      {item.userHas ? (
                        <span className="badge badge-accent"><CheckCircle2 size={12} /> Present</span>
                      ) : (
                        <span className="badge badge-muted">Missing</span>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary"><CheckCircle2 size={12} /> Required</span>
                    </td>
                    <td>
                      {item.userHas ? (
                        <span className="text-muted font-heading">Match Verified ✓</span>
                      ) : (
                        <span className={`priority-tag ${item.priority?.toLowerCase()}`}>
                          {item.priority} PRIORITY
                        </span>
                      )}
                    </td>
                    <td>
                      {!item.userHas && gapMatch && (
                        <button
                          onClick={() => setSelectedSkillGap(gapMatch)}
                          className="btn btn-primary-outline btn-xs"
                        >
                          Inspect Path <ChevronRight size={13} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Priority Action Cards Grid */}
      <div className="gaps-roadmap-section">
        <div className="section-title-row">
          <TrendingUp size={20} className="text-electric-blue" />
          <h3 className="section-heading">Priority Skill Learning Roadmap</h3>
        </div>

        <div className="gaps-priority-grid">
          {skillGaps.map((gap) => (
            <div
              key={gap.id}
              onClick={() => setSelectedSkillGap(gap)}
              className="card priority-card hover-expand card-interactive"
            >
              <div className="priority-card-header">
                <span className="badge badge-accent">
                  {gap.priority}
                </span>
                <span className="impact-badge">{gap.impact}</span>
              </div>

              <h3 className="gap-skill-title">{gap.skill}</h3>
              <p className="gap-description">{gap.description}</p>

              <div className="hours-row">
                <Clock size={14} className="text-electric-blue" />
                <span>Estimated Effort: ~{gap.estimatedHours} Hours</span>
              </div>

              <div className="inspect-link-row">
                <span>Click to view detailed learning path</span>
                <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SKILL DETAIL INSPECTION MODAL */}
      {selectedSkillGap && (
        <div className="admin-modal-overlay">
          <div className="card admin-modal-card">
            <div className="modal-header">
              <div>
                <span className="badge badge-accent mb-1">{selectedSkillGap.priority}</span>
                <h2>{selectedSkillGap.skill}</h2>
                <p className="text-muted text-sm">{selectedSkillGap.impact}</p>
              </div>
              <button onClick={() => setSelectedSkillGap(null)} className="icon-action-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body-content">
              <div className="modal-info-stack">
                <div className="detail-block">
                  <span className="block-label">WHY YOU NEED IT</span>
                  <p className="block-text">{selectedSkillGap.whyNeeded || selectedSkillGap.description}</p>
                </div>

                <div className="struct-levels-grid">
                  <div className="level-item">
                    <span className="level-lbl">CURRENT LEVEL</span>
                    <span className="level-val">{selectedSkillGap.currentLevel || 'Beginner'}</span>
                  </div>
                  <div className="level-item">
                    <span className="level-lbl">REQUIRED TARGET LEVEL</span>
                    <span className="level-val blue">{selectedSkillGap.targetLevel || 'Intermediate'}</span>
                  </div>
                </div>

                <div className="detail-block mt-3">
                  <span className="block-label">RECOMMENDED LEARNING PATH</span>
                  <div className="action-steps-list">
                    {selectedSkillGap.learningPath ? (
                      selectedSkillGap.learningPath.map((step, i) => (
                        <div key={i} className="action-step-item">
                          <CheckCircle2 size={15} className="step-icon text-electric-blue" />
                          <span>{step}</span>
                        </div>
                      ))
                    ) : (
                      selectedSkillGap.recommendations.map((step, i) => (
                        <div key={i} className="action-step-item">
                          <CheckCircle2 size={15} className="step-icon text-electric-blue" />
                          <span>{step}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="detail-block mt-3">
                  <span className="block-label">ESTIMATED EFFORT</span>
                  <p className="block-text font-bold text-electric-blue">~{selectedSkillGap.estimatedHours} Hours of targeted learning</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
