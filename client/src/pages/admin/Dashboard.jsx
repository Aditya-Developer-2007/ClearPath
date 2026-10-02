import React from 'react';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-headings">Delay analytics</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Applications" value="1,402" />
        <StatCard title="SLA breaches" value="156" />
        <StatCard title="Escalations" value="43" />
      </div>
      <EmptyState message="No anomalies detected this week." />
    </div>
  );
}
