import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { useScrollReveal } from '../hooks/useScrollReveal';
import {
ArrowRight,
Sparkles,
CheckCircle2,
BrainCircuit,
MessageSquareCode,
Briefcase,
Target,
GitFork,
ChevronRight,
TrendingUp,
Award,
Download,
FileText,
Layers,
Wrench,
ShieldCheck,
Zap,
Star,
Check,
ExternalLink,
ArrowUpRight
} from 'lucide-react';
import './Home.css';

export const Home = () => {
const [activeFeatureTab, setActiveFeatureTab] = useState('ats');
const [previewTemplate, setPreviewTemplate] = useState('modern');
const [aiQueryState, setAiQueryState] = useState({
question: "How do I optimize my resume for a Senior Frontend role?",
insight: "To target Senior Frontend requisitions, emphasize distributed architecture, state management performance (e.g. React 19 / Zustand), and measurable impact (e.g. 'reduced LCP by 42%'). Use single-column ATS templates with clear standard headers.",
match: "94% ATS Target Fit",
nextStep: "Use ATS Resume Maker to generate action-verb bullets.",
project: "Architected micro-frontend framework with Webpack Module Federation."
});
const [aiQueryState, setAiQueryState] = useState({
question: "How do I optimize my resume for a Senior Frontend role?",
insight: "To target Senior Frontend requisitions, emphasize distributed architecture, state management performance (e.g. React 19 / Zustand), and measurable impact (e.g. 'reduced LCP by 42%'). Use single-column ATS templates with clear standard headers.",
match: "94% ATS Target Fit",
nextStep: "Use ATS Resume Maker to generate action-verb bullets.",
project: "Architected micro-frontend framework with Webpack Module Federation."
});
const [isAiProcessing, setIsAiProcessing] = useState(false);

// Scroll reveal hooks
const [statsRef, isStatsVisible] = useScrollReveal({ threshold: 0.1 });
const [atsShowcaseRef, isAtsShowcaseVisible] = useScrollReveal({ threshold: 0.15 });
const [featuresRef, isFeaturesVisible] = useScrollReveal({ threshold: 0.15 });
const [howItWorksRef, isHowItWorksVisible] = useScrollReveal({ threshold: 0.15 });
const [aiAssistantRef, isAiAssistantVisible] = useScrollReveal({ threshold: 0.15 });
const [testimonialsRef, isTestimonialsVisible] = useScrollReveal({ threshold: 0.15 });
const [ctaRef, isCtaVisible] = useScrollReveal({ threshold: 0.15 });

const suggestedQuestions = [
{
question: "How do I optimize my resume for a Senior Frontend role?",
insight: "To target Senior Frontend requisitions, emphasize distributed architecture, state management performance (e.g. React 19 / Zustand), and measurable impact (e.g. 'reduced LCP by 42%'). Use single-column ATS templates with clear standard headers.",
match: "94% ATS Target Fit",
nextStep: "Use ATS Resume Maker to generate action-verb bullets.",
project: "Architected micro-frontend framework with Webpack Module Federation."
},
{
question: "What skills are missing for a Staff Cloud Architect position?",
insight: "Primary high-priority gap is Distributed Tracing & Infrastructure as Code (Terraform, AWS CDK). Closing this gap increases your role match from 74% to 92%.",
match: "92% Fit Potential",
nextStep: "Complete Terraform + Kubernetes CI/CD Capstone project.",
project: "Multi-region Kubernetes deployment with automated blue-green failover."
},
{
question: "How can I negotiate a higher equity package for a Series B startup?",
insight: "Benchmark with Talent Agent AI market matrix: Senior Full-Stack candidates in tier-1 hubs average 0.25%–0.5% equity with $180k base. Leverage multiple live match scores to anchor counter-offers.",
match: "Market Top 10%",
nextStep: "Review competitive compensation breakdown in Job Matches.",
project: "Document quantifiable ARR impact generated at previous roles."
}
];

const handleSelectQuestion = (item) => {
setIsAiProcessing(true);
setTimeout(() => {
setAiQueryState(item);
setIsAiProcessing(false);
}, 300);
};

return (
<div className="landing-page-wrapper">
<Navbar />

{/* Hero Section with Parallax Depth & Dynamic Typing */}
<Hero />

{/* ========================================================================= */}
{/* 1. VALUE METRICS & TRUST COUNTER STRIP */}
{/* ========================================================================= */}
<section ref={statsRef} className={`stats-ribbon-section ${isStatsVisible ? 'revealed' : ''}`}>
<div className="container">
<div className="stats-counters-grid">
<div className="stat-counter-item">
<span className="stat-value">99.4%</span>
<span className="stat-desc">ATS Parse Rate Across Greenhouse & Lever</span>
</div>
<div className="stat-counter-item">
<span className="stat-value">3.2x</span>
<span className="stat-desc">Interview Conversion for Calibrated Candidates</span>
</div>
<div className="stat-counter-item">
<span className="stat-value">&lt; 0.2s</span>
<span className="stat-desc">Gemini AI Career Vector Latency</span>
</div>
<div className="stat-counter-item">
<span className="stat-value">10,000+</span>
<span className="stat-desc">Autonomous Career Path Simulations</span>
</div>
</div>
</div>
</section>

{/* ========================================================================= */}
{/* 2. ATS RESUME MAKER — FLAGSHIP FEATURE SHOWCASE */}
{/* ========================================================================= */}
<section id="ats-resume" ref={atsShowcaseRef} className={`ats-flagship-section container ${isAtsShowcaseVisible ? 'revealed' : ''}`}>
<div className="section-title-stack text-center">
<div className="section-pill-tag">
<Sparkles size={13} className="text-electric-blue" />
<span>ATS RESUME MAKER v2.5</span>
</div>
<h2 className="main-section-heading">Designed to Pass Every ATS Filter</h2>
<p className="main-section-sub">
Recruiter-approved, machine-readable resumes with instant Gemini AI summary generation, action-verb bullet improvements, and selectable-text PDF/DOCX downloads.
</p>
</div>

<div className="ats-interactive-showcase-card">
<div className="showcase-left-col">
<div className="showcase-feature-list">
<div className="feature-item active">
<div className="feature-icon-badge blue">
<Award size={18} />
</div>
<div>
<h4>Real-Time ATS Score (0–100)</h4>
<p>Instant scoring breakdown across contact info, skills taxonomy, experience verbs, education, and single-column formatting.</p>
</div>
</div>

<div className="feature-item">
<div className="feature-icon-badge green">
<BrainCircuit size={18} />
</div>
<div>
<h4>Gemini AI Optimization</h4>
<p>Automatically turn rough notes into quantifiable bullet points. Never hallucinate fake metrics or companies.</p>
</div>
</div>

<div className="feature-item">
<div className="feature-icon-badge purple">
<Target size={18} />
</div>
<div>
<h4>Target Job Description Matcher</h4>
<p>Paste any job posting to calculate exact keyword alignment, identify missing technical terms, and fine-tune your summary.</p>
</div>
</div>

<div className="feature-item">
<div className="feature-icon-badge dark">
<Download size={18} />
</div>
<div>
<h4>True Selectable PDF & DOCX</h4>
<p>Export pristine documents built with ReportLab and python-docx. No image snapshots or broken multi-column tables.</p>
</div>
</div>
</div>

<div className="showcase-cta-wrap">
<Link to="/resume-maker" className="btn btn-primary btn-lg hover-expand">
<Sparkles size={17} />
<span>Launch ATS Resume Maker</span>
<ArrowRight size={17} />
</Link>
</div>
</div>

{/* Right Live Teaser Preview */}
<div className="showcase-right-col">
<div className="interactive-mini-preview">
<div className="preview-top-toolbar">
<div className="template-switcher-mini">
<button
type="button"
onClick={() => setPreviewTemplate('modern')}
className={`mini-tpl-btn ${previewTemplate === 'modern' ? 'active' : ''}`}
>
Modern
</button>
<button
type="button"
onClick={() => setPreviewTemplate('classic')}
className={`mini-tpl-btn ${previewTemplate === 'classic' ? 'active' : ''}`}
>
Classic
</button>
<button
type="button"
onClick={() => setPreviewTemplate('minimal')}
className={`mini-tpl-btn ${previewTemplate === 'minimal' ? 'active' : ''}`}
>
Minimal
</button>
</div>

<div className="ats-score-pill-mini">
<span className="score-num">94</span>
<span className="score-lbl">/100 ATS</span>
</div>
</div>

{/* Document Sheet Simulation */}
<div className={`mini-paper-doc template-${previewTemplate}`}>
<div className="mini-doc-header">
<h3>ALEXANDER REED</h3>
<p className="mini-doc-title">Lead Software Engineer • San Francisco, CA</p>
<p className="mini-doc-contact">alex.reed@example.com • linkedin.com/in/alexreed • github.com/alexreed</p>
</div>

<div className="mini-doc-section">
<span className="mini-sec-heading">PROFESSIONAL SUMMARY</span>
<p className="mini-sec-text">
Results-driven Lead Software Engineer with 6+ years of experience architecting distributed cloud systems and real-time frontend architectures in React, TypeScript, and Python.
</p>
</div>

<div className="mini-doc-section">
<span className="mini-sec-heading">CORE SKILLS</span>
<p className="mini-sec-text">
<strong>Languages:</strong> TypeScript, Python, Go, SQL • <strong>Frontend:</strong> React 19, Next.js, Redux • <strong>Cloud:</strong> AWS, Docker, Kubernetes
</p>
</div>

<div className="mini-doc-section">
<span className="mini-sec-heading">EXPERIENCE</span>
<div className="mini-job-row">
<strong>Senior Engineer — Horizon Cloud</strong>
<span>2022 – Present</span>
</div>
<ul className="mini-bullets">
<li>• Scaled real-time ingestion pipeline handling 50k RPS with 99.99% uptime.</li>
<li>• Reduced core bundle load time by 38% via dynamic code-splitting.</li>
</ul>
</div>
</div>
</div>
</div>
</div>
</section>

{/* ========================================================================= */}
{/* 3. PLATFORM CAPABILITIES & DEEP DIVES */}
{/* ========================================================================= */}
<section id="features" ref={featuresRef} className={`features-deepdive-section container ${isFeaturesVisible ? 'revealed' : ''}`}>
<div className="section-title-stack text-center">
<div className="section-pill-tag">
<Layers size={13} className="text-electric-blue" />
<span>FULL-SPECTRUM INTELLIGENCE</span>
</div>
<h2 className="main-section-heading">Everything You Need to Advance</h2>
<p className="main-section-sub">
From technical skill gap diagnostics to multi-year progression modeling, Talent Agent AI handles your entire career workflow.
</p>
</div>

{/* Feature Cards Grid */}
<div className="features-showcase-grid">
{/* Card 1: Job Match Matrix */}
<div className="card feature-deep-card hover-expand">
<div className="feature-card-icon blue">
<Briefcase size={22} />
</div>
<div className="feature-card-content">
<h3>Neural Job Compatibility Matrix</h3>
<p>
Cosine similarity algorithms calculate exact alignment percentages against live market requisitions, matching required technical proficiencies and domain mastery.
</p>
<div className="feature-mock-ui">
<div className="mock-match-item">
<div>
<strong>Staff Frontend Architect</strong>
<span>Starlight SaaS • Bengaluru / Remote</span>
</div>
<span className="mock-fit-pill">91% Match</span>
</div>
</div>
<Link to="/job-matching" className="feature-explore-link">
<span>Explore Job Matching</span>
<ChevronRight size={15} />
</Link>
</div>
</div>

{/* Card 2: Skill Gap Analysis */}
<div className="card feature-deep-card hover-expand">
<div className="feature-card-icon green">
<Target size={22} />
</div>
<div className="feature-card-content">
<h3>Targeted Skill Gap Diagnostics</h3>
<p>
Identify exactly which technologies stand between you and your target position, complete with learning curves, project suggestions, and time-to-mastery estimates.
</p>
<div className="feature-mock-ui">
<div className="mock-skill-bar">
<div className="mock-skill-meta">
<span>Kubernetes & Cloud Orchestration</span>
<span className="text-electric-blue">High Priority</span>
</div>
<div className="mock-bar-track">
<div className="mock-bar-fill" style={{ width: '75%' }} />
</div>
</div>
</div>
<Link to="/skill-gaps" className="feature-explore-link">
<span>View Skill Gaps</span>
<ChevronRight size={15} />
</Link>
</div>
</div>

{/* Card 3: Career Path Planner */}
<div className="card feature-deep-card hover-expand">
<div className="feature-card-icon purple">
<GitFork size={22} />
</div>
<div className="feature-card-content">
<h3>Autonomous Career Trajectory</h3>
<p>
Dynamic roadmap forecasting milestones, compensation growth, and staff-level engineering leadership targets across 1 to 5 year timelines.
</p>
<div className="feature-mock-ui">
<div className="mock-timeline-step">
<span className="step-circle">1</span>
<span>Senior Engineer</span>
<ArrowRight size={13} />
<span className="step-circle active">2</span>
<span>Lead Architect</span>
</div>
</div>
<Link to="/career-path" className="feature-explore-link">
<span>Explore Career Paths</span>
<ChevronRight size={15} />
</Link>
</div>
</div>
</div>
</section>

{/* ========================================================================= */}
{/* 4. HOW IT WORKS — 4-STEP TIMELINE */}
{/* ========================================================================= */}
<section id="how-it-works" ref={howItWorksRef} className={`how-it-works-section container ${isHowItWorksVisible ? 'revealed' : ''}`}>
<div className="section-title-stack text-center">
<div className="section-pill-tag">
<Zap size={13} className="text-electric-blue" />
<span>HOW IT WORKS</span>
</div>
<h2 className="main-section-heading">Four Steps to Career Acceleration</h2>
</div>

<div className="timeline-steps-grid">
<div className="timeline-step-box">
<div className="step-num-bubble">01</div>
<h4>Create or Import Profile</h4>
<p>Enter your technical background, skills, and target roles, or let our ATS engine parse your existing resume instantly.</p>
</div>

<div className="timeline-step-box">
<div className="step-num-bubble">02</div>
<h4>Gemini AI Calibration</h4>
<p>Our AI vectorizes your background to determine your multi-dimensional readiness score and market competitiveness.</p>
</div>

<div className="timeline-step-box">
<div className="step-num-bubble">03</div>
<h4>Optimize & Match</h4>
<p>Generate recruiter-approved ATS resumes, benchmark against live requisitions, and close critical skill gaps.</p>
</div>

<div className="timeline-step-box">
<div className="step-num-bubble">04</div>
<h4>Interview & Advance</h4>
<p>Practice with your dedicated AI Career Co-Pilot, benchmark compensation packages, and land top-tier offers.</p>
</div>
</div>
</section>

{/* ========================================================================= */}
{/* 5. CONVERSATIONAL AI CAREER CO-PILOT */}
{/* ========================================================================= */}
<section id="about" ref={aiAssistantRef} className={`ai-copilot-section container ${isAiAssistantVisible ? 'revealed' : ''}`}>
<div className="section-title-stack text-center">
<div className="section-pill-tag">
<MessageSquareCode size={13} className="text-electric-blue" />
<span>AI CAREER CO-PILOT</span>
</div>
<h2 className="main-section-heading">Ask Your Career Agent Anything</h2>
<p className="main-section-sub">
Real-time strategic advice tailored to your technical profile, compensation goals, and interview preparation.
</p>
</div>

<div className="ai-agent-interactive-container">
<div className="prompts-chips-grid">
{suggestedQuestions.map((item, idx) => (



























































</Link>
</div>
</div>
</div>
</section>

{/* ========================================================================= */}
{/* 7. COMPREHENSIVE MULTI-COLUMN FOOTER */}
{/* ========================================================================= */}
<footer className="footer-comprehensive">
<div className="container footer-grid">
<div className="footer-brand-col">
<span className="logo-brand-title font-display">
TALENT AGENT <span className="logo-blue-badge">AI</span>
</span>
<p className="footer-tagline">
Autonomous career intelligence, ATS resume optimization, and job compatibility modeling for modern engineering professionals.
</p>
<div className="system-status-indicator">
<span className="status-dot green" />
<span>All AI Systems Operational (Gemini 2.5)</span>
</div>
</div>

<div className="footer-links-col">
<h5>Product</h5>
<Link to="/resume-maker">ATS Resume Maker</Link>
<Link to="/job-matching">Job Compatibility Matrix</Link>
<Link to="/skill-gaps">Skill Gap Diagnostics</Link>
<Link to="/career-path">Career Roadmap</Link>
<Link to="/assistant">AI Co-Pilot</Link>
</div>

<div className="footer-links-col">
<h5>Resources</h5>
<a href="/#ats-resume">ATS Templates</a>
<a href="/#how-it-works">How It Works</a>
<a href="/#features">Platform Architecture</a>
<Link to="/login">Candidate Sign In</Link>
<Link to="/signup">Register Account</Link>
</div>

<div className="footer-links-col">
<h5>Administration</h5>
<Link to="/admin/login">Admin Gateway</Link>
<Link to="/login">Candidate Sign In</Link>
<Link to="/signup">Register Account</Link>
</div>

<div className="footer-links-col">
<h5>Administration</h5>
<Link to="/admin/login">Admin Gateway</Link>
<Link to="/admin">Recruiter Dashboard</Link>
<Link to="/settings">System Preferences</Link>
</div>
</div>

<div className="container footer-bottom-row">
<span>© 2026 Talent Agent AI. All rights reserved.</span>
<div className="footer-legal-links">
<span>Privacy Policy</span>
<span>Terms of Service</span>
<span>Security & Compliance</span>
</div>
</div>
</footer>