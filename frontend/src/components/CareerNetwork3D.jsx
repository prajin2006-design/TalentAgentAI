import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Briefcase, TrendingUp, CheckCircle2, Award, Zap, ShieldCheck, Target, ArrowUpRight } from 'lucide-react';
import './CareerNetwork3D.css';

export const CareerNetwork3D = ({ mousePos = { x: 0, y: 0 } }) => {
const [activeNode, setActiveNode] = useState('match');
const containerRef = useRef(null);

// Subtle 3D tilt calculation (max 6 degrees)
const tiltX = (mousePos.y || 0) * -8;
const tiltY = (mousePos.x || 0) * 8;

return (
<div className="career-network-viewport" ref={containerRef}>
<div
className="career-network-stage"
style={{
transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1)'
}}
>
{/* Ambient Subtle Glow */}
<div className="network-ambient-glow" />

{/* Central Intelligence Core Hub */}
<div className="network-center-card">
<div className="center-card-header">
<div className="ai-core-chip">
<span className="core-dot" />
<span>NEURAL CAREER AGENT</span>
</div>
<span className="live-telemetry-badge">Live Analysis</span>
</div>

<div className="center-role-box">
<span className="role-sub-label">Target Role Match</span>
<div className="role-title-row">
<h3 className="role-title">Staff AI Product Engineer</h3>
<span className="score-badge-highlight">96% Fit</span>
</div>
<p className="role-desc">
High alignment with distributed systems, React architecture, and Gemini LLM integration.
</p>
</div>

<div className="center-metrics-grid">
<div className="mini-metric-item">
<span className="metric-label">ATS Score</span>
<strong className="metric-value text-blue">94/100</strong>
</div>
<div className="mini-metric-item">
<span className="metric-label">Skill Match</span>
<strong className="metric-value text-purple">18 of 20</strong>
</div>
<div className="mini-metric-item">
<span className="metric-label">Salary Band</span>
<strong className="metric-value text-dark">$185k - $225k</strong>
</div>
</div>
</div>

{/* Floating Satellite Card 1: Live ATS Readiness (Top Left) */}
<div
className="network-satellite-card sat-top-left"
style={{
transform: `translate3d(${mousePos.x * -16}px, ${mousePos.y * -16}px, 30px)`
}}
>
<div className="sat-icon-wrap blue">
<Sparkles size={15} />
</div>
<div className="sat-content">
<span className="sat-tag">RESUME ENGINE</span>
<h5 className="sat-title">ATS Formatted & Calibrated</h5>
<span className="sat-sub">Single-column parse ready</span>
</div>
</div>

{/* Floating Satellite Card 2: Skill Acceleration (Bottom Right) */}
<div
className="network-satellite-card sat-bottom-right"
style={{
transform: `translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 40px)`
}}
>
<div className="sat-icon-wrap purple">
<TrendingUp size={15} />
</div>
<div className="sat-content">
<span className="sat-tag">SKILL GAP</span>
<h5 className="sat-title">+12% Velocity Roadmap</h5>
<div className="sat-progress-bar">
<div className="sat-progress-fill" style={{ width: '88%' }} />
</div>
</div>
</div>

{/* Floating Satellite Card 3: Instant Interview Match (Bottom Left) */}
<div
className="network-satellite-card sat-bottom-left"
style={{
transform: `translate3d(${mousePos.x * -12}px, ${mousePos.y * 12}px, 20px)`
}}
>
<div className="sat-icon-wrap green">
<CheckCircle2 size={15} />
</div>
<div className="sat-content">
<span className="sat-tag">MARKET DEMAND</span>
<h5 className="sat-title">14 Live Tier-1 Matches</h5>
<span className="sat-sub">Updated 2m ago</span>
</div>
</div>

{/* Connecting SVG Network Lines */}
<svg className="network-svg-lines" viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg">
<path
d="M 120 70 Q 200 120 240 160"
stroke="rgba(36, 59, 255, 0.22)"
strokeWidth="1.5"
strokeDasharray="4 4"
/>
<path
d="M 460 310 Q 380 260 340 220"
stroke="rgba(124, 92, 255, 0.22)"
strokeWidth="1.5"
strokeDasharray="4 4"
/>
<path
d="M 130 310 Q 210 270 260 230"
stroke="rgba(22, 163, 74, 0.22)"
strokeWidth="1.5"
strokeDasharray="4 4"
/>
</svg>
</div>
</div>
);
};

export default CareerNetwork3D;
