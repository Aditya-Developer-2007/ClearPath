import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import {
  getMyApplicationsAPI,
  generateApprovalsForBusiness,
  deriveApprovalMetadata,
  getStatePortalBadge,
} from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import VerifiableNocModal from '../../components/VerifiableNocModal';
import {
  Search,
  ShieldCheck,
  Clock,
  ArrowRight,
  CheckCircle2,
  FileText,
  X,
} from 'lucide-react';

function getStatusBucket(r) {
  if (r.status === 'approved') return 'approved';
  if (['query_raised', 'rejected'].includes(r.status) || r.escalated) return 'needsAction';
  if (['submitted', 'under_review'].includes(r.status)) return 'inReview';
  return 'notStarted';
}

function formatSLA(r) {
  if (r.status === 'approved') {
    return { text: 'NOC Issued & Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  }
  if (!r.slaDeadline) {
    return { text: `${r.slaDays || 30}d Statutory SLA`, color: 'text-slate-600 bg-slate-100 border-slate-200' };
  }
  const diffMs = new Date(r.slaDeadline).getTime() - Date.now();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) {
    return { text: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-rose-700 bg-rose-50 border-rose-200' };
  }
  if (diffDays <= 3) {
    return { text: `${diffDays}d remaining (Urgent)`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
  }
  return { text: `${diffDays}d remaining`, color: 'text-slate-600 bg-slate-50 border-slate-200' };
}

export default function MyApprovals() {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, needsAction, inReview, approved
  const [selectedNocApproval, setSelectedNocApproval] = useState(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    getMyApplicationsAPI()
      .then((res) => {
        if (!mounted) return;
        const app = res.data?.applications?.[0];
        let list = app?.approvalRequests || [];

        if (activeBusiness) {
          const isDefaultUnit =
            activeBusiness.id === 'b1' ||
            (activeBusiness.sector?.toLowerCase().includes('textile') &&
              activeBusiness.city?.toLowerCase().includes('surat'));

          if (!isDefaultUnit) {
            list = generateApprovalsForBusiness(activeBusiness).map((a) => ({
              ...a,
              status: 'not_started',
              slaDeadline: new Date(Date.now() + (a.slaDays || 30) * 86400000).toISOString(),
              lastActionAt: new Date().toISOString(),
            }));
          }
        }

        // Enhance with metadata
        const stateName = activeBusiness?.state || 'Gujarat';
        const enhanced = list.map((item) => {
          const meta = deriveApprovalMetadata(item, stateName);
          return {
            ...item,
            formName: item.formName || meta.formName,
            routing: item.routing || meta.routing,
            stage: item.stage || meta.stage,
            statutoryBasis: item.statutoryBasis || meta.statutoryBasis,
          };
        });

        setApprovals(enhanced);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        // Fallback to statutory catalog generation
        if (activeBusiness) {
          const gen = generateApprovalsForBusiness(activeBusiness);
          setApprovals(gen);
        }
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeBusiness]);

  // Metric counts
  const counts = useMemo(() => {
    const res = { all: approvals.length, needsAction: 0, inReview: 0, approved: 0, notStarted: 0 };
    for (const a of approvals) {
      const bucket = getStatusBucket(a);
      if (bucket === 'needsAction') res.needsAction++;
      else if (bucket === 'inReview') res.inReview++;
      else if (bucket === 'approved') res.approved++;
      else if (bucket === 'notStarted') res.notStarted++;
    }
    return res;
  }, [approvals]);

  // Total statutory fees
  const totalStatutoryFees = useMemo(() => {
    return approvals.reduce((sum, a) => sum + (a.statutoryFeeInr || 0), 0);
  }, [approvals]);

  // Filtered list
  const filteredApprovals = useMemo(() => {
    return approvals.filter((a) => {
      // Status filter
      if (statusFilter !== 'all') {
        const bucket = getStatusBucket(a);
        if (bucket !== statusFilter) return false;
      }
      // Search filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = (a.name || '').toLowerCase().includes(q);
        const matchesCode = (a.code || '').toLowerCase().includes(q);
        const matchesForm = (a.formName || '').toLowerCase().includes(q);
        const matchesBasis = (a.statutoryBasis || '').toLowerCase().includes(q);
        const matchesDept = (a.department || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesForm && !matchesBasis && !matchesDept) {
          return false;
        }
      }
      return true;
    });
  }, [approvals, statusFilter, searchTerm]);

  return (
    <div className="min-h-full pb-16">
      {/* Header Banner */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  STATUTORY CLEARANCES LEDGER
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-medium text-slate-600">
                  Right to Public Services Act (RTPS) SLA Protected
                </span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headings">
                My Statutory Approvals &amp; Licences
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                <span>Unit: <strong>{activeBusiness?.name || 'Surya Vastra Mills Pvt. Ltd.'}</strong></span>
                <span>•</span>
                <span>{activeBusiness?.sector || 'Textile'}</span>
                <span>•</span>
                <span>{activeBusiness?.city || 'Surat'}, {activeBusiness?.state || 'Gujarat'}</span>
                {activeBusiness?.udyam && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                      {activeBusiness.udyam}
                    </span>
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-mono font-bold shadow-sm">
                <ShieldCheck size={14} className="text-teal-400" />
                {counts.approved} / {counts.all} Cleared
              </span>
            </div>
          </div>

          {/* Executive GovTech Telemetry Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                <span className="font-mono font-bold text-base">₹</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Statutory Fees</span>
                <span className="font-mono text-base font-bold text-slate-900">
                  ₹{totalStatutoryFees.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200/80 pl-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Critical Path SLA</span>
                <span className="font-mono text-sm font-bold text-slate-900">
                  58 Days <span className="text-xs font-normal text-slate-500">(Max)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200/80 pl-4">
              <div className="w-10 h-10 rounded-lg bg-sky-50 border border-sky-200 text-sky-700 flex items-center justify-center shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Parallel Days Saved</span>
                <span className="font-mono text-sm font-bold text-sky-700">
                  76 Days <span className="text-xs font-normal text-slate-500">(vs 134d)</span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200/80 pl-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                <ShieldCheck size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Verifiable NOCs</span>
                <span className="font-mono text-base font-bold text-emerald-700">
                  {counts.approved} of {counts.all} Validated
                </span>
              </div>
            </div>
          </div>

          {/* Metric Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mt-6">
            <button
              onClick={() => setStatusFilter('all')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50/60 text-slate-900 border-slate-200/80 hover:bg-slate-100'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">Total Required</div>
              <div className="font-mono text-2xl font-bold mt-0.5">{counts.all}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Statutory compliance mandates</div>
            </button>

            <button
              onClick={() => setStatusFilter('needsAction')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'needsAction'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-amber-50/50 text-amber-950 border-amber-200/80 hover:bg-amber-100/60'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Action Required</div>
              <div className="font-mono text-2xl font-bold mt-0.5">{counts.needsAction}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Department queries</div>
            </button>

            <button
              onClick={() => setStatusFilter('inReview')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'inReview'
                  ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                  : 'bg-sky-50/50 text-sky-950 border-sky-200/80 hover:bg-sky-100/60'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Under Review</div>
              <div className="font-mono text-2xl font-bold mt-0.5">{counts.inReview}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Scrutiny at officer desk</div>
            </button>

            <button
              onClick={() => setStatusFilter('approved')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'approved'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-emerald-50/50 text-emerald-950 border-emerald-200/80 hover:bg-emerald-100/60'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Approved</div>
              <div className="font-mono text-2xl font-bold mt-0.5">{counts.approved}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Issued certificates &amp; NOCs</div>
            </button>

            <button
              onClick={() => setStatusFilter('notStarted')}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                statusFilter === 'notStarted'
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-slate-50/50 text-slate-700 border-slate-200/80 hover:bg-slate-100/60'
              }`}
            >
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-80">Not Started</div>
              <div className="font-mono text-2xl font-bold mt-0.5">{counts.notStarted}</div>
              <div className="text-[10px] opacity-75 mt-0.5">Pending filing</div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {/* Search & Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-96">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by license name, form, act, code..."
              className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 shrink-0">Filter:</span>
            {[
              { id: 'all', label: `All (${counts.all})` },
              { id: 'needsAction', label: `Action Required (${counts.needsAction})` },
              { id: 'inReview', label: `In Review (${counts.inReview})` },
              { id: 'approved', label: `Approved (${counts.approved})` },
              { id: 'notStarted', label: `Not Started (${counts.notStarted})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="space-y-4">
            <SkeletonCard count={4} />
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
            <EmptyState
              icon={FileText}
              title="No Approvals Match Filter"
              description={searchTerm ? `No clearances match search query "${searchTerm}".` : 'No clearances found in this filter category.'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-3 text-xs font-bold text-teal-700 hover:text-teal-800 underline"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApprovals.map((r) => {
              const sla = formatSLA(r);
              const portalBadge = getStatePortalBadge(activeBusiness?.state || 'Gujarat');

              return (
                <div
                  key={r.id}
                  onClick={() => navigate(`/app/workspace/${r.id}`)}
                  className="group cursor-pointer bg-white border border-slate-200/80 hover:border-teal-500/60 rounded-xl p-5 flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between shadow-2xs hover:shadow-md transition-all duration-150 relative overflow-hidden"
                >
                  {/* Left accent strip based on status */}
                  <div
                    className={`absolute top-0 left-0 bottom-0 w-[4px] ${
                      r.status === 'approved'
                        ? 'bg-emerald-500'
                        : r.status === 'query_raised'
                        ? 'bg-sky-500'
                        : ['submitted', 'under_review'].includes(r.status)
                        ? 'bg-amber-400'
                        : r.status === 'rejected'
                        ? 'bg-rose-500'
                        : 'bg-slate-300'
                    }`}
                  />

                  {/* Left Details */}
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded shrink-0">
                        {r.code}
                      </span>
                      <h3 className="font-headings font-bold text-base text-slate-900 tracking-tight group-hover:text-teal-700 transition-colors">
                        {r.name}
                      </h3>
                      <StatusBadge status={r.status} />
                      <RiskBadge tier={r.riskTier} />
                      {r.escalated && (
                        <span className="px-2 py-0.5 bg-rose-50 border border-rose-200 text-rose-800 text-[10px] uppercase font-bold rounded tracking-wider shrink-0">
                          Escalated
                        </span>
                      )}
                      {r.status === 'approved' && r.certificateMeta && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-mono font-bold">
                          <CheckCircle2 size={12} className="text-emerald-600" />
                          {r.certificateMeta.certificateNo}
                        </span>
                      )}
                    </div>

                    {/* Metadata & Mandate */}
                    <div className="text-xs text-slate-600 space-y-1 mt-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Mandate:</span>
                        <span className="text-slate-700 font-medium">{r.statutoryBasis}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-500 flex-wrap pt-1">
                        <span>Form: <strong className="font-mono text-slate-800">{r.formName || 'CAF Form'}</strong></span>
                        <span>•</span>
                        <span>Dept: <strong className="text-slate-800">{r.department}</strong></span>
                        <span>•</span>
                        <span>Portal: <span className="text-teal-700 font-semibold">{portalBadge.portalName}</span></span>
                      </div>
                    </div>

                    {/* Bottom strip: Fee & Officer */}
                    <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Govt Fee:</span>
                        <span className="font-mono font-bold text-slate-900">
                          {r.statutoryFeeInr != null && r.statutoryFeeInr > 0
                            ? `₹${r.statutoryFeeInr.toLocaleString('en-IN')}`
                            : 'Statutory ₹0 (Zero Fee)'}
                        </span>
                      </div>
                      <span className="text-slate-300">•</span>
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Desk:</span>
                        <span>{r.assignedOfficerName ? `${r.assignedOfficerName} (Desk ${r.deskNo})` : 'Central Inward Queue'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions & SLA */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 shrink-0">
                    <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono font-semibold border ${sla.color}`}>
                      <Clock size={12} />
                      {sla.text}
                    </div>

                    <div className="flex items-center gap-2">
                      {r.status === 'approved' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedNocApproval(r);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 shadow-2xs transition-all active:scale-[0.98]"
                        >
                          <ShieldCheck size={14} className="text-emerald-600" />
                          <span>View NOC Certificate</span>
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/workspace/${r.id}`);
                        }}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-2xs transition-all active:scale-[0.98]"
                      >
                        <span>Open Workspace</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verifiable Digital NOC Modal */}
      {selectedNocApproval && (
        <VerifiableNocModal
          approval={selectedNocApproval}
          business={activeBusiness}
          onClose={() => setSelectedNocApproval(null)}
        />
      )}
    </div>
  );
}

