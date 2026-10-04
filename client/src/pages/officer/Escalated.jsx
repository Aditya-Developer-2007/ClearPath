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
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-headings text-[#0A1128]">Escalated</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            <span className="font-mono font-semibold text-red-600">{escalated.length}</span>{' '}
            case{escalated.length !== 1 ? 's' : ''} requiring priority attention
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Info strip */}
      <div className="bg-red-50 border border-red-200 rounded p-4 text-sm text-red-800 flex items-start gap-3">
        <ShieldAlert size={18} className="shrink-0 text-red-600 mt-0.5" />
        <div>
          <strong>Escalated cases</strong> are approvals where the SLA has been breached or a senior officer was
          requested. They require priority review.
        </div>
      </div>

      {escalated.length === 0 ? (
        <EmptyState message="No escalated cases right now." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-border rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="w-1 p-0" />
                  <th className="px-4 py-3 text-left">Applicant / Unit</th>
                  <th className="px-4 py-3 text-left">Approval</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">SLA</th>
                  <th className="px-4 py-3 text-left">Escalated from</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Flags</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {escalated.map((row) => {
                  const sla = getSLAInfo(row.slaDeadline, row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/officer/review/${row.id}`)}
                      className="cursor-pointer transition-colors hover:bg-red-50/30"
                    >
                      <td className="p-0 w-1">
                        <div className="w-1" style={{ backgroundColor: '#ef4444', minHeight: '3.5rem' }} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0A1128]">{row.applicantName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[160px]">{row.unitName}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0A1128]">{row.name}</div>
                        <div className="text-xs text-gray-500">{row.department}</div>
                      </td>
                      <td className="px-4 py-3">
                        <RiskBadge tier={row.riskTier} />
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-semibold px-2 py-1 rounded ${sla.chip}`}>
                          {sla.text}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-700">{row.escalatedFrom || '\u2014'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.warningsCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <AlertTriangle size={11} /> {row.warningsCount}
                            </span>
                          )}
                          <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-semibold">
                            <ShieldAlert size={11} /> Escalated
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/officer/review/${row.id}`); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Review <ArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile stacked cards */}
          <div className="md:hidden space-y-3">
            {escalated.map((row) => {
              const sla = getSLAInfo(row.slaDeadline, row.status);
              return (
                <div
                  key={row.id}
                  onClick={() => navigate(`/officer/review/${row.id}`)}
                  className="bg-white border border-red-200 rounded shadow-sm cursor-pointer active:bg-red-50/30 flex overflow-hidden"
                >
                  <div className="w-1 shrink-0" style={{ backgroundColor: '#ef4444' }} />
                  <div className="flex-1 p-4 space-y-3 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#0A1128] text-sm">{row.name}</div>
                        <div className="text-xs text-gray-500 mt-0.5 truncate">{row.applicantName} {row.unitName}</div>
                      </div>
                      <span className={`font-mono text-xs font-semibold px-2 py-1 rounded shrink-0 ${sla.chip}`}>
                        {sla.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <RiskBadge tier={row.riskTier} />
                      <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-semibold">
                        <ShieldAlert size={11} /> Escalated
                      </span>
                      {row.warningsCount > 0 && (
                        <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                          <AlertTriangle size={11} /> {row.warningsCount}
                        </span>
                      )}
                    </div>
                    {row.escalatedFrom && (
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-700">Escalated from:</span> {row.escalatedFrom}
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-red-100">
                      <span className="text-xs text-gray-400 font-mono">
                        Updated {getRelativeTime(row.lastActionAt)}
                      </span>
                      <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                        Review <ArrowRight size={12} />
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
