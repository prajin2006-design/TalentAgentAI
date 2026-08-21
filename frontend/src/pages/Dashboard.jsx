import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { MatchScore } from '../components/MatchScore';
import { AIRecommendation } from '../components/AIRecommendation';
import { JobCard } from '../components/JobCard';
import { SkillBar } from '../components/SkillBar';
import {
Sparkles,
TrendingUp,
Briefcase,
Target,
Award,
ArrowRight,
BrainCircuit,
ChevronRight,
CheckCircle2,
AlertCircle,
FileText,
GraduationCap
} from 'lucide-react';
import './Dashboard.css';

export const Dashboard = () => {
const { user, isAuthenticated } = useAuth();
const {
profile,
skills,
education,
projects,
resume,
profileCompletion,
hasAnalysis,
profileScore,
jobMatches,
skillGaps,
aiAnalysis,
isAnalyzing,
runAiAnalysis
} = useCareer();

// Animated stat counters state
const [counts, setCounts] = useState({
score: 0,
matches: 0,
gaps: 0,
readiness: 0
});

useEffect(() => {
if (!hasAnalysis) return;
const duration = 900;
const steps = 25;
const interval = duration / steps;
let step = 0;

const timer = setInterval(() => {
step++;
const progress = step / steps;
setCounts({
score: Math.round(profileScore * progress),
matches: Math.round((jobMatches?.length || 0) * progress),
gaps: Math.round((skillGaps?.length || 0) * progress),
readiness: Math.round((profileScore > 0 ? profileScore : 75) * progress)
});

if (step >= steps) {
clearInterval(timer);
}
}, interval);

return () => clearInterval(timer);
}, [profileScore, jobMatches, skillGaps, hasAnalysis]);

// If user is not authenticated, show sign in gateway
if (!isAuthenticated) {
return (
<div className="dashboard-view-container">
<div className="card empty-state-card text-center">
<div className="empty-icon-circle mb-3">
<BrainCircuit size={36} className="text-electric-blue" />
</div>
<h2 className="empty-state-title">Sign in to access your Candidate Dashboard</h2>
<p className="empty-state-text">
Create an account or log in to calibrate your career profile with AI and explore real-time job compatibility.
</p>
<div className="empty-actions-row">
<Link to="/login" className="btn btn-primary">
<span>Sign In</span>
</Link>
<Link to="/signup" className="btn btn-accent">
<span>Create Candidate Account</span>
<ArrowRight size={16} />
</Link>
</div>
</div>
</div>
);
}

// If authenticated but profile is incomplete or unanalyzed
if (!hasAnalysis) {
return (
<div className="dashboard-view-container">
<div className="card dashboard-welcome-banner mb-4">
<div className="welcome-text-col">
<div className="status-pill badge badge-accent">
<Sparkles size={14} />
<span>Candidate Account Active</span>
</div>
<h1 className="welcome-heading">
Welcome, <span className="text-electric-blue">{user?.full_name || 'Candidate'}</span>.
</h1>
<p className="welcome-sub">
Your profile is {profileCompletion}% complete. Complete the setup wizard and upload your resume to unlock real AI career intelligence.
</p>
</div>

<div className="welcome-cta-col">
<Link to="/profile/setup" className="btn btn-accent">
<span>Continue Profile Setup</span>
<ArrowRight size={16} />
</Link>
</div>
</div>

{/* Profile Completion Card */}
<div className="card onboarding-prompt-card">
<div className="prompt-header">
<div>
<span className="card-pre-title">PROFILE SETUP STATUS</span>
<h3 className="card-section-title">Calibration Checklist</h3>
</div>
<span className="completion-tag text-electric-blue">{profileCompletion}% Complete</span>
</div>

<div className="completion-bar-track my-3">
<div className="completion-bar-fill" style={{ width: `${profileCompletion}%` }} />
</div>

<div className="prompt-checklist-grid">
<div className={`checklist-box ${profile?.headline || profile?.preferred_role ? 'done' : ''}`}>
<div className="check-box-icon">
{profile?.headline || profile?.preferred_role ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
</div>
<div>
<strong>Basic Info & Target Role</strong>
<span>{profile?.preferred_role || 'Not specified yet'}</span>
</div>
</div>

<div className={`checklist-box ${skills.length > 0 ? 'done' : ''}`}>
<div className="check-box-icon">
{skills.length > 0 ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
</div>
<div>
<strong>Technical Skills ({skills.length})</strong>
<span>{skills.length > 0 ? `${skills.length} skills recorded` : 'Add your core stack'}</span>
</div>
</div>

<div className={`checklist-box ${education.length > 0 ? 'done' : ''}`}>
<div className="check-box-icon">
{education.length > 0 ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
</div>
<div>
<strong>Academic Background</strong>
<span>{education.length > 0 ? `${education.length} record(s)` : 'Add degree & college'}</span>
</div>
</div>

<div className={`checklist-box ${resume ? 'done' : ''}`}>
<div className="check-box-icon">
{resume ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
</div>
<div>
<strong>Resume Document</strong>
<span>{resume ? 'Parsed & verified' : 'Upload PDF or DOCX'}</span>
</div>
</div>
</div>

<div className="prompt-action-footer mt-4">
<Link to="/profile/setup" className="btn btn-accent btn-large">
<Sparkles size={17} />
<span>Complete Setup & Run AI Analysis</span>
<ArrowRight size={17} />
</Link>
</div>
</div>
</div>
);
}

// ==================================================
// FULL CANDIDATE DASHBOARD (Complete & Analyzed)
// ==================================================
const readinessBreakdown = [
{ label: 'Profile Readiness', value: aiAnalysis?.readiness_score || 85 },
{ label: 'Skill Stack Match', value: Math.min(95, (aiAnalysis?.readiness_score || 80) + 4) },
{ label: 'Project Portfolio', value: projects.length > 0 ? 88 : 60 },
{ label: 'Market Compatibility', value: jobMatches.length > 0 ? jobMatches[0].matchPercentage : 82 }
];

return (
<div className="dashboard-view-container">
{/* Greeting Banner */}
<div className="card dashboard-welcome-banner">
<div className="welcome-text-col">
<div className="status-pill badge badge-accent">
<Sparkles size={14} />
<span>Neural Career Intelligence Active</span>
</div>
<h1 className="welcome-heading">
Good day, <span className="text-electric-blue">{user?.full_name || 'Candidate'}</span>.
</h1>
<p className="welcome-sub">
Targeting <strong>{profile?.preferred_role || 'Software Engineering'}</strong> roles. You have {jobMatches.length} live matching requisitions in the network.
</p>
</div>

<div className="welcome-cta-col">
<button
onClick={runAiAnalysis}
disabled={isAnalyzing}
className="btn btn-primary hover-expand"
>
<BrainCircuit size={17} /> {isAnalyzing ? 'Analyzing...' : 'Re-Calibrate AI Profile'}
</button>
</div>
</div>

{/* Animated Stats Cards Grid */}
<div className="stats-cards-grid">
<div className="card stat-card hover-expand">
<div className="stat-icon-box blue">
<Award size={20} />
</div>
<div className="stat-content">
<span className="stat-title">READINESS SCORE</span>
<div className="stat-number-row">
<span className="stat-number">{counts.score}%</span>
<span className="stat-badge success">Market Ready</span>
</div>
</div>
</div>

<div className="card stat-card hover-expand">
<div className="stat-icon-box blue">
<Briefcase size={20} />
</div>
<div className="stat-content">
<span className="stat-title">JOB MATCHES</span>
<div className="stat-number-row">
<span className="stat-number">{counts.matches}</span>
<span className="stat-badge success">Live Fit</span>
</div>
</div>
</div>

<div className="card stat-card hover-expand">
<div className="stat-icon-box blue">
<Target size={20} />
</div>
<div className="stat-content">
<span className="stat-title">SKILL GAPS</span>
<div className="stat-number-row">
<span className="stat-number">{counts.gaps}</span>
<span className="stat-badge muted">Prioritized</span>
</div>
</div>
</div>

<div className="card stat-card hover-expand">
<div className="stat-icon-box blue">
<TrendingUp size={20} />
</div>
<div className="stat-content">
<span className="stat-title">TARGET POSITION</span>
<div className="stat-number-row">
<span className="stat-number-text">{profile?.preferred_role || 'Engineering'}</span>
</div>
</div>
</div>
</div>

{/* Main Grid: Readiness Breakdown & AI Insight */}
<div className="dashboard-main-grid">
{/* Left Column: Multi-Dimensional Readiness */}
<div className="dashboard-left-col">
<div className="card readiness-visualization-card">
<div className="card-section-header">
<div>
<span className="card-pre-title">CAREER READINESS INDEX</span>
<h3 className="card-section-title">Multi-Dimensional Readiness Metrics</h3>
</div>
<Link to="/job-matching" className="card-header-link">
View Match Matrix <ChevronRight size={14} />
</Link>
</div>

<div className="readiness-breakdown-stack">
{readinessBreakdown.map((item) => (
<div key={item.label} className="readiness-item">
<div className="readiness-item-info">
<span className="readiness-item-label">{item.label}</span>
<span className="readiness-item-val">{item.value}%</span>
</div>
<div className="readiness-track">
<div
className="readiness-fill"
style={{ width: `${item.value}%` }}
/>
</div>
</div>
))}
</div>

{/* Real Recorded Skills */}
<div className="readiness-skills-footer">
<h4 className="sub-section-heading">Your Recorded Core Skills ({skills.length})</h4>
<div className="skills-stack-grid">
{skills.slice(0, 4).map((s) => (
<SkillBar
key={s.id || s.skill_name}
name={s.skill_name}
percentage={s.proficiency || 80}
color="var(--primary)"
/>
))}
</div>
</div>
</div>
</div>

{/* Right Column: AI Executive Summary & Co-Pilot Launch */}
<div className="dashboard-right-col">
<AIRecommendation
title="AI EXECUTIVE SUMMARY"
quote={aiAnalysis?.profile_summary || "Candidate profile demonstrates solid technical proficiency and strong alignment with early-career engineering requisitions."}
actionText="Explore Skill Gap Roadmap"
actionLink="/skill-gaps"
/>

<div className="card quick-assistant-card">
<div className="assistant-mini-header">
<Sparkles size={16} className="text-electric-blue" />
<h4>Have questions about your target role?</h4>
</div>
<p className="assistant-mini-text">
Ask your AI co-pilot anything about salary benchmarks, interview questions, or resume optimization.
</p>
<Link to="/assistant" className="btn btn-outline btn-full hover-expand">
Launch AI Assistant →
</Link>
</div>
</div>
</div>

{/* Recommended Jobs Section */}
<div className="dashboard-jobs-section">
<div className="card-section-header">
<div>
<span className="card-pre-title">CURATED OPPORTUNITIES</span>
<h3 className="card-section-title">Top Recommended Roles for You</h3>
</div>
<Link to="/job-matching" className="card-header-link">
See All Matches ({jobMatches.length}) <ChevronRight size={14} />
</Link>
</div>

<div className="recommended-jobs-grid">
{jobMatches.slice(0, 3).map((job) => (
<JobCard key={job.id} job={job} />
))}
</div>
</div>
</div>
);
};

export default Dashboard;
