import React from 'react';
import { CheckCircle, Clock, Sparkles, ChevronRight } from 'lucide-react';
import './CareerCard.css';

export const CareerCard = ({ item, isCurrent, isCompleted, index }) => {
  return (
    <div className={`career-node-card ${isCurrent ? 'current' : ''} ${isCompleted ? 'completed' : ''}`}>
      <div className="node-connector-line" />
      
      <div className="node-badge-col">
        <div className="node-badge-circle">
          {isCompleted ? (
            <CheckCircle size={18} className="node-icon completed" />
          ) : isCurrent ? (
            <Sparkles size={18} className="node-icon current" />
          ) : (
            <Clock size={18} className="node-icon upcoming" />
          )}
        </div>
        <span className="node-index">0{index + 1}</span>
      </div>

      <div className="node-content-body">
        <div className="node-header">
          <div>
            <span className="node-stage-tag">{item.stage}</span>
            <h3 className="node-role-title">{item.role}</h3>
          </div>
          <span className="node-timeline">{item.timeline}</span>
        </div>

        <p className="node-description">{item.description}</p>

        <div className="node-skills-box">
          <span className="skills-box-title">Key Skills & Milestones:</span>
          <div className="skills-box-flex">
            {item.keySkills.map((skill) => (
              <span key={skill} className={`badge ${isCurrent ? 'badge-accent' : 'badge-muted'}`}>
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
