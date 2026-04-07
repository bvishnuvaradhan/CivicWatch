import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import AuthPage from './pages/AuthPage';
import ReportIssue from './pages/ReportIssue';
import IssueDetail from './pages/IssueDetail';
import MyIssuesPage from './pages/MyIssuesPage';
import ProfilePage from './pages/ProfilePage';
import StatsPage from './pages/StatsPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ActivityPage from './pages/ActivityPage';
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
import SettingsPage from './pages/SettingsPage';
import WorkerDashboard from './pages/WorkerDashboard';
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
                <Suspense fallback={<div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" /></div>}>
                  <AdminDashboard />
                </Suspense>
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
