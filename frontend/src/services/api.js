/**
 * Talent Agent AI — Central API Client
 * Automatically handles JSON parsing, error normalization, and HTTP-only cookie credentials.
 */

// Dynamically compute API base URL: supports production VITE_API_URL or relative /api proxy
const RAW_URL = import.meta.env.VITE_API_URL || '';
const API_BASE = RAW_URL ? `${RAW_URL.replace(/\/$/, '')}/api` : '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // If FormData is sent, omit Content-Type header so browser sets multipart boundary
  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const config = {
    ...options,
    headers,
    credentials: 'include' // Sends HTTP-only cookies
  };

  let response;
  try {
    response = await fetch(url, config);
  } catch (initialErr) {
    if (initialErr.name === 'AbortError') {
      throw initialErr;
    }
    let fallbackWorked = false;
    // Transparently resolve Windows localhost IPv6 (::1) vs IPv4 (127.0.0.1)
    if (url.includes('://localhost:')) {
      try {
        const altUrl = url.replace('://localhost:', '://127.0.0.1:');
        response = await fetch(altUrl, config);
        fallbackWorked = true;
      } catch {}
    } else if (url.includes('://127.0.0.1:')) {
      try {
        const altUrl = url.replace('://127.0.0.1:', '://localhost:');
        response = await fetch(altUrl, config);
        fallbackWorked = true;
      } catch {}
    }

    if (!fallbackWorked) {
      // Try Vite dev-server proxy if direct port access failed
      try {
        response = await fetch(`/api${endpoint}`, config);
        fallbackWorked = true;
      } catch {}
    }

    if (!fallbackWorked) {
      const connErr = new Error("Unable to connect to the server. Check that the backend is running.");
      throw connErr;
    }
  }

  try {
    // If downloading a binary blob (e.g. PDF or DOCX export)
    if (options.responseType === 'blob') {
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Download failed');
        const err = new Error(errorText);
        err.status = response.status;
        throw err;
      }
      return response.blob();
    }

    // Parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      let message = (data && typeof data === 'object') ? (data.error || data.message) : data;
      if (!message || typeof message !== 'string') {
        if (response.status === 404) {
          message = 'The requested service endpoint was not found.';
        } else if (response.status === 401) {
          message = 'Incorrect email or password.';
        } else if (response.status === 403) {
          message = 'You do not have permission to perform this action.';
        } else if (response.status === 500) {
          message = 'An unexpected server error occurred. Please try again shortly.';
        } else {
          message = `Request failed with status ${response.status}.`;
        }
      }
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (!err.status && !err.message) {
      err.message = 'Unable to connect to the server. Check that the backend is running.';
    }
    throw err;
  }
}

export const authAPI = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getGoogleConfig: () => request('/auth/google/config', { method: 'GET' }),
  googleAuth: (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
  verifyResetCode: (payload) => request('/auth/verify-reset-code', { method: 'POST', body: JSON.stringify(payload) }),
  resetPassword: (payload) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: async () => {
    try {
      return await request('/auth/me', { method: 'GET' });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        return { authenticated: false, user: null };
      }
      throw err;
    }
  },
  logout: () => request('/auth/logout', { method: 'POST' })
};

export const profileAPI = {
  getProfile: () => request('/profile', { method: 'GET' }),
  updateProfile: (payload) => request('/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getSkills: () => request('/skills', { method: 'GET' }),
  addSkill: (payload) => request('/skills', { method: 'POST', body: JSON.stringify(payload) }),
  deleteSkill: (id) => request(`/skills/${id}`, { method: 'DELETE' }),
  getEducation: () => request('/education', { method: 'GET' }),
  addEducation: (payload) => request('/education', { method: 'POST', body: JSON.stringify(payload) }),
  deleteEducation: (id) => request(`/education/${id}`, { method: 'DELETE' }),
  addProject: (payload) => request('/projects', { method: 'POST', body: JSON.stringify(payload) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
  addExperience: (payload) => request('/experience', { method: 'POST', body: JSON.stringify(payload) }),
  deleteExperience: (id) => request(`/experience/${id}`, { method: 'DELETE' }),
  uploadResume: (formData) => request('/resume/upload', { method: 'POST', body: formData })
};

export const resumeAPI = {
  getResumes: () => request('/resumes', { method: 'GET' }),
  getActiveResume: () => request('/resumes/active', { method: 'GET' }),
  getResumeHistory: () => request('/resumes/history', { method: 'GET' }),
  setActiveResume: (id) => request(`/resumes/${id}/set-active`, { method: 'POST' }),
  uploadPDF: (formData) => request('/resumes/upload', { method: 'POST', body: formData }),
  reanalyzeResume: (id) => request(`/resumes/${id}/reanalyze`, { method: 'POST' }),
  createResume: (payload) => request('/resumes', { method: 'POST', body: JSON.stringify(payload) }),
  getResumeDetail: (id) => request(`/resumes/${id}`, { method: 'GET' }),
  updateResume: (id, payload) => request(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  deleteUploadedPDF: (id) => request(`/resumes/uploaded/${id}`, { method: 'DELETE' }),
  analyzeATS: (id, payload = {}) => request(id ? `/resumes/${id}/ats-analysis` : '/resumes/ats-analysis', { method: 'POST', body: JSON.stringify(payload) }),
  analyzeJobATS: (id, payload = {}) => request(id ? `/resumes/${id}/job-match` : '/resumes/job-match', { method: 'POST', body: JSON.stringify(payload) }),
  generateSummary: (payload = {}, id = null) => request(id ? `/resumes/${id}/generate-summary` : '/resumes/generate-summary', { method: 'POST', body: JSON.stringify(payload) }),
  improveBullets: (payload = {}, id = null) => request(id ? `/resumes/${id}/improve-bullets` : '/resumes/improve-bullets', { method: 'POST', body: JSON.stringify(payload) }),
  optimizeResume: (payload) => request('/resume/optimize', { method: 'POST', body: JSON.stringify(payload) }),
  getVersions: () => request('/resume/versions', { method: 'GET' }),
  downloadPDF: (id, template = 'modern') => request(`/resumes/${id}/download/pdf?template=${encodeURIComponent(template)}`, { method: 'GET', responseType: 'blob' }),
  downloadDOCX: (id, template = 'modern') => request(`/resumes/${id}/download/docx?template=${encodeURIComponent(template)}`, { method: 'GET', responseType: 'blob' }),
  exportResume: (format = 'pdf', resumeId = null, template = 'modern') => {
    const q = new URLSearchParams({ format, template });
    if (resumeId) q.append('resume_id', resumeId);
    return request(`/resumes/export?${q.toString()}`, { method: 'GET', responseType: 'blob' });
  }
};

export const aiAPI = {
  analyzeProfile: () => request('/ai/analyze-profile', { method: 'POST' }),
  getAnalysis: () => request('/ai/analysis', { method: 'GET' }),
  askAssistant: (message, conversationId, signal) => request('/ai/chat', {
    method: 'POST',
    signal,
    body: JSON.stringify({ message, conversation_id: conversationId })
  }),
  getConversations: () => request('/ai/conversations', { method: 'GET' }),
  getConversation: (id) => request(`/ai/conversations/${id}`, { method: 'GET' }),
  renameConversation: (id, title) => request(`/ai/conversations/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title })
  }),
  deleteConversation: (id) => request(`/ai/conversations/${id}`, { method: 'DELETE' }),
  clearAllConversations: () => request('/ai/conversations', { method: 'DELETE' }),
  regenerateResponse: (conversationId) => request(`/ai/conversations/${conversationId}/regenerate`, { method: 'POST' }),
  getHealth: () => request('/ai/health', { method: 'GET' }),
  generateInterviewQuestions: (payload = {}) => request('/ai/interview/generate', { method: 'POST', body: JSON.stringify(payload) }),
  evaluateInterviewAnswer: (payload) => request('/ai/interview/evaluate', { method: 'POST', body: JSON.stringify(payload) })
};

export const interviewAPI = {
  generateQuestions: (payload = {}) => request('/ai/interview/generate', { method: 'POST', body: JSON.stringify(payload) }),
  evaluateAnswer: (payload) => request('/ai/interview/evaluate', { method: 'POST', body: JSON.stringify(payload) })
};


export const jobsAPI = {
  getJobs: () => request('/jobs', { method: 'GET' }),
  getJobDetail: (id) => request(`/jobs/${id}`, { method: 'GET' }),
  getJobMatches: () => request('/job-matches', { method: 'GET' }),
  toggleSaveJob: (id) => request(`/job-matches/${id}/save`, { method: 'POST' }),
  applyToJob: (id) => request(`/jobs/${id}/apply`, { method: 'POST' }),
  getApplications: () => request('/applications', { method: 'GET' })
};

export const adminAPI = {
  login: (payload) => request('/admin/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => request('/admin/logout', { method: 'POST' }),
  getMe: async () => {
    try {
      return await request('/admin/me', { method: 'GET' });
    } catch (err) {
      if (err.status === 401 || err.status === 403) {
        return { authenticated: false, admin: null };
      }
      throw err;
    }
  },
  getDashboard: () => request('/admin/dashboard', { method: 'GET' }),
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/admin/candidates?${qs}` : '/admin/candidates', { method: 'GET' });
  },
  getCandidateDetail: (id) => request(`/admin/candidates/${id}`, { method: 'GET' }),
  toggleCandidateStatus: (id, isActive) => request(`/admin/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) }),
  deleteCandidate: (id) => request(`/admin/candidates/${id}`, { method: 'DELETE' }),
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/admin/jobs?${qs}` : '/admin/jobs', { method: 'GET' });
  },
  createJob: (payload) => request('/admin/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  updateJob: (id, payload) => request(`/admin/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  pauseJob: (id) => request(`/admin/jobs/${id}/pause`, { method: 'POST' }),
  resumeJob: (id) => request(`/admin/jobs/${id}/resume`, { method: 'POST' }),
  archiveJob: (id) => request(`/admin/jobs/${id}/archive`, { method: 'POST' }),
  deleteJob: (id) => request(`/admin/jobs/${id}`, { method: 'DELETE' }),
  reanalyzeResume: (resumeId) => request(`/admin/resumes/${resumeId}/reanalyze`, { method: 'POST' }),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(qs ? `/admin/audit-logs?${qs}` : '/admin/audit-logs', { method: 'GET' });
  }
};

export const dashboardAPI = {
  getSummary: (timeframe = '30d') => request(`/dashboard/summary?timeframe=${encodeURIComponent(timeframe)}`, { method: 'GET' }),
  getActivity: (timeframe = '30d') => request(`/dashboard/activity?timeframe=${encodeURIComponent(timeframe)}`, { method: 'GET' })
};
