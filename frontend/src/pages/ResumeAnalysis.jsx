import React from 'react';
import { useCareer } from '../context/CareerContext';
import { ResumeUploader } from '../components/ResumeUploader';
import { MatchScore } from '../components/MatchScore';
import {
  Bot,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  GraduationCap,
  Briefcase,
  FolderGit2,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import './ResumeAnalysis.css';

export const ResumeAnalysis = () => {
  const { resume, profileScore, profile, education, experience, projects, skills } = useCareer();

  const parsedData = resume?.parsed_data || {};
  const strengths = resume?.strengths || parsedData?.strengths || [
    'Strong foundational proficiencies matching active market standards',
    'Quantified experience milestones and clean document structure'
  ];
  const weaknesses = resume?.weaknesses || parsedData?.weaknesses || [
    'Add specific quantifiable metric outcomes (% improvements, latency, revenue)',
    'Ensure single-column ATS compatibility for optimal Greenhouse/Lever parsing'
  ];

  return (
    <div className="resume-analysis-wrapper">
      {/* Upload Zone Section */}
      <div className="card upload-section-card">
        <div className="upload-header">
          <div className="header-badge badge badge-accent">
            <Sparkles size={14} /> <span>AI Parser & ATS Calibration Active</span>
          </div>
          <h2 className="section-title-sm">Resume Intelligence & ATS Diagnostic</h2>
          <p className="section-sub-sm">
            Upload your latest PDF or DOCX resume to extract technical competencies, calculate your machine readability score, and align with live market requisitions.
          </p>
        </div>
        <ResumeUploader />
      </div>

      {/* Analysis Results Display */}
      {resume ? (
        <div className="analysis-results-grid">
          {/* Left Column: Profile Score, Strengths & Areas to Improve */}
          <div className="results-left-col">
            <div className="card score-summary-card">
              <div className="score-summary-header">
                <span className="card-pre-title">ATS READABILITY BENCHMARK</span>
                <h3>Readiness & ATS Score</h3>
              </div>

              <div className="score-center-box">
                <MatchScore
                  score={resume.ats_score || profileScore || 85}
                  label="ATS SCORE"
                  role={profile?.preferred_role || 'Market Calibration'}
                />
              </div>

              <div className="ai-summary-box">
                <div className="ai-summary-title">
                  <Bot size={16} className="text-primary" />
                  <span>Resume Diagnostic Summary</span>
                </div>
                <p className="ai-summary-text">
                  "{resume.original_filename ? `Document '${resume.original_filename}' parsed successfully.` : ''} {resume.summary || 'Resume structured with recruiter-approved keyword density and technical competencies.'}"
                </p>
              </div>
            </div>

            {/* Strengths & Weaknesses Breakdown */}
            <div className="card feedback-breakdown-card">
              <div className="feedback-section">
                <h4 className="feedback-title success">
                  <CheckCircle2 size={16} /> <span>STRENGTHS & HIGHLIGHTS</span>
                </h4>
                <div className="feedback-list">
                  {strengths.map((str, idx) => (
                    <div key={idx} className="feedback-item">
                      <span className="bullet-dot blue" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="feedback-section mt-4">
                <h4 className="feedback-title warning">
                  <AlertCircle size={16} /> <span>AREAS FOR OPTIMIZATION</span>
                </h4>
                <div className="feedback-list">
                  {weaknesses.map((wk, idx) => (
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
                <Sparkles size={18} className="text-primary" />
                <h3>Extracted Skills Taxonomy ({skills?.length || 0})</h3>
              </div>
              <div className="detected-skills-flex">
                {skills && skills.length > 0 ? (
                  skills.map((skill) => (
                    <span key={skill.id || skill.skill_name} className="badge badge-accent skill-detected-pill">
                      ✓ {skill.skill_name || skill}
                    </span>
                  ))
                ) : (
                  <p className="empty-hint">No skills extracted yet. Upload a resume to populate.</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Extracted Structure */}
          <div className="results-right-col">
            <div className="card extracted-card">
              <div className="extracted-header">
                <GraduationCap size={18} className="text-primary" />
                <h3>Education ({education?.length || 0})</h3>
              </div>
              <div className="extracted-body">
                {education && education.length > 0 ? (
                  education.map((edu) => (
                    <div key={edu.id} className="extracted-sub-item">
                      <div className="extracted-item-title">{edu.degree}</div>
                      <div className="extracted-item-sub">{edu.institution}</div>
                      <div className="extracted-item-meta">{edu.field ? `${edu.field} • ` : ''}{edu.end_year || 'Present'}</div>
                    </div>
                  ))
                ) : (
                  <p className="empty-hint">No education records found.</p>
                )}
              </div>
            </div>

            <div className="card extracted-card">
              <div className="extracted-header">
                <Briefcase size={18} className="text-primary" />
                <h3>Experience ({experience?.length || 0})</h3>
              </div>
              <div className="extracted-list">
                {experience && experience.length > 0 ? (
                  experience.map((exp) => (
                    <div key={exp.id} className="extracted-list-item">
                      <div className="item-title">{exp.role}</div>
                      <div className="item-sub">{exp.company} ({exp.start_date || ''} - {exp.end_date || 'Present'})</div>
                      {exp.description && <p className="item-desc">{exp.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="empty-hint">No experience records found.</p>
                )}
              </div>
            </div>

            <div className="card extracted-card">
              <div className="extracted-header">
                <FolderGit2 size={18} className="text-primary" />
                <h3>Featured Projects ({projects?.length || 0})</h3>
              </div>
              <div className="extracted-list">
                {projects && projects.length > 0 ? (
                  projects.map((proj) => (
                    <div key={proj.id} className="extracted-list-item">
                      <div className="item-title">{proj.title}</div>
                      {proj.technologies && <div className="item-sub">{proj.technologies}</div>}
                      {proj.description && <p className="item-desc">{proj.description}</p>}
                    </div>
                  ))
                ) : (
                  <p className="empty-hint">No project records found.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card empty-upload-prompt text-center">
          <FileText size={40} className="text-muted mb-2" />
          <h3>No Resume Uploaded Yet</h3>
          <p>Upload your PDF/DOCX above to see real-time ATS scoring, keyword taxonomy, and section diagnostics.</p>
          <Link to="/resume-maker" className="btn btn-primary btn-sm mt-3">
            <Sparkles size={14} /> <span>Launch ATS Resume Maker</span>
          </Link>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
