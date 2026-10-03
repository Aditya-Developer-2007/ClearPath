import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import RiskBadge from '../../components/RiskBadge';
import EmptyState from '../../components/EmptyState';
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

export default function ChecklistResult() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const result = state?.result;

  if (!result) {
    return (
      <div className="min-h-screen p-8 bg-background flex flex-col items-center justify-center">
        <EmptyState message="No results found." />
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-primary text-white rounded text-sm">Go to Home</button>
      </div>
    );
  }

  const { approvals, estimatedDays } = result;
  const inspectionCount = approvals.filter(a => a.needsInspection).length;

  const handleStart = () => {
    if (user) {
      navigate('/app/dashboard');
    } else {
      // In a real app we'd pass a return URL
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background pb-32">
      <header className="h-16 flex items-center px-6 border-b border-border bg-white shrink-0">
        <div className="font-headings font-bold text-xl text-text cursor-pointer" onClick={() => navigate('/')}>ClearPath</div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto p-6 md:p-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl md:text-5xl font-headings mb-4 text-text">
            {approvals.length} approvals required
          </h1>
          <p className="text-lg font-mono text-gray-600">
            Estimated ~{estimatedDays} days
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {approvals.map((app, idx) => {
            const Icon = DEPT_ICONS[app.department] || FileText;
            const staggerClass = `stagger-${Math.min(idx + 1, 7)}`;
            
            return (
              <div key={app.id} className={`bg-white border border-border rounded-lg p-5 flex flex-col md:flex-row gap-4 md:items-center justify-between shadow-sm ${staggerClass}`}>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center text-gray-600 shrink-0">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-headings text-lg text-text leading-snug">{app.name}</h3>
                    <p className="text-sm text-gray-500 mb-2">{app.department}</p>
                    <div className="flex flex-wrap gap-2">
                      {app.docs.map(d => (
                        <span key={d} className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-xs rounded">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-3 mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-border">
                  <div className="flex gap-2 items-center">
                    {app.needsInspection && (
                       <span className="px-2 py-1 bg-purple-100 text-purple-800 text-[10px] uppercase font-bold rounded">Inspection needed</span>
                    )}
                    <RiskBadge tier={app.riskTier} />
                  </div>
                  <span className="font-mono text-sm font-medium">SLA {app.slaDays}d</span>
                </div>
              </div>
            );
          })}
        </div>

        {inspectionCount >= 2 && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded p-4 mb-8 text-sm flex gap-3 stagger-7">
            <ShieldAlert size={20} className="shrink-0 text-blue-600" />
            <div>
              <strong>Good news:</strong> {inspectionCount} inspections can be combined into one joint visit by the departments.
            </div>
          </div>
        )}
      </main>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-border p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 flex justify-center pb-safe">
        <button onClick={handleStart} className="w-full md:w-auto bg-primary text-white font-medium py-3 px-12 rounded-lg hover:bg-teal-800 transition-colors shadow-sm">
          Start my application
        </button>
      </div>

      {/* Floating Ask Assistant Button */}
      <button 
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-teal-800 transition-colors z-20 group"
        onClick={() => alert("Assistant coming next")}
      >
        <MessageCircle size={24} />
      </button>
    </div>
  );
}
