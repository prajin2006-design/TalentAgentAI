/**
 * Talent Agent AI — Central API Client
 * Automatically handles JSON parsing, error normalization, and HTTP-only cookie credentials.
 */

const API_BASE = '/api';

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
    credentials: 'include'
  };

  try {
    const res = await fetch(url, config);

    if (options.responseType === 'blob') {
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const err = new Error(errorData.error || `Request failed with status ${res.status}`);
        err.status = res.status;
        err.data = errorData;
        throw err;
      }
      return res.blob();
    }

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const err = new Error(data.error || data.message || `Request failed with status ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    if (!err.status) {
      err.message = 'Backend server is currently unavailable. Please check connection.';
    }
    throw err;
  }
}

export const authAPI = {
  signup: (payload) => request('/auth/signup', { method: 'POST', body: JSON.stringify(payload) }),
  verifyEmail: (payload) => request('/auth/verify-email', { method: 'POST', body: JSON.stringify(payload) }),
  resendOtp: (payload) => request('/auth/resend-otp', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  googleAuth: (payload) => request('/auth/google', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (payload) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify(payload) }),
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
  deleteExperience: (id) => request(`/experience/${id}`, { method: 'DELETE' }),
  uploadResume: (formData) => request('/resume/upload', { method: 'POST', body: formData })
};

export const resumeAPI = {
  getResumes: () => request('/resumes', { method: 'GET' }),
  createResume: (payload) => request('/resumes', { method: 'POST', body: JSON.stringify(payload) }),
  getResumeDetail: (id) => request(`/resumes/${id}`, { method: 'GET' }),
  updateResume: (id, payload) => request(`/resumes/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteResume: (id) => request(`/resumes/${id}`, { method: 'DELETE' }),
  analyzeATS: (id, payload = {}) => request(id ? `/resumes/${id}/ats-analysis` : '/resumes/ats-analysis', { method: 'POST', body: JSON.stringify(payload) }),
  analyzeJobATS: (id, payload = {}) => request(id ? `/resumes/${id}/job-match` : '/resumes/job-match', { method: 'POST', body: JSON.stringify(payload) }),
  generateSummary: (payload = {}, id = null) => request(id ? `/resumes/${id}/generate-summary` : '/resumes/generate-summary', { method: 'POST', body: JSON.stringify(payload) }),
  improveBullets: (payload = {}, id = null) => request(id ? `/resumes/${id}/improve-bullets` : '/resumes/improve-bullets', { method: 'POST', body: JSON.stringify(payload) }),
  optimizeResume: (payload) => request('/resume/optimize', { method: 'POST', body: JSON.stringify(payload) }),
  getVersions: () => request('/resume/versions', { method: 'GET' }),
  downloadPDF: (id, template = 'modern') => request(`/resumes/${id}/download/pdf?template=${template}`, { method: 'GET', responseType: 'blob' }),
  downloadDOCX: (id, template = 'modern') => request(`/resumes/${id}/download/docx?template=${template}`, { method: 'GET', responseType: 'blob' }),
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
  deleteConversation: (id) => request(`/ai/conversations/${id}`, { method: 'DELETE' })
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
    return request(`/admin/candidates${qs ? '?' + qs : ''}`, { method: 'GET' });
  },
  getCandidateDetail: (id) => request(`/admin/candidates/${id}`, { method: 'GET' }),
  toggleCandidateStatus: (id, isActive) => request(`/admin/candidates/${id}/status`, { method: 'PATCH', body: JSON.stringify({ is_active: isActive }) }),
  deleteCandidate: (id) => request(`/admin/candidates/${id}`, { method: 'DELETE' }),
  getJobs: () => request('/admin/jobs', { method: 'GET' }),
  createJob: (payload) => request('/admin/jobs', { method: 'POST', body: JSON.stringify(payload) }),
  updateJob: (id, payload) => request(`/admin/jobs/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteJob: (id) => request(`/admin/jobs/${id}`, { method: 'DELETE' }),
  updateJobStatus: (id, status) => request(`/admin/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getAuditLogs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/admin/audit-logs${qs ? '?' + qs : ''}`, { method: 'GET' });
  }
};
