import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { User, GraduationCap, Code, Briefcase, FolderGit2, Compass, Edit3, Save, Plus, X } from 'lucide-react';
import './Profile.css';

export const Profile = () => {
  const { profile, updateProfile } = useCareer();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [newSkill, setNewSkill] = useState('');

  const handleSave = () => {
    updateProfile(formData);
    setIsEditing(false);
  };

  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, newSkill.trim()]
      });
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skill)
    });
  };

  return (
    <div className="profile-view-wrapper">
      {/* Profile Header */}
      <div className="card profile-header-card">
        <div className="header-left-info">
          <div className="profile-big-avatar">
            {profile.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="badge badge-accent mb-1">{profile.status}</div>
            <h1 className="profile-name">{profile.name}</h1>
            <p className="profile-title">{profile.title} • {profile.location}</p>
            <p className="profile-bio">{profile.bio}</p>
          </div>
        </div>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={`btn ${isEditing ? 'btn-accent' : 'btn-outline'} hover-expand`}
        >
          {isEditing ? (
            <>
              <Save size={16} /> Save Changes
            </>
          ) : (
            <>
              <Edit3 size={16} /> Edit Profile
            </>
          )}
        </button>
      </div>

      <div className="profile-grid">
        {/* Left Column: Personal, Education & Preferences */}
        <div className="profile-col">
          {/* Personal Info */}
          <div className="card section-card">
            <div className="section-title-row">
              <User size={18} className="text-accent" />
              <h3>Personal Details</h3>
            </div>
            {isEditing ? (
              <div className="form-stack">
                <div className="form-group">
                  <label className="input-label">Full Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Title / Headline</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">Location</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>
            ) : (
              <div className="info-list">
                <div className="info-item">
                  <span className="info-label">Email:</span>
                  <span className="info-val">{profile.email}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Status:</span>
                  <span className="info-val">{profile.status}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Location:</span>
                  <span className="info-val">{profile.location}</span>
                </div>
              </div>
            )}
          </div>

          {/* Education */}
          <div className="card section-card">
            <div className="section-title-row">
              <GraduationCap size={18} className="text-accent" />
              <h3>Education</h3>
            </div>
            {isEditing ? (
              <div className="form-stack">
                <div className="form-group">
                  <label className="input-label">Degree</label>
                  <input
                    type="text"
                    value={formData.education.degree}
                    onChange={(e) => setFormData({
                      ...formData,
                      education: { ...formData.education, degree: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">University / College</label>
                  <input
                    type="text"
                    value={formData.education.college}
                    onChange={(e) => setFormData({
                      ...formData,
                      education: { ...formData.education, college: e.target.value }
                    })}
                    className="input-field"
                  />
                </div>
              </div>
            ) : (
              <div className="edu-box">
                <div className="edu-degree">{profile.education.degree}</div>
                <div className="edu-college">{profile.education.college}</div>
                <div className="edu-meta">{profile.education.field} • Class of {profile.education.gradYear}</div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="card section-card">
            <div className="section-title-row">
              <Compass size={18} className="text-accent" />
              <h3>Career Preferences</h3>
            </div>
            <div className="info-list">
              <div className="info-item">
                <span className="info-label">Target Role:</span>
                <span className="info-val">{profile.preferences.targetRole}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Work Mode:</span>
                <span className="info-val">{profile.preferences.workMode}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Target Salary:</span>
                <span className="info-val">{profile.preferences.targetSalary}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Skills, Experience, Projects */}
        <div className="profile-col">
          {/* Skills */}
          <div className="card section-card">
            <div className="section-title-row">
              <Code size={18} className="text-accent" />
              <h3>Skills & Competencies</h3>
            </div>

            {isEditing && (
              <form onSubmit={handleAddSkill} className="add-skill-row">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add skill..."
                  className="input-field"
                />
                <button type="submit" className="btn btn-accent">
                  <Plus size={16} />
                </button>
              </form>
            )}

            <div className="skills-tags-flex">
              {(isEditing ? formData.skills : profile.skills).map((skill) => (
                <span key={skill} className="badge badge-accent skill-pill">
                  {skill}
                  {isEditing && (
                    <button onClick={() => handleRemoveSkill(skill)} className="remove-skill-btn">
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Experience */}
          <div className="card section-card">
            <div className="section-title-row">
              <Briefcase size={18} className="text-accent" />
              <h3>Experience</h3>
            </div>
            <div className="exp-list">
              {profile.experience.map((exp) => (
                <div key={exp.id} className="exp-item">
                  <div className="exp-header">
                    <div>
                      <h4 className="exp-title">{exp.title}</h4>
                      <span className="exp-company">{exp.company}</span>
                    </div>
                    <span className="exp-duration">{exp.duration}</span>
                  </div>
                  <p className="exp-desc">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Projects */}
          <div className="card section-card">
            <div className="section-title-row">
              <FolderGit2 size={18} className="text-accent" />
              <h3>Featured Projects</h3>
            </div>
            <div className="proj-list">
              {profile.projects.map((proj) => (
                <div key={proj.id} className="proj-item">
                  <div className="proj-header">
                    <h4 className="proj-name">{proj.name}</h4>
                    <span className="badge badge-muted">{proj.tech}</span>
                  </div>
                  <p className="proj-desc">{proj.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
