import React from 'react';
import { useSharedTimer } from '../hooks/useSharedTimer';

export default function SLATimer({ deadline }) {
  const now = useSharedTimer();
  const days = deadline
    ? Math.ceil((new Date(deadline) - now) / 86400000)
    : 0;
  const isOverdue = days < 0;
  const isWarning = days >= 0 && days <= 2;
  const color = isOverdue
    ? 'text-rose-700 font-semibold'
    : isWarning
    ? 'text-amber-700 font-semibold'
    : 'text-slate-700 font-medium';

  return (
    <span className={`font-mono tabular-nums tracking-tight text-xs ${color}`}>
      {isOverdue ? 'OVERDUE' : `${days}d left`}
    </span>
  );
}