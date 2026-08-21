import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCareer } from '../context/CareerContext';
import { dashboardAPI, jobsAPI } from '../services/api';
import { getUserDisplayName } from '../utils/userHelpers';
import {
  Sparkles,
  TrendingUp,
  Briefcase,
  Target,
  Award,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
  MessageSquareCode,
  RefreshCw,
  Clock,
  Check,
  ExternalLink,
  Plus
} from 'lucide-react';
import './Dashboard.css';

// SVG Activity Chart Component with smooth SVG path and bars
const CareerActivityChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="chart-loading-state">
        <RefreshCw size={20} className="animate-spin text-primary" />
        <span>Loading career activity telemetry...</span>
      </div>
    );
  }

  if (!data || !data.has_data || !data.labels || data.labels.length === 0) {
    return (
      <div className="chart-empty-state">
        <TrendingUp size={32} className="text-muted" />
        <p className="empty-title">No activity data yet</p>
        <p className="empty-sub">Activity will populate as you evaluate job matches and submit applications.</p>
      </div>
    );
  }

  const { labels, matches, applications } = data;
  const maxVal = Math.max(...matches, ...applications, 10);
  const chartHeight = 180;
  const chartWidth = 580;
  const paddingX = 40;
  const paddingY = 20;

  const stepX = (chartWidth - paddingX * 2) / Math.max(labels.length - 1, 1);

  // Generate SVG points for matches curve
  const points = matches.map((val, idx) => {
    const x = paddingX + idx * stepX;
    const y = chartHeight - paddingY - (val / maxVal) * (chartHeight - paddingY * 2);
    return { x, y, val };
  });

  const pathD = points.reduce((acc, pt, idx, arr) => {
    if (idx === 0) return `M ${pt.x} ${pt.y}`;
    const prev = arr[idx - 1];
    const cpX = (prev.x + pt.x) / 2;
    return `${acc} C ${cpX} ${prev.y}, ${cpX} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`;

  return (
    <div className="activity-chart-wrapper">
      <div className="chart-legend-row">
        <div className="legend-item">
          <span className="legend-dot blue" />
          <span>Job Matches Evaluated</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot purple" />
          <span>Applications Submitted</span>
        </div>
      </div>

      <div className="svg-container">
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="activity-svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="matchesGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#243BFF" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#243BFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={paddingX} y1={chartHeight / 2} x2={chartWidth - paddingX} y2={chartHeight / 2} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
          <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="#E2E8F0" strokeWidth="1" />

          {/* Area Fill */}
          <path d={areaD} fill="url(#matchesGradient)" />

          {/* Application Bars */}
          {applications.map((appCount, idx) => {
            if (appCount === 0) return null;
            const x = paddingX + idx * stepX - 8;
            const barH = (appCount / maxVal) * (chartHeight - paddingY * 2);
            const y = chartHeight - paddingY - barH;
            return (
              <rect
                key={idx}
                x={x}
                y={y}
                width="16"
                height={barH}
                rx="4"
                fill="#7C5CFF"
                opacity="0.85"
              />
            );
          })}

          {/* Match Score Line */}
          <path d={pathD} fill="none" stroke="#243BFF" strokeWidth="2.5" strokeLinecap="round" />

          {/* Points */}
          {points.map((pt, idx) => (
            <g key={idx} className="chart-node">
              <circle cx={pt.x} cy={pt.y} r="4.5" fill="#FFFFFF" stroke="#243BFF" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="chart-labels-row">
        {labels.map((lbl, idx) => (
          <span key={idx} className="x-label">{lbl}</span>
        ))}
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const { profile } = useCareer();
  const navigate = useNavigate();

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState(null);
  const [timeframe, setTimeframe] = useState('30d');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState(null);

  const fetchDashboardData = useCallback(async (selectedTimeframe = timeframe, isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const data = await dashboardAPI.getSummary(selectedTimeframe);
      if (data && data.success) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [timeframe]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData(timeframe);
    }
  }, [isAuthenticated, timeframe, fetchDashboardData]);

  // Quick Apply Handler
  const handleQuickApply = async (jobId) => {
    setApplyingJobId(jobId);
    try {
      await jobsAPI.applyToJob(jobId);
      // Refresh summary to reflect new application count
      fetchDashboardData(timeframe, true);
    } catch (err) {
      console.error('Quick apply failed:', err);
    } finally {
      setApplyingJobId(null);
    }
  };

  const displayName = getUserDisplayName(user, profile);
  const metrics = dashboardData?.metrics || {
    readiness_score: 75,
    readiness_change: '+4.8% this month',
    job_matches_count: 0,
    total_active_jobs: 0,
    applications_count: 0,
    skill_coverage_pct: 0
  };

  const topJobMatches = dashboardData?.top_job_matches || [];
  const skillGaps = dashboardData?.skill_gaps || [];
  const recentActivity = dashboardData?.recent_activity || [];
  const chartData = dashboardData?.chart_data;

  return (
    <div className="saas-dashboard-container">
      {/* 1. TOP GREETING & TELEMETRY HEADER */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-text-group">
          <h1 className="welcome-heading">Welcome back, {displayName}</h1>
          <p className="welcome-subtext">
            Here is your real-time career intelligence, active match matrix, and skill trajectory.
          </p>
        </div>

        <div className="welcome-actions">
          <div className="system-live-pill">
            <span className="live-pulse-dot" />
            <span>AI Telemetry Active</span>
          </div>

          <button
            type="button"
            onClick={() => fetchDashboardData(timeframe, true)}
            disabled={isRefreshing}
            className="btn-refresh-dashboard"
            title="Refresh telemetry"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Updating...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS ROW (4 CARDS) */}
      <div className="kpi-cards-grid">
        {/* Card 1: Career Readiness */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Career Readiness</span>
            <div className="kpi-icon-wrap blue">
              <Sparkles size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{isLoading ? '--' : `${metrics.readiness_score}%`}</span>
            <div className="kpi-trend-pill positive">
              <TrendingUp size={12} />
              <span>{metrics.readiness_change}</span>
            </div>
          </div>
          <span className="kpi-subtext">Calibrated from profile & ATS analysis</span>
        </div>

        {/* Card 2: Active Job Matches */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Active Job Matches</span>
            <div className="kpi-icon-wrap purple">
              <Briefcase size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{isLoading ? '--' : metrics.job_matches_count}</span>
            <span className="kpi-badge-live">Live Matrix</span>
          </div>
          <span className="kpi-subtext">{metrics.total_active_jobs} total active requisitions</span>
        </div>

        {/* Card 3: Submitted Applications */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Applications</span>
            <div className="kpi-icon-wrap green">
              <Target size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{isLoading ? '--' : metrics.applications_count}</span>
            <span className="kpi-badge-neutral">Submitted</span>
          </div>
          <span className="kpi-subtext">Direct submissions to active roles</span>
        </div>

        {/* Card 4: Skill Coverage */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-card-label">Skill Coverage</span>
            <div className="kpi-icon-wrap dark">
              <Award size={16} />
            </div>
          </div>
          <div className="kpi-value-row">
            <span className="kpi-main-number">{isLoading ? '--' : `${metrics.skill_coverage_pct}%`}</span>
            <span className="kpi-badge-coverage">Market Fit</span>
          </div>
          <div className="kpi-progress-bar">
            <div
              className="kpi-progress-fill"
              style={{ width: `${Math.min(100, metrics.skill_coverage_pct || 0)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. MAIN ANALYTICS SECTION: "Career Activity" CHART */}
      <div className="dashboard-card chart-section-card">
        <div className="card-header-flex">
          <div>
            <h3 className="card-title">Career Activity</h3>
            <p className="card-subtitle">Telemetry of evaluated matches and direct applications over time</p>
          </div>

          {/* Timeframe selector tabs */}
          <div className="timeframe-tabs">
            {[
              { key: '7d', label: '7 Days' },
              { key: '30d', label: '30 Days' },
              { key: '90d', label: '3 Months' },
              { key: '1y', label: '1 Year' }
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setTimeframe(tab.key)}
                className={`timeframe-tab-btn ${timeframe === tab.key ? 'active' : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <CareerActivityChart data={chartData} loading={isLoading} />
      </div>

      {/* 4. TWO-COLUMN GRID: Top Job Matches & Skill Gap Overview */}
      <div className="dashboard-split-grid">
        {/* LEFT COLUMN: Top Job Matches */}
        <div className="dashboard-card flex-col">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Top Job Matches</h3>
              <p className="card-subtitle">Highest alignment active requisitions</p>
            </div>
            <Link to="/job-matching" className="card-action-link">
              <span>View All ({metrics.job_matches_count})</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="matches-list-stack">
            {isLoading ? (
              <div className="list-skeleton-box">
                <div className="skeleton-line full" />
                <div className="skeleton-line mid" />
                <div className="skeleton-line full" />
              </div>
            ) : topJobMatches.length > 0 ? (
              topJobMatches.map(job => (
                <div key={job.id} className="top-job-item">
                  <div className="job-item-header">
                    <div className="job-meta-left">
                      <h4 className="job-item-title">{job.title}</h4>
                      <span className="job-item-company">
                        {job.company} • {job.location} ({job.work_mode || 'Hybrid'})
                      </span>
                    </div>
                    <div className="match-pill-badge">
                      <Sparkles size={11} />
                      <span>{job.matchPercentage}% Match</span>
                    </div>
                  </div>

                  {/* Skills tags */}
                  <div className="job-item-skills">
                    {job.matchingSkills?.slice(0, 3).map((sk, sIdx) => (
                      <span key={sIdx} className="job-skill-chip match">✓ {sk}</span>
                    ))}
                    {job.missingSkills?.slice(0, 2).map((sk, sIdx) => (
                      <span key={sIdx} className="job-skill-chip gap">! {sk}</span>
                    ))}
                  </div>

                  <div className="job-item-footer">
                    <span className="job-salary-tag">{job.salary}</span>
                    <div className="job-actions-row">
                      <Link to="/job-matching" className="btn-details-link">
                        <span>Details</span>
                      </Link>
                      {job.applied ? (
                        <span className="applied-status-badge">
                          <Check size={12} /> Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuickApply(job.id)}
                          disabled={applyingJobId === job.id}
                          className="btn-quick-apply"
                        >
                          {applyingJobId === job.id ? 'Applying...' : 'Quick Apply'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel-box">
                <Briefcase size={28} className="text-muted" />
                <p>No active job matches found</p>
                <Link to="/profile" className="btn-inline-link">Update your profile skills</Link>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Skill Gap Overview */}
        <div className="dashboard-card flex-col">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Skill Gap Overview</h3>
              <p className="card-subtitle">Key proficiencies to maximize match rate</p>
            </div>
            <Link to="/skill-gaps" className="card-action-link">
              <span>Diagnostics</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="skill-gaps-list">
            {isLoading ? (
              <div className="list-skeleton-box">
                <div className="skeleton-line full" />
                <div className="skeleton-line mid" />
                <div className="skeleton-line full" />
              </div>
            ) : skillGaps.length > 0 ? (
              skillGaps.map((gap, gIdx) => (
                <div key={gap.id || gIdx} className="skill-gap-row">
                  <div className="gap-info-line">
                    <span className="gap-skill-name">{gap.skill_name}</span>
                    <span className={`gap-priority-pill ${gap.priority.toLowerCase()}`}>
                      {gap.priority}
                    </span>
                  </div>
                  <div className="gap-progress-track">
                    <div
                      className="gap-progress-fill"
                      style={{ width: `${gap.proficiency_pct || 65}%` }}
                    />
                  </div>
                  <div className="gap-footer-meta">
                    <span>Target: {gap.target_level || 'Intermediate'}</span>
                    <span>Affects {gap.jobs_affected || 2} active roles</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel-box">
                <CheckCircle2 size={28} className="text-green" />
                <p>No high-priority skill gaps identified!</p>
                <span className="text-muted text-xs">Your skill coverage matches target requirements well.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. TWO-COLUMN GRID: Recent Activity & Quick Actions */}
      <div className="dashboard-split-grid">
        {/* LEFT: Recent Activity Timeline */}
        <div className="dashboard-card flex-col">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Recent Activity</h3>
              <p className="card-subtitle">Real-time candidate telemetry log</p>
            </div>
          </div>

          <div className="activity-timeline-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((ev) => (
                <div key={ev.id} className="timeline-item">
                  <div className={`timeline-icon-dot ${ev.type || 'generic'}`}>
                    {ev.type === 'application' && <Target size={12} />}
                    {ev.type === 'resume' && <FileText size={12} />}
                    {ev.type === 'skill' && <Award size={12} />}
                    {ev.type === 'ai' && <Sparkles size={12} />}
                  </div>
                  <div className="timeline-content">
                    <div className="timeline-title-row">
                      <span className="timeline-event-title">{ev.title}</span>
                      <span className="timeline-event-time">{ev.time_ago}</span>
                    </div>
                    <p className="timeline-event-desc">{ev.description}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-panel-box">
                <Clock size={24} className="text-muted" />
                <p>No recent activity recorded</p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Quick Actions */}
        <div className="dashboard-card flex-col">
          <div className="card-header-flex">
            <div>
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Jump straight into your career workspace</p>
            </div>
          </div>

          <div className="quick-actions-grid">
            <Link to="/resume-maker" className="quick-action-card">
              <div className="quick-action-icon blue">
                <FileText size={18} />
              </div>
              <div className="quick-action-info">
                <h4>Build ATS Resume</h4>
                <p>Create & optimize machine-readable resume</p>
              </div>
              <ArrowRight size={14} className="action-arrow" />
            </Link>

            <Link to="/resume-analysis" className="quick-action-card">
              <div className="quick-action-icon purple">
                <Target size={18} />
              </div>
              <div className="quick-action-info">
                <h4>Resume Analysis</h4>
                <p>Deep ATS calibration & feedback</p>
              </div>
              <ArrowRight size={14} className="action-arrow" />
            </Link>

            <Link to="/job-matching" className="quick-action-card">
              <div className="quick-action-icon green">
                <Briefcase size={18} />
              </div>
              <div className="quick-action-info">
                <h4>Job Compatibility</h4>
                <p>Find top positions matching your skillset</p>
              </div>
              <ArrowRight size={14} className="action-arrow" />
            </Link>

            <Link to="/assistant" className="quick-action-card">
              <div className="quick-action-icon dark">
                <MessageSquareCode size={18} />
              </div>
              <div className="quick-action-info">
                <h4>AI Career Co-Pilot</h4>
                <p>Ask strategic interview & salary questions</p>
              </div>
              <ArrowRight size={14} className="action-arrow" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
