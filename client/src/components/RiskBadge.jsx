import React from 'react';

const RISK_CONFIG = {
  low: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
  medium: 'bg-amber-50 text-amber-800 border-amber-200/80',
  high: 'bg-rose-50 text-rose-800 border-rose-200/80',
};

export default function RiskBadge({ tier }) {
  const normalized = (tier || 'low').toLowerCase();
  const style = RISK_CONFIG[normalized] || RISK_CONFIG.low;
  return (
    <span className={`px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase rounded border ${style}`}>
      {tier} Risk
    </span>
  );
}