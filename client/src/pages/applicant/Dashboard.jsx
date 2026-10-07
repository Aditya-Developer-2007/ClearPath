import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getMyApplicationsAPI, deriveApprovalMetadata, getStatePortalBadge, generateApprovalsForBusiness } from '../../lib/api';
import useSharedTimer from '../../hooks/useSharedTimer';
import { useBusiness } from '../../context/BusinessContext';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import { ShieldAlert, Info, Play, Eye, MessageSquareReply, CornerDownRight, CheckCircle2, Building2, ChevronDown, Plus, FileText, Clock, AlertTriangle, ShieldCheck, Activity, Check, Circle, AlertCircle, FileCheck2, UserRound } from 'lucide-react';

function bucketOf(r, now) {
  if (r.status === 'approved') {
    return 'approved';
  }
  const isOverdue = r.slaDeadline ? new Date(r.slaDeadline) < now : false;
  if (r.status === 'query_raised' || r.status === 'rejected' || isOverdue || r.escalated) {
    return 'needsAction';
  }
  if (['submitted', 'under_review'].includes(r.status)) {
    return 'inReview';
  }
  if (r.status === 'not_started') {
    return 'notStarted';
  }
  return 'needsAction';
}

export default function ApplicantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const now = useSharedTimer();
  const { businesses, activeBusiness, selectBusiness } = useBusiness();
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef(null);
  
  const navigate = useNavigate();
  const { setAlerts } = useOutletContext() || {};

  useEffect(() => {
    if (!switcherOpen) return;
    const handleClickOutside = (e) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target)) {
        setSwitcherOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [switcherOpen]);

  useEffect(() => {
    getMyApplicationsAPI()
      .then(res => {
        const appData = res.data.applications[0] ? { ...res.data.applications[0] } : null;
        if (appData && activeBusiness) {
          appData.approvalRequests = generateApprovalsForBusiness(activeBusiness).map(a => ({
            ...a,
            status: 'not_started', // ensure all are not_started for new businesses
            slaDeadline: new Date(Date.now() + (a.slaDays || 30) * 86400000).toISOString(),
            lastActionAt: new Date().toISOString()
          }));
        }
        setData(appData);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [activeBusiness]);

  const stats = useMemo(() => {
    if (!data?.approvalRequests) return { total: 0, needsAction: 0, inReview: 0, notStarted: 0, approved: 0 };
    const reqs = data.approvalRequests;
    const total = reqs.length;

    const counts = { approved: 0, inReview: 0, needsAction: 0, notStarted: 0 };
    reqs.forEach((r) => {
      const bucket = bucketOf(r, now);
      if (counts[bucket] !== undefined) {
        counts[bucket]++;
      }
    });

    return {
      total,
      needsAction: counts.needsAction,
      inReview: counts.inReview,
      notStarted: counts.notStarted,
      approved: counts.approved,
    };
  }, [data, now]);

  const isMismatch =
    Boolean(import.meta.env.DEV) &&
    stats.total > 0 &&
    stats.approved + stats.inReview + stats.needsAction + stats.notStarted !== stats.total;

  const sortedReqs = useMemo(() => {
    if (!data) return [];
    return [...data.approvalRequests].sort((a, b) => {
      const getScore = (r) => {
        const isOverdue = new Date(r.slaDeadline) < now && !['approved', 'rejected'].includes(r.status);
        if (isOverdue || r.escalated) return 4;
        if (r.status === 'query_raised') return 3;
        if (['submitted', 'under_review'].includes(r.status)) return 2;
        return 1;
      };
      return getScore(b) - getScore(a);
    });
  }, [data, now]);

  const pipelineStages = useMemo(() => {
    if (!sortedReqs.length) return { grouped: {}, stageOrder: [] };
    const grouped = sortedReqs
      .map(r => deriveApprovalMetadata(r, activeBusiness?.state || data?.state))
      .reduce((acc, curr) => {
        if (!acc[curr.stage]) acc[curr.stage] = [];
        acc[curr.stage].push(curr);
        return acc;
      }, {});
      
    const stageOrder = [
      { id: 'Stage A: Zero-to-land / Premises Stage', short: 'Land & Premises' },
      { id: 'Stage B: Pre-construction / Construction Stage', short: 'Construction' },
      { id: 'Stage C: Commissioning / Pre-operation Stage', short: 'Commissioning' },
      { id: 'Stage D: Industry-Specific Compliance', short: 'Industry specific' }
    ];
    return { grouped, stageOrder };
  }, [sortedReqs, activeBusiness?.state, data?.state]);

  const alerts = useMemo(() => {
    if (!data) return [];
    const arr = [];
    data.approvalRequests.forEach(r => {
      if (['approved', 'rejected'].includes(r.status)) return;
      const isOverdue = new Date(r.slaDeadline) < now;
      if (r.escalated) {
        arr.push({ id: r.id, text: `${r.name} is past SLA and was escalated to the Senior Officer.` });
      } else if (isOverdue) {
        arr.push({ id: r.id, text: `${r.name} is past SLA.` });
      } else if (r.status === 'query_raised') {
        arr.push({ id: r.id, text: `${r.name} needs your reply.` });
      }
    });
    return arr;
  }, [data, now]);

  useEffect(() => {
    if (setAlerts) setAlerts(alerts);
  }, [alerts, setAlerts]);

  const unscheduledInspections = useMemo(() => {
    if (!data) return [];
    return data.approvalRequests.filter(r => r.needsInspection && ['not_started', 'submitted', 'under_review', 'query_raised'].includes(r.status));
  }, [data]);

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'No action yet';
    const diffDays = Math.floor((now - new Date(dateStr)) / 86400000);
    if (diffDays === 0) return 'Last action today';
    if (diffDays === 1) return 'Last action 1 day ago';
    return `Last action ${diffDays} days ago`;
  };

  const getSLA = (r) => {
    if (['approved', 'rejected'].includes(r.status)) return { text: 'COMPLETED', color: 'text-gray-500', isOverdue: false };
    const diffDays = Math.ceil((new Date(r.slaDeadline) - now) / 86400000);
    if (diffDays < 0) return { text: 'OVERDUE', color: 'text-status-rejected', isOverdue: true };
    if (diffDays <= 2) return { text: `${diffDays}d left`, color: 'text-orange-600', isOverdue: false };
    return { text: `${diffDays}d left`, color: 'text-text', isOverdue: false };
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6">
        <div className="space-y-2 pb-6 border-b border-border/60">
          <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-40 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
        <div className="space-y-4"><SkeletonCard /><SkeletonCard /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <EmptyState message="Failed to load your applications." />
        <div className="mt-4 flex justify-center">
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white rounded">Retry</button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[60vh] flex flex-col items-center justify-center">
        <EmptyState message="No application yet. Find out which approvals you need." />
        <button onClick={() => navigate('/start')} className="mt-6 px-6 py-2 bg-primary text-white rounded font-medium">Start</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-6 w-full min-w-0">
      {/* Header */}
      <header className="space-y-6 pb-8 border-b border-slate-200/80 stagger-1">
        <div className="text-[10px] tracking-widest text-slate-500 font-bold mb-2 uppercase">Workspace / Dashboard</div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 break-words">
              {activeBusiness?.name || `${data.sector} Unit, ${data.city}`}
            </h1>

            <div className="relative inline-block text-left shrink-0" ref={switcherRef}>
              <button
                type="button"
                onClick={() => setSwitcherOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 hover:border-teal-500/50 hover:shadow-md text-xs font-semibold text-slate-800 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-teal-500/20 active:scale-[0.97]"
                aria-label="Switch business unit"
                aria-expanded={switcherOpen}
              >
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                <span>Switch Unit</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${switcherOpen ? 'rotate-180' : ''}`} />
              </button>

              {switcherOpen && (
                <div className="absolute left-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden">
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                    Switch Business Unit
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 py-1">
                    {businesses.map((biz) => {
                      const isCurrent = biz.id === activeBusiness?.id;
                      return (
                        <button
                          key={biz.id}
                          type="button"
                          onClick={() => {
                            selectBusiness(biz.id);
                            setSwitcherOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-slate-50 transition-colors ${
                            isCurrent ? 'bg-teal-50/50 font-medium' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {biz.name}
                            </div>
                            <div className="text-[11px] text-slate-500 truncate mt-0.5">
                              {biz.city}, {biz.state} • {biz.sector}
                            </div>
                          </div>
                          {isCurrent && (
                            <span className="shrink-0 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200/50">
                              Active
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-slate-100 pt-1 px-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSwitcherOpen(false);
                        navigate('/start');
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                    >
                      <Plus className="w-4 h-4 shrink-0" />
                      <span>+ Add Unit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-semibold text-slate-700">
              {activeBusiness
                ? `${activeBusiness.city}, ${activeBusiness.state} • ${activeBusiness.sector}`
                : `${data.city}, Gujarat • ${data.sector}`}
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50/80 border border-blue-200/80 text-[11px] font-semibold text-blue-800">
              {getStatePortalBadge(activeBusiness?.state || data?.state)}
            </div>
          </div>
        </div>

        {/* Pipeline Progress Hero */}
        <div className="pt-6 border-t border-slate-200/80">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            {pipelineStages.stageOrder.map((stage, idx) => {
              const items = pipelineStages.grouped[stage.id] || [];
              const cleared = items.filter(r => r.status === 'approved').length;
              const total = items.length;
              const isDone = total > 0 && cleared === total;
              const isActive = total > 0 && cleared < total && (idx === 0 || pipelineStages.grouped[pipelineStages.stageOrder[idx - 1].id]?.filter(r => r.status === 'approved').length === pipelineStages.grouped[pipelineStages.stageOrder[idx - 1].id]?.length);
              
              return (
                <div key={stage.id} className="flex-1 w-full min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${
                      isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-teal-600 text-white ring-2 ring-teal-200' : 'bg-slate-100 text-slate-400'
                    }`}>
                      {isDone ? <Check size={12} strokeWidth={3} /> : idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-wider truncate ${isActive ? 'text-teal-900' : 'text-slate-500'}`}>
                        {stage.short}
                      </div>
                    </div>
                    {total > 0 && (
                      <div className="text-[10px] font-mono text-slate-400 shrink-0">
                        {cleared}/{total}
                      </div>
                    )}
                  </div>
                  {total > 0 ? (
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(cleared / total) * 100}%` }} />
                    </div>
                  ) : (
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* Stats */}
      {isMismatch && (
        <div className="text-xs text-rose-600 font-mono tabular-nums font-semibold stagger-2">
          stats mismatch
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 stagger-2">
        {[
          { label: 'Total', value: stats.total, caption: 'all approvals', icon: FileCheck2 },
          { label: 'Needs action', value: stats.needsAction, caption: 'reply, rejected or overdue', highlight: stats.needsAction > 0 ? 'text-amber-700' : '', icon: AlertTriangle, iconColor: 'text-amber-600 bg-amber-50' },
          { label: 'In review', value: stats.inReview, caption: 'being checked', icon: Activity, iconColor: 'text-blue-600 bg-blue-50' },
          { label: 'Not started', value: stats.notStarted, caption: 'pending submission', icon: Circle, iconColor: 'text-slate-400 bg-slate-50' },
          { label: 'Approved', value: stats.approved, caption: 'completed', highlight: stats.approved > 0 ? 'text-emerald-700' : '', icon: ShieldCheck, iconColor: 'text-emerald-600 bg-emerald-50' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200/80 p-5 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 hover:border-teal-500/30 transition-all duration-150 flex flex-col min-w-0 group relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">{s.label}</span>
              {s.icon && (
                <div className={`p-1.5 rounded-lg ${s.iconColor || 'text-slate-500 bg-slate-100'} transition-transform duration-200 group-hover:scale-110`}>
                  <s.icon size={16} strokeWidth={2} />
                </div>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-mono tabular-nums tracking-tight font-extrabold ${s.highlight || 'text-slate-900'} truncate`}>{s.value}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-2 font-medium break-words leading-tight">{s.caption}</span>
          </div>
        ))}
      </div>

      {/* Operational Brief / Alert Strip */}
      {(alerts.length > 0 || data?.scheduledInspection || unscheduledInspections.length >= 2) && (
        <div className="space-y-2.5 stagger-3">
          {data?.scheduledInspection && (
            <div className="bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 rounded-lg p-3 text-xs flex gap-2.5 items-center shadow-sm">
              <CheckCircle2 size={16} strokeWidth={1.5} className="shrink-0 text-emerald-700" />
              <div><strong>Combined inspection scheduled:</strong> Confirmed for {data.scheduledInspection.date}.</div>
            </div>
          )}
          {alerts.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200/80 text-rose-950 rounded-lg p-3 text-xs flex gap-2.5 items-start shadow-sm">
              <ShieldAlert size={16} strokeWidth={1.5} className="shrink-0 text-rose-700 mt-0.5" />
              <div className="space-y-1">
                {alerts.slice(0, 3).map((alert, idx) => (
                  <div key={alert.id || idx}>{alert.text}</div>
                ))}
                {alerts.length > 3 && (
                  <div className="text-rose-700 font-semibold">and {alerts.length - 3} more critical alerts</div>
                )}
              </div>
            </div>
          )}
          {!data?.scheduledInspection && unscheduledInspections.length >= 2 && (
            <div className="bg-teal-50/60 border border-teal-200/70 text-teal-950 rounded-lg p-3 text-xs flex gap-2.5 items-start shadow-sm">
              <Info size={16} strokeWidth={1.5} className="shrink-0 text-teal-700 mt-0.5" />
              <div><strong>Operational Note:</strong> {unscheduledInspections.map(r => r.name.split(' ')[0]).join(' and ')} inspections can be synchronized into a single officer visit.</div>
            </div>
          )}
        </div>
      )}

      {/* Approvals Cards List */}
      <div className="space-y-6 pt-2 stagger-4">
        {(() => {
          const { grouped, stageOrder } = pipelineStages;
          
          return stageOrder
            .filter(stage => grouped[stage.id] && grouped[stage.id].length > 0)
            .map(stage => (
              <div key={stage.id} className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                    {stage.id.split(':')[0]}
                  </h3>
                  <div className="h-px flex-1 bg-slate-200/60" />
                </div>
                {grouped[stage.id].map(r => {
                  const sla = getSLA(r);
                  return (
                    <div
                      key={r.id}
                      onClick={() => navigate(`/app/approvals/${r.id}`)}
                      className="group cursor-pointer bg-white border border-slate-200/80 hover:border-teal-500/50 rounded-xl p-5 flex flex-col md:flex-row gap-4 md:gap-5 md:items-center justify-between shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 min-w-0 border-l-4 border-l-transparent hover:border-l-teal-500 active:scale-[0.99] relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 bottom-0 w-[4px] ${
                        r.status === 'approved' ? 'bg-emerald-500' :
                        r.status === 'query_raised' ? 'bg-sky-500' :
                        ['submitted', 'under_review'].includes(r.status) ? 'bg-amber-400' :
                        r.status === 'rejected' ? 'bg-rose-500' :
                        'bg-transparent'
                      }`} />
                      
                      <div className="flex-1 min-w-0 pl-1.5">
                        <div className="flex items-center gap-2 sm:gap-2.5 mb-2 flex-wrap">
                          <h3 className="font-headings font-bold text-base sm:text-lg text-slate-900 tracking-tight break-words group-hover:text-teal-700 transition-colors">
                            {r.name}
                          </h3>
                          {r.escalated && (
                            <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] uppercase font-bold rounded tracking-wider shrink-0">
                              Escalated
                            </span>
                          )}
                          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded tracking-wider shrink-0 ${r.requirementType === 'BASE' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                            {r.requirementType}
                          </span>
                          <StatusBadge status={r.status} />
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50/50 border border-blue-100 text-[10px] font-bold text-blue-800 shrink-0 uppercase tracking-wider ml-auto">
                            <ShieldCheck size={12} className="text-blue-600" />
                            {r.routing}
                          </span>
                        </div>
                        
                        <div className="mt-4 border border-slate-100 rounded-lg bg-slate-50 flex items-stretch divide-x divide-slate-200/60 text-xs">
                          <div className="flex-1 p-2.5 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Form ID</span>
                            <span className="font-mono text-slate-700 font-semibold truncate">{r.formName}</span>
                          </div>
                          
                          <div className="flex-1 p-2.5 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Officer Desk</span>
                            <div className="flex items-center gap-1.5 truncate text-slate-700 font-medium">
                              <UserRound size={12} className="text-slate-400 shrink-0" />
                              <span className="truncate">{r.assignedOfficerName ? `${r.assignedOfficerName} (Desk ${r.deskNo})` : 'Unassigned'}</span>
                            </div>
                          </div>

                          <div className="flex-1 p-2.5 flex flex-col justify-center">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Last Action</span>
                            <span className="font-mono text-slate-700 font-semibold truncate">{getRelativeTime(r.lastActionAt)}</span>
                          </div>

                          {r.status === 'not_started' && (
                            <div className="flex-1 p-2.5 flex flex-col justify-center">
                              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Readiness</span>
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  <div className="w-3 h-1.5 bg-emerald-500 rounded-sm"></div>
                                  <div className="w-3 h-1.5 bg-slate-200 rounded-sm"></div>
                                  <div className="w-3 h-1.5 bg-slate-200 rounded-sm"></div>
                                </div>
                                <span className="font-mono font-semibold text-slate-700">1/3 Docs</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {r.escalated && (
                          <div className="flex items-center gap-1.5 mt-3 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-1 rounded-md w-fit">
                            <AlertCircle size={14} strokeWidth={2.5} className="shrink-0" /> Escalated to Senior Officer
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                        <div className={`font-mono tabular-nums tracking-tight text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 ${sla.color}`}>
                          <Clock size={12} className={sla.isOverdue ? 'text-rose-600' : 'text-slate-400'} /> {sla.text}
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/app/approvals/${r.id}`);
                          }}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold active:scale-[0.97] transition-all duration-75 ease-out focus-visible:ring-2 focus-visible:ring-offset-1 focus:outline-none shrink-0 shadow-sm ${
                            r.status === 'not_started' ? 'bg-slate-900 text-white hover:bg-slate-800' :
                            r.status === 'query_raised' ? 'bg-sky-600 text-white hover:bg-sky-700' :
                            'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          {r.status === 'not_started' ? <><Play size={14} /> Start Application</> :
                           r.status === 'query_raised' ? <><MessageSquareReply size={14} /> Fix Query</> :
                           <><Eye size={14} /> View Clearance</>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
        })()}
      </div>
    </div>
  );
}
