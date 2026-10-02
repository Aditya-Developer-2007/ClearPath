import React from 'react';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

export default function OfficerDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headings">Review queue</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending" value="24" />
        <StatCard title="Due today" value="5" />
        <StatCard title="Overdue" value="2" />
        <StatCard title="Escalated" value="1" />
      </div>
      <EmptyState message="Your queue is empty right now." />
    </div>
  );
}
