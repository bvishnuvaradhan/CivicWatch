import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const ReportIssue = lazy(() => import('./pages/ReportIssue'));
const IssueDetail = lazy(() => import('./pages/IssueDetail'));
const MyIssuesPage = lazy(() => import('./pages/MyIssuesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const StatsPage = lazy(() => import('./pages/StatsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const WorkerDashboard = lazy(() => import('./pages/WorkerDashboard'));
import { motion, AnimatePresence } from 'motion/react';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const RoleRoute: React.FC<{ children: React.ReactNode; allowedRoles: string[] }> = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>;
  if (!user) return <Navigate to="/auth" />;
  return allowedRoles.includes(user.role) ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <main>
        <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>}>
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={user ? <Navigate to="/dashboard" /> : <AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/stats" element={<StatsPage />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/activity" element={<ActivityPage />} />
              <Route path="/issue/:id" element={<IssueDetail />} />
              
              {/* Protected Routes */}
              <Route path="/report" element={
                <RoleRoute allowedRoles={['USER']}>
                  <ReportIssue />
                </RoleRoute>
              } />
              <Route path="/my-issues" element={
                <RoleRoute allowedRoles={['USER']}>
                  <MyIssuesPage />
                </RoleRoute>
              } />
              <Route path="/profile" element={
                <PrivateRoute>
                  <ProfilePage />
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <SettingsPage />
                </PrivateRoute>
              } />
              
              {/* Admin Panel */}
              <Route path="/admin" element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <Navigate to="/admin/analysis" replace />
                </RoleRoute>
              } />
              <Route path="/admin/:section" element={
                <RoleRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </RoleRoute>
              } />
              
              {/* Worker Panel */}
              <Route path="/worker" element={
                <RoleRoute allowedRoles={['WORKER']}>
                  <WorkerDashboard />
                </RoleRoute>
              } />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </main>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;
