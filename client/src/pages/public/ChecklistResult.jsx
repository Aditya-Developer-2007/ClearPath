import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { deriveApprovalMetadata, getStatePortalBadge } from '../../lib/api';
import RiskBadge from '../../components/RiskBadge';
import EmptyState from '../../components/EmptyState';
import AssistantDrawer from '../../components/AssistantDrawer';
import { Building2, ShieldAlert, FileText, Briefcase, Zap, FileSignature, Landmark, MessageCircle } from 'lucide-react';

const DEPT_ICONS = {
  'Industrial': Building2,
  'Safety': ShieldAlert,
  'Environment': FileText,
  'Labour': Briefcase,
  'Utilities': Zap,
  'MSME': FileSignature,
  'Finance': Landmark
};

function useCountUp(target = 0, duration = 700) {
  const isReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [count, setCount] = useState(() => (isReduced ? target : 0));

  useEffect(() => {
    if (isReduced) return;

    let startTimestamp = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easedProgress * target));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [target, duration, isReduced]);

  return isReduced ? target : count;
}

export default function ChecklistResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { businesses, addBusiness, selectBusiness } = useBusiness();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const result = state?.result;

  const approvals = result?.approvals || [];
  const estimatedDays = result?.estimatedDays || 0;
  const animatedApprovals = useCountUp(approvals.length, 700);
  const animatedDays = useCountUp(estimatedDays, 700);

  if (!result) {
    return (
      <div className="min-h-screen p-8 bg-slate-50 flex flex-col items-center justify-center">
        <EmptyState message="No results found." />
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-sm shadow-sm active:scale-[0.97] transition-all duration-75">Go to Home</button>
      </div>
    );
  }

  const inspectionCount = approvals.filter(a => a.needsInspection).length;

  const handleStart = () => {
    if (user) {
      if (state?.newBusiness) {
        if (state.newBusiness.id && businesses.some(b => b.id === state.newBusiness.id)) {
          selectBusiness(state.newBusiness.id);
        } else {
          addBusiness(state.newBusiness);
        }
      }
      navigate('/app/dashboard');
    } else {
      navigate('/login', { state: { returnUrl: '/app/dashboard', newBusiness: state?.newBusiness } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 pb-32">
      <header className="h-16 flex items-center px-6 lg:px-10 border-b border-slate-200/80 bg-white shrink-0">
        <div className="font-headings font-bold text-xl text-slate-900 tracking-tight cursor-pointer" onClick={() => navigate('/')}>ClearPath</div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12">
        <div className="mb-10 text-center stagger-1">
          <div className="flex items-center justify-center mb-3">
             <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[11px] font-bold text-blue-800 tracking-widest uppercase shadow-sm">
               {getStatePortalBadge(state?.newBusiness?.state)}
             </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-slate-900">
            {animatedApprovals} approvals required
          </h1>
          <p className="text-lg font-mono font-medium text-slate-500">
            Estimated ~{animatedDays} days
          </p>
        </div>

        <div className="space-y-8 mb-8">
          {(() => {
            const grouped = approvals
              .map(r => deriveApprovalMetadata(r, state?.newBusiness?.state || 'Gujarat'))
              .reduce((acc, curr) => {
                if (!acc[curr.stage]) acc[curr.stage] = [];
                acc[curr.stage].push(curr);
                return acc;
              }, {});
              
            const stageOrder = [
              'Stage A: Zero-to-land / Premises Stage',
              'Stage B: Pre-construction / Construction Stage',
              'Stage C: Commissioning / Pre-operation Stage',
              'Stage D: Industry-Specific Compliance'
            ];
            
            return stageOrder
              .filter(stage => grouped[stage] && grouped[stage].length > 0)
              .map((stage, sIdx) => (
                <div key={stage} className={`space-y-4 stagger-${Math.min(sIdx + 2, 7)}`}>
                  <div className="flex items-center gap-3 mb-4 mt-8">
                    <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase">
                      {stage}
                    </h3>
                    <div className="h-px flex-1 bg-slate-200/60" />
                  </div>
                  {grouped[stage].map(app => {
                    const Icon = DEPT_ICONS[app.department] || FileText;
                    
                    return (
                      <div key={app.id} className="bg-white border border-slate-200/75 rounded-xl p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all duration-200">
                        <div className="flex items-start gap-4 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0 shadow-inner">
                            <Icon size={18} strokeWidth={2} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <h3 className="font-bold text-lg text-slate-900 leading-snug tracking-tight">{app.name}</h3>
                              <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-md tracking-wider shrink-0 ${app.requirementType === 'BASE' ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {app.requirementType}
                              </span>
                            </div>
                            <div className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50/50 border border-blue-100 text-[10px] font-bold text-blue-800 shrink-0 tracking-wider uppercase">
                                {app.routing}
                              </span>
                              <span className="text-slate-300">&bull;</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-tight">Form: {app.formName}</span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-500 mb-2 font-medium">{app.department}</p>
                            <div className="flex flex-wrap gap-2">
                              {app.docs.map(d => (
                                <span key={d} className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 text-[11px] font-medium rounded-md shadow-sm">{d}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                          <div className="flex gap-2 items-center">
                            {app.needsInspection && (
                               <span className="px-2 py-0.5 bg-purple-50 text-purple-800 border border-purple-200 text-[10px] uppercase font-bold rounded-md tracking-wider">Inspection needed</span>
                            )}
                            <RiskBadge tier={app.riskTier} />
                          </div>
                          <span className="font-mono text-sm font-bold text-slate-700 bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">SLA {app.slaDays}d</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ));
          })()}
        </div>

        {inspectionCount >= 2 && (
          <div className="bg-blue-50 border border-blue-200/80 text-blue-900 rounded-xl p-4 mb-8 text-sm flex gap-3 stagger-7 shadow-sm">
            <ShieldAlert size={20} className="shrink-0 text-blue-600" />
            <div>
              <strong>Good news:</strong> {inspectionCount} inspections can be combined into one joint visit by the departments.
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200/80 p-4 shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.05)] z-10 flex justify-center pb-safe">
        <button onClick={handleStart} className="w-full md:w-auto bg-slate-900 text-white font-bold py-3 px-12 rounded-lg hover:bg-slate-800 shadow-sm active:scale-[0.97] transition-all duration-75">
          Start my application
        </button>
      </div>

      {/* Floating Ask Assistant Button */}
      <button 
        className="fixed bottom-24 right-6 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:bg-slate-800 hover:-translate-y-1 transition-all duration-200 z-20 group"
        onClick={() => setAssistantOpen(true)}
        aria-label="Ask assistant"
      >
        <MessageCircle size={24} strokeWidth={2.5} />
      </button>

      {/* Assistant Drawer */}
      <AssistantDrawer isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
    </div>
  );
}
