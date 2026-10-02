import React from 'react';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

export default function ApplicantDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headings">Your approvals</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value="12" />
        <StatCard title="In review" value="3" />
        <StatCard title="Needs action" value="1" />
        <StatCard title="Approved" value="8" />
      </div>
      <EmptyState message="You have no recent approval activity." />
    </div>
  );
}
