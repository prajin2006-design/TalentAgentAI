import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { CareerCard } from '../components/CareerCard';
import { GitFork, Sparkles, CheckCircle2, ArrowRight, Briefcase, Code, FolderGit2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { safeString } from '../utils/userHelpers';
import './CareerPath.css';

export const CareerPath = () => {
const { profile, careerPath } = useCareer();
const targetRole = safeString(profile?.preferred_role, 'Software Engineer');

const defaultRoadmap = [
{
stage: "Stage 01",
role: "Computer Science Foundation",
timeline: "Foundation",
status: "COMPLETED",
description: "Master programming fundamentals, data structures, and core languages.",
keySkills: ["Programming Fundamentals", "Data Structures", "Git"]
},
{
stage: "Stage 02",
role: `Junior ${targetRole}`,
timeline: "Target Focus (0–1 YOE)",
status: "CURRENT",
description: "Ship production-ready features, master testing, and integrate with backend APIs.",
keySkills: ["Core Frameworks", "TypeScript", "Testing & Debugging"]
},
{
stage: "Stage 03",
role: `Mid-Level ${targetRole}`,
timeline: "Year 2–3",
status: "UPCOMING",
description: "Own feature modules end-to-end, optimize performance, and participate in technical design reviews.",
keySkills: ["System Design", "Performance Optimization", "State Architecture"]
},
{
stage: "Stage 04",
role: `Senior ${targetRole}`,
timeline: "Year 4–5",
status: "UPCOMING",
description: "Lead design system architectures, mentor team members, and direct product engineering.",
keySkills: ["Technical Leadership", "Scalability", "Architecture Patterns"]
},
{
stage: "Stage 05",
role: `Principal ${targetRole} / Architect`,
timeline: "Year 5+",
status: "UPCOMING",
description: "Direct global engineering strategy, evaluate emerging tech stacks, and architect enterprise platforms.",
keySkills: ["Platform Strategy", "Enterprise Systems", "Engineering Direction"]
}
];

const activeRoadmap = (careerPath && careerPath.length > 0) ? careerPath : defaultRoadmap;
const [selectedNode, setSelectedNode] = useState(activeRoadmap[1] || activeRoadmap[0]);

return (
<div className="career-path-wrapper">
{/* Overview Banner */}
<div className="card roadmap-banner-card">
<div className="banner-left-info">
<div className="badge badge-accent">
<GitFork size={14} /> Interactive Career Roadmap
</div>
<h2 className="banner-heading">Engineering Career Pathway</h2>
<p className="banner-sub">
Trajectory mapping your skills from graduate student to Senior Engineering Architect. Click any stage to inspect required skills, responsibilities, and milestones.
</p>
</div>

<div className="roadmap-current-badge">
<Sparkles size={16} className="text-electric-blue" />
<div>
<span className="current-label">CURRENT GOAL STAGE</span>
<span className="current-val">{targetRole}</span>
</div>
</div>
</div>

{/* Main Roadmap Flex Container */}
<div className="roadmap-main-grid">
{/* Timeline Nodes Column */}
<div className="nodes-timeline-col">
{activeRoadmap.map((item, idx) => {
const isCurrent = item.status === 'CURRENT';
const isCompleted = item.status === 'COMPLETED';

return (
<div
key={item.stage}
onClick={() => setSelectedNode(item)}
className="node-card-interactive-wrapper"
>
<CareerCard
item={item}
isCurrent={isCurrent}
isCompleted={isCompleted}
index={idx}
/>
</div>
);
})}
</div>

{/* Selected Stage Detail Inspector */}
<div className="node-inspector-col">
{selectedNode && (
<div className="card inspector-card sticky-inspector">
<div className="inspector-badge">
<Sparkles size={14} className="text-electric-blue" />
<span>STAGE ANALYSIS & MILESTONES</span>
</div>

<h3 className="inspector-role">{selectedNode.role}</h3>
<span className="inspector-timeline">{selectedNode.timeline}</span>

<p className="inspector-desc">{selectedNode.description}</p>

{/* Required Skills */}
<div className="inspector-skills-group">
<h4 className="group-title">
<Code size={14} /> Required Skills & Competencies:
</h4>
<div className="inspector-tags-flex">
{(selectedNode.keySkills || selectedNode.key_skills || []).map((sk) => (
<span key={sk} className="badge badge-accent">
✓ {sk}
</span>
))}
</div>
</div>

{/* Typical Responsibilities */}
{selectedNode.responsibilities && (
<div className="inspector-skills-group">
<h4 className="group-title">
<Briefcase size={14} /> Typical Responsibilities:
</h4>
<ul className="inspector-list">
{selectedNode.responsibilities.map((r, i) => (
<li key={i}>{r}</li>
))}
</ul>
</div>
)}

<div className="inspector-status-box">
<span className="status-box-label">Milestone Status:</span>
<span className={`badge ${selectedNode.status === 'CURRENT' ? 'badge-accent' : 'badge-muted'}`}>
{selectedNode.status}
</span>
</div>
</div>
)}
</div>
</div>
</div>
);
};

export default CareerPath;
