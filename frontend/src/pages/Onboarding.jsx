import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { Sparkles, ArrowRight, ArrowLeft, Plus, X, Check } from 'lucide-react';
import { useCareer } from '../context/CareerContext';
import './Onboarding.css';

export const Onboarding = () => {
  const { profile, updateProfile } = useCareer();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [basic, setBasic] = useState({
    name: profile?.name || profile?.full_name || 'Alex Chen',
    status: profile?.status || 'Fresh Graduate'
  });

  const [education, setEducation] = useState({
    degree: profile?.education?.degree || 'B.S. Computer Science',
    college: profile?.education?.college || 'Stanford University',
    field: profile?.education?.field || 'Software Engineering',
    gradYear: profile?.education?.gradYear || '2026'
  });

  const [skills, setSkills] = useState(Array.isArray(profile?.skills) ? profile.skills : ['React', 'JavaScript', 'Figma', 'HTML', 'CSS', 'Git']);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [experience, setExperience] = useState({
    title: 'Frontend Developer Intern',
    company: 'Veloce Labs',
    duration: 'Jun 2025 – Sep 2025',
    type: 'Internship',
    description: 'Engineered reusable React UI components and collaborated with design teams on Figma specs.'
  });

  const [preferences, setPreferences] = useState({
    targetRole: profile?.preferred_role || profile?.preferences?.targetRole || 'Frontend Developer',
    preferredLocation: profile?.preferred_location || profile?.location || 'San Francisco, CA / Remote',
    workMode: profile?.preferred_work_mode || profile?.preferences?.workMode || 'Hybrid',
    interests: Array.isArray(profile?.preferences?.interests) ? profile.preferences.interests : ['Design Systems', 'AI Frontend Integration']
  });

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      // Save all onboarding data into CareerContext
      updateProfile({
        name: basic.name,
        status: basic.status,
        education,
        skills,
        preferences
      });
      navigate('/dashboard');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="onboarding-page-wrapper">
      <div className="container onboarding-container">
        {/* Brand Header */}
        <div className="onboarding-header">
          <div className="brand-logo">
            <Sparkles size={20} className="text-accent" />
            <span className="logo-text">
              TALENT AGENT <span className="logo-highlight">AI</span>
            </span>
          </div>
          <span className="badge badge-accent">Onboarding Portal</span>
        </div>

        {/* Wizard Card */}
        <div className="card onboarding-card">
          <ProgressBar currentStep={currentStep} totalSteps={5} />

          <div className="step-content-body">
            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="step-pane">
                <h2 className="step-title">Basic Information</h2>
                <p className="step-sub">Tell us your name and current career status.</p>

                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    value={basic.name}
                    onChange={(e) => setBasic({ ...basic, name: e.target.value })}
                    className="input-field"
                    placeholder="Alex Chen"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Current Status</label>
                  <div className="status-grid">
                    {['Student', 'Fresh Graduate', 'Working Professional', 'Career Switcher'].map((st) => (
                      <div
                        key={st}
                        className={`status-option-card ${basic.status === st ? 'selected' : ''}`}
                        onClick={() => setBasic({ ...basic, status: st })}
                      >
                        <div className="radio-circle">
                          {basic.status === st && <Check size={12} />}
                        </div>
                        <span className="status-text">{st}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Education */}
            {currentStep === 2 && (
              <div className="step-pane">
                <h2 className="step-title">Education Background</h2>
                <p className="step-sub">Share your academic qualifications.</p>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Degree</label>
                    <input
                      type="text"
                      value={education.degree}
                      onChange={(e) => setEducation({ ...education, degree: e.target.value })}
                      className="input-field"
                      placeholder="e.g. B.S. Computer Science"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">College / University</label>
                    <input
                      type="text"
                      value={education.college}
                      onChange={(e) => setEducation({ ...education, college: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Stanford University"
                    />
                  </div>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Field of Study</label>
                    <input
                      type="text"
                      value={education.field}
                      onChange={(e) => setEducation({ ...education, field: e.target.value })}
                      className="input-field"
                      placeholder="e.g. Software Engineering"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Graduation Year</label>
                    <select
                      value={education.gradYear}
                      onChange={(e) => setEducation({ ...education, gradYear: e.target.value })}
                      className="input-field"
                    >
                      <option value="2027">2027</option>
                      <option value="2026">2026</option>
                      <option value="2025">2025</option>
                      <option value="2024">2024</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills */}
            {currentStep === 3 && (
              <div className="step-pane">
                <h2 className="step-title">Your Skills</h2>
                <p className="step-sub">Add your primary technical and creative skills.</p>

                <form onSubmit={handleAddSkill} className="skill-input-row">
                  <input
                    type="text"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    placeholder="Add a skill (e.g. TypeScript, Python, Tailwind)..."
                    className="input-field"
                  />
                  <button type="submit" className="btn btn-accent">
                    <Plus size={16} /> Add Skill
                  </button>
                </form>

                <div className="skills-cloud">
                  {skills.map((sk) => (
                    <span key={sk} className="badge badge-accent skill-pill">
                      {sk}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(sk)}
                        className="remove-skill-btn"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Experience */}
            {currentStep === 4 && (
              <div className="step-pane">
                <h2 className="step-title">Experience & Projects</h2>
                <p className="step-sub">Add recent internships, projects, or freelance work.</p>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Role Title / Project</label>
                    <input
                      type="text"
                      value={experience.title}
                      onChange={(e) => setExperience({ ...experience, title: e.target.value })}
                      className="input-field"
                    />
                  </div>

                  <div className="form-group">
                    <label className="input-label">Organization / College</label>
                    <input
                      type="text"
                      value={experience.company}
                      onChange={(e) => setExperience({ ...experience, company: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="input-label">Short Description</label>
                  <textarea
                    rows={3}
                    value={experience.description}
                    onChange={(e) => setExperience({ ...experience, description: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Career Goals */}
            {currentStep === 5 && (
              <div className="step-pane">
                <h2 className="step-title">Career Preferences</h2>
                <p className="step-sub">Define your target roles and ideal work setup.</p>

                <div className="form-group">
                  <label className="input-label">Target Job Role</label>
                  <input
                    type="text"
                    value={preferences.targetRole}
                    onChange={(e) => setPreferences({ ...preferences, targetRole: e.target.value })}
                    className="input-field"
                    placeholder="e.g. Frontend Developer"
                  />
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label className="input-label">Preferred Work Mode</label>
                    <select
                      value={preferences.workMode}
                      onChange={(e) => setPreferences({ ...preferences, workMode: e.target.value })}
                      className="input-field"
                    >
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="input-label">Location Preference</label>
                    <input
                      type="text"
                      value={preferences.preferredLocation}
                      onChange={(e) => setPreferences({ ...preferences, preferredLocation: e.target.value })}
                      className="input-field"
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Wizard Navigation Controls */}
            <div className="onboarding-controls-row">
              {currentStep > 1 ? (
                <button onClick={handleBack} className="btn btn-outline">
                  <ArrowLeft size={16} /> Back
                </button>
              ) : <div />}

              <button onClick={handleNext} className="btn btn-accent btn-lg hover-expand">
                {currentStep === 5 ? (
                  <>
                    Analyze My Career
                    <Sparkles size={16} />
                  </>
                ) : (
                  <>
                    Next Step
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
