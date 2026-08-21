import React from 'react';
import './SkillBar.css';

export const SkillBar = ({ name, percentage, color = 'var(--accent)', status }) => {
  return (
    <div className="skill-bar-item">
      <div className="skill-bar-info">
        <span className="skill-name">{name}</span>
        <div className="skill-right-info">
          {status && <span className="skill-status-tag">{status}</span>}
          <span className="skill-percentage">{percentage}%</span>
        </div>
      </div>
      <div className="skill-progress-track">
        <div
          className="skill-progress-fill"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: `0 0 10px ${color}`
          }}
        />
      </div>
    </div>
  );
};
