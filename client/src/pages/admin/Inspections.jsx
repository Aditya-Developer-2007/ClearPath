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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 stagger-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Inspection planner</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Group multi-department site visits into single unified inspections to reduce business disruption.
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={handleReset}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition-all duration-75 active:scale-[0.97]"
          >
            <RotateCcw size={14} strokeWidth={2.5} /> Reset demo
          </button>
        )}
      </div>

      {/* Explainer banner */}
      <div className="bg-slate-900 rounded-2xl p-6 flex items-start gap-4 shadow-xl stagger-2">
        <Sparkles size={20} className="text-teal-400 shrink-0 mt-0.5" strokeWidth={2.5} />
        <div className="text-sm font-medium text-slate-300 leading-relaxed">
          <strong className="text-slate-100 font-bold tracking-tight block mb-1">Automated Joint Visit Clustering:</strong>
          ClearPath identifies units with overlapping physical inspection mandates (e.g. Fire Safety + Environmental Clearances) and coordinates multi-agency officer visits into a single scheduled appointment.
        </div>
      </div>

      {/* Proposals list */}
      {proposals.length === 0 ? (
        <EmptyState message="No pending inspection proposals found." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-3">
          {proposals.map((proposal) => {
            const isScheduled = proposal.status === 'scheduled';
            const isBusy = schedulingId === proposal.id;
            const currentDate = slotDates[proposal.id] || proposal.proposedDate;

            return (
              <div
                key={proposal.id}
                className={`bg-white border-2 rounded-2xl p-6 md:p-8 shadow-sm hover:shadow-md flex flex-col justify-between transition-all duration-200 ${
                  isScheduled ? 'border-teal-500/30 bg-teal-50/20' : 'border-slate-200/75 hover:border-slate-300'
                }`}
              >
                <div className="space-y-4">
                  {/* Card top */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <Building2 size={18} className="text-slate-400 shrink-0" strokeWidth={2.5} />
                        <h2 className="font-bold tracking-tight text-lg text-slate-900">
                          {proposal.unitName}
                        </h2>
                      </div>
                      <div className="text-xs font-medium text-slate-500">
                        Applicant: <strong className="text-slate-800 font-bold">{proposal.applicantName}</strong>
                      </div>
                    </div>

                    {isScheduled ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 shrink-0">
                        <CheckCircle2 size={14} strokeWidth={2.5} /> Scheduled
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80 shrink-0">
                        Proposed
                      </span>
                    )}
                  </div>

                  {/* Grouped Approvals */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2.5">
                      Combined clearances
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {proposal.approvals.map((appr, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 shadow-sm"
                        >
                          {appr}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Efficiency tag */}
                  <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/80 shadow-sm">
                    <CalendarCheck size={14} className="text-teal-600" strokeWidth={2.5} />
                    <span>Saves {proposal.visitsSaved} visit{proposal.visitsSaved > 1 ? 's' : ''} for this unit</span>
                  </div>
                </div>

                {/* Card bottom: Date input + Action button */}
                <div className="pt-6 mt-6 border-t border-slate-100 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <label className="font-bold tracking-tight text-slate-700 flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" strokeWidth={2.5} />
                      Inspection date:
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => handleDateChange(proposal.id, e.target.value)}
                        disabled={isScheduled || isBusy}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono font-bold text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 disabled:bg-slate-50 disabled:text-slate-400 shadow-sm transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleSchedule(proposal.id)}
                    disabled={isScheduled || isBusy}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-75 active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm ${
                      isScheduled
                        ? 'bg-teal-50 text-teal-700 border border-teal-200/80 cursor-not-allowed shadow-none active:scale-100'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {isScheduled ? (
                      <>
                        <CheckCircle2 size={16} strokeWidth={2.5} /> Scheduled for {currentDate}
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
