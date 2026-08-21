import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CareerProvider } from './context/CareerContext';
import { CustomCursor } from './components/CustomCursor';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts — kept eager since DashboardLayout wraps many routes
import { DashboardLayout } from './layouts/DashboardLayout';

// Shared auth hook — needed for AdminProtectedRoute
import { useAuth } from './context/AuthContext';

// ========================================================================
// LAZY-LOADED PAGES — Route-Level Code Splitting
// Each page and its dependencies load only when the route is visited.
// ========================================================================

// Public Pages & Auth
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

// Legal Pages
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const SecurityCompliance = lazy(() => import('./pages/SecurityCompliance'));

// Onboarding
const Onboarding = lazy(() => import('./pages/Onboarding'));

// Authenticated Candidate Pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const ResumeAnalysis = lazy(() => import('./pages/ResumeAnalysis'));
const ATSResumeMaker = lazy(() => import('./pages/ATSResumeMaker'));
const JobMatching = lazy(() => import('./pages/JobMatching'));
const JobRecommendations = lazy(() => import('./pages/JobRecommendations'));
const SkillGapAnalysis = lazy(() => import('./pages/SkillGapAnalysis'));
const CareerPath = lazy(() => import('./pages/CareerPath'));
const Assistant = lazy(() => import('./pages/Assistant'));
const Settings = lazy(() => import('./pages/Settings'));

// Admin Pages
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));

// ========================================================================
// SUSPENSE LOADING FALLBACK
// Minimal, clean loading indicator — not a blank screen.
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
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return <div style={{ padding: '4rem', textAlign: 'center' }}>Verifying admin authorization...</div>;
  }
  if (!isAuthenticated || !user || user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
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

                {/* Public Legal Pages */}
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/security" element={<SecurityCompliance />} />

                {/* Profile Setup Wizard */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/profile/setup" element={<Onboarding />} />

                {/* Admin Protected Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/candidates" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
                <Route path="/admin/candidates/:id" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
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
                  <Route path="/job-matching" element={<JobMatching />} />
                  <Route path="/job-recommendations" element={<JobRecommendations />} />
                  <Route path="/skill-gaps" element={<SkillGapAnalysis />} />
                  <Route path="/career-path" element={<CareerPath />} />
                  <Route path="/assistant" element={<Assistant />} />
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
