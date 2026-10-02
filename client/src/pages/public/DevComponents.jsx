import React from 'react';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import SLATimer from '../../components/SLATimer';
import ApprovalCard from '../../components/ApprovalCard';
import RouteTrack from '../../components/RouteTrack';
import Thread from '../../components/Thread';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatCard from '../../components/StatCard';
import { approvals } from '../../mocks';

export default function DevComponents() {
  return (
    <div className="space-y-8 max-w-4xl">
      <h1 className="text-3xl font-headings mb-8">Component Library</h1>
      
      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Status Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <StatusBadge status="not_started" />
          <StatusBadge status="in_review" />
          <StatusBadge status="query_raised" />
          <StatusBadge status="approved" />
          <StatusBadge status="rejected" />
          <StatusBadge status="overdue" />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Risk Badges</h2>
        <div className="flex gap-4 flex-wrap">
          <RiskBadge tier="low" />
          <RiskBadge tier="medium" />
          <RiskBadge tier="high" />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">SLA Timer</h2>
        <div className="flex gap-8 border border-border p-4 rounded bg-white w-max">
          <SLATimer deadline="dummy-1" />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Route Track</h2>
        <div className="border border-border p-8 rounded bg-white max-w-md">
          <RouteTrack currentStep="Review" />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ApprovalCard approval={approvals[0]} />
          <ApprovalCard approval={approvals[6]} />
          <SkeletonCard />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Stats & States</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StatCard title="Total Approvals" value="1,234" />
          <EmptyState />
        </div>
      </section>

      <section>
        <h2 className="text-xl mb-4 border-b border-border pb-2">Thread</h2>
        <div className="max-w-md">
          <Thread />
        </div>
      </section>
    </div>
  );
}
