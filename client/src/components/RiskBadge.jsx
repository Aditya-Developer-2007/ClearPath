import React from 'react';
export default function RiskBadge({ tier }) {
  const styles = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded uppercase ${styles[tier] || styles.low}`}>{tier} RISK</span>;
}