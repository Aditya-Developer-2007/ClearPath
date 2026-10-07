import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  getOfficerApprovalAPI,
  officerActionAPI,
  aiSummarizeAPI,
  sendMessageAPI,
} from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import RouteTrack from '../../components/RouteTrack';
import {
  ArrowLeft,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Send,
  User as UserIcon,
  Check,
  X,
  XCircle,
  MessageSquareWarning,
  RefreshCw,
} from 'lucide-react';

// ── Helpers ────────────────────────────────────────────────────────────────
function getSLAInfo(deadline, status) {
  if (['approved', 'rejected'].includes(status)) {
    return { text: 'Done', color: 'text-gray-400', isOverdue: false };
  }
  if (!deadline) return { text: 'No SLA', color: 'text-gray-400', isOverdue: false };
  const diffDays = Math.ceil((new Date(deadline) - Date.now()) / 86400000);
  if (diffDays < 0) return { text: 'OVERDUE', color: 'text-status-rejected', isOverdue: true };
  if (diffDays === 0) return { text: 'Due today', color: 'text-orange-600', isOverdue: false };
  if (diffDays <= 2) return { text: `${diffDays}d left`, color: 'text-orange-600', isOverdue: false };
  return { text: `${diffDays}d left`, color: 'text-text', isOverdue: false };
}

function getRelativeTime(dateStr) {
  if (!dateStr) return 'Just now';
  const m = Math.floor((Date.now() - new Date(dateStr)) / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function computeCurrentStep(status) {
  if (['approved', 'rejected'].includes(status)) return 'Decision';
  if (['submitted', 'under_review', 'query_raised'].includes(status)) return 'Review';
  return 'Submitted';
}

// Has any document a warning?
function hasDocWarnings(documents) {
  return (documents || []).some((d) => d.warnings && d.warnings.length > 0);
}

// ── Action modal ───────────────────────────────────────────────────────────
function ActionModal({ type, onClose, onSubmit, loading }) {
  const [note, setNote] = useState('');
  const textRef = useRef(null);
  const isQuery = type === 'query';
  const isReject = type === 'reject';
  const minLen = 10;
  const canSubmit = !loading && note.trim().length >= minLen;

  useEffect(() => {
    textRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-headings text-lg text-[#0A1128]">
            {isQuery ? 'Raise a query' : 'Reject approval'}
          </h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>

        <p className="text-sm text-gray-600">
          {isQuery
            ? 'Describe what the applicant needs to fix or provide. This message will be sent to them.'
            : 'Explain why this application is being rejected. The applicant will see this note.'}
        </p>

        <textarea
          ref={textRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={4}
          placeholder={isQuery ? 'e.g. The address on the Lease Deed does not match…' : 'e.g. Hazardous material declaration is missing…'}
          className="w-full border border-slate-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-slate-50 text-slate-900 placeholder:text-slate-400 shadow-sm resize-none transition-all"
        />

        {note.trim().length > 0 && note.trim().length < minLen && (
          <p className="text-xs text-amber-600">Note must be at least {minLen} characters.</p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all duration-75 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={() => onSubmit(note)}
            disabled={!canSubmit}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-lg shadow-sm transition-all duration-75 active:scale-[0.97] ${
              isReject
                ? 'bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:active:scale-100'
                : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:active:scale-100'
            } disabled:cursor-not-allowed`}
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isQuery ? 'Send query' : 'Reject'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Approve confirm ────────────────────────────────────────────────────────
function ApproveConfirm({ onClose, onConfirm, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-8 space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-headings text-lg text-[#0A1128]">Approve this application?</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded">
            <X size={18} />
          </button>
        </div>
        <p className="text-sm text-gray-600">
          This will mark the application as approved. The applicant will be notified.
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all duration-75 shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100 transition-all duration-75 shadow-sm"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            <Check size={16} strokeWidth={2.5} /> Approve
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function OfficerReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const officerName = user?.name || 'Bob Officer';

  const [approval, setApproval] = useState(null);
  const [messages, setMessages] = useState([]);
  const uniqueMessages = useMemo(() => {
    const seen = new Set();
    return (messages || []).filter((m) => {
      if (!m || !m.id) return true;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }, [messages]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const [modal, setModal] = useState(null); // 'approve' | 'query' | 'reject'
  const [actionLoading, setActionLoading] = useState(false);
  const [actionBanner, setActionBanner] = useState(null); // { type: 'success'|'error', text }

  const [replyText, setReplyText] = useState('');
  const messagesEndRef = useRef(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(false);
    getOfficerApprovalAPI(id)
      .then((res) => {
        setApproval(res.data);
        setMessages(res.data.messages || []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGenerateSummary = () => {
    setAiLoading(true);
    aiSummarizeAPI(id)
      .then((res) => {
        setAiSummary(res.data);
        setAiLoading(false);
      })
      .catch(() => setAiLoading(false));
  };

  const performAction = (actionType, note = '') => {
    setActionLoading(true);
    const msgId = actionType === 'query' ? `msg-q-${Date.now()}-${Math.random().toString(36).substr(2, 6)}` : undefined;
    officerActionAPI(id, { action: actionType, note, officerName, msgId })
      .then((res) => {
        setApproval((prev) => ({
          ...prev,
          status: res.data.status,
          lastActionAt: res.data.lastActionAt,
          activityLog: res.data.activityLog,
        }));
        if (res.data.messages) {
          setMessages(res.data.messages);
        }
        const bannerText =
          actionType === 'approve' ? 'Application approved.' :
          actionType === 'reject' ? 'Application rejected.' :
          'Query sent to the applicant.';
        setActionBanner({ type: 'success', text: bannerText });
        setModal(null);
        setActionLoading(false);
      })
      .catch(() => {
        setActionBanner({ type: 'error', text: 'Something went wrong. Please try again.' });
        setActionLoading(false);
        setModal(null);
      });
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText('');
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const optimistic = {
      id: msgId,
      senderRole: 'officer',
      senderName: officerName,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => (prev.some((m) => m.id === msgId) ? prev : [...prev, optimistic]));
    sendMessageAPI(id, text, officerName, 'officer', msgId)
      .then((res) => {
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      })
      .catch(console.error);
  };

  // ── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState message="Approval not found." />
        <div className="mt-4 flex justify-center">
          <button
            onClick={() => navigate('/officer/queue')}
            className="px-4 py-2 bg-primary text-white rounded text-sm"
          >
            Back to queue
          </button>
        </div>
      </div>
    );
  }

  const sla = getSLAInfo(approval.slaDeadline, approval.status);
  const currentStep = computeCurrentStep(approval.status);
  const docHasWarnings = hasDocWarnings(approval.documents);
  const isLocked = ['approved', 'rejected'].includes(approval.status);

  const lockReason = isLocked
    ? `${approval.status === 'approved' ? 'Approved' : 'Rejected'}. No further action.`
    : null;

  const approveBlockReason = docHasWarnings
    ? 'Resolve the document warning first, or raise a query.'
    : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Modals */}
      {modal === 'approve' && (
        <ApproveConfirm
          onClose={() => setModal(null)}
          onConfirm={() => performAction('approve')}
          loading={actionLoading}
        />
      )}
      {(modal === 'query' || modal === 'reject') && (
        <ActionModal
          type={modal}
          onClose={() => setModal(null)}
          onSubmit={(note) => performAction(modal, note)}
          loading={actionLoading}
        />
      )}

      {/* Back link */}
      <div>
        <Link
          to="/officer/queue"
          className="text-xs text-slate-500 font-bold uppercase tracking-widest hover:text-slate-900 transition-colors flex items-center gap-1.5 w-fit mb-6"
        >
          <ArrowLeft size={14} strokeWidth={2.5} /> Back to queue
        </Link>

        {/* Header card */}
        <div className="bg-white shadow-sm border border-slate-200/75 rounded-2xl p-6 md:p-8 space-y-5">
          <div className="flex flex-col md:flex-row md:items-start gap-5 justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">{approval.name}</h1>
                <StatusBadge status={approval.status} isOverdue={sla.isOverdue} />
                <RiskBadge tier={approval.riskTier} />
                {approval.escalated && (
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-200/80 text-[10px] uppercase font-bold rounded-md tracking-wider">
                    <ShieldAlert size={12} strokeWidth={2.5} /> Escalated
                  </span>
                )}
              </div>
              <div className="text-sm font-medium text-slate-500 flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5 text-slate-700 font-bold">
                  <UserIcon size={14} /> {approval.applicantName}
                </span>
                <span className="text-slate-300">&bull;</span>
                <span>{approval.unitName}</span>
                <span className="text-slate-300">&bull;</span>
                <span>{approval.department}</span>
              </div>
            </div>
            <div className="flex flex-col md:items-end gap-3 shrink-0">
              <div className={`font-mono text-sm font-bold flex items-center gap-1.5 px-3 py-1.5 rounded-lg border bg-slate-50 ${sla.color} ${sla.isOverdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200'}`}>
                <Clock size={16} strokeWidth={2.5} /> {sla.text}
              </div>
              <RouteTrack currentStep={currentStep} />
            </div>
          </div>
        </div>
      </div>

      {/* Action banner */}
      {actionBanner && (
        <div className={`flex items-center gap-3 px-4 py-3 rounded border text-sm font-medium shadow-sm ${
          actionBanner.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {actionBanner.type === 'success'
            ? <CheckCircle2 size={18} className="shrink-0 text-green-600" />
            : <XCircle size={18} className="shrink-0 text-red-600" />}
          {actionBanner.text}
        </div>
      )}

      {/* Two-column body */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* LEFT: Application summary + docs */}
        <div className="space-y-6">

          {/* AI Summary card */}
          <div className="bg-white shadow-sm border border-slate-200/75 rounded-2xl p-6 md:p-8 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-bold tracking-tight text-lg text-slate-900">Application summary</h2>
              {!aiSummary && (
                <button
                  onClick={handleGenerateSummary}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800 active:scale-[0.97] transition-all duration-75 disabled:opacity-50"
                >
                  {aiLoading
                    ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating…</>
                    : <><Sparkles size={14} strokeWidth={2.5} /> Generate summary</>}
                </button>
              )}
            </div>

            {aiSummary && (
              <div className="space-y-3">
                <div className="p-3 bg-teal-50 border border-teal-100 rounded space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-teal-800 font-bold uppercase tracking-wider mb-1">
                    <Sparkles size={11} /> AI summary · Rules decide, you approve.
                  </div>
                  <ul className="space-y-1.5">
                    {aiSummary.summary.map((s, i) => (
                      <li key={i} className="flex gap-2 items-start text-xs text-gray-700">
                        <span className="text-teal-600 font-mono mt-0.5 shrink-0">{i + 1}.</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                  {aiSummary.flags && aiSummary.flags.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap pt-2">
                      {aiSummary.flags.map((f) => (
                        <span key={f} className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded bg-amber-100 text-amber-800">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => { setAiSummary(null); handleGenerateSummary(); }}
                  className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <RefreshCw size={11} /> Regenerate
                </button>
              </div>
            )}

            {/* Applicant profile */}
            {approval.applicantProfile && (
              <div className="border-t border-slate-200/80 pt-5 mt-5 space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Applicant profile
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  {[
                    ['Applicant', approval.applicantProfile.name],
                    ['Sector', approval.applicantProfile.sector],
                    ['City', approval.applicantProfile.city],
                    ['Investment', approval.applicantProfile.investment],
                    ['Employees', approval.applicantProfile.employees],
                    ['Hazardous', approval.applicantProfile.hazardous ? 'Yes' : 'No'],
                    ['Address', approval.applicantProfile.address],
                  ].map(([k, v]) => (
                    <div key={k} className="flex flex-col col-span-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{k}</span>
                      <span className="text-slate-900 font-medium text-xs">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Documents card */}
          <div className="bg-white shadow-sm border border-slate-200/75 rounded-2xl p-6 md:p-8 space-y-5">
            <h2 className="font-bold tracking-tight text-lg text-slate-900">Documents</h2>

            {/* Required docs — show missing ones first */}
            <div className="space-y-3">
              {(approval.requiredDocs || []).map((req) => {
                const uploaded = (approval.documents || []).find((d) => d.docType === req.docType);
                return (
                  <div key={req.docType} className="border border-border rounded p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-[#0A1128]">{req.label}</span>
                      {!uploaded ? (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">Missing</span>
                      ) : uploaded.warnings && uploaded.warnings.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle size={12} /> Needs fix
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-status-approved font-medium">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      )}
                    </div>
                    {uploaded && (
                      <div className="font-mono text-xs text-gray-500">{uploaded.fileName}</div>
                    )}
                    {uploaded && uploaded.warnings && uploaded.warnings.length > 0 && (
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded space-y-1">
                        {uploaded.warnings.map((w, i) => (
                          <div key={i} className="flex gap-2 items-start text-xs text-amber-900">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5 text-amber-600" />
                            <span>{w.note}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Also show any uploaded docs that aren't in requiredDocs */}
              {(approval.documents || [])
                .filter((d) => !(approval.requiredDocs || []).some((r) => r.docType === d.docType))
                .map((d) => (
                  <div key={d.id} className="border border-border rounded p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-[#0A1128]">{d.docType}</span>
                      {d.warnings && d.warnings.length > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle size={12} /> Needs fix
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-status-approved font-medium">
                          <CheckCircle2 size={12} /> Valid
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-xs text-gray-500 mt-1">{d.fileName}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* RIGHT: Thread + Timeline */}
        <div className="space-y-6">

          {/* Thread */}
          <div className="bg-white shadow-sm border border-slate-200/75 rounded-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-200/80 bg-slate-50/50">
              <h2 className="font-bold tracking-tight text-lg text-slate-900">Thread</h2>
            </div>

            {/* Messages — NO max-h or overflow-y here */}
            <div className="p-4 space-y-4">
              {uniqueMessages.length === 0 ? (
                <div className="text-sm text-gray-400 text-center py-6">No messages yet.</div>
              ) : (
                uniqueMessages.map((m) => {
                  const isOfficer = m.senderRole === 'officer';
                  return (
                    <div key={m.id} className={`flex flex-col ${isOfficer ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">{m.senderName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{getRelativeTime(m.timestamp)}</span>
                      </div>
                      <div className={`p-3 rounded max-w-[90%] text-sm ${
                        isOfficer
                          ? 'bg-primary text-white'
                          : 'bg-white border border-border text-[#0A1128] shadow-sm'
                      }`}>
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply box */}
            <div className="p-4 border-t border-slate-200/80 flex items-center gap-3 bg-white mt-auto">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type a message…"
                disabled={isLocked}
                className="flex-1 border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm disabled:bg-slate-50 disabled:text-slate-400 text-slate-900 placeholder:text-slate-400 transition-all"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim() || isLocked}
                className="p-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-all duration-75 active:scale-[0.97] shadow-sm shrink-0"
              >
                <Send size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white shadow-sm border border-slate-200/75 rounded-2xl p-6 md:p-8">
            <h2 className="font-bold tracking-tight text-lg text-slate-900 mb-5">Timeline</h2>
            <div className="space-y-5 border-l-2 border-slate-100 ml-2.5 pl-5 relative">
              {(approval.activityLog || []).map((log, i) => (
                <div key={i} className="relative flex flex-col gap-1">
                  <div className="absolute w-3.5 h-3.5 bg-slate-200 rounded-full -left-[1.7rem] top-1 border-[3px] border-white shadow-sm" />
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold text-sm text-slate-900 leading-snug">{log.action}</span>
                    <span className="text-[10px] text-slate-400 font-mono font-bold tracking-wider shrink-0">{getRelativeTime(log.timestamp)}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500">By {log.by}</span>
                  {log.note && (
                    <div className="mt-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-lg">{log.note}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div className="bg-white shadow-xl border border-slate-200/50 rounded-2xl p-6 md:p-8 sticky bottom-6 z-20">
        {isLocked ? (
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-sm ${approval.status === 'approved' ? 'bg-green-500' : 'bg-rose-500'}`} />
            <p className="text-sm font-bold text-slate-700">{lockReason}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Approve */}
              <div className="relative group">
                <button
                  onClick={() => !approveBlockReason && setModal('approve')}
                  disabled={!!approveBlockReason}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-all duration-75 active:scale-[0.97] ${
                    approveBlockReason
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Check size={16} strokeWidth={2.5} /> Approve
                </button>
              </div>

              {/* Raise query */}
              <button
                onClick={() => setModal('query')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-400 transition-all duration-75 active:scale-[0.97]"
              >
                <MessageSquareWarning size={16} strokeWidth={2.5} /> Raise query
              </button>

              {/* Reject */}
              <button
                onClick={() => setModal('reject')}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-rose-200 text-rose-700 rounded-lg text-sm font-bold shadow-sm hover:bg-rose-50 transition-all duration-75 active:scale-[0.97]"
              >
                <XCircle size={16} strokeWidth={2.5} /> Reject
              </button>
            </div>

            {/* Blocking reason for approve */}
            {approveBlockReason && (
              <p className="text-sm font-medium text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <AlertTriangle size={16} className="shrink-0 text-amber-600" strokeWidth={2.5} />
                {approveBlockReason}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
