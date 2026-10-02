import React from 'react';
export default function StatusBadge({ status }) {
  const styles = {
    not_started: 'bg-status-not_started_bg text-status-not_started',
    in_review: 'bg-status-in_review_bg text-status-in_review',
    query_raised: 'bg-status-query_raised_bg text-status-query_raised',
    approved: 'bg-status-approved_bg text-status-approved',
    rejected: 'bg-status-rejected_bg text-status-rejected',
    overdue: 'bg-status-overdue_bg text-status-overdue',
  };
  const label = status.replace('_', ' ').toUpperCase();
  return <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.not_started}`}>{label}</span>;
}