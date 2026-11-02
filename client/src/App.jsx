import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { BusinessProvider } from './context/BusinessContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';

const Login = React.lazy(() => import('./pages/public/Login'));
const Landing = React.lazy(() => import('./pages/public/Landing'));
const Wizard = React.lazy(() => import('./pages/public/Wizard'));
const ChecklistResult = React.lazy(() => import('./pages/public/ChecklistResult'));
const NotFound = React.lazy(() => import('./pages/public/NotFound'));
const ApplicantDashboard = React.lazy(() => import('./pages/applicant/Dashboard'));
const ApplicantWorkspace = React.lazy(() => import('./pages/applicant/Workspace'));
const MyApprovals = React.lazy(() => import('./pages/applicant/MyApprovals'));
const MessagesHub = React.lazy(() => import('./pages/applicant/MessagesHub'));
const OfficerDashboard = React.lazy(() => import('./pages/officer/Dashboard'));
const OfficerReview = React.lazy(() => import('./pages/officer/Review'));
const OfficerEscalated = React.lazy(() => import('./pages/officer/Escalated'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminInspections = React.lazy(() => import('./pages/admin/Inspections'));

const Loader = () => <div className="p-8 flex justify-center text-gray-500">Loading...</div>;

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'applicant') return <Navigate to="/app/dashboard" replace />;
  if (user.role === 'officer') return <Navigate to="/officer/queue" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
  return <Navigate to="/login" replace />;
};

const ApprovalRedirect = () => {
  const { id } = useParams();
  return <Navigate to={`/app/workspace/${id}`} replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BusinessProvider>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/start" element={<Wizard />} />
              <Route path="/result" element={<ChecklistResult />} />
              <Route path="/login" element={<Login />} />
              
              <Route path="/app" element={<AppShell />}>
                <Route index element={<RootRedirect />} />
                
                <Route path="dashboard" element={
                  <ProtectedRoute allowedRoles={['applicant']}><ApplicantDashboard /></ProtectedRoute>
                } />
                <Route path="approvals" element={
                  <ProtectedRoute allowedRoles={['applicant']}><MyApprovals /></ProtectedRoute>
                } />
                <Route path="approvals/:id" element={
                  <ProtectedRoute allowedRoles={['applicant']}><ApprovalRedirect /></ProtectedRoute>
                } />
                <Route path="workspace/:id" element={
                  <ProtectedRoute allowedRoles={['applicant']}><ApplicantWorkspace /></ProtectedRoute>
                } />
                <Route path="messages" element={
                  <ProtectedRoute allowedRoles={['applicant']}><MessagesHub /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
                
              </Route>
              <Route path="/officer" element={<AppShell />}>
                <Route path="queue" element={
                  <ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>
                } />
                <Route path="review/:id" element={
                  <ProtectedRoute allowedRoles={['officer']}><OfficerReview /></ProtectedRoute>
                } />
                <Route path="escalated" element={
                  <ProtectedRoute allowedRoles={['officer']}><OfficerEscalated /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/officer/queue" replace />} />
              </Route>
              <Route path="/admin" element={<AppShell />}>
                <Route index element={<Navigate to="/admin/analytics" replace />} />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
                } />
                <Route path="inspections" element={
                  <ProtectedRoute allowedRoles={['admin']}><AdminInspections /></ProtectedRoute>
                } />
                <Route path="*" element={<Navigate to="/admin/analytics" replace />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </BusinessProvider>
    </AuthProvider>
  );
}
