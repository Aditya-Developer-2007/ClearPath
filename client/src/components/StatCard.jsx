import React from 'react';
export default function StatCard({ title, value }) {
  return (
    <div className="border border-border rounded p-4 bg-white">
      <h4 className="text-sm text-gray-500 mb-1">{title}</h4>
      <div className="text-2xl font-headings font-bold font-mono">{value}</div>
    </div>
  );
}