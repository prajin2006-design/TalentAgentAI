import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CareerProvider } from './context/CareerContext';
import { CustomCursor } from './components/CustomCursor';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts — kept eager since DashboardLayout wraps candidate routes
import { DashboardLayout } from './layouts/DashboardLayout';

// ========================================================================
// LAZY-LOADED PAGES — Route-Level Code Splitting
// ========================================================================

// Public Pages & Auth
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Legal & Support Pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const SecurityCompliance = lazy(() => import('./pages/SecurityCompliance'));
const CookiesPolicy = lazy(() => import('./pages/CookiesPolicy'));
const AIDataUse = lazy(() => import('./pages/AIDataUse'));
const HelpSupport = lazy(() => import('./pages/HelpSupport'));

// Onboarding
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Candidate Dashboard Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const ATSResumeMaker = lazy(() => import('./pages/ATSResumeMaker'));
const JobMatching = lazy(() => import('./pages/JobMatching'));
const JobDetail = lazy(() => import('./pages/JobDetail'));
const Applications = lazy(() => import('./pages/Applications'));
const SkillGapAnalysis = lazy(() => import('./pages/SkillGapAnalysis'));
const CareerPath = lazy(() => import('./pages/CareerPath'));
const Assistant = lazy(() => import('./pages/Assistant'));
const InterviewPrep = lazy(() => import('./pages/InterviewPrep'));
const Settings = lazy(() => import('./pages/Settings'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// ========================================================================
// SUSPENSE LOADING FALLBACK
// ========================================================================
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
    flexDirection: 'column',
    gap: '1rem'
  }}>
    <div style={{
      width: 36,
      height: 36,
      borderRadius: '50%',
      border: '3px solid rgba(30, 34, 255, 0.1)',
      borderTopColor: '#1E22FF',
      animation: 'pageLoaderSpin 0.7s linear infinite'
    }} />
    <style>{`@keyframes pageLoaderSpin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Admin Security Route Gate
const AdminProtectedRoute = ({ children }) => {
  const { adminUser, isAdminAuthenticated, isAdminLoading } = useAuth();
  if (isAdminLoading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748B' }}>
        Verifying administrator authorization...
      </div>
    );
  }
  if (!isAdminAuthenticated && !adminUser) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
};

// Candidate Protected Route Gate
const CandidateProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <PageLoader />;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <CareerProvider>
          <CustomCursor />
          <Router>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Landing & Auth Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signin" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/register" element={<Signup />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/* Public Legal & Support Pages */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/security" element={<SecurityCompliance />} />
                <Route path="/cookies" element={<CookiesPolicy />} />
                <Route path="/ai-data-use" element={<AIDataUse />} />
                <Route path="/help" element={<HelpSupport />} />
                <Route path="/support" element={<HelpSupport />} />

                {/* Profile Setup Wizard */}
                <Route path="/onboarding" element={<CandidateProtectedRoute><Onboarding /></CandidateProtectedRoute>} />
                <Route path="/profile/setup" element={<CandidateProtectedRoute><Onboarding /></CandidateProtectedRoute>} />

                {/* Admin Protected Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/candidates" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/candidates/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/users" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/users/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/jobs" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/matches" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/resumes" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/ai" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/analytics" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/audit-logs" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />

                {/* Authenticated Candidate Dashboard Layout Routes */}
                <Route element={<DashboardLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/resume-analysis" element={<ResumeAnalysis />} />
                  <Route path="/resume-maker" element={<ATSResumeMaker />} />
                  <Route path="/ats-resume-maker" element={<ATSResumeMaker />} />
                  <Route path="/jobs" element={<JobMatching />} />
                  <Route path="/jobs/:id" element={<JobDetail />} />
                  <Route path="/job-matching" element={<JobMatching />} />
                  <Route path="/job-recommendations" element={<JobMatching />} />
                  <Route path="/applications" element={<Applications />} />
                  <Route path="/skill-gaps" element={<SkillGapAnalysis />} />
                  <Route path="/career-path" element={<CareerPath />} />
                  <Route path="/ai-agent" element={<Assistant />} />
                  <Route path="/assistant" element={<Assistant />} />
                  <Route path="/interview" element={<InterviewPrep />} />
                  <Route path="/mock-interview" element={<InterviewPrep />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </Router>
        </CareerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
