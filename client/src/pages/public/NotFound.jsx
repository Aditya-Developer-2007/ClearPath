import React from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../../components/EmptyState';
import { useAuth } from '../../hooks/useAuth';

export default function NotFound() {
  const { user } = useAuth();
  
  let homePath = '/';
  if (user) {
    if (user.role === 'applicant') homePath = '/app/dashboard';
    else if (user.role === 'officer') homePath = '/officer/queue';
    else if (user.role === 'admin') homePath = '/admin/analytics';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-white border border-border rounded p-8 text-center">
        <h1 className="text-4xl font-headings mb-4 text-text">404</h1>
        <EmptyState message="Page not found." />
        <Link to={homePath} className="mt-6 inline-block bg-primary text-white px-6 py-2 rounded text-sm hover:bg-teal-800 transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
