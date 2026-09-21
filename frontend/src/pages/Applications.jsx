import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { jobsAPI } from '../services/api';
import {
  Briefcase,
  Search,
  Filter,
  Calendar,
  Building2,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  FileText,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import './Applications.css';

export const Applications = () => {
  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchApplications = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await jobsAPI.getApplications();
      setApplications(res.applications || []);
    } catch (err) {
      console.error('Failed to load applications:', err);
      setError(err.message || 'Unable to load applications from database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('offer') || s.includes('hired')) return 'status-badge-offer';
    if (s.includes('interview')) return 'status-badge-interview';
    if (s.includes('screen')) return 'status-badge-screening';
    if (s.includes('reject')) return 'status-badge-rejected';
    return 'status-badge-applied';
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !query ||
      (app.title || '').toLowerCase().includes(query) ||
      (app.company || '').toLowerCase().includes(query) ||
      (app.location || '').toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === 'All' ||
      (app.status || '').toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const statusCounts = applications.reduce((acc, app) => {
    const st = app.status || 'Applied';
    acc[st] = (acc[st] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="applications-page-container">
      {/* Page Header */}
      <div className="applications-header-card">
        <div className="header-top-row">
          <div className="badge badge-accent">
            <Briefcase size={14} />
            <span>APPLICATION INTELLIGENCE TRACKER</span>
          </div>
          <span className="live-status-pill">{applications.length} Requisitions Active</span>
        </div>
        <h1 className="banner-heading">Track & Manage Your Job Applications</h1>
        <p className="banner-sub">
          Real-time synchronization with employer requisition databases. Monitor candidate screening, technical interviews, and offer letters.
        </p>

        {/* Metrics Summary Strip */}
        <div className="applications-metrics-strip">
          <div className="app-metric-box">
            <span className="metric-num">{applications.length}</span>
            <span className="metric-lbl">Total Applied</span>
          </div>
          <div className="app-metric-box">
            <span className="metric-num text-primary">
              {(statusCounts['Interview'] || 0) + (statusCounts['Screening'] || 0)}
            </span>
            <span className="metric-lbl">In Progress</span>
          </div>
          <div className="app-metric-box">
            <span className="metric-num text-success">{statusCounts['Offer'] || 0}</span>
            <span className="metric-lbl">Offers Received</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="applications-filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by job title, company, or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field with-icon"
          />
        </div>

        <div className="status-pills-row">
          {['All', 'Applied', 'Screening', 'Interview', 'Offer', 'Rejected'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`filter-pill-btn ${statusFilter === status ? 'active' : ''}`}
            >
              {status}
              {status !== 'All' && statusCounts[status] ? (
                <span className="pill-count">{statusCounts[status]}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Content Stream */}
      <div className="applications-list-wrapper">
        {isLoading ? (
          <div className="applications-skeleton-stack">
            {[1, 2, 3].map((i) => (
              <div key={i} className="app-card-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div className="card empty-state-card text-center">
            <AlertCircle size={40} className="text-warning mb-2" />
            <h3>Failed to load applications</h3>
            <p className="text-muted">{error}</p>
            <button onClick={fetchApplications} className="btn btn-secondary btn-sm mt-3">
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className="card empty-state-card text-center">
            <Briefcase size={44} className="text-muted mb-2" />
            <h3>No applications found</h3>
            <p className="text-muted">
              {searchTerm || statusFilter !== 'All'
                ? 'No applications match your search or filter criteria.'
                : 'You have not submitted any applications yet. Explore matched roles to start applying.'}
            </p>
            <Link to="/job-matching" className="btn btn-primary btn-sm mt-3">
              <Sparkles size={14} />
              <span>Explore Matched Jobs</span>
            </Link>
          </div>
        ) : (
          <div className="applications-grid">
            {filteredApplications.map((app) => (
              <div key={app.id || app.application_id} className="card application-item-card">
                <div className="app-item-main">
                  <div className="app-item-header">
                    <div>
                      <h3 className="app-job-title">{app.title}</h3>
                      <div className="app-company-meta">
                        <Building2 size={14} className="text-muted" />
                        <span className="app-company-name">{app.company}</span>
                        <span className="meta-bullet">•</span>
                        <MapPin size={14} className="text-muted" />
                        <span>{app.location || 'Remote'}</span>
                      </div>
                    </div>
                    <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                      {app.status || 'Applied'}
                    </span>
                  </div>

                  <div className="app-item-footer">
                    <div className="app-date-meta">
                      <Calendar size={13} className="text-muted" />
                      <span>Applied on {app.applied_at ? new Date(app.applied_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}</span>
                      {app.salary && (
                        <>
                          <span className="meta-bullet">•</span>
                          <span className="app-salary-tag">{app.salary}</span>
                        </>
                      )}
                    </div>

                    <div className="app-actions-row">
                      <Link to={`/jobs/${app.job_id || app.id}`} className="btn btn-outline btn-xs">
                        <span>View Job Requisition</span>
                        <ChevronRight size={13} />
                      </Link>
                      <Link to="/interview" className="btn btn-accent btn-xs">
                        <Sparkles size={12} />
                        <span>Prep Interview</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Applications;
