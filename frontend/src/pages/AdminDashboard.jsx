import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI } from '../services/api';
import {
  Users,
  Briefcase,
  BrainCircuit,
  Award,
  LogOut,
  Sparkles,
  TrendingUp,
  Search,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  BarChart3,
  FileText,
  ShieldCheck,
  Plus,
  Trash2,
  Edit3,
  X,
  Eye,
  Activity,
  ChevronLeft,
  ChevronRight,
  Clock,
  ShieldAlert,
  Download,
  RefreshCw,
  MoreHorizontal
} from 'lucide-react';
import './AdminDashboard.css';

// Readiness visual indicator
const ReadinessIndicator = ({ score }) => {
  const getFillColor = (s) => {
    if (s >= 80) return '#10B981'; // green
    if (s >= 65) return '#1E22FF'; // electric blue
    if (s >= 40) return '#F59E0B'; // orange
    return '#EF4444'; // red
  };

  return (
    <div className="readiness-bar-container">
      <span className="readiness-val">{score}%</span>
      <div className="readiness-bar-bg">
        <div 
          className="readiness-bar-fill" 
          style={{ 
            width: `${score}%`, 
            backgroundColor: getFillColor(score) 
          }} 
        />
      </div>
    </div>
  );
};

// Deterministic initials avatar + broken img fallback handler
const UserAvatar = ({ fullName, avatarUrl, size = 32 }) => {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <img 
        src={avatarUrl} 
        alt={fullName} 
        className="admin-avatar" 
        onError={() => setImgError(true)} 
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    );
  }

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'C';

  return (
    <div 
      className="cand-avatar" 
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '50%', 
        backgroundColor: '#EEF2FF', 
        color: '#1E22FF', 
        display: 'flex', 
        alignItems: 'center', 
        justify: 'center', 
        fontSize: size * 0.4, 
        fontWeight: 'bold' 
      }}
    >
      {initials}
    </div>
  );
};

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { adminUser, isAdminAuthenticated, adminLogout } = useAuth();

  const [activeTab, setActiveTab] = useState('Overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Stats & Dashboard
  const [metrics, setMetrics] = useState({
    total_candidates: 0,
    active_candidates: 0,
    verified_candidates: 0,
    unverified_candidates: 0,
    profiles_completed: 0,
    resumes_uploaded: 0,
    resumes_analyzed: 0,
    ai_analyses_run: 0,
    active_jobs: 0,
    total_matches: 0,
    average_readiness: 0,
    ai_usage: { requests: 0, successful: 0, failed: 0, average_response_time_ms: 0, total_tokens: 0 }
  });
  const [recentCandidates, setRecentCandidates] = useState([]);

  // Candidate Talent Directory Filters & Paginations
  const [candidatesList, setCandidatesList] = useState([]);
  const [loadingCandidates, setLoadingCandidates] = useState(true);
  const [candidatesError, setCandidatesError] = useState(null);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCandidatesCount, setTotalCandidatesCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState('all');
  const [readinessFilter, setReadinessFilter] = useState('all');
  const [resumeFilter, setResumeFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Dossier & Drawer details
  const [selectedCandidateDossier, setSelectedCandidateDossier] = useState(null);
  const [candidateProfileTab, setCandidateProfileTab] = useState('Overview');
  const [reanalyzingResumeId, setReanalyzingResumeId] = useState(null);
  const [dossierMessage, setDossierMessage] = useState('');

  // Requisitions & Jobs management
  const [jobsList, setJobsList] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    department: 'Engineering',
    location: 'Bengaluru, KA',
    work_mode: 'Remote',
    salary: '₹14,00,000 - ₹18,00,000 LPA',
    description: '',
    required_skills: 'React, TypeScript, CSS3, JavaScript',
    status: 'Active'
  });

  // Audit timeline details
  const [auditLogsList, setAuditLogsList] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [auditPage, setAuditPage] = useState(1);
  const [totalAuditPages, setTotalAuditPages] = useState(1);

  // General loader
  const [loading, setLoading] = useState(false);

  // Search input debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchTerm(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Auth Guard & initialization
  useEffect(() => {
    if (!isAdminAuthenticated) {
      navigate('/admin/login');
      return;
    }
    loadDashboardMetrics();
  }, [isAdminAuthenticated, navigate]);

  // Tab switching fetch routers
  useEffect(() => {
    if (!isAdminAuthenticated) return;
    if (activeTab === 'Overview') {
      loadDashboardMetrics();
    } else if (activeTab === 'Candidates') {
      loadCandidatesList();
    } else if (activeTab === 'Jobs') {
      loadJobsList();
    } else if (activeTab === 'Audit') {
      loadAuditTimeline();
    }
  }, [activeTab, page, statusFilter, readinessFilter, resumeFilter, skillFilter, sortBy, sortOrder, searchTerm, auditPage]);

  // Statistics loader
  const loadDashboardMetrics = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getDashboard();
      if (res.metrics) setMetrics(res.metrics);
      if (res.recent_candidates) setRecentCandidates(res.recent_candidates);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  // Candidates list loader
  const loadCandidatesList = async () => {
    setLoadingCandidates(true);
    setCandidatesError(null);
    try {
      const res = await adminAPI.getCandidates({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        readiness: readinessFilter,
        resume_status: resumeFilter,
        skills: skillFilter,
        sort_by: sortBy,
        sort_order: sortOrder
      });
      setCandidatesList(res.candidates || []);
      if (res.pagination) {
        setTotalPages(res.pagination.pages || 1);
        setTotalCandidatesCount(res.pagination.total || 0);
      }
    } catch (err) {
      setCandidatesError('Failed to fetch talent directory records.');
    } finally {
      setLoadingCandidates(false);
    }
  };

  // Jobs requisitions list loader
  const loadJobsList = async () => {
    setLoadingJobs(true);
    try {
      const res = await adminAPI.getJobs();
      setJobsList(res.jobs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingJobs(false);
    }
  };

  // Audit logs timeline loader
  const loadAuditTimeline = async () => {
    setLoadingAudit(true);
    try {
      const res = await adminAPI.getAuditLogs({ page: auditPage, limit: 12 });
      setAuditLogsList(res.logs || []);
      if (res.pagination) {
        setTotalAuditPages(res.pagination.pages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  // Open Dossier Drawer
  const handleOpenCandidateDossier = async (candidateId) => {
    setDossierMessage('');
    try {
      const data = await adminAPI.getCandidateDetail(candidateId);
      setSelectedCandidateDossier(data);
      setCandidateProfileTab('Overview');
    } catch (err) {
      alert('Could not retrieve candidate dossier details.');
    }
  };

  // Toggle active/inactive candidate status
  const handleToggleCandidateStatus = async (candidateId, currentStatus) => {
    try {
      await adminAPI.toggleCandidateStatus(candidateId, !currentStatus);
      if (activeTab === 'Candidates') loadCandidatesList();
      if (selectedCandidateDossier?.user?.id === candidateId) {
        setSelectedCandidateDossier((prev) => ({
          ...prev,
          user: { ...prev.user, is_active: !currentStatus }
        }));
      }
    } catch (err) {
      alert('Failed to change status.');
    }
  };

  // Create Job Posting
  const handleCreateJob = async (e) => {
    e.preventDefault();
    if (!jobForm.title || !jobForm.company || !jobForm.description) return;

    try {
      await adminAPI.createJob({
        ...jobForm,
        required_skills: jobForm.required_skills.split(',').map((s) => s.trim())
      });
      setShowJobModal(false);
      resetJobForm();
      await loadJobsList();
    } catch (err) {
      alert(err.message || 'Failed to post requisition.');
    }
  };

  // Update Job Posting
  const handleUpdateJob = async (e) => {
    e.preventDefault();
    if (!editingJob || !jobForm.title || !jobForm.company || !jobForm.description) return;

    try {
      await adminAPI.updateJob(editingJob.id, {
        ...jobForm,
        required_skills: jobForm.required_skills.split(',').map((s) => s.trim())
      });
      setEditingJob(null);
      resetJobForm();
      await loadJobsList();
    } catch (err) {
      alert(err.message || 'Failed to update requisition.');
    }
  };

  // Soft-archive Job Posting
  const handleArchiveJob = async (jobId) => {
    if (!window.confirm('Are you sure you want to Archive this requisition? This preserves matching references.')) return;
    try {
      await adminAPI.deleteJob(jobId);
      await loadJobsList();
    } catch (err) {
      alert(err.message || 'Failed to archive job.');
    }
  };

  // Trigger Reanalyze Resume
  const handleReanalyzeResume = async (resumeId, candidateId) => {
    setReanalyzingResumeId(resumeId);
    setDossierMessage('');
    try {
      const res = await adminAPI.reanalyzeResume(resumeId);
      setDossierMessage(res.message || 'Re-analysis parsing complete.');
      // Refresh dossier data
      const data = await adminAPI.getCandidateDetail(candidateId);
      setSelectedCandidateDossier(data);
    } catch (err) {
      setDossierMessage(err.message || 'Re-analysis parsing failed.');
    } finally {
      setReanalyzingResumeId(null);
    }
  };

  // Trigger Download Resume PDF
  const handleDownloadResume = (resumeId) => {
    window.open(`/api/admin/resumes/${resumeId}/download`, '_blank');
  };

  const resetJobForm = () => {
    setJobForm({
      title: '',
      company: '',
      department: 'Engineering',
      location: 'Bengaluru, KA',
      work_mode: 'Remote',
      salary: '₹14,00,000 - ₹18,00,000 LPA',
      description: '',
      required_skills: 'React, TypeScript, CSS3, JavaScript',
      status: 'Active'
    });
  };

  const handleEditJobClick = (job) => {
    setEditingJob(job);
    setJobForm({
      title: job.title || '',
      company: job.company || '',
      department: job.department || 'Engineering',
      location: job.location || 'Remote',
      work_mode: job.work_mode || 'Hybrid',
      salary: job.salary || 'Competitive',
      description: job.description || '',
      required_skills: (job.required_skills || []).join(', '),
      status: job.status || (job.is_active ? 'Active' : 'Paused')
    });
  };

  return (
    <div className="admin-layout">
      {/* ==================== ADMIN SIDEBAR ==================== */}
      <aside className="admin-sidebar">
        <a href="/admin" className="sidebar-logo">
          <span className="logo-dot" />
          <span className="logo-text">CONTROL ROOM</span>
        </a>

        <div className="sidebar-section-title">OVERVIEW</div>
        <div className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('Overview')} 
            className={`sidebar-item ${activeTab === 'Overview' ? 'active' : ''}`}
          >
            <BarChart3 size={16} className="sidebar-icon" />
            <span>Dashboard</span>
          </button>
        </div>

        <div className="sidebar-section-title">TALENT</div>
        <div className="sidebar-menu">
          <button 
            onClick={() => { setActiveTab('Candidates'); setPage(1); }} 
            className={`sidebar-item ${activeTab === 'Candidates' ? 'active' : ''}`}
          >
            <Users size={16} className="sidebar-icon" />
            <span>Candidates</span>
          </button>
        </div>

        <div className="sidebar-section-title">RECRUITMENT</div>
        <div className="sidebar-menu">
          <button 
            onClick={() => setActiveTab('Jobs')} 
            className={`sidebar-item ${activeTab === 'Jobs' ? 'active' : ''}`}
          >
            <Briefcase size={16} className="sidebar-icon" />
            <span>Jobs / Requisitions</span>
          </button>
        </div>

        <div className="sidebar-section-title">SYSTEM</div>
        <div className="sidebar-menu">
          <button 
            onClick={() => { setActiveTab('Audit'); setAuditPage(1); }} 
            className={`sidebar-item ${activeTab === 'Audit' ? 'active' : ''}`}
          >
            <Clock size={16} className="sidebar-icon" />
            <span>Audit Trail</span>
          </button>
        </div>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button onClick={adminLogout} className="sidebar-item text-danger">
            <LogOut size={16} className="sidebar-icon" />
            <span>Exit Session</span>
          </button>
        </div>
      </aside>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="admin-main">
        {/* ==================== HEADER ==================== */}
        <header className="admin-header-bar">
          <div className="admin-header-title-box">
            <h1>Talent Agent AI</h1>
            <p>Enterprise recruitment control room</p>
          </div>

          <div className="admin-global-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search candidate name, email, target role, skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input"
            />
          </div>

          <div className="admin-user-profile">
            <UserAvatar fullName={adminUser?.full_name || 'Administrator'} size={32} />
            <div className="admin-info">
              <span className="admin-name">{adminUser?.full_name || 'System Admin'}</span>
              <span className="admin-role">Super Administrator</span>
            </div>
          </div>
        </header>

        {/* ==================== MAIN PANEL CONTAINER ==================== */}
        <div className="admin-container">
          
          {/* ==================== TAB 1: OVERVIEW ==================== */}
          {activeTab === 'Overview' && (
            <div className="admin-content-stack">
              <div className="tab-heading-row">
                <h2>Dashboard Overview</h2>
                <p>Real-time platform activity metrics calculated directly from records</p>
              </div>

              {/* Stats Card Grid */}
              <div className="admin-stats-grid">
                <div className="admin-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Total Candidates</span>
                    <div className="stat-icon-circle"><Users size={16} /></div>
                  </div>
                  <span className="stat-val">{metrics.total_candidates}</span>
                  <span className="stat-trend">★ Database Driven</span>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Active Users</span>
                    <div className="stat-icon-circle"><Activity size={16} /></div>
                  </div>
                  <span className="stat-val">{metrics.active_candidates}</span>
                  <span className="stat-trend text-primary">★ Platform verified</span>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Resumes Analyzed</span>
                    <div className="stat-icon-circle"><FileText size={16} /></div>
                  </div>
                  <span className="stat-val">{metrics.resumes_analyzed}</span>
                  <span className="stat-trend">★ ATS Parsed</span>
                </div>

                <div className="admin-stat-card">
                  <div className="stat-header">
                    <span className="stat-label">Avg Readiness Score</span>
                    <div className="stat-icon-circle"><BrainCircuit size={16} /></div>
                  </div>
                  <span className="stat-val">{metrics.average_readiness}%</span>
                  <span className="stat-trend text-warning">★ AI readiness average</span>
                </div>
              </div>

              <div className="admin-charts-grid">
                {/* AI telemetry card */}
                <div className="admin-system-card">
                  <h3>AI Integration Telemetry</h3>
                  <div className="telemetry-list">
                    <div className="telemetry-item">
                      <span className="tel-label">Total API Calls:</span>
                      <span className="tel-val">{metrics.ai_usage?.requests || 0}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">Successful Calls:</span>
                      <span className="tel-val text-success">{metrics.ai_usage?.successful || 0}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">Failed/Rate Limited:</span>
                      <span className="tel-val text-danger">{metrics.ai_usage?.failed || 0}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">Total Tokens Utilized:</span>
                      <span className="tel-val">{metrics.ai_usage?.total_tokens || 0}</span>
                    </div>
                  </div>
                </div>

                {/* Platform Status */}
                <div className="admin-system-card">
                  <h3>Active Recruitment Funnel</h3>
                  <div className="telemetry-list">
                    <div className="telemetry-item">
                      <span className="tel-label">Live Job Postings:</span>
                      <span className="tel-val">{metrics.active_jobs}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">Profiles &gt;= 80% Complete:</span>
                      <span className="tel-val">{metrics.profiles_completed}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">Matches Evaluated:</span>
                      <span className="tel-val">{metrics.total_matches}</span>
                    </div>
                    <div className="telemetry-item">
                      <span className="tel-label">AI Analyses Generated:</span>
                      <span className="tel-val">{metrics.ai_analyses_run}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent candidates registrations */}
              <div className="card admin-table-card">
                <h3>Recent Candidate Signups</h3>
                <div className="table-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Preferred Role</th>
                        <th>Verification status</th>
                        <th>Created Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentCandidates.length > 0 ? (
                        recentCandidates.map((c) => (
                          <tr key={c.id}>
                            <td className="font-bold">{c.full_name}</td>
                            <td className="text-muted">{c.email}</td>
                            <td>{c.preferred_role || 'General Engineering'}</td>
                            <td>
                              {c.email_verified ? (
                                <span className="badge badge-active">Verified ✓</span>
                              ) : (
                                <span className="badge badge-inactive">Unverified</span>
                              )}
                            </td>
                            <td className="text-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-muted">No candidates registered yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 2: CANDIDATES ==================== */}
          {activeTab === 'Candidates' && (
            <div className="admin-content-stack">
              <div className="tab-heading-row">
                <h2>Talent Pool Directory</h2>
                <p>Search, filter, and review details and parsed resumes of candidate profiles</p>
              </div>

              {/* Table Filters Box */}
              <div className="table-filters-row">
                <select 
                  value={statusFilter} 
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} 
                  className="filter-select"
                >
                  <option value="all">All Accounts Status</option>
                  <option value="active">Active Accounts</option>
                  <option value="inactive">Inactive Accounts</option>
                  <option value="verified">Verified Emails</option>
                  <option value="unverified">Unverified Emails</option>
                </select>

                <select 
                  value={readinessFilter} 
                  onChange={(e) => { setReadinessFilter(e.target.value); setPage(1); }} 
                  className="filter-select"
                >
                  <option value="all">All Readiness Levels</option>
                  <option value="80-100">High (80 - 100%)</option>
                  <option value="60-79">Medium (60 - 79%)</option>
                  <option value="40-59">Low (40 - 59%)</option>
                  <option value="0-39">Needs Improvement (&lt; 40%)</option>
                </select>

                <select 
                  value={resumeFilter} 
                  onChange={(e) => { setResumeFilter(e.target.value); setPage(1); }} 
                  className="filter-select"
                >
                  <option value="all">All Resume Statuses</option>
                  <option value="analyzed">Analyzed Resumes</option>
                  <option value="not_analyzed">No Resume Uploaded</option>
                </select>

                <input 
                  type="text" 
                  placeholder="Filter by Skill name..."
                  value={skillFilter}
                  onChange={(e) => { setSkillFilter(e.target.value); setPage(1); }}
                  className="filter-select"
                  style={{ width: 180 }}
                />

                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)} 
                  className="filter-select"
                >
                  <option value="created_at">Joined Date</option>
                  <option value="name">Name Alphabetical</option>
                  <option value="readiness">Readiness Score</option>
                  <option value="last_active">Last Login Time</option>
                  <option value="preferred_role">Preferred Target Role</option>
                </select>

                <select 
                  value={sortOrder} 
                  onChange={(e) => setSortOrder(e.target.value)} 
                  className="filter-select"
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>

              {/* Data Table */}
              <div className="card admin-table-card">
                {candidatesError && (
                  <div className="badge badge-inactive mb-3 style-toast">
                    <AlertCircle size={14} /> {candidatesError}
                  </div>
                )}

                <div className="table-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Candidate</th>
                        <th>Email</th>
                        <th>Target Role</th>
                        <th>Location</th>
                        <th>Readiness</th>
                        <th>Resume File</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingCandidates ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">
                            <RefreshCw size={24} className="animate-spin text-muted" style={{ margin: 'auto' }} />
                            <p className="text-muted mt-2">Loading candidate list...</p>
                          </td>
                        </tr>
                      ) : candidatesList.length > 0 ? (
                        candidatesList.map((cand) => (
                          <tr key={cand.id}>
                            <td>
                              <div className="cand-name-cell">
                                <UserAvatar fullName={cand.full_name} avatarUrl={null} size={28} />
                                <span className="font-bold">{cand.full_name}</span>
                              </div>
                            </td>
                            <td className="text-muted">{cand.email}</td>
                            <td>{cand.preferred_role || 'General Engineer'}</td>
                            <td>{cand.location || 'Remote'}</td>
                            <td>
                              <ReadinessIndicator score={cand.readiness_score || 0} />
                            </td>
                            <td>
                              {cand.resume_filename ? (
                                <span className="text-muted" style={{ fontSize: '0.8rem' }} title={cand.resume_filename}>
                                  {cand.resume_filename.length > 20 ? cand.resume_filename.slice(0, 17) + '...' : cand.resume_filename}
                                </span>
                              ) : (
                                <span className="text-muted" style={{ fontSize: '0.75rem', fontStyle: 'italic' }}>No Upload</span>
                              )}
                            </td>
                            <td>
                              <button
                                onClick={() => handleToggleCandidateStatus(cand.id, cand.is_active)}
                                className={`badge ${cand.is_active ? 'badge-active' : 'badge-inactive'}`}
                                style={{ cursor: 'pointer', border: 'none' }}
                              >
                                {cand.is_active ? 'Active' : 'Inactive'}
                              </button>
                            </td>
                            <td>
                              <button
                                onClick={() => handleOpenCandidateDossier(cand.id)}
                                className="btn btn-secondary btn-xs"
                                style={{ padding: '4px 10px' }}
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted py-4">
                            <AlertCircle size={24} style={{ margin: 'auto' }} />
                            <p className="mt-2 font-bold">No candidates found matching the filters.</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div className="pagination-row">
                  <span className="pagination-text">
                    Showing {(page - 1) * 10 + 1} - {Math.min(page * 10, totalCandidatesCount)} of {totalCandidatesCount} Candidates
                  </span>

                  <div className="pagination-controls">
                    <button 
                      onClick={() => setPage(p => Math.max(p - 1, 1))} 
                      disabled={page === 1 || loadingCandidates} 
                      className="page-btn"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={`page-btn ${page === i + 1 ? 'active' : ''}`}
                        disabled={loadingCandidates}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setPage(p => Math.min(p + 1, totalPages))} 
                      disabled={page === totalPages || loadingCandidates} 
                      className="page-btn"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 3: JOBS ==================== */}
          {activeTab === 'Jobs' && (
            <div className="admin-content-stack">
              <div className="tab-heading-row">
                <h2>Job Requisitions</h2>
                <p>Publish engineering openings, configure required skills, and pause or archive requisitions</p>
              </div>

              {/* Jobs Table */}
              <div className="card admin-table-card">
                <div className="table-card-header">
                  <h3>Active Requisitions List</h3>
                  <button 
                    onClick={() => { resetJobForm(); setShowJobModal(true); }} 
                    className="btn btn-primary btn-sm"
                  >
                    <Plus size={16} /> Post Requisition
                  </button>
                </div>

                <div className="table-wrapper">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th>Job Title</th>
                        <th>Company</th>
                        <th>Location</th>
                        <th>Work Mode</th>
                        <th>Salary Band</th>
                        <th>Skills Required</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingJobs ? (
                        <tr>
                          <td colSpan="8" className="text-center py-4">Loading positions...</td>
                        </tr>
                      ) : jobsList.length > 0 ? (
                        jobsList.map((job) => (
                          <tr key={job.id}>
                            <td className="font-bold">{job.title}</td>
                            <td>{job.company}</td>
                            <td>{job.location}</td>
                            <td>{job.work_mode || job.workType}</td>
                            <td>{job.salary}</td>
                            <td>
                              <div className="tags-flex">
                                {(job.required_skills || []).slice(0, 3).map((s) => (
                                  <span key={s} className="badge badge-muted">{s}</span>
                                ))}
                                {(job.required_skills || []).length > 3 && (
                                  <span className="text-muted text-xs">+{job.required_skills.length - 3} more</span>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                job.status === 'Active' ? 'badge-active' : (job.status === 'Paused' ? 'badge-inactive' : 'badge-suspended')
                              }`}>
                                {job.status || (job.is_active ? 'Active' : 'Paused')}
                              </span>
                            </td>
                            <td>
                              <div className="actions-cell-flex">
                                <button 
                                  onClick={() => handleEditJobClick(job)} 
                                  className="icon-action-btn"
                                  title="Edit"
                                >
                                  <Edit3 size={13} />
                                </button>
                                {job.status !== 'Archived' && (
                                  <button 
                                    onClick={() => handleArchiveJob(job.id)} 
                                    className="icon-action-btn text-danger"
                                    title="Archive"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center text-muted">No jobs posted.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ==================== TAB 4: AUDIT TRAIL ==================== */}
          {activeTab === 'Audit' && (
            <div className="admin-content-stack">
              <div className="tab-heading-row">
                <h2>Security Platform Audit Logs</h2>
                <p>Immutable ledger of administrator actions, login attempts, and resume operations</p>
              </div>

              {/* Timeline list */}
              <div className="audit-timeline">
                {loadingAudit ? (
                  <p className="text-center text-muted">Loading audit entries...</p>
                ) : auditLogsList.length > 0 ? (
                  auditLogsList.map((log) => (
                    <div key={log.id} className="audit-log-item">
                      <div className="audit-time">
                        {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <div style={{ fontSize: '0.725rem', color: '#9CA3AF', fontWeight: 'normal' }}>
                          {new Date(log.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="audit-details-box">
                        <div className="audit-action-title">
                          <span className="badge badge-muted" style={{ marginRight: '0.5rem', verticalAlign: 'middle' }}>
                            {log.actor_type?.toUpperCase()}
                          </span>
                          {log.action?.replace(/_/g, ' ')?.toUpperCase()}
                        </div>
                        <p className="audit-description">{log.details}</p>
                        <div className="audit-meta">
                          <span>IP: {log.ip_address}</span>
                          <span>Entity: {log.target_type} #{log.target_id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted">No administrative logs recorded.</p>
                )}
              </div>

              {/* Audit pagination */}
              {totalPages > 1 && (
                <div className="pagination-row">
                  <span />
                  <div className="pagination-controls">
                    <button 
                      onClick={() => setAuditPage(p => Math.max(p - 1, 1))} 
                      disabled={auditPage === 1} 
                      className="page-btn"
                    >
                      <ChevronLeft size={14} /> Previous
                    </button>
                    {Array.from({ length: totalAuditPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setAuditPage(i + 1)}
                        className={`page-btn ${auditPage === i + 1 ? 'active' : ''}`}
                      >
                        {i + 1}
                      </button>
                    ))}
                    <button 
                      onClick={() => setAuditPage(p => Math.min(p + 1, totalAuditPages))} 
                      disabled={auditPage === totalAuditPages} 
                      className="page-btn"
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ==================================================
          CANDIDATE DOSSIER DRAWER
         ================================================== */}
      {selectedCandidateDossier && (
        <div className="dossier-drawer-overlay" onClick={() => setSelectedCandidateDossier(null)}>
          <div className="dossier-drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="dossier-header">
              <div className="dossier-header-left">
                <span className="badge badge-accent">CANDIDATE DOSSIER</span>
                <h3>{selectedCandidateDossier.user?.full_name}</h3>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {selectedCandidateDossier.user?.email} • ID: #{selectedCandidateDossier.user?.id}
                </span>
              </div>
              <button 
                onClick={() => setSelectedCandidateDossier(null)} 
                className="icon-action-btn"
                style={{ padding: '0.5rem' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Dossier Tabs */}
            <div className="dossier-tabs-row">
              {['Overview', 'Skills & Gaps', 'Education & Work', 'Resumes History', 'Calculated Matches'].map((t) => (
                <button
                  key={t}
                  onClick={() => setCandidateProfileTab(t)}
                  className={`dossier-tab-btn ${candidateProfileTab === t ? 'active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Drawer Body Scroll */}
            <div className="dossier-body">
              {dossierMessage && (
                <div className="badge badge-active mb-3 w-100" style={{ padding: '0.6rem 1rem' }}>
                  <CheckCircle2 size={14} /> {dossierMessage}
                </div>
              )}

              {/* Tab 1: Overview */}
              {candidateProfileTab === 'Overview' && (
                <div className="modal-info-stack">
                  <div className="dossier-block">
                    <div className="dossier-block-title">Target Preferences</div>
                    <div className="dossier-info-grid">
                      <div className="dossier-info-item">
                        <span className="lbl">Target Role:</span>
                        <span className="val text-primary">{selectedCandidateDossier.profile?.preferred_role || 'Not provided'}</span>
                      </div>
                      <div className="dossier-info-item">
                        <span className="lbl">Location target:</span>
                        <span className="val">{selectedCandidateDossier.profile?.preferred_location || 'Not provided'}</span>
                      </div>
                      <div className="dossier-info-item" style={{ marginTop: '0.5rem' }}>
                        <span className="lbl">Work Mode:</span>
                        <span className="val">{selectedCandidateDossier.profile?.preferred_work_mode || 'Not provided'}</span>
                      </div>
                      <div className="dossier-info-item" style={{ marginTop: '0.5rem' }}>
                        <span className="lbl">Experience:</span>
                        <span className="val">{selectedCandidateDossier.profile?.years_experience || 0} Years</span>
                      </div>
                    </div>
                  </div>

                  <div className="dossier-block">
                    <div className="dossier-block-title">Account details</div>
                    <div className="dossier-info-grid">
                      <div className="dossier-info-item">
                        <span className="lbl">Authentication Provider:</span>
                        <span className="val" style={{ textTransform: 'uppercase' }}>{selectedCandidateDossier.user?.auth_provider}</span>
                      </div>
                      <div className="dossier-info-item">
                        <span className="lbl">Registered on:</span>
                        <span className="val">{new Date(selectedCandidateDossier.user?.created_at).toLocaleDateString()}</span>
                      </div>
                      <div className="dossier-info-item" style={{ marginTop: '0.5rem' }}>
                        <span className="lbl">Email status:</span>
                        <span className="val">{selectedCandidateDossier.user?.email_verified ? 'Verified ✓' : 'Unverified'}</span>
                      </div>
                      <div className="dossier-info-item" style={{ marginTop: '0.5rem' }}>
                        <span className="lbl">Last Login activity:</span>
                        <span className="val">
                          {selectedCandidateDossier.user?.last_login_at 
                            ? new Date(selectedCandidateDossier.user?.last_login_at).toLocaleString() 
                            : 'No history'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedCandidateDossier.profile?.bio && (
                    <div className="dossier-block">
                      <div className="dossier-block-title">Biography / Summary</div>
                      <p style={{ fontSize: '0.875rem', color: '#374151', lineHeight: '1.5' }}>
                        {selectedCandidateDossier.profile.bio}
                      </p>
                    </div>
                  )}

                  {selectedCandidateDossier.ai_analysis && (
                    <div className="dossier-block">
                      <div className="dossier-block-title">Neural Executive Evaluation</div>
                      <p style={{ fontSize: '0.85rem', color: '#4B5563', lineHeight: '1.6', fontStyle: 'italic', backgroundColor: '#F9FAFB', padding: '1rem', border: '1px solid #E5E7EB', borderRadius: 8 }}>
                        {selectedCandidateDossier.ai_analysis.profile_summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Skills & Gaps */}
              {candidateProfileTab === 'Skills & Gaps' && (
                <div>
                  <div className="dossier-block">
                    <div className="dossier-block-title">Candidate Skills ({selectedCandidateDossier.skills?.length || 0})</div>
                    <div className="tags-flex">
                      {selectedCandidateDossier.skills && selectedCandidateDossier.skills.length > 0 ? (
                        selectedCandidateDossier.skills.map((s) => (
                          <span key={s.id} className="badge badge-accent">
                            {s.skill_name} • {s.proficiency}%
                          </span>
                        ))
                      ) : (
                        <span className="text-muted">No skills populated in profile.</span>
                      )}
                    </div>
                  </div>

                  <div className="dossier-block">
                    <div className="dossier-block-title">Identified Skill Gaps ({selectedCandidateDossier.skill_gaps?.length || 0})</div>
                    {selectedCandidateDossier.skill_gaps && selectedCandidateDossier.skill_gaps.length > 0 ? (
                      selectedCandidateDossier.skill_gaps.map((gap) => (
                        <div key={gap.id} className="dossier-list-item">
                          <div className="flex-row justify-space-between align-center">
                            <span className="font-bold text-danger">! {gap.skill_name}</span>
                            <span className="badge badge-muted text-xs">{gap.priority}</span>
                          </div>
                          <p style={{ marginTop: '0.25rem' }}>{gap.description}</p>
                          <div className="text-xs text-muted mt-1">Impact potential: +{gap.impact_pct}% match rate boost</div>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted">No skill gaps calculated yet.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Education & Work */}
              {candidateProfileTab === 'Education & Work' && (
                <div>
                  <div className="dossier-block">
                    <div className="dossier-block-title">Work Experience</div>
                    {selectedCandidateDossier.experience && selectedCandidateDossier.experience.length > 0 ? (
                      selectedCandidateDossier.experience.map((exp) => (
                        <div key={exp.id} className="dossier-list-item">
                          <h4 className="font-bold">{exp.role} @ {exp.company}</h4>
                          <span className="text-xs text-muted">{exp.start_date} - {exp.is_current ? 'Present' : exp.end_date}</span>
                          <p style={{ marginTop: '0.4rem' }}>{exp.description}</p>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted">No experience entries recorded.</span>
                    )}
                  </div>

                  <div className="dossier-block">
                    <div className="dossier-block-title">Projects</div>
                    {selectedCandidateDossier.projects && selectedCandidateDossier.projects.length > 0 ? (
                      selectedCandidateDossier.projects.map((proj) => (
                        <div key={proj.id} className="dossier-list-item">
                          <h4 className="font-bold">{proj.title}</h4>
                          <span className="text-xs text-muted" style={{ display: 'block' }}>Tech stack: {proj.technologies}</span>
                          <p style={{ marginTop: '0.4rem' }}>{proj.description}</p>
                        </div>
                      ))
                    ) : (
                      <span className="text-muted">No project listings added.</span>
                    )}
                  </div>

                  <div className="dossier-block">
                    <div className="dossier-block-title">Education Credentials</div>
                    {selectedCandidateDossier.education && selectedCandidateDossier.education.length > 0 ? (
                      selectedCandidateDossier.education.map((edu) => (
                        <div key={edu.id} className="dossier-list-item">
                          <h4 className="font-bold">{edu.degree} {edu.field ? `in ${edu.field}` : ''}</h4>
                          <p>{edu.institution} ({edu.start_year} - {edu.end_year})</p>
                          {edu.grade && <span className="text-xs text-muted">Grade/GPA: {edu.grade}</span>}
                        </div>
                      ))
                    ) : (
                      <span className="text-muted">No education credentials populated.</span>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Resumes History */}
              {candidateProfileTab === 'Resumes History' && (
                <div>
                  <div className="dossier-block-title">Uploaded Resumes History</div>
                  {selectedCandidateDossier.resumes && selectedCandidateDossier.resumes.length > 0 ? (
                    selectedCandidateDossier.resumes.map((res) => (
                      <div key={res.id} className="dossier-list-item" style={{ position: 'relative' }}>
                        <div className="flex-row justify-space-between align-center" style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span className="font-bold">{res.original_filename}</span>
                          <span className="badge badge-accent">ATS Score: {res.ats_score || 0}%</span>
                        </div>
                        <div className="text-xs text-muted mt-1">
                          Uploaded on: {new Date(res.uploaded_at).toLocaleDateString()} at {new Date(res.uploaded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-xs text-muted">Parsing Status: {res.status?.toUpperCase()}</div>

                        <div className="actions-cell-flex mt-2" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                          <button
                            onClick={() => handleDownloadResume(res.id)}
                            className="btn btn-secondary btn-xs"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <Download size={13} /> Download PDF
                          </button>

                          <button
                            onClick={() => handleReanalyzeResume(res.id, selectedCandidateDossier.user.id)}
                            disabled={reanalyzingResumeId === res.id}
                            className="btn btn-primary-outline btn-xs"
                            style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <RefreshCw size={13} className={reanalyzingResumeId === res.id ? 'animate-spin' : ''} />
                            {reanalyzingResumeId === res.id ? 'Parsing...' : 'Re-Analyze'}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">No resume uploads in database history.</span>
                  )}
                </div>
              )}

              {/* Tab 5: Job Matches */}
              {candidateProfileTab === 'Calculated Matches' && (
                <div>
                  <div className="dossier-block-title">System Job Requisition Matches</div>
                  {selectedCandidateDossier.job_matches && selectedCandidateDossier.job_matches.length > 0 ? (
                    selectedCandidateDossier.job_matches.map((m) => (
                      <div key={m.id} className="dossier-list-item">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 className="font-bold">{m.title}</h4>
                          <span className="badge badge-accent">{m.match_percentage}% MATCH</span>
                        </div>
                        <span className="text-muted text-xs">{m.company}</span>
                        <p style={{ marginTop: '0.4rem', fontSize: '0.8rem' }} className="text-muted">{m.why_recommended}</p>
                      </div>
                    ))
                  ) : (
                    <span className="text-muted">No compatibility matches computed. Ensure candidate profile has skills.</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          JOB REQUISITION MODAL (Create/Edit Form)
         ================================================== */}
      {(showJobModal || editingJob) && (
        <div className="admin-modal-overlay">
          <div className="card admin-modal-card">
            <div className="modal-header">
              <h3>{editingJob ? 'Edit Requisition Details' : 'Post New Job Requisition'}</h3>
              <button 
                onClick={() => { setShowJobModal(false); setEditingJob(null); resetJobForm(); }} 
                className="icon-action-btn"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={editingJob ? handleUpdateJob : handleCreateJob} className="admin-form-stack">
              <div className="form-group">
                <label className="input-label">Job Title *</label>
                <input
                  type="text"
                  required
                  value={jobForm.title}
                  onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                  placeholder="e.g. Lead Frontend Developer"
                  className="input-field"
                />
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="input-label">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={jobForm.company}
                    onChange={(e) => setJobForm({ ...jobForm, company: e.target.value })}
                    placeholder="e.g. Starlight SaaS"
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Location</label>
                  <input
                    type="text"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="input-label">Work Mode</label>
                  <select
                    value={jobForm.work_mode}
                    onChange={(e) => setJobForm({ ...jobForm, work_mode: e.target.value })}
                    className="input-field"
                  >
                    <option value="Remote">Remote</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="On-site">On-site</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="input-label">Salary Band</label>
                  <input
                    type="text"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="input-label">Required Skills (Comma-separated)</label>
                  <input
                    type="text"
                    value={jobForm.required_skills}
                    onChange={(e) => setJobForm({ ...jobForm, required_skills: e.target.value })}
                    className="input-field"
                  />
                </div>

                <div className="form-group">
                  <label className="input-label">Status</label>
                  <select
                    value={jobForm.status}
                    onChange={(e) => setJobForm({ ...jobForm, status: e.target.value })}
                    className="input-field"
                  >
                    <option value="Active">Active</option>
                    <option value="Paused">Paused</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">Role Description *</label>
                <textarea
                  rows={4}
                  required
                  value={jobForm.description}
                  onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                  placeholder="Describe duties, requirements, stack..."
                  className="input-field"
                />
              </div>

              <div className="modal-actions-row">
                <button 
                  type="button" 
                  onClick={() => { setShowJobModal(false); setEditingJob(null); resetJobForm(); }} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingJob ? 'Save Requisition' : 'Publish Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
