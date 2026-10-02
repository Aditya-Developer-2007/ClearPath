import React from 'react';
export default function SLATimer({ deadline }) {
  // Mock logic for days remaining
  const days = 1; // normally calculated
  const isOverdue = days < 0;
  const isWarning = days >= 0 && days <= 2;
  const color = isOverdue ? 'text-status-overdue' : (isWarning ? 'text-status-in_review' : 'text-text');
  return <span className={`font-mono font-medium ${color}`}>{isOverdue ? 'OVERDUE' : `${days}d left`}</span>;
}