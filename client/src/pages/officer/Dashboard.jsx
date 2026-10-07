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
    return { text: 'Done', color: 'text-gray-400', chip: 'bg-gray-100 text-gray-500', isOverdue: false };
  }
  const diffDays = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (diffDays < 0) {
    return { text: 'OVERDUE', color: 'text-status-rejected', chip: 'bg-red-100 text-red-700', isOverdue: true };
  }
  if (diffDays === 0) {
    return { text: 'Due today', color: 'text-orange-600', chip: 'bg-orange-100 text-orange-700', isOverdue: false };
  }
  if (diffDays <= 2) {
    return { text: `${diffDays}d left`, color: 'text-orange-600', chip: 'bg-orange-100 text-orange-700', isOverdue: false };
  }
  return { text: `${diffDays}d left`, color: 'text-text', chip: 'bg-gray-100 text-gray-600', isOverdue: false };
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
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-headings text-[#0A1128]">Review queue</h1>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending', value: stats.pending, accent: '' },
          { label: 'Due today', value: stats.dueToday, accent: stats.dueToday > 0 ? 'text-orange-600' : '' },
          { label: 'Overdue', value: stats.overdue, accent: stats.overdue > 0 ? 'text-status-rejected' : '' },
          { label: 'Escalated', value: stats.escalated, accent: stats.escalated > 0 ? 'text-red-600' : '' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-border rounded p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{s.label}</div>
            <div className={`text-3xl font-mono font-bold ${s.accent || 'text-[#0A1128]'}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeFilter === f
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-gray-600 border-border hover:border-primary hover:text-primary'
            }`}
          >
            {f}
            <span className={`font-mono text-xs ${activeFilter === f ? 'text-white/80' : 'text-gray-400'}`}>
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
          <div className="hidden md:block bg-white border border-border rounded shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/60 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-3 text-left">Applicant / Unit</th>
                  <th className="px-4 py-3 text-left">Approval</th>
                  <th className="px-4 py-3 text-left">Risk</th>
                  <th className="px-4 py-3 text-left">SLA</th>
                  <th className="px-4 py-3 text-left">Flags</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRows.map((row) => {
                  const sla = getSLAInfo(row.slaDeadline, row.status);
                  const done = ['approved', 'rejected'].includes(row.status);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/officer/review/${row.id}`)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50/70 ${done ? 'opacity-60' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[#0A1128]">{row.applicantName}</div>
                        <div className="text-xs text-gray-500 truncate max-w-[180px]">{row.unitName}</div>
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
                        <div className="flex items-center gap-2 flex-wrap">
                          {row.warningsCount > 0 && (
                            <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                              <AlertTriangle size={11} /> {row.warningsCount} warning{row.warningsCount > 1 ? 's' : ''}
                            </span>
                          )}
                          {row.escalated && (
                            <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-semibold">
                              <ShieldAlert size={11} /> Escalated
                            </span>
                          )}
                          {!row.warningsCount && !row.escalated && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/officer/review/${row.id}`); }}
                          disabled={done}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                            done
                              ? 'text-gray-400 border border-gray-200 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-teal-800'
                          }`}
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

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredRows.map((row) => {
              const sla = getSLAInfo(row.slaDeadline, row.status);
              const done = ['approved', 'rejected'].includes(row.status);
              return (
                <div
                  key={row.id}
                  onClick={() => navigate(`/officer/review/${row.id}`)}
                  className={`bg-white border border-border rounded p-4 shadow-sm cursor-pointer active:bg-gray-50 ${done ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-[#0A1128] text-sm">{row.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{row.applicantName} · {row.unitName}</div>
                    </div>
                    <span className={`font-mono text-xs font-semibold px-2 py-1 rounded shrink-0 ${sla.chip}`}>
                      {sla.text}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <RiskBadge tier={row.riskTier} />
                    <StatusBadge status={row.status} isOverdue={sla.isOverdue} />
                    {row.escalated && (
                      <span className="flex items-center gap-1 text-xs text-red-700 bg-red-50 px-1.5 py-0.5 rounded font-semibold">
                        <ShieldAlert size={11} /> Escalated
                      </span>
                    )}
                    {row.warningsCount > 0 && (
                      <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        <AlertTriangle size={11} /> {row.warningsCount}
                      </span>
                    )}
                  </div>
                  {!done && (
                    <div className="mt-3 flex justify-end">
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        Review <ArrowRight size={12} />
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
