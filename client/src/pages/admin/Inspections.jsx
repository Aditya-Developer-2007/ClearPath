import React, { useState, useEffect, useCallback } from 'react';
import { getAdminInspectionsAPI, scheduleInspectionAPI, resetMockDataAPI } from '../../lib/api';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import {
  CalendarCheck,
  CheckCircle2,
  Calendar,
  Building2,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function AdminInspections() {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [slotDates, setSlotDates] = useState({});
  const [schedulingId, setSchedulingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await getAdminInspectionsAPI();
      const list = res.data || [];
      setProposals(list);
      const initialDates = {};
      list.forEach((p) => {
        initialDates[p.id] = p.proposedDate;
      });
      setSlotDates(initialDates);
      setError(false);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDateChange = (id, newDate) => {
    setSlotDates((prev) => ({ ...prev, [id]: newDate }));
  };

  const handleSchedule = async (id) => {
    const slotDate = slotDates[id];
    setSchedulingId(id);
    try {
      await scheduleInspectionAPI({ id, slotDate });
      // Re-fetch to synchronize state derived from store
      await load();
    } catch {
      // ignore
    } finally {
      setSchedulingId(null);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    await resetMockDataAPI();
    await load();
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-headings text-[#0A1128]">Inspection planner</h1>
          <p className="text-sm text-gray-500 mt-1">Coordinate joint departmental site visits</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <EmptyState message="Failed to load inspection proposals." />
        <div className="flex justify-center">
          <button
            onClick={() => {
              setLoading(true);
              load();
            }}
            className="px-4 py-2 bg-primary text-white rounded text-sm hover:bg-teal-800 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-headings text-[#0A1128]">Inspection planner</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Group multi-department site visits into single unified inspections to reduce business disruption.
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs text-gray-600 hover:text-text hover:bg-gray-50 transition-colors"
          >
            <RotateCcw size={13} /> Reset demo
          </button>
        )}
      </div>

      {/* Explainer banner */}
      <div className="bg-teal-50/60 border border-teal-200/80 rounded-lg p-4 flex items-start gap-3">
        <Sparkles size={18} className="text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-gray-700 leading-relaxed">
          <strong className="text-teal-900 block mb-0.5">Automated Joint Visit Clustering:</strong>
          ClearPath identifies units with overlapping physical inspection mandates (e.g. Fire Safety + Environmental Clearances) and coordinates multi-agency officer visits into a single scheduled appointment.
        </div>
      </div>

      {/* Proposals list */}
      {proposals.length === 0 ? (
        <EmptyState message="No pending inspection proposals found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {proposals.map((proposal) => {
            const isScheduled = proposal.status === 'scheduled';
            const isBusy = schedulingId === proposal.id;
            const currentDate = slotDates[proposal.id] || proposal.proposedDate;

            return (
              <div
                key={proposal.id}
                className={`bg-white border rounded-lg p-5 shadow-sm flex flex-col justify-between transition-all ${
                  isScheduled ? 'border-teal-200 bg-white' : 'border-border hover:border-gray-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 size={16} className="text-primary shrink-0" />
                        <h2 className="font-headings text-base text-[#0A1128]">
                          {proposal.unitName}
                        </h2>
                      </div>
                      <div className="text-xs text-gray-500">
                        Applicant: <strong className="text-gray-700">{proposal.applicantName}</strong>
                      </div>
                    </div>

                    {isScheduled ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold bg-green-50 text-status-approved border border-green-200 shrink-0">
                        <CheckCircle2 size={13} /> Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                        Proposed
                      </span>
                    )}
                  </div>

                  {/* Grouped Approvals */}
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block mb-1.5">
                      Combined clearances
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {proposal.approvals.map((appr, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs rounded font-medium bg-gray-100 text-[#0A1128] border border-gray-200"
                        >
                          {appr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Efficiency tag */}
                  <div className="inline-flex items-center gap-1.5 text-xs text-teal-800 bg-teal-50 px-2.5 py-1 rounded border border-teal-100 font-medium">
                    <CalendarCheck size={14} className="text-teal-600" />
                    <span>Saves {proposal.visitsSaved} visit{proposal.visitsSaved > 1 ? 's' : ''} for this unit</span>
                  </div>
                </div>

                {/* Card bottom: Date input + Action button */}
                <div className="pt-5 mt-5 border-t border-border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <label className="font-medium text-gray-700 flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400" />
                      Inspection date:
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => handleDateChange(proposal.id, e.target.value)}
                        disabled={isScheduled || isBusy}
                        className="px-2.5 py-1 border border-border rounded font-mono text-xs text-gray-800 focus:outline-none focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSchedule(proposal.id)}
                    disabled={isScheduled || isBusy}
                    className={`w-full py-2 px-4 rounded text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      isScheduled
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-teal-800 shadow-sm'
                    }`}
                  >
                    {isScheduled ? (
                      <>
                        <CheckCircle2 size={15} /> Scheduled for {currentDate}
                      </>
                    ) : isBusy ? (
                      'Scheduling visit…'
                    ) : (
                      'Schedule combined visit'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
