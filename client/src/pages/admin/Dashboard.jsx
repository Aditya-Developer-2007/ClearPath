import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAdminAnalyticsAPI, fastForwardAPI, getAdminInsightsAPI, resetMockDataAPI } from '../../lib/api';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import {
  Sparkles,
  RefreshCw,
  AlertTriangle,
  Clock,
  FastForward,
  Building2,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [fastForwarding, setFastForwarding] = useState(false);
  const [ffResult, setFfResult] = useState(null);
  const [newlyEscalatedIds, setNewlyEscalatedIds] = useState([]);
  const [insights, setInsights] = useState(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getAdminAnalyticsAPI();
      setData(res.data);
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

  const handleFastForward = async (days) => {
    setFastForwarding(true);
    try {
      const res = await fastForwardAPI(days);
      const newly = res.data?.newlyEscalated || [];
      setFfResult({ shifted: res.data?.shifted ?? 0, days, count: newly.length });
      setNewlyEscalatedIds(newly);
      await load();
    } catch {
      // ignore
    } finally {
      setFastForwarding(false);
    }
  };

  const handleGenerateInsights = async () => {
    if (!data) return;
    setGeneratingInsights(true);
    try {
      const res = await getAdminInsightsAPI(data);
      setInsights(res.data?.insights || []);
    } catch {
      // ignore
    } finally {
      setGeneratingInsights(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    await resetMockDataAPI();
    setFfResult(null);
    setNewlyEscalatedIds([]);
    setInsights(null);
    await load();
  };

  const maxAvgDays = useMemo(() => {
    if (!data?.byDepartment) return 30;
    const max = Math.max(...data.byDepartment.map((d) => d.avgDays), 25);
    return Math.ceil(max / 5) * 5;
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-headings text-[#0A1128]">Delay analytics</h1>
            <p className="text-sm text-gray-500 mt-1">Admin overview</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <EmptyState message="Failed to load delay analytics." />
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

  const { totals, byDepartment = [], slowest = [] } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <style>{`
        @keyframes slideInRight {
          0% { transform: translateX(12px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-escalated-slide {
            animation: none !important;
          }
        }
        .animate-escalated-slide {
          animation: slideInRight 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl font-headings text-[#0A1128]">Delay analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Admin overview</p>
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

      {/* Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Applications
            </span>
            <Building2 size={16} className="text-gray-400" />
          </div>
          <div className="mt-2 text-3xl font-mono text-[#0A1128]">{totals.applications}</div>
          <div className="text-xs text-gray-400 mt-1">across active industrial units</div>
        </div>

        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              SLA breaches
            </span>
            <Clock size={16} className={totals.breaches > 0 ? 'text-status-rejected' : 'text-gray-400'} />
          </div>
          <div
            className={`mt-2 text-3xl font-mono ${
              totals.breaches > 0 ? 'text-status-rejected' : 'text-[#0A1128]'
            }`}
          >
            {totals.breaches}
          </div>
          <div className="text-xs text-gray-400 mt-1">past standard statutory deadline</div>
        </div>

        <div className="bg-white border border-border rounded-lg p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Escalations
            </span>
            <ShieldAlert size={16} className={totals.escalations > 0 ? 'text-status-rejected' : 'text-gray-400'} />
          </div>
          <div
            className={`mt-2 text-3xl font-mono ${
              totals.escalations > 0 ? 'text-status-rejected' : 'text-[#0A1128]'
            }`}
          >
            {totals.escalations}
          </div>
          <div className="text-xs text-gray-400 mt-1">transferred to senior oversight</div>
        </div>
      </div>

      {/* Demo Fast-Forward Control */}
      <div className="bg-white border border-border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FastForward size={16} className="text-primary" />
              <h2 className="text-sm font-semibold text-[#0A1128]">Demo control</h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                Simulation
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Advance calendar time to test statutory SLA breach thresholds and automated officer reassignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleFastForward(1)}
              disabled={fastForwarding}
              className="px-2.5 py-1 text-xs border border-border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-gray-700"
            >
              +1 day
            </button>
            <button
              onClick={() => handleFastForward(5)}
              disabled={fastForwarding}
              className="px-2.5 py-1 text-xs border border-border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors font-medium text-gray-700"
            >
              +5 days
            </button>
            <button
              onClick={() => handleFastForward(10)}
              disabled={fastForwarding}
              className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-teal-800 disabled:opacity-50 transition-colors font-medium shadow-sm"
            >
              +10 days
            </button>
          </div>
        </div>

        {ffResult && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="font-mono text-gray-600">
              {ffResult.count > 0 ? (
                <span className="text-status-rejected font-semibold">
                  {ffResult.count} request{ffResult.count > 1 ? 's' : ''} newly escalated
                </span>
              ) : (
                <span className="text-gray-500">
                  {ffResult.shifted} requests shifted by {ffResult.days}d (0 newly escalated)
                </span>
              )}
            </span>
            <span className="text-[11px] text-gray-400">Store synchronized</span>
          </div>
        )}
      </div>

      {/* Bar Chart: Average days per department */}
      <div className="bg-white border border-border rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="font-headings text-base text-[#0A1128]">Average turnaround by department</h2>
            <p className="text-xs text-gray-500">
              Horizontal bars show average resolution duration. Red indicates active SLA breaches.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary inline-block" /> Within SLA
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" /> SLA Breach
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="space-y-3 pt-2">
          {byDepartment.map((d) => {
            const hasBreach = d.breaches > 0;
            const percentage = Math.min(100, Math.round((d.avgDays / maxAvgDays) * 100));

            return (
              <div key={d.dept} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-800">{d.dept}</span>
                  <div className="flex items-center gap-2 font-mono">
                    {hasBreach && (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-red-100 text-red-800">
                        {d.breaches} breach{d.breaches > 1 ? 'es' : ''}
                      </span>
                    )}
                    <span className="text-gray-500 font-semibold">{d.avgDays}d avg</span>
                    <span className="text-gray-400 text-[11px]">({d.pending} open)</span>
                  </div>
                </div>

                <div className="w-full h-5 bg-gray-100 rounded overflow-hidden flex items-center">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full transition-all duration-500 flex items-center justify-end pr-2 ${
                      hasBreach ? 'bg-red-500' : 'bg-primary'
                    }`}
                  >
                    {percentage > 20 && (
                      <span className="text-[10px] text-white font-mono font-bold">
                        {d.avgDays}d
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Text alternative / summary for accessibility */}
        <div className="pt-3 border-t border-gray-100">
          <details className="text-xs text-gray-600">
            <summary className="cursor-pointer font-medium hover:text-text">
              View data table summary (accessible)
            </summary>
            <table className="w-full mt-2 text-left text-xs border border-border rounded">
              <thead className="bg-gray-50 text-gray-700">
                <tr>
                  <th className="p-2 border-b">Department</th>
                  <th className="p-2 border-b">Average Days</th>
                  <th className="p-2 border-b">Open Approvals</th>
                  <th className="p-2 border-b">SLA Breaches</th>
                </tr>
              </thead>
              <tbody>
                {byDepartment.map((d) => (
                  <tr key={d.dept} className="border-b last:border-b-0">
                    <td className="p-2 font-medium">{d.dept}</td>
                    <td className="p-2 font-mono">{d.avgDays} days</td>
                    <td className="p-2 font-mono">{d.pending}</td>
                    <td className="p-2 font-mono text-status-rejected">{d.breaches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </div>
      </div>

      {/* Slowest approvals list */}
      <div className="bg-white border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <h2 className="font-headings text-base text-[#0A1128]">Slowest approvals</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Active filings prioritized by statutory delay and escalation status.
          </p>
        </div>

        <div className="divide-y divide-border">
          {slowest.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-400">No active approvals found.</div>
          ) : (
            slowest.map((row) => {
              const isNewlyEscalated = newlyEscalatedIds.includes(row.id);
              const isEscalated = row.escalated || isNewlyEscalated;
              const isOverdue = row.overdueDays > 0;

              return (
                <div
                  key={row.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    isNewlyEscalated
                      ? 'border-l-4 border-l-red-500 bg-red-50/20'
                      : isEscalated
                      ? 'border-l-4 border-l-red-400'
                      : 'hover:bg-gray-50/50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-[#0A1128]">{row.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                        {row.dept}
                      </span>
                      {isEscalated && (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-red-100 text-red-800 ${
                            isNewlyEscalated ? 'animate-escalated-slide' : ''
                          }`}
                        >
                          Escalated
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">Applicant: {row.applicantName}</div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono self-start sm:self-center">
                    <span className="text-gray-600">
                      Days taken: <strong>{row.daysTaken}d</strong>
                    </span>
                    {isOverdue ? (
                      <span className="text-status-rejected font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> {row.overdueDays}d overdue
                      </span>
                    ) : (
                      <span className="text-teal-700 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Within SLA
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* AI Insight Box */}
      <div className="bg-white border border-teal-200 rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-100">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-teal-100 text-teal-800">
              <Sparkles size={14} />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-teal-900">
                AI suggestion. Admins decide.
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                Algorithmic anomaly detection and regulatory optimization recommendations.
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerateInsights}
            disabled={generatingInsights}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded text-xs font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors shadow-sm"
          >
            <RefreshCw size={12} className={generatingInsights ? 'animate-spin' : ''} />
            {generatingInsights ? 'Analyzing…' : 'Generate insights'}
          </button>
        </div>

        {insights && insights.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {insights.map((item, idx) => (
              <div key={idx} className="p-3 bg-teal-50/60 border border-teal-100 rounded-lg space-y-1.5">
                <div className="text-xs font-semibold text-teal-950 flex items-center gap-1.5">
                  <span className="text-teal-600 font-mono text-[11px] font-bold">0{idx + 1}.</span>
                  {item.title}
                </div>
                <div className="text-xs text-gray-700 leading-relaxed">{item.action}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center text-xs text-gray-400">
            Click <strong>Generate insights</strong> to synthesize department bottlenecks, escalation risks, and joint inspection clustering recommendations.
          </div>
        )}
      </div>
    </div>
  );
}
