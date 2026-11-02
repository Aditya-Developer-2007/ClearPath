import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOfficerQueueAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import {
  AlertTriangle,
  ArrowRight,
  RefreshCw,
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
    return { text: 'Due today', color: 'text-amber-700 font-semibold', chip: 'bg-amber-50 text-amber-800 border border-amber-200/80', isOverdue: false };
  }
  if (diffDays <= 2) {
    return { text: `${diffDays}d left`, color: 'text-amber-700 font-semibold', chip: 'bg-amber-50 text-amber-800 border border-amber-200/80', isOverdue: false };
  }
  return { text: `${diffDays}d left`, color: 'text-slate-700', chip: 'bg-slate-100 text-slate-800 border border-slate-200/80', isOverdue: false };
}

const FILTERS = ['All', 'Needs action', 'High risk', 'Pending', 'Due today', 'Overdue'];

const DEPARTMENTS = [
  { id: 'all', label: 'All Jurisdictions' },
  { id: 'Safety', label: 'Safety & Fire' },
  { id: 'Environment', label: 'Environment' },
  { id: 'Industrial', label: 'Industrial / DISH' },
  { id: 'Labour', label: 'Labour' },
  { id: 'Utilities', label: 'Utilities & Power' },
];

export default function OfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedDept, setSelectedDept] = useState('all');

  const load = useCallback(() => {
    setLoading(true);
    getOfficerQueueAPI()
      .then((res) => {
        setQueue(res.data);
        setError(false);
      })
      .catch(() => {
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // ── Stat calculations ──────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const pending = queue.filter((r) => !['approved', 'rejected'].includes(r.status)).length;
    const dueToday = queue.filter((r) => {
      if (['approved', 'rejected'].includes(r.status)) return false;
      const d = Math.ceil((new Date(r.slaDeadline) - Date.now()) / 86400000);
      return d === 0;
    }).length;
    const overdue = queue.filter((r) => {
      if (['approved', 'rejected'].includes(r.status)) return false;
      return new Date(r.slaDeadline) < Date.now();
    }).length;
    const escalated = queue.filter((r) => r.escalated).length;
    return { pending, dueToday, overdue, escalated };
  }, [queue]);

  // ── Department counts ──────────────────────────────────────────────────────
  const deptCounts = useMemo(() => {
    const counts = { all: queue.length };
    DEPARTMENTS.forEach((d) => {
      if (d.id !== 'all') {
        counts[d.id] = queue.filter((r) => {
          if (d.id === 'Safety') return r.department === 'Safety' || r.department === 'Fire Dept';
          return r.department === d.id;
        }).length;
      }
    });
    return counts;
  }, [queue]);

  // ── Filtered by department ─────────────────────────────────────────────────
  const deptFilteredRows = useMemo(() => {
    if (selectedDept === 'all') return queue;
    return queue.filter((r) => {
      if (selectedDept === 'Safety') return r.department === 'Safety' || r.department === 'Fire Dept';
      return r.department === selectedDept;
    });
  }, [queue, selectedDept]);

  // ── Filter counts for chips ────────────────────────────────────────────────
  const filterCounts = useMemo(() => {
    return {
      All: deptFilteredRows.length,
      'Needs action': deptFilteredRows.filter((r) => r.status === 'submitted' || r.warningsCount > 0 || r.escalated).length,
      'High risk': deptFilteredRows.filter((r) => r.riskTier === 'high').length,
      Pending: deptFilteredRows.filter((r) => !['approved', 'rejected'].includes(r.status)).length,
      'Due today': deptFilteredRows.filter((r) => {
        if (['approved', 'rejected'].includes(r.status)) return false;
        const d = Math.ceil((new Date(r.slaDeadline) - Date.now()) / 86400000);
        return d === 0;
      }).length,
      Overdue: deptFilteredRows.filter((r) => {
        if (['approved', 'rejected'].includes(r.status)) return false;
        return new Date(r.slaDeadline) < Date.now();
      }).length,
    };
  }, [deptFilteredRows]);

  // ── Filtered rows ──────────────────────────────────────────────────────────
  const filteredRows = useMemo(() => {
    let list = deptFilteredRows;
    switch (activeFilter) {
      case 'Needs action':
        list = list.filter((r) => r.status === 'submitted' || r.warningsCount > 0 || r.escalated);
        break;
      case 'High risk':
        list = list.filter((r) => r.riskTier === 'high');
        break;
      case 'Pending':
        list = list.filter((r) => !['approved', 'rejected'].includes(r.status));
        break;
      case 'Due today':
        list = list.filter((r) => {
          if (['approved', 'rejected'].includes(r.status)) return false;
          const d = Math.ceil((new Date(r.slaDeadline) - Date.now()) / 86400000);
          return d === 0;
        });
        break;
      case 'Overdue':
        list = list.filter((r) => {
          if (['approved', 'rejected'].includes(r.status)) return false;
          return new Date(r.slaDeadline) < Date.now();
        });
        break;
      default:
        break;
    }

    return [...list].sort((a, b) => {
      const aDone = ['approved', 'rejected'].includes(a.status);
      const bDone = ['approved', 'rejected'].includes(b.status);
      if (aDone !== bDone) return aDone ? 1 : -1;

      if (a.escalated !== b.escalated) return (b.escalated ? 1 : 0) - (a.escalated ? 1 : 0);

      const aOverdue = new Date(a.slaDeadline) < Date.now();
      const bOverdue = new Date(b.slaDeadline) < Date.now();
      if (aOverdue !== bOverdue) return (bOverdue ? 1 : 0) - (aOverdue ? 1 : 0);

      const aTime = a.slaDeadline ? new Date(a.slaDeadline).getTime() : 0;
      const bTime = b.slaDeadline ? new Date(b.slaDeadline).getTime() : 0;
      if (aTime !== bTime) return aTime - bTime;

      return String(a.id).localeCompare(String(b.id));
    });
  }, [deptFilteredRows, activeFilter]);

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
            {user?.name || 'Vikramaditya Sinh'}, {user?.department || 'Fire & Industrial Safety'}
          </p>
        </div>
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

      {/* Departmental Jurisdiction Filter Bar */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-2.5 shadow-2xs stagger-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 shrink-0">
            Jurisdiction:
          </span>
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98] ${
                selectedDept === dept.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <span>{dept.label}</span>
              <span
                className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                  selectedDept === dept.id ? 'bg-slate-800 text-teal-300' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {deptCounts[dept.id] || 0}
              </span>
            </button>
          ))}
        </div>
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
