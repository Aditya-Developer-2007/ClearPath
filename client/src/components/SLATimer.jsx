import React from 'react';
import { useSharedTimer } from '../hooks/useSharedTimer';

export default function SLATimer({ deadline }) {
  const now = useSharedTimer();
  const days = deadline
    ? Math.ceil((new Date(deadline) - now) / 86400000)
    : 0;
  const isOverdue = days < 0;
  const isWarning = days >= 0 && days <= 2;
  const color = isOverdue ? 'text-status-overdue' : (isWarning ? 'text-status-in_review' : 'text-text');
  return <span className={`font-mono font-medium ${color}`}>{isOverdue ? 'OVERDUE' : `${days}d left`}</span>;
}