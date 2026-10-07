import React from 'react';

const STATUS_CONFIG = {
  approved: {
    label: 'Approved',
    style: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  },
  query_raised: {
    label: 'Query Raised',
    style: 'bg-sky-50 text-sky-800 border-sky-200/80',
  },
  in_review: {
    label: 'In Review',
    style: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  under_review: {
    label: 'Under Review',
    style: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  submitted: {
    label: 'Submitted',
    style: 'bg-amber-50 text-amber-800 border-amber-200/80',
  },
  not_started: {
    label: 'Not Started',
    style: 'bg-slate-50 text-slate-700 border-slate-200/80',
  },
  rejected: {
    label: 'Rejected',
    style: 'bg-rose-50 text-rose-800 border-rose-200/80',
  },
  escalated: {
    label: 'Escalated',
    style: 'bg-rose-50 text-rose-800 border-rose-200/80',
  },
};

export default function StatusBadge({ status, isOverdue }) {
  const key = (status || 'not_started').toLowerCase();
  const cfg = STATUS_CONFIG[key] || {
    label: (status || 'Unknown').replace(/_/g, ' '),
    style: 'bg-slate-50 text-slate-700 border-slate-200/80',
  };

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <span className={`px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full border shadow-sm ${cfg.style}`}>
        {cfg.label}
      </span>
      {isOverdue && (
        <span className="px-2.5 py-0.5 text-[10px] font-bold tracking-widest uppercase rounded-full border shadow-sm bg-rose-50 text-rose-800 border-rose-200/80">
          Overdue
        </span>
      )}
    </div>
  );
}