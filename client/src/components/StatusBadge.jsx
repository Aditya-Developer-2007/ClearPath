import React from 'react';
export default function StatusBadge({ status, isOverdue }) {
  const styles = {
    not_started: 'bg-status-not_started_bg text-status-not_started',
    in_review: 'bg-yellow-100 text-yellow-800',
    submitted: 'bg-yellow-100 text-yellow-800',
    under_review: 'bg-yellow-100 text-yellow-800',
    query_raised: 'bg-status-query_raised_bg text-status-query_raised',
    approved: 'bg-status-approved_bg text-status-approved',
    rejected: 'bg-status-rejected_bg text-status-rejected',
  };
  const label = status.replace('_', ' ').toUpperCase();
  return (
    <div className="flex gap-2">
      <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.not_started}`}>{label}</span>
      {isOverdue && <span className="px-2 py-1 text-xs font-medium rounded bg-status-rejected_bg text-status-rejected uppercase">Overdue</span>}
    </div>
  );
}