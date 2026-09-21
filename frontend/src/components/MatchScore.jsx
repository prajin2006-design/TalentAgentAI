import React from 'react';
import { Sparkles } from 'lucide-react';
import { normalizeReadiness, safeString } from '../utils/userHelpers';
import './MatchScore.css';

export const MatchScore = ({ score = 82, label = "MATCH", role = "Frontend Developer" }) => {
  const numericScore = normalizeReadiness(score);
  const displayLabel = safeString(label, 'MATCH');
  const displayRole = safeString(role);

  return (
    <div className="match-score-widget">
      <div className="score-circle-outer">
        <svg viewBox="0 0 100 100" className="score-svg">
          <circle
            cx="50"
            cy="50"
            r="42"
            className="score-circle-bg"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            className="score-circle-fill"
            style={{
              strokeDasharray: 264,
              strokeDashoffset: 264 - (264 * numericScore) / 100
            }}
          />
        </svg>
        <div className="score-center-content">
          <span className="score-number">{numericScore}%</span>
          <span className="score-label">{displayLabel}</span>
        </div>
      </div>

      {displayRole && (
        <div className="score-role-badge">
          <Sparkles size={12} className="role-sparkle" />
          <span>{displayRole}</span>
        </div>
      )}
    </div>
  );
};

export default MatchScore;
