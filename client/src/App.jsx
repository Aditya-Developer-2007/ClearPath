import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './layouts/AppShell';

const Login = React.lazy(() => import('./pages/public/Login'));
const DevComponents = React.lazy(() => import('./pages/public/DevComponents'));
const ApplicantDashboard = React.lazy(() => import('./pages/applicant/Dashboard'));
const OfficerDashboard = React.lazy(() => import('./pages/officer/Dashboard'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));

const Loader = () => <div className="p-8 flex justify-center text-gray-500">Loading...</div>;

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'applicant') return <Navigate to="/app/dashboard" replace />;
  if (user.role === 'officer') return <Navigate to="/officer/queue" replace />;
  if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
  return <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<AppShell />}>
              <Route index element={<RootRedirect />} />
              <Route path="dev/components" element={<DevComponents />} />
              
              <Route path="app/dashboard" element={
                <ProtectedRoute allowedRoles={['applicant']}><ApplicantDashboard /></ProtectedRoute>
              } />
              {/* Add dummy routes so links work without 404 */}
              <Route path="app/*" element={<ProtectedRoute allowedRoles={['applicant']}><div>Placeholder</div></ProtectedRoute>} />
              
              <Route path="officer/queue" element={
                <ProtectedRoute allowedRoles={['officer']}><OfficerDashboard /></ProtectedRoute>
              } />
              <Route path="officer/*" element={<ProtectedRoute allowedRoles={['officer']}><div>Placeholder</div></ProtectedRoute>} />
              
              <Route path="admin/analytics" element={
                <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />
              <Route path="admin/*" element={<ProtectedRoute allowedRoles={['admin']}><div>Placeholder</div></ProtectedRoute>} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
