import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOfficerQueueAPI, resetMockDataAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import useSharedTimer from '../../hooks/useSharedTimer';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
function getSLAInfo(deadline, status) {
  if (['approved', 'rejected'].includes(status)) {
    return { text: 'Done', color: 'text-slate-400', chip: 'bg-slate-50 text-slate-600 border border-slate-200/80', isOverdue: false };
  }
  const diffDays = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (diffDays < 0) {
    return { text: 'OVERDUE', color: 'text-rose-700 font-semibold', chip: 'bg-rose-50 text-rose-800 border border-rose-200/80 font-semibold', isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: 'Due today', color: 'text-amber-700 font-semibold', chip: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold', isOverdue: false };
  }
  if (diffDays <= 2) {
    return { text: `${diffDays}d left`, color: 'text-amber-700 font-semibold', chip: 'bg-amber-50 text-amber-800 border border-amber-200/80 font-semibold', isOverdue: false };
  }
  return { text: `${diffDays}d left`, color: 'text-slate-700', chip: 'bg-slate-50 text-slate-700 border border-slate-200/80', isOverdue: false };
}

function urgencyScore(row) {
  if (['approved', 'rejected'].includes(row.status)) return 0;
  const sla = getSLAInfo(row.slaDeadline, row.status);
  if (sla.isOverdue && row.escalated) return 100;
  if (sla.isOverdue) return 90;
  if (row.escalated) return 80;
  const diffDays = Math.ceil((new Date(row.slaDeadline) - Date.now()) / 86400000);
  if (diffDays <= 1) return 70;
  if (diffDays <= 2) return 60;
  return Math.max(10, 50 - diffDays);
}

const FILTERS = ['All', 'Overdue', 'High risk', 'Needs review'];

// ── Component ──────────────────────────────────────────────────────────────
export default function OfficerQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const now = useSharedTimer();

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getOfficerQueueAPI()
      .then((res) => {
        setRows(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Derived stats ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const active = rows.filter((r) => !['approved', 'rejected'].includes(r.status));
    const overdue = active.filter((r) => new Date(r.slaDeadline) < now);
    const dueToday = active.filter((r) => {
      const d = Math.ceil((new Date(r.slaDeadline) - now) / 86400000);
      return d >= 0 && d <= 0;
    });
    const escalated = rows.filter((r) => r.escalated);
    return {
      pending: active.length,
      dueToday: dueToday.length,
      overdue: overdue.length,
      escalated: escalated.length,
    };
  }, [rows, now]);

  // ── Filter counts ──────────────────────────────────────────────────────
  const filterCounts = useMemo(() => ({
    All: rows.length,
    Overdue: rows.filter((r) => getSLAInfo(r.slaDeadline, r.status).isOverdue).length,
    'High risk': rows.filter((r) => r.riskTier === 'high').length,
    'Needs review': rows.filter((r) => r.warningsCount > 0 && !['approved', 'rejected'].includes(r.status)).length,
  }), [rows]);

  // ── Sorted + filtered rows ─────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let subset = [...rows];
    if (activeFilter === 'Overdue') {
      subset = subset.filter((r) => getSLAInfo(r.slaDeadline, r.status).isOverdue);
    } else if (activeFilter === 'High risk') {
      subset = subset.filter((r) => r.riskTier === 'high');
    } else if (activeFilter === 'Needs review') {
      subset = subset.filter((r) => r.warningsCount > 0 && !['approved', 'rejected'].includes(r.status));
    }
    return subset.sort((a, b) => {
      const scoreDiff = urgencyScore(b) - urgencyScore(a);
      if (scoreDiff !== 0) return scoreDiff;
      const timeA = new Date(a.slaDeadline).getTime();
      const timeB = new Date(b.slaDeadline).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });
  }, [rows, activeFilter]);

  const handleReset = () => {
    resetMockDataAPI().then(() => load());
  };

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState message="Failed to load queue." />
        <div className="mt-4 flex justify-center">
          <button
            onClick={load}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded text-sm font-medium"
          >
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap stagger-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Review queue</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {user?.name || 'Bob Officer'}, {user?.department || 'Fire Dept'}
          </p>
        </div>
        {import.meta.env.DEV && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={11} /> Reset demo
          </button>
        )}
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-2">
        {[
          { label: 'Pending', value: stats.pending, accent: '' },
          { label: 'Due today', value: stats.dueToday, accent: stats.dueToday > 0 ? 'text-amber-600' : '' },
          { label: 'Overdue', value: stats.overdue, accent: stats.overdue > 0 ? 'text-rose-600' : '' },
          { label: 'Escalated', value: stats.escalated, accent: stats.escalated > 0 ? 'text-rose-600' : '' },
        ].map((s, i) => (
          <div key={s.label} className={`bg-white border border-slate-200/75 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 stagger-${Math.min(i + 2, 7)}`}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2">{s.label}</div>
            <div className={`text-4xl font-mono tabular-nums tracking-tight font-bold ${s.accent || 'text-slate-900'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap stagger-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-75 active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none ${
              activeFilter === f
                ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900 shadow-sm'
            }`}
          >
            {f}
            <span className={`font-mono tabular-nums text-[11px] ${activeFilter === f ? 'text-white/80' : 'text-slate-400'}`}>
              {filterCounts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* Table / cards */}
      {filteredRows.length === 0 ? (
        <EmptyState message="Nothing to review." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white shadow-xl border border-slate-200/50 rounded-2xl overflow-hidden stagger-5">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="px-5 py-4 text-left">Applicant / Unit</th>
                  <th className="px-5 py-4 text-left">Approval</th>
                  <th className="px-5 py-4 text-left">Risk</th>
                  <th className="px-5 py-4 text-left">SLA</th>
                  <th className="px-5 py-4 text-left">Flags</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => {
                  const sla = getSLAInfo(row.slaDeadline, row.status);
                  const done = ['approved', 'rejected'].includes(row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/officer/review/${row.id}`)}
                      className={`cursor-pointer transition-all duration-150 hover:bg-slate-50/80 group ${done ? 'opacity-50' : ''}`}
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 tracking-tight group-hover:text-slate-600 transition-colors">{row.applicantName}</div>
                        <div className="text-xs font-medium text-slate-500 truncate max-w-[180px] mt-0.5">{row.unitName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 tracking-tight">{row.name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{row.department}</div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge tier={row.riskTier} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono tabular-nums tracking-tight text-xs px-2 py-0.5 rounded ${sla.chip}`}>
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.warningsCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded font-medium">
                              <AlertTriangle size={11} strokeWidth={1.75} /> {row.warningsCount} warning{row.warningsCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {row.escalated && (
                            <span className="flex items-center gap-1 text-[11px] text-rose-800 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded font-semibold">
                              <ShieldAlert size={11} strokeWidth={1.75} /> Escalated
                            </span>
                          )}
                          {!row.warningsCount && !row.escalated && (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/officer/review/${row.id}`); }}
                          disabled={done}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold active:scale-[0.97] transition-all duration-75 focus-visible:ring-2 focus-visible:ring-slate-900 focus:outline-none ${
                            done
                              ? 'text-slate-400 border border-slate-200 cursor-not-allowed bg-slate-50 shadow-none'
                              : 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
                          }`}
                        >
                          Review <ArrowRight size={12} strokeWidth={3} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3 stagger-5">
            {filteredRows.map((row) => {
              const sla = getSLAInfo(row.slaDeadline, row.status);
              const done = ['approved', 'rejected'].includes(row.status);
              return (
                <div
                  key={row.id}
                  onClick={() => navigate(`/officer/review/${row.id}`)}
                  className={`bg-white border border-slate-200/75 hover:border-slate-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-[0.98] ${done ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-sm tracking-tight">{row.name}</div>
                      <div className="text-xs font-medium text-slate-500 mt-0.5">{row.applicantName} · {row.unitName}</div>
                    </div>
                    <span className={`font-mono tabular-nums tracking-tight text-xs px-2 py-0.5 rounded shrink-0 ${sla.chip}`}>
                      {sla.text}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 flex-wrap">
                    <RiskBadge tier={row.riskTier} />
                    <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                    {row.escalated && (
                      <span className="flex items-center gap-1 text-[11px] text-rose-800 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        <ShieldAlert size={12} strokeWidth={2} /> Escalated
                      </span>
                    )}
                    {row.warningsCount > 0 && (
                      <span className="flex items-center gap-1 text-[11px] text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                        <AlertTriangle size={12} strokeWidth={2} /> {row.warningsCount}
                      </span>
                    )}
                  </div>
                  {!done && (
                    <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                        Review <ArrowRight size={14} strokeWidth={2.5} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
