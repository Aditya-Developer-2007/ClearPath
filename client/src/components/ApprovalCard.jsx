import React from 'react';
import StatusBadge from './StatusBadge';
import RiskBadge from './RiskBadge';
import SLATimer from './SLATimer';

export default function ApprovalCard({ approval }) {
  return (
    <div className="border border-border rounded p-4 bg-white flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-headings">{approval.name}</h3>
        <StatusBadge status={approval.status} />
      </div>
      <div className="text-sm text-gray-600 flex gap-4">
        <span>Desk: {approval.deskNo}</span>
        <span>Dept: {approval.department}</span>
      </div>
      <div className="flex justify-between items-center mt-2 border-t border-border pt-3 text-sm">
        <RiskBadge tier={approval.riskTier} />
        <div className="flex items-center gap-2">
           <span className="text-gray-500">SLA:</span>
           <SLATimer deadline={approval.slaDeadline} />
        </div>
      </div>
    </div>
  );
}