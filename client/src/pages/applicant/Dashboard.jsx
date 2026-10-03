import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getMyApplicationsAPI } from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import { ShieldAlert, Info, Play, Eye, MessageSquareReply, LayoutList, GitMerge, CornerDownRight } from 'lucide-react';

export default function ApplicantDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [view, setView] = useState('cards'); // 'cards' or 'route'
  const [now, setNow] = useState(new Date());
  
  const navigate = useNavigate();
  const { setAlerts } = useOutletContext() || {};

  useEffect(() => {
    getMyApplicationsAPI()
      .then(res => {
        setData(res.data.applications[0] || null);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const stats = useMemo(() => {
    if (!data) return { total: 0, inReview: 0, needsAction: 0, approved: 0 };
    const reqs = data.approvalRequests;
    const total = reqs.length;
    const approved = reqs.filter(r => r.status === 'approved').length;
    const inReview = reqs.filter(r => {
      const isOverdue = new Date(r.slaDeadline) < now && !['approved', 'rejected'].includes(r.status);
      return ['submitted', 'under_review'].includes(r.status) && !isOverdue;
    }).length;
    const needsAction = total - approved - inReview;
    return { total, inReview, needsAction, approved };
  }, [data, now]);

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

  const alerts = useMemo(() => {
    if (!data) return [];
    const arr = [];
    data.approvalRequests.forEach(r => {
      const isOverdue = new Date(r.slaDeadline) < now && !['approved', 'rejected'].includes(r.status);
      if (isOverdue) arr.push({ id: r.id, text: `${r.name} is overdue!` });
      else if (r.escalated) arr.push({ id: r.id, text: `${r.name} was escalated.` });
      else if (r.status === 'query_raised') arr.push({ id: r.id, text: `Query raised on ${r.name}.` });
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
        <h1 className="text-3xl font-headings">Your approvals</h1>
        <div className="grid grid-cols-4 gap-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>
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
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headings text-[#0A1128]">Your approvals</h1>
          <p className="text-gray-600 mt-1">{data.sector}, {data.city}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 p-1 rounded">
            <button 
              onClick={() => setView('cards')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === 'cards' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-text'}`}
            >
              <LayoutList size={16} /> Cards
            </button>
            <button 
              onClick={() => setView('route')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${view === 'route' ? 'bg-white shadow-sm text-primary' : 'text-gray-600 hover:text-text'}`}
            >
              <GitMerge size={16} /> Route
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: stats.total, caption: 'all approvals' },
          { label: 'In review', value: stats.inReview, caption: 'being checked' },
          { label: 'Needs action', value: stats.needsAction, caption: 'query or overdue' },
          { label: 'Approved', value: stats.approved, caption: 'done' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-border p-4 rounded shadow-sm flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{s.label}</span>
            <span className="text-3xl font-mono text-[#0A1128]">{s.value}</span>
            <span className="text-xs text-gray-400 mt-1">{s.caption}</span>
          </div>
        ))}
      </div>

      {/* Alert Strip */}
      {(alerts.length > 0 || unscheduledInspections.length >= 2) && (
        <div className="bg-white border border-border rounded shadow-sm overflow-hidden flex flex-col">
          {alerts.length > 0 && (
            <div className="bg-red-50 text-red-800 p-4 text-sm flex gap-3 items-start">
              <ShieldAlert size={20} className="shrink-0 text-red-600 mt-0.5" />
              <div><strong>Attention needed:</strong> You have {alerts.length} item(s) requiring immediate attention.</div>
            </div>
          )}
          {unscheduledInspections.length >= 2 && (
            <div className={`bg-teal-50/50 text-teal-800 p-4 text-sm flex gap-3 items-start ${alerts.length > 0 ? 'border-t border-border' : ''}`}>
              <Info size={18} className="shrink-0 text-teal-600 mt-0.5" />
              <div><strong>Tip:</strong> {unscheduledInspections.map(r => r.name.split(' ')[0]).join(' and ')} inspections can be combined into one visit.</div>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="mt-8 overflow-visible">
        {view === 'cards' ? (
          <div className="space-y-4">
            {sortedReqs.map(r => {
              const sla = getSLA(r);
              return (
                <div key={r.id} className="bg-white border border-border rounded p-5 flex flex-col md:flex-row gap-5 md:items-center justify-between shadow-sm">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-headings text-lg text-[#0A1128]">{r.name}</h3>
                      {r.escalated && <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] uppercase font-bold rounded tracking-wide">Escalated</span>}
                      <StatusBadge status={r.status} />
                      <RiskBadge tier={r.riskTier} />
                    </div>
                    <div className="text-sm text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
                      <span>{r.department}</span>
                      {r.assignedOfficerName ? <span>{r.assignedOfficerName}, Desk {r.deskNo}</span> : <span>Unassigned</span>}
                      <span className="text-gray-400">&bull;</span>
                      <span>{getRelativeTime(r.lastActionAt)}</span>
                    </div>
                    {r.escalated && (
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-red-600 font-medium">
                        <CornerDownRight size={14} /> Escalated to Senior Officer
                      </div>
                    )}
                    {/* Thin SLA bar */}
                    {r.status !== 'not_started' && !['approved', 'rejected'].includes(r.status) && (
                      <div className="mt-3 w-full max-w-xs h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${sla.isOverdue ? 'bg-red-500' : 'bg-primary'}`} style={{ width: '60%' }}></div>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 border-border pt-4 md:pt-0">
                    <div className={`font-mono text-sm font-medium ${sla.color}`}>{sla.text}</div>
                    <button 
                      onClick={() => navigate(`/app/approvals/${r.id}`)}
                      className="flex items-center gap-2 px-4 py-2 border border-border rounded text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      {r.status === 'not_started' ? <><Play size={14} /> Start</> :
                       r.status === 'query_raised' ? <><MessageSquareReply size={14} /> Reply</> :
                       <><Eye size={14} /> View</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-visible">
            <div className="w-full flex flex-col gap-8 pt-4 overflow-visible">
              {sortedReqs.map((r, i) => {
                const sla = getSLA(r);
                let currentStation = 0;
                if (r.status === 'not_started') currentStation = -1;
                else if (['submitted', 'query_raised'].includes(r.status)) currentStation = 0;
                else if (r.status === 'under_review') currentStation = 1;
                else if (['approved', 'rejected'].includes(r.status)) currentStation = 2;

                const isTerminal = ['approved', 'rejected'].includes(r.status);
                const terminalColor = r.status === 'approved' ? 'bg-status-approved' : 'bg-status-rejected';
                
                return (
                  <div 
                    key={r.id} 
                    className="flex flex-col md:flex-row md:items-center gap-4 pt-8 transition-all duration-700 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] overflow-visible"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <div className="w-48 shrink-0 font-medium text-sm text-[#0A1128] truncate" title={r.name}>{r.name}</div>
                    
                    <div className="flex-1 flex items-center relative overflow-visible">
                      {/* Stations */}
                      {['Submitted', 'Review', 'Decision'].map((step, idx) => (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center relative z-10 overflow-visible">
                            <div className={`w-4 h-4 rounded-full transition-colors duration-500
                              ${currentStation === -1 
                                ? 'border-2 border-gray-300 bg-transparent'
                                : idx < currentStation 
                                  ? (sla.isOverdue ? 'bg-red-500' : 'bg-primary') 
                                  : idx === currentStation 
                                    ? (sla.isOverdue ? 'bg-red-500 animate-pulse' : 'bg-primary animate-pulse') 
                                    : (idx === 2 && isTerminal ? terminalColor : 'bg-gray-200')}
                            `} />
                            <span className="absolute top-6 text-[10px] font-bold text-gray-400 uppercase tracking-wider">{step}</span>
                            {r.needsInspection && step === 'Review' && (
                               <span className="absolute bottom-6 text-[10px] bg-purple-100 text-purple-800 px-1 rounded whitespace-nowrap">Inspection</span>
                            )}
                          </div>
                          {idx < 2 && (
                            <div className={`flex-1 mx-1 relative ${currentStation === -1 ? 'h-0 border-t-2 border-dashed border-gray-300' : 'h-1 bg-gray-100 overflow-hidden'}`}>
                              {currentStation !== -1 && (
                                <div className={`absolute left-0 top-0 h-full transition-all duration-1000 ease-out
                                  ${idx < currentStation ? `w-full ${sla.isOverdue ? 'bg-red-500' : 'bg-primary'}` : `w-0 ${sla.isOverdue ? 'bg-red-500' : 'bg-primary'}`}
                                `} />
                              )}
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                      {sla.isOverdue && <span className="absolute -right-4 top-[-20px] text-[10px] bg-red-100 text-red-800 px-1 rounded">Overdue</span>}
                    </div>

                    <div className={`w-24 text-right font-mono text-xs font-medium shrink-0 ${sla.color}`}>
                      {sla.text}
                    </div>
                  </div>
                );
              })}
            </div>
            <style>{`
              @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
              @media (prefers-reduced-motion) { .animate-\\[fadeIn_0\\.5s_ease-out_forwards\\] { animation: none !important; opacity: 1 !important; transform: none !important; } .animate-pulse { animation: none !important; } }
            `}</style>
          </div>
        )}
      </div>
    </div>
  );
}
