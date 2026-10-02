import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'applicant') return <Navigate to="/app/dashboard" replace />;
    if (user.role === 'officer') return <Navigate to="/officer/queue" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/analytics" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}
