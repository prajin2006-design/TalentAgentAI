import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { useAuth } from '../context/AuthContext';
import {
  ArrowRight,
  Sparkles,
  Check,
  X,
  FileText,
  Briefcase,
  Target,
  TrendingUp,
  BrainCircuit,
  MessageSquareCode,
  GraduationCap,
  Award,
  Layers,
  Compass,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import './Home.css';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  // Role calibration demo state
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);

  const roleCalibrationDemos = [
    {
      role: "Frontend Developer",
      matchScore: 84,
      strongMatches: ["React", "JavaScript", "CSS", "Figma"],
      skillGaps: ["TypeScript", "Testing"],
      nextBestMove: "Build a TypeScript project and strengthen testing fundamentals.",
      openRolesCount: 42
    },
    {
      role: "Full Stack Engineer",
      matchScore: 78,
      strongMatches: ["Node.js", "Express", "REST APIs", "SQL"],
      skillGaps: ["Docker", "GraphQL"],
      nextBestMove: "Containerize a full-stack CRUD application and deploy on AWS / Render.",
      openRolesCount: 58
    },
    {
      role: "Data & AI Associate",
      matchScore: 72,
      strongMatches: ["Python", "Pandas", "SQL", "Data Viz"],
      skillGaps: ["PyTorch / LLMs", "MLOps"],
      nextBestMove: "Implement a vector search retrieval pipeline with LangChain or Groq.",
      openRolesCount: 29
    }
  ];

  const currentRole = roleCalibrationDemos[selectedRoleIndex];

  // AI Assistant preview state
  const [aiQueryState, setAiQueryState] = useState({
    question: "How do I optimize my resume for a Frontend Developer role?",
    insight: "Emphasize modern component architecture (React 19), measurable user impact (e.g., 'reduced render time by 35%'), and live project demo links. Highlight TypeScript and responsive UI fidelity.",
    match: "84% Target Fit",
    nextStep: "Use ATS Resume Maker to benchmark action verbs."
  });

  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const suggestedQuestions = [
    {
      question: "How do I optimize my resume for a Frontend Developer role?",
      insight: "Emphasize modern component architecture (React 19), measurable user impact (e.g., 'reduced render time by 35%'), and live project demo links. Highlight TypeScript and responsive UI fidelity.",
      match: "84% Target Fit",
      nextStep: "Use ATS Resume Maker to benchmark action verbs."
    },
    {
      question: "What skills are missing for a Cloud & DevOps entry role?",
      insight: "Primary high-impact skills missing are Terraform (IaC) and Docker container orchestration. Closing these two gaps improves your profile match from 68% to 88%.",
      match: "88% Fit Potential",
      nextStep: "Review CI/CD learning milestones in Skill Gaps."
    },
    {
      question: "How can I stand out as a fresh computer science graduate?",
      insight: "Recruiters evaluate problem-solving clarity over generic tutorial clones. Build a full-stack production application with auth, automated tests, and measurable data flow.",
      match: "Top 15% Profile",
      nextStep: "Follow Career Roadmap for prioritized project templates."
    }
  ];

  const handleSelectQuestion = (item) => {
    setIsAiProcessing(true);
    setTimeout(() => {
      setAiQueryState(item);
      setIsAiProcessing(false);
    }, 280);
  };

  return (
    <div className="landing-page-root">
      {/* 1. Universal Clean Navigation Bar */}
      <Navbar />

      {/* 2. Redesigned 2-Column Hero */}
      <Hero />

      {/* ========================================================================= */}
      {/* 3. CAPABILITIES & METRICS STRIP (Directly Below Hero) */}
      {/* ========================================================================= */}
      <section className="capabilities-strip-section">
        <div className="landing-container">
          <div className="capabilities-grid">
            <div className="capability-item">
              <span className="capability-index">01</span>
              <div className="capability-text-group">
                <h4 className="capability-title">Resume Intelligence</h4>
                <p className="capability-desc">Deep structural & semantic parsing of skills, experience, and impact.</p>
              </div>
            </div>

            <div className="capability-item">
              <span className="capability-index">02</span>
              <div className="capability-text-group">
                <h4 className="capability-title">AI Job Matching</h4>
                <p className="capability-desc">Real-time compatibility scoring across active entry-level roles.</p>
              </div>
            </div>

            <div className="capability-item">
              <span className="capability-index">03</span>
              <div className="capability-text-group">
                <h4 className="capability-title">Skill Gap Detection</h4>
                <p className="capability-desc">Pinpoint missing technical requirements and prioritize learning.</p>
              </div>
            </div>

            <div className="capability-item">
              <span className="capability-index">04</span>
              <div className="capability-text-group">
                <h4 className="capability-title">Career Guidance</h4>
                <p className="capability-desc">Actionable next moves and milestones to maximize hiring fit.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. PROBLEM → SOLUTION SECTION */}
      {/* ========================================================================= */}
      <section className="problem-solution-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-tag-pill">
              <Sparkles size={13} className="text-lavender" />
              <span>THE OLD WAY VS. TALENT AGENT AI</span>
            </div>
            <h2 className="section-primary-heading">
              Job searching shouldn't feel like guesswork.
            </h2>
            <p className="section-sub-paragraph">
              Traditional job applications are a black box. Talent Agent AI brings clarity, calibration, and strategy to every step of your career.
            </p>
          </div>

          {/* Comparison Cards Grid */}
          <div className="problem-solution-grid">
            {/* Left: Traditional Search Problems */}
            <div className="comparison-card problem-card">
              <div className="comparison-card-top">
                <span className="comparison-label error-label">THE FRICTION</span>
                <h3 className="comparison-heading">Traditional Job Search</h3>
              </div>
              <ul className="comparison-list">
                <li>
                  <span className="list-icon-badge cross-badge"><X size={13} strokeWidth={2.5} /></span>
                  <span>Too many job listings with conflicting, bloated requirements</span>
                </li>
                <li>
                  <span className="list-icon-badge cross-badge"><X size={13} strokeWidth={2.5} /></span>
                  <span>Unclear role fit and opaque automated ATS rejections</span>
                </li>
                <li>
                  <span className="list-icon-badge cross-badge"><X size={13} strokeWidth={2.5} /></span>
                  <span>Unknown skill gaps with zero actionable recruiter feedback</span>
                </li>
                <li>
                  <span className="list-icon-badge cross-badge"><X size={13} strokeWidth={2.5} /></span>
                  <span>Generic, one-size-fits-all career advice that wastes months</span>
                </li>
              </ul>
            </div>

            {/* Right: Talent Agent AI Solutions */}
            <div className="comparison-card solution-card">
              <div className="comparison-card-top">
                <span className="comparison-label success-label">THE SOLUTION</span>
                <h3 className="comparison-heading">Talent Agent AI</h3>
              </div>
              <ul className="comparison-list">
                <li>
                  <span className="list-icon-badge check-badge"><Check size={13} strokeWidth={2.5} /></span>
                  <span>Understand your profile with deep technical & contextual extraction</span>
                </li>
                <li>
                  <span className="list-icon-badge check-badge"><Check size={13} strokeWidth={2.5} /></span>
                  <span>Match your actual skills against precise, verified job requirements</span>
                </li>
                <li>
                  <span className="list-icon-badge check-badge"><Check size={13} strokeWidth={2.5} /></span>
                  <span>Identify precise gaps with prioritized project learning roadmaps</span>
                </li>
                <li>
                  <span className="list-icon-badge check-badge"><Check size={13} strokeWidth={2.5} /></span>
                  <span>Recommend your next best move with measurable career outcomes</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Linear Transformation Flow Diagram */}
          <div className="transformation-flow-wrapper">
            <div className="flow-step-node">
              <div className="node-circle">01</div>
              <span className="node-title">Your Profile</span>
            </div>
            <div className="flow-arrow-connector">
              <span className="flow-line" />
              <ChevronRight size={16} className="flow-arrow-icon" />
            </div>
            <div className="flow-step-node">
              <div className="node-circle active-node">02</div>
              <span className="node-title">AI Understanding</span>
            </div>
            <div className="flow-arrow-connector">
              <span className="flow-line" />
              <ChevronRight size={16} className="flow-arrow-icon" />
            </div>
            <div className="flow-step-node">
              <div className="node-circle">03</div>
              <span className="node-title">Job Fit</span>
            </div>
            <div className="flow-arrow-connector">
              <span className="flow-line" />
              <ChevronRight size={16} className="flow-arrow-icon" />
            </div>
            <div className="flow-step-node">
              <div className="node-circle">04</div>
              <span className="node-title">Skill Gap</span>
            </div>
            <div className="flow-arrow-connector">
              <span className="flow-line" />
              <ChevronRight size={16} className="flow-arrow-icon" />
            </div>
            <div className="flow-step-node">
              <div className="node-circle active-node lime-border">05</div>
              <span className="node-title">Next Step</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURES 2x3 GRID SECTION */}
      {/* ========================================================================= */}
      <section id="features" className="features-grid-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-tag-pill">
              <Sparkles size={13} className="text-lavender" />
              <span>CORE CAPABILITIES</span>
            </div>
            <h2 className="section-primary-heading">
              Everything you need to move forward.
            </h2>
            <p className="section-sub-paragraph">
              Purpose-built intelligence tools for entry-level professionals, students, and recent graduates.
            </p>
          </div>

          <div className="features-2x3-grid">
            {/* 01 Resume Analysis */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">01</span>
                <div className="feature-icon-wrapper">
                  <FileText size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">Resume Analysis</h3>
              <p className="feature-card-desc">
                Understand your skills, experience, projects, and qualifications with deep ATS-grade semantic parsing.
              </p>
              <Link to="/resume-analysis" className="feature-card-link">
                <span>Explore Resume Intelligence</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 02 AI Job Matching */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">02</span>
                <div className="feature-icon-wrapper">
                  <Briefcase size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">AI Job Matching</h3>
              <p className="feature-card-desc">
                See how closely your profile matches a role before you spend time applying to opaque job boards.
              </p>
              <Link to="/job-matching" className="feature-card-link">
                <span>View Job Matching</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 03 Match Score */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">03</span>
                <div className="feature-icon-wrapper">
                  <Award size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">Match Score</h3>
              <p className="feature-card-desc">
                Get a simple compatibility score with clear supporting reasons, strengths, and alignment breakdown.
              </p>
              <Link to="/job-matching" className="feature-card-link">
                <span>See Score Breakdown</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 04 Skill Gap Analysis */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">04</span>
                <div className="feature-icon-wrapper">
                  <Target size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">Skill Gap Analysis</h3>
              <p className="feature-card-desc">
                Know exactly which skills you're missing for your target career tracks and prioritize what to learn next.
              </p>
              <Link to="/skill-gaps" className="feature-card-link">
                <span>Inspect Skill Gaps</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 05 Job Recommendations */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">05</span>
                <div className="feature-icon-wrapper">
                  <TrendingUp size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">Job Recommendations</h3>
              <p className="feature-card-desc">
                Discover high-alignment opportunities tailored to your actual strengths and career trajectory.
              </p>
              <Link to="/job-matching" className="feature-card-link">
                <span>Browse Opportunities</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            {/* 06 AI Career Assistant */}
            <div className="feature-card">
              <div className="feature-card-top-row">
                <span className="feature-index">06</span>
                <div className="feature-icon-wrapper">
                  <BrainCircuit size={18} />
                </div>
              </div>
              <h3 className="feature-card-title">AI Career Assistant</h3>
              <p className="feature-card-desc">
                Ask strategic career questions, get resume improvement suggestions, and prepare for interviews 24/7.
              </p>
              <Link to="/assistant" className="feature-card-link">
                <span>Launch Assistant</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. HOW IT WORKS SECTION (Horizontal 4 Steps) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="how-it-works-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-tag-pill">
              <Sparkles size={13} className="text-lavender" />
              <span>THE 4-STEP WORKFLOW</span>
            </div>
            <h2 className="section-primary-heading">
              How Talent Agent AI Works
            </h2>
            <p className="section-sub-paragraph">
              From raw profile to calibrated candidacy in four structured steps.
            </p>
          </div>

          <div className="how-it-works-steps-grid">
            {/* Step 01 */}
            <div className="step-card">
              <div className="step-badge-row">
                <span className="step-number">01</span>
                <span className="step-status-tag">Profile</span>
              </div>
              <h3 className="step-title">Build Your Profile</h3>
              <p className="step-description">
                Set up your education background, technical toolkit, target engineering roles, and career goals.
              </p>
            </div>

            {/* Step 02 */}
            <div className="step-card">
              <div className="step-badge-row">
                <span className="step-number">02</span>
                <span className="step-status-tag">Resume</span>
              </div>
              <h3 className="step-title">Upload Your Resume</h3>
              <p className="step-description">
                Our parser extracts your technical toolkit, project bullets, coursework, and work history.
              </p>
            </div>

            {/* Step 03 */}
            <div className="step-card active-step">
              <div className="step-badge-row">
                <span className="step-number">03</span>
                <span className="step-status-tag lime-tag">AI Calibrated</span>
              </div>
              <h3 className="step-title">AI Understands Your Fit</h3>
              <p className="step-description">
                Deep semantic calibration benchmarks your candidacy against live requisitions and market standards.
              </p>
            </div>

            {/* Step 04 */}
            <div className="step-card">
              <div className="step-badge-row">
                <span className="step-number">04</span>
                <span className="step-status-tag">Action</span>
              </div>
              <h3 className="step-title">Take Your Next Step</h3>
              <p className="step-description">
                Target high-probability jobs, close prioritized skill gaps, and apply with ATS-optimized materials.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. AI INSIGHT SECTION (Split Section) */}
      {/* ========================================================================= */}
      <section id="job-intelligence" className="ai-insight-split-section">
        <div className="landing-container ai-insight-grid">
          {/* Left Column: Heading & Role Selector */}
          <div className="ai-insight-left">
            <div className="section-tag-pill">
              <Sparkles size={13} className="text-lavender" />
              <span>REAL-TIME CALIBRATION</span>
            </div>
            <h2 className="ai-insight-main-heading">
              Know where you fit.<br />
              <span className="hero-lavender-accent">Know what's missing.</span>
            </h2>
            <p className="ai-insight-lead">
              Stop guessing why you aren't hearing back from recruiters. Our AI breaks down your profile against live role benchmarks so you know exactly what hiring teams see.
            </p>

            {/* Interactive Role Switcher */}
            <div className="role-switcher-group">
              <span className="role-switcher-label">TEST WITH SAMPLE ROLES:</span>
              <div className="role-buttons-wrap">
                {roleCalibrationDemos.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`role-select-btn ${selectedRoleIndex === idx ? 'selected' : ''}`}
                    onClick={() => setSelectedRoleIndex(idx)}
                  >
                    <span>{item.role}</span>
                    <span className="role-select-score">{item.matchScore}%</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="ai-insight-cta-wrap">
              <Link to="/job-matching" className="btn btn-primary">
                <span>View Live Job Matches</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>

          {/* Right Column: Interactive Product Card */}
          <div className="ai-insight-right">
            <div className="interactive-calibration-card">
              {/* Card Header */}
              <div className="calibration-card-header">
                <div>
                  <span className="calibration-sub-tag">TARGET ROLE CALIBRATION</span>
                  <h3 className="calibration-role-name">{currentRole.role.toUpperCase()}</h3>
                </div>
                <div className="calibration-match-badge">
                  <span className="badge-pulse-dot" />
                  <span>{currentRole.matchScore}% MATCH</span>
                </div>
              </div>

              {/* Strong Matches */}
              <div className="calibration-block">
                <div className="calibration-block-header">
                  <span className="block-title">STRONG MATCHES</span>
                  <span className="block-count text-green">{currentRole.strongMatches.length} skills verified</span>
                </div>
                <div className="calibration-chips-wrap">
                  {currentRole.strongMatches.map((skill, i) => (
                    <span key={i} className="skill-chip match-chip">
                      <Check size={12} strokeWidth={3} className="skill-check-icon" /> {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Skill Gaps */}
              <div className="calibration-block">
                <div className="calibration-block-header">
                  <span className="block-title">SKILL GAPS</span>
                  <span className="block-count text-amber">{currentRole.skillGaps.length} gaps identified</span>
                </div>
                <div className="calibration-chips-wrap">
                  {currentRole.skillGaps.map((skill, i) => (
                    <span key={i} className="skill-chip gap-chip">
                      <span className="gap-indicator-dot" /> {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next Best Move Highlight Box */}
              <div className="calibration-next-move-card">
                <div className="next-move-tag-row">
                  <Sparkles size={13} className="text-lavender" />
                  <span className="next-move-title">NEXT BEST MOVE</span>
                </div>
                <p className="next-move-content">
                  "{currentRole.nextBestMove}"
                </p>
              </div>

              <div className="calibration-card-footer">
                <span className="footer-open-roles">⚡ {currentRole.openRolesCount} matching requisitions active today</span>
                <Link to="/signup" className="footer-action-link">
                  <span>Analyze Your Resume →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TARGET USERS SECTION (3 Clean Cards) */}
      {/* ========================================================================= */}
      <section className="target-users-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-tag-pill">
              <GraduationCap size={13} className="text-lavender" />
              <span>WHO IT'S FOR</span>
            </div>
            <h2 className="section-primary-heading">
              Built for every stage of early career
            </h2>
            <p className="section-sub-paragraph">
              Tailored intelligence whether you're taking your first step or leveling up your technical trajectory.
            </p>
          </div>

          <div className="target-users-grid">
            {/* Card 1 */}
            <div className="target-user-card">
              <div className="user-card-icon-wrap">
                <GraduationCap size={22} className="user-card-icon" />
              </div>
              <h3 className="user-card-title">College Students</h3>
              <p className="user-card-desc">
                Discover high-growth career tracks and build the exact project portfolio recruiters search for.
              </p>
            </div>

            {/* Card 2 */}
            <div className="target-user-card">
              <div className="user-card-icon-wrap">
                <Award size={22} className="user-card-icon" />
              </div>
              <h3 className="user-card-title">Fresh Graduates</h3>
              <p className="user-card-desc">
                Translate coursework and internship experience into compelling, ATS-optimized job applications.
              </p>
            </div>

            {/* Card 3 */}
            <div className="target-user-card">
              <div className="user-card-icon-wrap">
                <Compass size={22} className="user-card-icon" />
              </div>
              <h3 className="user-card-title">Entry-Level Professionals</h3>
              <p className="user-card-desc">
                Identify high-leverage skill upgrades to transition into higher-paying mid-level roles.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. AI CAREER ASSISTANT INTERACTIVE SECTION */}
      {/* ========================================================================= */}
      <section id="co-pilot" className="ai-assistant-interactive-section">
        <div className="landing-container">
          <div className="section-header-centered">
            <div className="section-tag-pill">
              <MessageSquareCode size={13} className="text-lavender" />
              <span>AI CAREER ASSISTANT</span>
            </div>
            <h2 className="section-primary-heading">
              Ask your career agent anything.
            </h2>
            <p className="section-sub-paragraph">
              Real-time strategic advice tailored to your technical profile, compensation goals, and interview preparation.
            </p>
          </div>

          <div className="ai-assistant-showcase-box">
            {/* Suggested Prompts */}
            <div className="assistant-prompts-row">
              {suggestedQuestions.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`assistant-prompt-chip ${aiQueryState.question === item.question ? 'active' : ''}`}
                  onClick={() => handleSelectQuestion(item)}
                >
                  <Sparkles size={13} className="chip-sparkle" />
                  <span>{item.question}</span>
                </button>
              ))}
            </div>

            {/* Live Chat Demo Box */}
            <div className="assistant-chat-bubble-card">
              <div className="chat-bubble-user">
                <div className="chat-avatar user-avatar">You</div>
                <div className="chat-message-text">{aiQueryState.question}</div>
              </div>

              <div className="chat-bubble-assistant">
                <div className="chat-avatar assistant-avatar">
                  <Sparkles size={15} />
                </div>
                <div className="chat-message-body">
                  {isAiProcessing ? (
                    <div className="typing-dots-indicator">
                      <span /><span /><span />
                    </div>
                  ) : (
                    <>
                      <p className="assistant-reply-paragraph">{aiQueryState.insight}</p>
                      <div className="assistant-meta-tags">
                        <span className="badge-fit-highlight">{aiQueryState.match}</span>
                        <span className="badge-next-step-link">
                          <ArrowRight size={13} /> {aiQueryState.nextStep}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FINAL CALL TO ACTION SECTION */}
      {/* ========================================================================= */}
      <section className="final-cta-section">
        <div className="landing-container">
          <div className="cta-dark-banner">
            <div className="cta-lavender-glow-ambient" />

            <div className="cta-banner-content">
              <div className="cta-eyebrow-chip">
                <Sparkles size={13} className="text-lime" />
                <span>ACCELERATE YOUR CAREER</span>
              </div>
              <h2 className="cta-primary-title">
                Your next opportunity starts with understanding your fit.
              </h2>
              <p className="cta-sub-description">
                Let Talent Agent AI turn your profile into a clearer career path.
              </p>
              <div className="cta-action-button-group">
                <Link
                  to={isAuthenticated ? '/dashboard' : '/signup'}
                  className="cta-main-btn"
                >
                  <span>{isAuthenticated ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight size={16} className="cta-lime-arrow" />
                </Link>
                {!isAuthenticated && (
                  <Link to="/login" className="cta-signin-btn">
                    <span>Sign In</span>
                  </Link>
                )}
              </div>
              <span className="cta-footnote-text">
                ✓ Free to analyze your profile • No credit card required • Instant calibration
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. COMPREHENSIVE 1280px GRID FOOTER */}
      {/* ========================================================================= */}
      <footer className="footer-root">
        <div className="landing-container footer-content-grid">
          {/* Brand Column */}
          <div className="footer-brand-column">
            <div className="footer-brand-header">
              <div className="brand-logo-mark">
                <Sparkles size={16} className="brand-sparkle-icon" />
              </div>
              <span className="brand-text">
                Talent Agent <span className="brand-ai-badge">AI</span>
              </span>
            </div>
            <p className="footer-brand-summary">
              AI-powered career agent for students, fresh graduates, and entry-level professionals. Understand your skills, find the right opportunities, and close your skill gaps.
            </p>
            <div className="system-live-status-pill">
              <span className="pulse-green-dot" />
              <span>All AI Systems Operational</span>
            </div>
          </div>

          {/* Column: Intelligence */}
          <div className="footer-links-column">
            <h5 className="footer-links-header">Product</h5>
            <Link to="/resume-maker">ATS Resume Maker</Link>
            <Link to="/resume-analysis">Resume Intelligence</Link>
            <Link to="/job-matching">Job Matching</Link>
            <Link to="/skill-gaps">Skill Gap Diagnostics</Link>
            <Link to="/career-path">Career Roadmap</Link>
            <Link to="/assistant">AI Career Assistant</Link>
          </div>

          {/* Column: Platform */}
          <div className="footer-links-column">
            <h5 className="footer-links-header">Navigation</h5>
            <a href="#features">Features</a>
            <a href="#how-it-works">How It Works</a>
            <a href="#job-intelligence">Job Intelligence</a>
            <a href="#co-pilot">AI Assistant</a>
            <Link to="/login">Candidate Sign In</Link>
            <Link to="/signup">Create Free Account</Link>
          </div>

          {/* Column: Compliance & Administration */}
          <div className="footer-links-column">
            <h5 className="footer-links-header">Legal & Trust</h5>
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/security">Security & Compliance</Link>
            <Link to="/cookies">Cookies Policy</Link>
            <Link to="/ai-data-use">AI Data Use</Link>
            <Link to="/help">Help & Support</Link>
            <Link to="/admin/login">Admin Gateway</Link>
          </div>
        </div>

        {/* Footer Bottom Line */}
        <div className="landing-container footer-bottom-bar">
          <span className="footer-copyright">
            © {new Date().getFullYear()} Talent Agent AI. All rights reserved.
          </span>
          <div className="footer-bottom-legal">
            <Link to="/privacy">Privacy</Link>
            <span className="legal-dot">•</span>
            <Link to="/terms">Terms</Link>
            <span className="legal-dot">•</span>
            <Link to="/security">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;