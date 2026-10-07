import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOfficerQueueAPI } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import { ShieldAlert, AlertTriangle, ArrowRight, RefreshCw } from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
function getSLAInfo(deadline, status) {
  if (['approved', 'rejected'].includes(status)) {
    return { text: 'Done', color: 'text-gray-400', chip: 'bg-gray-100 text-gray-500', isOverdue: false };
  }
  if (!deadline) return { text: 'No SLA', color: 'text-gray-400', chip: 'bg-gray-100 text-gray-500', isOverdue: false };
  const diffDays = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (diffDays < 0)
    return { text: 'OVERDUE', color: 'text-status-rejected', chip: 'bg-red-100 text-red-700', isOverdue: true };
  if (diffDays === 0)
    return { text: 'Due today', color: 'text-orange-600', chip: 'bg-orange-100 text-orange-700', isOverdue: false };
  if (diffDays <= 2)
    return { text: `${diffDays}d left`, color: 'text-orange-600', chip: 'bg-orange-100 text-orange-700', isOverdue: false };
  return { text: `${diffDays}d left`, color: 'text-text', chip: 'bg-gray-100 text-gray-600', isOverdue: false };
}

function getRelativeTime(dateStr) {
  if (!dateStr) return 'Never';
  const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function EscalatedQueue() {
  const navigate = useNavigate();
  const [allRows, setAllRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getOfficerQueueAPI()
      .then((res) => {
        setAllRows(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => { load(); }, [load]);

  // Sorted: overdue first, then soonest SLA
  const escalated = useMemo(
    () =>
      allRows
        .filter((r) => r.escalated)
        .sort((a, b) => {
          const slaA = getSLAInfo(a.slaDeadline, a.status);
          const slaB = getSLAInfo(b.slaDeadline, b.status);
          if (slaA.isOverdue && !slaB.isOverdue) return -1;
          if (!slaA.isOverdue && slaB.isOverdue) return 1;
          return new Date(a.slaDeadline) - new Date(b.slaDeadline);
        }),
    [allRows],
  );

  // ── Loading ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <SkeletonCard /><SkeletonCard /><SkeletonCard />
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState message="Failed to load escalated queue." />
        <div className="mt-4 flex justify-center">
          <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded text-sm">
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap stagger-1">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Escalated</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            <span className="font-mono font-bold text-rose-600">{escalated.length}</span>{' '}
            case{escalated.length !== 1 ? 's' : ''} requiring priority attention
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all duration-75 active:scale-[0.97]"
        >
          <RefreshCw size={14} strokeWidth={2.5} /> Refresh
        </button>
      </div>

      {/* Info strip */}
      <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-4 text-sm text-rose-900 flex items-start gap-3 shadow-sm stagger-2">
        <ShieldAlert size={18} className="shrink-0 text-rose-600 mt-0.5" strokeWidth={2.5} />
        <div className="font-medium">
          <strong className="font-bold text-rose-950">Escalated cases</strong> are approvals where the SLA has been breached or a senior officer was
          requested. They require priority review.
        </div>
      </div>

      {escalated.length === 0 ? (
        <EmptyState message="No escalated cases right now." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white shadow-xl border border-slate-200/50 rounded-2xl overflow-hidden stagger-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <th className="w-1.5 p-0" />
                  <th className="px-5 py-4 text-left">Applicant / Unit</th>
                  <th className="px-5 py-4 text-left">Approval</th>
                  <th className="px-5 py-4 text-left">Risk</th>
                  <th className="px-5 py-4 text-left">SLA</th>
                  <th className="px-5 py-4 text-left">Escalated from</th>
                  <th className="px-5 py-4 text-left">Status</th>
                  <th className="px-5 py-4 text-left">Flags</th>
                  <th className="px-5 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {escalated.map((row) => {
                  const sla = getSLAInfo(row.slaDeadline, row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/officer/review/${row.id}`)}
                      className="cursor-pointer transition-all duration-150 hover:bg-rose-50/40 group"
                    >
                      <td className="p-0 w-1.5">
                        <div className="w-1.5" style={{ backgroundColor: '#e11d48', minHeight: '4.5rem' }} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 group-hover:text-rose-700 transition-colors">{row.applicantName}</div>
                        <div className="text-xs font-medium text-slate-500 truncate max-w-[160px] mt-0.5">{row.unitName}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900">{row.name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-0.5">{row.department}</div>
                      </td>
                      <td className="px-5 py-4">
                        <RiskBadge tier={row.riskTier} />
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-mono tabular-nums tracking-tight text-xs px-2 py-0.5 rounded ${sla.chip}`}>
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-bold text-slate-700">{row.escalatedFrom || '\u2014'}</span>
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.warningsCount > 0 && (
                            <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/80">
                              <AlertTriangle size={12} strokeWidth={2.5} /> {row.warningsCount}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 border border-rose-200/80 px-1.5 py-0.5 rounded">
                            <ShieldAlert size={12} strokeWidth={2.5} /> Escalated
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/officer/review/${row.id}`); }}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 transition-all duration-75 active:scale-[0.97] shadow-sm"
                        >
                          Review <ArrowRight size={14} strokeWidth={2.5} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-4 stagger-3">
            {escalated.map((row) => {
              const sla = getSLAInfo(row.slaDeadline, row.status);
              return (
                <div
                  key={row.id}
                  onClick={() => navigate(`/officer/review/${row.id}`)}
                  className="bg-white border border-rose-200/75 rounded-2xl shadow-sm hover:shadow-md cursor-pointer active:scale-[0.98] transition-all duration-200 flex overflow-hidden"
                >
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: '#e11d48' }} />
                  <div className="flex-1 p-5 space-y-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-slate-900 text-sm">{row.name}</div>
                        <div className="text-xs font-medium text-slate-500 mt-1 truncate">{row.applicantName} &bull; {row.unitName}</div>
                      </div>
                      <span className={`font-mono tabular-nums tracking-tight text-xs px-2 py-0.5 rounded shrink-0 ${sla.chip}`}>
                        {sla.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge tier={row.riskTier} />
                      <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-rose-800 bg-rose-50 px-1.5 py-0.5 border border-rose-200/80 rounded">
                        <ShieldAlert size={12} strokeWidth={2.5} /> Escalated
                      </span>
                      {row.warningsCount > 0 && (
                        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200/80 rounded">
                          <AlertTriangle size={12} strokeWidth={2.5} /> {row.warningsCount}
                        </span>
                      )}
                    </div>
                    {row.escalatedFrom && (
                      <div className="text-xs text-slate-500">
                        <span className="font-bold text-slate-700">Escalated from:</span> {row.escalatedFrom}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                      <span className="text-xs text-slate-400 font-mono font-bold tracking-wider">
                        Updated {getRelativeTime(row.lastActionAt)}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600">
                        Review <ArrowRight size={14} strokeWidth={2.5} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
