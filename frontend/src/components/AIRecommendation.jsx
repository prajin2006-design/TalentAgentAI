import React from 'react';
import { Bot, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './AIRecommendation.css';

export const AIRecommendation = ({
  title = "AI RECOMMENDATION",
  quote = "Strengthen JavaScript + Git to improve your match.",
  actionText = "View Skill Gap Breakdown",
  actionLink = "/skill-gaps"
}) => {
  return (
    <div className="ai-recommendation-card">
      <div className="ai-rec-header">
        <div className="ai-badge">
          <Bot size={14} className="bot-icon" />
          <span>{title}</span>
        </div>
        <Sparkles size={16} className="sparkle-accent" />
      </div>

      <p className="ai-rec-quote">"{quote}"</p>

      {actionLink && (
        <Link to={actionLink} className="ai-rec-link">
          <span>{actionText}</span>
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
};
