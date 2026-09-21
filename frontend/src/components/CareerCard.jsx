import React from 'react';
import { CheckCircle, Clock, Sparkles } from 'lucide-react';
import { safeString } from '../utils/userHelpers';
import './CareerCard.css';

export const CareerCard = ({ item = {}, isCurrent, isCompleted, index = 0 }) => {
  const keySkills = Array.isArray(item.keySkills) ? item.keySkills : [];

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
            <span className="node-stage-tag">{safeString(item.stage, 'Stage')}</span>
            <h3 className="node-role-title">{safeString(item.role, 'Engineering Role')}</h3>
          </div>
          <span className="node-timeline">{safeString(item.timeline, 'Timeline')}</span>
        </div>

        <p className="node-description">{safeString(item.description)}</p>

        {keySkills.length > 0 && (
          <div className="node-skills-box">
            <span className="skills-box-title">Key Skills & Milestones:</span>
            <div className="skills-box-flex">
              {keySkills.map((skill, sIdx) => {
                const sStr = typeof skill === 'string' ? skill : (skill?.name || skill?.skill || '');
                if (!sStr) return null;
                return (
                  <span key={sIdx} className={`badge ${isCurrent ? 'badge-accent' : 'badge-muted'}`}>
                    {sStr}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerCard;
