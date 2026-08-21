import React from 'react';
import { useCareer } from '../context/CareerContext';
import { ResumeUploader } from '../components/ResumeUploader';
import { MatchScore } from '../components/MatchScore';
import { Bot, CheckCircle2, Sparkles, AlertCircle, GraduationCap, Briefcase, FolderGit2 } from 'lucide-react';
import './ResumeAnalysis.css';

export const ResumeAnalysis = () => {
  const { resume, profileScore, profile } = useCareer();

  return (
    <div className="resume-analysis-wrapper">
      {/* Upload Zone Section */}
      <div className="card upload-section-card">
        <div className="upload-header">
          <div className="header-badge badge badge-accent">
            <Sparkles size={14} /> AI Parser Active
          </div>
          <h2 className="section-title-sm">Neural Resume Analysis</h2>
          <p className="section-sub-sm">
            Upload your latest PDF resume to refresh your detected skill matrix, profile readiness score, and job match compatibility.
          </p>
        </div>
        <ResumeUploader />
      </div>

      {/* Analysis Results Display */}
      {resume && (
        <div className="analysis-results-grid">
          {/* Left Column: Profile Score, Strengths & Areas to Improve */}
          <div className="results-left-col">
            <div className="card score-summary-card">
              <div className="score-summary-header">
                <span className="card-pre-title">PARSED HEALTH METRIC</span>
                <h3>Profile Readiness Score</h3>
              </div>

              <div className="score-center-box">
                <MatchScore score={profileScore} label="HEALTH SCORE" role="Frontend Developer Fit" />
              </div>

              <div className="ai-summary-box">
                <div className="ai-summary-title">
                  <Bot size={16} className="text-electric-blue" />
                  <span>AI Executive Summary</span>
                </div>
                <p className="ai-summary-text">"{resume.summary}"</p>
              </div>
            </div>

            {/* Strengths & Weaknesses Breakdown */}
            <div className="card feedback-breakdown-card">
              <div className="feedback-section">
                <h4 className="feedback-title success">
                  <CheckCircle2 size={16} /> STRENGTHS
                </h4>
                <div className="feedback-list">
                  {resume.strengths?.map((str, idx) => (
                    <div key={idx} className="feedback-item">
                      <span className="bullet-dot blue" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feedback-section mt-4">
                <h4 className="feedback-title warning">
                  <AlertCircle size={16} /> AREAS TO IMPROVE
                </h4>
                <div className="feedback-list">
                  {resume.weaknesses?.map((wk, idx) => (
                    <div key={idx} className="feedback-item">
                      <span className="bullet-dot muted" />
                      <span>{wk}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Detected Skills Tag Cloud */}
            <div className="card detected-skills-card">
              <div className="card-header">
                <Sparkles size={18} className="text-electric-blue" />
                <h3>Detected Skills ({resume.skillsFound?.length || 0})</h3>
              </div>
              <div className="detected-skills-flex">
                {resume.skillsFound?.map((skill) => (
                  <span key={skill} className="badge badge-accent skill-detected-pill">
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Structure */}
          <div className="results-right-col">
            <div className="card extracted-card">
              <div className="extracted-header">
                <GraduationCap size={18} className="text-electric-blue" />
                <h3>Extracted Education</h3>
              </div>
              <div className="extracted-body">
                <div className="extracted-item-title">{profile.education.degree}</div>
                <div className="extracted-item-sub">{profile.education.college}</div>
                <div className="extracted-item-meta">{profile.education.field} • Class of {profile.education.gradYear}</div>
              </div>
            </div>

            <div className="card extracted-card">
              <div className="extracted-header">
                <Briefcase size={18} className="text-electric-blue" />
                <h3>Extracted Experience ({profile.experience.length})</h3>
              </div>
              <div className="extracted-list">
                {profile.experience.map((exp) => (
                  <div key={exp.id} className="extracted-list-item">
                    <div className="item-title">{exp.title}</div>
                    <div className="item-sub">{exp.company} ({exp.duration})</div>
                    <p className="item-desc">{exp.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card extracted-card">
              <div className="extracted-header">
                <FolderGit2 size={18} className="text-electric-blue" />
                <h3>Extracted Projects ({profile.projects.length})</h3>
              </div>
              <div className="extracted-list">
                {profile.projects.map((proj) => (
                  <div key={proj.id} className="extracted-list-item">
                    <div className="item-title">{proj.name}</div>
                    <div className="item-sub">{proj.tech}</div>
                    <p className="item-desc">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
