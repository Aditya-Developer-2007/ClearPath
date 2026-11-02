import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getMyApplicationsAPI, deriveApprovalMetadata, getStatePortalBadge, generateApprovalsForBusiness, evaluateEligibleSchemes, evaluateGovernmentTenders } from '../../lib/api';
import useSharedTimer from '../../hooks/useSharedTimer';
import { useBusiness } from '../../context/BusinessContext';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import StatutorySimulator from '../../components/StatutorySimulator';
import VerifiableNocModal from '../../components/VerifiableNocModal';
import { ShieldAlert, Info, Play, Eye, MessageSquareReply, CheckCircle2, Building2, ChevronDown, Plus, Clock, AlertTriangle, ShieldCheck, Activity, Check, Circle, AlertCircle, FileCheck2, UserRound, Lock, Unlock, Briefcase, ExternalLink, X } from 'lucide-react';

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
  const [schemesExpanded, setSchemesExpanded] = useState(true);
  const [tendersExpanded, setTendersExpanded] = useState(true);
  const [selectedBidTender, setSelectedBidTender] = useState(null);
  const [selectedNocApproval, setSelectedNocApproval] = useState(null);
  const [bidNotification, setBidNotification] = useState(null);

  const schemes = useMemo(() => {
    const unit = activeBusiness || data || { sector: 'Textile', city: 'Surat', investmentLakh: 30, employees: 12 };
    return evaluateEligibleSchemes(unit);
  }, [activeBusiness, data]);

  const tenderGate = useMemo(() => {
    const unit = activeBusiness || data || { sector: 'Textile', city: 'Surat', investmentLakh: 30, employees: 12 };
    const approvals = data?.approvalRequests || [];
    return evaluateGovernmentTenders(unit, approvals);
  }, [activeBusiness, data]);

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
          const isDefaultUnit = activeBusiness.id === 'b1' ||
            (activeBusiness.sector?.toLowerCase().includes('textile') && activeBusiness.city?.toLowerCase().includes('surat'));

          if (!isDefaultUnit) {
            appData.approvalRequests = generateApprovalsForBusiness(activeBusiness).map(a => ({
              ...a,
              status: 'not_started', // ensure all are not_started for new businesses
              slaDeadline: new Date(Date.now() + (a.slaDays || 30) * 86400000).toISOString(),
              lastActionAt: new Date().toISOString()
            }));
          }
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

      {/* Interactive What-If Statutory Threshold Simulator */}
      <StatutorySimulator baselineBusiness={activeBusiness || data} />

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
                      onClick={() => navigate(`/app/workspace/${r.id}`)}
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
                          <RiskBadge tier={r.riskTier} />
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

                        {r.statutoryBasis && (
                          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Mandate:</span>
                            <span className="text-slate-600 truncate">{r.statutoryBasis}</span>
                          </div>
                        )}
                        
                        {r.escalated && (
                          <div className="flex items-center gap-1.5 mt-3 text-xs text-rose-700 font-bold bg-rose-50 border border-rose-100 px-2 py-1 rounded-md w-fit">
                            <AlertCircle size={14} strokeWidth={2.5} className="shrink-0" /> Escalated to Senior Officer
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-2.5 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0 shrink-0">
                        <div className={`font-mono tabular-nums tracking-tight text-xs font-bold flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 ${sla.color}`}>
                          <Clock size={12} className={sla.isOverdue ? 'text-rose-600' : 'text-slate-400'} /> {sla.text}
                        </div>
                        <div className="flex items-center gap-2">
                          {r.status === 'approved' && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedNocApproval(r);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-all shadow-2xs active:scale-[0.98]"
                            >
                              <ShieldCheck size={13} className="text-emerald-600" />
                              <span>View NOC</span>
                            </button>
                          )}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/app/workspace/${r.id}`);
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
                    </div>
                  );
                })}
              </div>
            ));
        })()}

        {/* Interactive "What-If" Statutory Threshold Simulator */}
        <div className="mt-10">
          <StatutorySimulator baselineBusiness={activeBusiness || data} />
        </div>

        {/* Matched Government Support & Subsidies */}
        {schemes.length > 0 && (
          <div className="mt-12 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">
                    Eligible Government Support &amp; Subsidies
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                    {schemes.length} Matched
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Deterministic statutory benefits matched for {activeBusiness?.name || 'your unit'}.
                </p>
              </div>
              <button
                onClick={() => setSchemesExpanded(!schemesExpanded)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-75 shrink-0 flex items-center gap-1.5"
              >
                {schemesExpanded ? 'Collapse' : 'View Schemes'}
                <ChevronDown size={14} className={`transform transition-transform duration-200 ${schemesExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {schemesExpanded && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                {schemes.map((sch) => (
                  <div
                    key={sch.code}
                    className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                        <span className="font-mono text-xs font-bold text-teal-900 bg-teal-100/60 border border-teal-200 px-2 py-0.5 rounded">
                          {sch.code}
                        </span>
                        <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]">
                          {sch.agency}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 mb-2 tracking-tight">
                        {sch.name}
                      </h4>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 text-white text-[11px] font-medium mb-3">
                        <span className="text-teal-300 font-bold">Benefit:</span>
                        <span>{sch.benefit}</span>
                      </div>
                    </div>
                    <div className="pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600 flex flex-col gap-1">
                      <div>
                        <span className="font-bold text-slate-900 text-[10px] uppercase tracking-wider mr-1.5">Mandate:</span>
                        <span>{sch.eligibilityBasis}</span>
                      </div>
                      {sch.portal && (
                        <div className="text-slate-400 font-mono text-[10px]">
                          Portal: {sch.portal}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compliance-Gated Government Procurement & GeM Tenders */}
        {tenderGate.tenders && tenderGate.tenders.length > 0 && (
          <div className="mt-8 bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="p-1.5 bg-slate-900 text-white rounded-lg">
                    <Briefcase size={16} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 tracking-tight">
                    Government Procurement &amp; GeM Tenders
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                    {tenderGate.tenders.length} Matched
                  </span>
                  {tenderGate.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <Unlock size={12} className="text-emerald-600" />
                      COMPLIANCE VERIFIED — BIDDING UNLOCKED
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Lock size={12} className="text-amber-600" />
                      GATE LOCKED — STATUTORY CLEARANCES REQUIRED
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Sector-matched PSU &amp; State Government procurement contracts under Public Procurement Policy for MSEs.
                </p>
              </div>
              <button
                onClick={() => setTendersExpanded(!tendersExpanded)}
                className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-all duration-75 shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
              >
                {tendersExpanded ? 'Collapse' : 'View Tenders'}
                <ChevronDown size={14} className={`transform transition-transform duration-200 ${tendersExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {tendersExpanded && (
              <div className="mt-5 space-y-5">
                {/* Compliance Gate Status Card */}
                <div className={`p-4 rounded-xl border ${
                  tenderGate.isUnlocked 
                    ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-950' 
                    : 'bg-amber-50/40 border-amber-200/80 text-amber-950'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {tenderGate.isUnlocked ? (
                        <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                      ) : (
                        <Lock size={18} className="text-amber-600 shrink-0" />
                      )}
                      <span className="font-bold text-sm">
                        {tenderGate.isUnlocked 
                          ? '100% Statutory Clearance Verified: Ready for Direct GeM Bidding' 
                          : 'Rule 144(xi) GFR Statutory Gate: 100% Approvals Required to Unlock Tenders'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200/60 text-slate-700">
                      {tenderGate.approvedCount} of {tenderGate.totalApprovals} Approvals Verified ({tenderGate.totalApprovals > 0 ? Math.round((tenderGate.approvedCount / tenderGate.totalApprovals) * 100) : 0}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden mb-3">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        tenderGate.isUnlocked ? 'bg-emerald-600' : 'bg-amber-500'
                      }`}
                      style={{
                        width: `${tenderGate.totalApprovals > 0 ? (tenderGate.approvedCount / tenderGate.totalApprovals) * 100 : 0}%`
                      }}
                    />
                  </div>

                  {/* Context notice & blocking items */}
                  {tenderGate.isUnlocked ? (
                    <p className="text-xs text-emerald-800 leading-relaxed">
                      All required statutory clearances (Fire Safety NOC, Factory Licence, Pollution Consents, Labour Registrations) are verified active. Your unit is eligible to submit bids directly via the GeM encrypted bid vault with MSE Purchase Preference.
                    </p>
                  ) : (
                    <div>
                      <p className="text-xs text-amber-900 leading-relaxed mb-3">
                        Public sector buyers mandate all statutory compliance clearances prior to bid acceptance. Complete the remaining <span className="font-bold font-mono">{tenderGate.pendingCount}</span> approvals to unlock bidding and generate verified submission packages:
                      </p>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                          Action Required:
                        </span>
                        {tenderGate.blockingApprovals.map((b) => (
                          <button
                            key={b.id}
                            onClick={() => navigate(`/app/workspace/${b.id}`)}
                            title={`Click to open ${b.name}`}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-white border border-amber-300/80 text-amber-900 hover:bg-amber-100 hover:border-amber-400 transition-all shadow-2xs group"
                          >
                            <span className="font-mono text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              {b.code}
                            </span>
                            <span className="font-medium truncate max-w-[200px]">{b.name}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-amber-800">
                              ({b.status.replace('_', ' ')}) &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tenders Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {tenderGate.tenders.map((tender) => (
                    <div
                      key={tender.id}
                      className="bg-slate-50/80 border border-slate-200/80 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-150"
                    >
                      <div>
                        {/* Top badges */}
                        <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded">
                              {tender.id}
                            </span>
                            <span className="font-mono text-[11px] font-semibold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                              {tender.portal}
                            </span>
                          </div>
                          <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                            <Clock size={12} />
                            {tender.bidWindow || `${tender.bidWindowDays}d left`}
                          </span>
                        </div>

                        {/* Title & Department */}
                        <h4 className="font-headings font-bold text-sm sm:text-base text-slate-900 mb-1.5 tracking-tight">
                          {tender.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <Building2 size={13} className="shrink-0 text-slate-400" />
                          <span className="truncate">{tender.issuingAuthority}</span>
                        </div>

                        {/* Key Attributes Grid */}
                        <div className="bg-white border border-slate-200/70 rounded-lg p-3 text-xs grid grid-cols-2 gap-2 mb-3">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Estimated Value</span>
                            <span className="font-mono font-bold text-slate-900 text-sm">{tender.estimatedValue}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Portal Reference</span>
                            <span className="font-mono text-slate-700 font-semibold truncate block">{tender.portalRef}</span>
                          </div>
                          <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">MSE Benefit</span>
                            <span className="text-emerald-700 font-bold text-[11px] flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              {tender.emdExemption ? 'EMD Exempt (MSE Policy)' : 'Standard EMD'}
                            </span>
                          </div>
                          <div className="col-span-2 pt-1 border-t border-slate-100">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-0.5">Statutory Prerequisite</span>
                            <span className="text-[11px] text-slate-600 line-clamp-1">{tender.prerequisite}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div>
                        {tenderGate.isUnlocked ? (
                          <button
                            onClick={() => setSelectedBidTender(tender)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-all active:scale-[0.98]"
                          >
                            <ExternalLink size={14} />
                            Participate via GeM Portal
                          </button>
                        ) : (
                          <button
                            disabled
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed border border-slate-200/80"
                          >
                            <Lock size={13} />
                            Locked — Complete {tenderGate.pendingCount} Pending Approvals to Bid
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bid Package Modal */}
        {selectedBidTender && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-teal-50 text-teal-700 rounded-lg border border-teal-200">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">GeM Bid Package Verified</h3>
                    <p className="font-mono text-xs text-slate-500">{selectedBidTender.portalRef}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBidTender(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">Target Contract</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedBidTender.title}</p>
                  <p className="text-slate-600 mt-0.5">{selectedBidTender.issuingAuthority} • Value: <span className="font-mono font-bold text-slate-900">{selectedBidTender.estimatedValue}</span></p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                    Attached Statutory Credentials (Verified)
                  </span>
                  <div className="space-y-1.5 font-mono text-[11px]">
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200/60">
                      <span className="text-slate-800">NOC-SAFE-2026-REQ2 (Fire Safety NOC)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200/60">
                      <span className="text-slate-800">LIC-FACT-2026-REQ1 (Factories Act Licence)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                    </div>
                    <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded border border-slate-200/60">
                      <span className="text-slate-800">CTE-PCB-2026-REQ3 (GPCB Pollution Consent)</span>
                      <span className="text-emerald-700 font-bold flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                    </div>
                  </div>
                </div>

                <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-3.5 space-y-1.5">
                  <span className="text-[10px] text-teal-800 font-bold uppercase tracking-wider block">
                    MSE Preferential Benefits Applied
                  </span>
                  <p className="text-teal-900 text-[11px] leading-relaxed">
                    Under the Public Procurement Policy for MSEs Order (2012), this bid is submitted with <strong>100% EMD Exemption</strong> and registered for the <strong>25% MSE Purchase Preference Allocation</strong>.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => setSelectedBidTender(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const tender = selectedBidTender;
                    setSelectedBidTender(null);
                    setBidNotification(`Bid package for ${tender.id} successfully generated with verified statutory NOC certificates.`);
                    setTimeout(() => setBidNotification(null), 5000);
                  }}
                  className="px-4 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all"
                >
                  Export &amp; Proceed to GeM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bid Toast / Notification */}
        {bidNotification && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in slide-in-from-bottom-2 duration-200 text-xs font-medium">
            <CheckCircle2 size={16} className="text-teal-400 shrink-0" />
            <span>{bidNotification}</span>
            <button onClick={() => setBidNotification(null)} className="ml-2 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Verifiable Digital NOC Modal */}
        {selectedNocApproval && (
          <VerifiableNocModal
            approval={selectedNocApproval}
            business={activeBusiness}
            onClose={() => setSelectedNocApproval(null)}
          />
        )}
      </div>
    </div>
  );
}
