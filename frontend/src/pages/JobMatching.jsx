import React, { useState, useEffect } from 'react';
import { useCareer } from '../context/CareerContext';
import { useAuth } from '../context/AuthContext';
import { JobCard } from '../components/JobCard';
import { jobsAPI } from '../services/api';
import { Sparkles, CheckCircle2, AlertCircle, ArrowRight, SlidersHorizontal, Search, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import './JobMatching.css';

// Pulser Placeholder for Job Cards Loading State
const JobCardSkeleton = () => (
  <div className="card job-card skeleton-pulse">
    <div className="skeleton-line header" />
    <div className="skeleton-line sub" />
    <div className="skeleton-line detail" />
    <div className="skeleton-line detail" />
    <div className="skeleton-line button" />
  </div>
);

export const JobMatching = () => {
  const { isAuthenticated } = useAuth();
  const { profile, skills } = useCareer();
  const [jobMatchesList, setJobMatchesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMatches = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await jobsAPI.getJobMatches();
      setJobMatchesList(res.matches || []);
    } catch (err) {
      console.error('Failed to load dynamic matches:', err);
      setError('Unable to load job matches.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchMatches();
    }
  }, [isAuthenticated]);

  const targetRole = profile?.preferred_role || 'Software Engineer';
  const targetLocation = profile?.preferred_location || profile?.location || 'Remote';

  // Client-side search and filters
  const filteredJobs = (Array.isArray(jobMatchesList) ? jobMatchesList : []).filter((job) => {
    const query = searchTerm.trim().toLowerCase();
    const matching = Array.isArray(job.matchingSkills) ? job.matchingSkills : (Array.isArray(job.matching_skills) ? job.matching_skills : []);
    const missing = Array.isArray(job.missingSkills) ? job.missingSkills : (Array.isArray(job.missing_skills) ? job.missing_skills : []);

    const matchesSearch = 
      !query ||
      (job.title || '').toLowerCase().includes(query) ||
      (job.company || '').toLowerCase().includes(query) ||
      (job.location || '').toLowerCase().includes(query) ||
      (job.description || '').toLowerCase().includes(query) ||
      matching.some(s => (typeof s === 'string' ? s : (s?.skill_name || s?.name || '')).toLowerCase().includes(query)) ||
      missing.some(s => (typeof s === 'string' ? s : (s?.skill_name || s?.name || '')).toLowerCase().includes(query));

    const matchesRole = 
      selectedRoleFilter === 'All' || 
      (job.workType || job.work_mode || '').toLowerCase() === selectedRoleFilter.toLowerCase();

    return matchesSearch && matchesRole;
  });

  return (
    <div className="job-matching-wrapper">
      {/* AI Matching Engine Header Banner */}
      <div className="card matching-banner-card">
        <div className="banner-top-row">
          <div className="badge badge-accent">
            <Sparkles size={13} /> Neural Match Matrix Engine
          </div>
          <span className="live-jobs-count">
            {isLoading ? 'Scanning roles...' : `${jobMatchesList.length} Active Positions Evaluated`}
          </span>
        </div>

        <div className="matrix-overview-grid">
          <div className="candidate-skills-box">
            <span className="box-label">CANDIDATE CAPABILITIES ({skills.length})</span>
            <div className="matrix-tags-flex">
              {Array.isArray(skills) && skills.length > 0 ? (
                skills.map((s, sIdx) => {
                  const sName = typeof s === 'string' ? s : (s?.skill_name || s?.name || s?.skill || '');
                  if (!sName) return null;
                  return (
                    <span key={s.id || sIdx} className="badge badge-accent">
                      ✓ {sName}
                    </span>
                  );
                })
              ) : (
                <span className="text-muted text-sm">No skills recorded yet.</span>
              )}
            </div>
          </div>

          <div className="matrix-arrow-box">
            <div className="pulse-arrow-icon">
              <Sparkles size={22} className="text-accent" />
            </div>
            <span className="matrix-label">AI MATCH SCORE MATRIX</span>
          </div>

          <div className="target-profile-box">
            <span className="box-label">CURRENT EVALUATION ROLE</span>
            <h3 className="target-role-name">{targetRole}</h3>
            <span className="target-location">{targetLocation}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="matching-filter-bar">
        <div className="search-input-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Filter roles by title, keyword, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field with-icon"
          />
        </div>

        <div className="filter-pills-row">
          <SlidersHorizontal size={16} className="text-muted" />
          {['All', 'Remote', 'Hybrid', 'On-site'].map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedRoleFilter(filter)}
              className={`filter-btn ${selectedRoleFilter === filter ? 'active' : ''}`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Job Cards Grid */}
      <div className="jobs-matrix-grid">
        {isLoading ? (
          <>
            <JobCardSkeleton />
            <JobCardSkeleton />
            <JobCardSkeleton />
          </>
        ) : error ? (
          <div className="empty-state-card card full-width-empty">
            <AlertCircle size={36} className="text-warning" />
            <h3>{error}</h3>
            <p>Please check your network connection and verify database state.</p>
            <button onClick={fetchMatches} className="btn btn-secondary btn-sm mt-2">
              <RefreshCw size={14} />
              <span>Try again</span>
            </button>
          </div>
        ) : filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))
        ) : (
          <div className="empty-state-card card full-width-empty">
            <AlertCircle size={36} className="text-warning" />
            <h3>No strong matches yet</h3>
            <p>Complete your profile or add more skills to improve your job matches.</p>
            <Link to="/profile" className="btn btn-primary btn-sm mt-2">
              <span>Update Profile</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobMatching;
