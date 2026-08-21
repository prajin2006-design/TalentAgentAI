import React, { useState } from 'react';
import { useCareer } from '../context/CareerContext';
import { JobCard } from '../components/JobCard';
import { Sparkles, Compass, Filter, CheckCircle2, Bookmark } from 'lucide-react';
import './JobRecommendations.css';

export const JobRecommendations = () => {
  const { jobs } = useCareer();
  const [minMatch, setMinMatch] = useState(75);

  const recommendedJobs = jobs.filter((job) => job.matchPercentage >= minMatch);

  return (
    <div className="recommendations-wrapper">
      {/* Header Banner */}
      <div className="card rec-banner-card">
        <div className="rec-header-content">
          <div className="badge badge-accent">
            <Sparkles size={14} /> AI Recommendation Engine
          </div>
          <h2 className="banner-heading">Curated Career Opportunities</h2>
          <p className="banner-sub">
            Jobs selected specifically for your candidate profile vector. We continuously re-index top remote and hybrid tech postings.
          </p>
        </div>

        <div className="match-slider-box">
          <div className="slider-label-row">
            <span className="slider-title">Minimum Match Score Threshold:</span>
            <span className="slider-value">{minMatch}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="95"
            step="5"
            value={minMatch}
            onChange={(e) => setMinMatch(Number(e.target.value))}
            className="match-range-slider"
          />
        </div>
      </div>

      {/* Recommended Job List */}
      <div className="recommendations-list-grid">
        {recommendedJobs.map((job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
};
