import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useSharedTimer from '../../hooks/useSharedTimer';
import {
  getApprovalAPI,
  getMessagesAPI,
  sendMessageAPI,
  submitApprovalAPI,
  getMyApplicationsAPI,
  explainQueryAPI,
  DEMO_PROFILE_ADDRESS,
  generateApprovalsForBusiness,
  deriveApprovalMetadata,
} from '../../lib/api';
import { useBusiness } from '../../context/BusinessContext';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import RouteTrack from '../../components/RouteTrack';
import {
  ArrowLeft, Clock, Upload, CheckCircle2, AlertTriangle,
  Send, Sparkles, User as UserIcon, RefreshCw, Check, RotateCcw, Circle, Copy, FileText
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const PROFILE_ADDRESS = DEMO_PROFILE_ADDRESS.toLowerCase();

// ── Initial snapshot of mock docs for Reset demo ───────────────────────────
function buildInitialDocs(appData) {
  const docs = {};
  (appData.requiredDocs || []).forEach((req) => {
    const uploaded = (appData.documents || []).find((d) => d.docType === req.docType);
    if (uploaded) {
      docs[req.docType] = {
        docType: req.docType,
        fileName: uploaded.fileName,
      };
    } else {
      docs[req.docType] = null;
    }
  });
  return docs;
}

// ── Component ──────────────────────────────────────────────────────────────
export default function Workspace() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [approval, setApproval] = useState(null);
  const [originalApproval, setOriginalApproval] = useState(null);
  const [allApprovals, setAllApprovals] = useState([]);
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

  /**
   * docsState[docType] = {
   *   docType, fileName, declaredFields,
   *   unchecked: bool   <- true after a field edit, cleared by Re-check
   * } | null
   */
  const [docsState, setDocsState] = useState({});
  const [originalDocsState, setOriginalDocsState] = useState({});

  const [replyText, setReplyText] = useState('');
  const now = useSharedTimer();
  const [mobileTab, setMobileTab] = useState('documents');
  const [checkingDoc, setCheckingDoc] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const [customExplanations, setCustomExplanations] = useState({});
  const [explainingIds, setExplainingIds] = useState({});
  const [viewModes, setViewModes] = useState({});
  const [copiedHindiId, setCopiedHindiId] = useState(null);

  const handleCopyHindi = (msgId, text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedHindiId(msgId);
      setTimeout(() => setCopiedHindiId(null), 2000);
    }
  };

  const handleExplainQuery = async (msgId, text) => {
    setExplainingIds((prev) => ({ ...prev, [msgId]: true }));
    try {
      const res = await explainQueryAPI(text);
      if (res?.data?.ok && res.data.explanation) {
        setCustomExplanations((prev) => ({ ...prev, [msgId]: res.data.explanation }));
      }
    } catch {
      // ignore
    } finally {
      setExplainingIds((prev) => ({ ...prev, [msgId]: false }));
    }
  };

  const toggleViewMode = (msgId) => {
    setViewModes((prev) => ({
      ...prev,
      [msgId]: prev[msgId] === 'original' ? 'explanation' : 'original',
    }));
  };

  const messagesEndRef = useRef(null);
  const fileInputRefs = useRef({});
  const debounceTimersRef = useRef({});
  const latestDocsRef = useRef({});

  useEffect(() => {
    return () => {
      Object.values(debounceTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    Promise.all([getApprovalAPI(id), getMessagesAPI(id), getMyApplicationsAPI()])
      .then(([appRes, msgRes, allRes]) => {
        if (!active) return;

        const appData = appRes.data;
        
        // Enhance with real-world form metadata
        const metadata = deriveApprovalMetadata(appData, activeBusiness?.state || 'Gujarat');
        setApproval({ ...appData, formName: metadata.formName, routing: metadata.routing, stage: metadata.stage });
        setOriginalApproval({ ...appData, formName: metadata.formName, routing: metadata.routing, stage: metadata.stage });
        setMessages(msgRes.data);

        if (activeBusiness) {
          const generated = generateApprovalsForBusiness(activeBusiness).map(a => ({
            ...a,
            status: 'not_started'
          }));
          // Make sure current approval's true status is reflected in the list if it's the current one
          const currentInList = generated.find(a => a.id === appData.id);
          if (currentInList) {
            currentInList.status = appData.status;
          }
          setAllApprovals(generated);
        } else if (allRes.data.applications.length > 0) {
          setAllApprovals(allRes.data.applications[0].approvalRequests);
        }

        const initialDocs = buildInitialDocs(appData);
        latestDocsRef.current = initialDocs;
        setDocsState(initialDocs);
        setOriginalDocsState(initialDocs);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        if (active) { setError(true); setLoading(false); }
      });

    return () => { active = false; };
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChosen = (docType, file) => {
    const updated = {
      ...latestDocsRef.current,
      ...docsState,
      [docType]: { docType, fileName: file.name },
    };
    latestDocsRef.current = updated;
    setDocsState(updated);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const text = replyText.trim();
    setReplyText('');
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    const optimistic = {
      id: msgId,
      senderRole: 'applicant',
      senderName: 'You',
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => (prev.some((m) => m.id === msgId) ? prev : [...prev, optimistic]));
    sendMessageAPI(id, text, 'You', 'applicant', msgId)
      .then((res) => {
        if (res.data?.messages) {
          setMessages(res.data.messages);
        }
      })
      .catch(console.error);
  };

  const handleSubmit = () => {
    if (submitting || submitSuccess) return;
    setSubmitting(true);
    submitApprovalAPI(id)
      .then(() => {
        const entry = { action: 'Submitted', by: 'You', timestamp: new Date().toISOString(), note: '' };
        setApproval((prev) => {
          const diffDays = prev.slaDeadline
            ? Math.ceil((new Date(prev.slaDeadline) - new Date()) / 86400000)
            : 0;
          const slaText = diffDays > 0 ? `${diffDays} day${diffDays === 1 ? '' : 's'}` : 'the agreed timeline';
          setSuccessBanner(`Submitted. ${prev.assignedOfficerName || 'the officer'} will review this within ${slaText}.`);
          return { ...prev, status: 'submitted', activityLog: [...prev.activityLog, entry] };
        });
        setAllApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'submitted' } : a)));
        setSubmitSuccess(true);
        setSubmitting(false);
      })
      .catch((err) => { console.error(err); setSubmitting(false); });
  };

  const handleReset = () => {
    if (!originalApproval) return;
    Object.values(debounceTimersRef.current).forEach(clearTimeout);
    debounceTimersRef.current = {};
    setCheckingDoc(null);
    setApproval({ ...originalApproval, status: 'query_raised', activityLog: originalApproval.activityLog });
    setAllApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'query_raised' } : a)));
    // Deep-copy each doc entry so post-reset edits cannot mutate the original snapshot.
    const freshDocs = {};
    Object.entries(originalDocsState).forEach(([k, v]) => {
      freshDocs[k] = v ? { ...v, declaredFields: { ...v.declaredFields } } : null;
    });
    latestDocsRef.current = freshDocs;
    setDocsState(freshDocs);
    setSubmitSuccess(false);
    setSuccessBanner('');
  };

  const isEditable = Boolean(approval && ['query_raised', 'not_started'].includes(approval.status));
  const isLocked = !isEditable;

  const getSubmitState = () => {
    if (!approval) return { canSubmit: false, reason: '' };
    if (!['query_raised', 'not_started'].includes(approval.status)) return { canSubmit: false, reason: '' };

    const missingDocs = approval.requiredDocs.filter((req) => !docsState[req.docType]);
    if (missingDocs.length > 0) {
      const names = missingDocs.map((r) => r.label).join(', ');
      return { canSubmit: false, reason: `Missing required document${missingDocs.length > 1 ? 's' : ''}: ${names}.` };
    }

    return { canSubmit: true, reason: '' };
  };

  const getSLA = (deadline) => {
    if (!deadline) return { text: 'No SLA', color: 'text-gray-500' };
    const d = Math.ceil((new Date(deadline) - now) / 86400000);
    if (d < 0) return { text: 'OVERDUE', color: 'text-status-rejected' };
    if (d <= 2) return { text: `${d}d left`, color: 'text-orange-600' };
    return { text: `${d}d left`, color: 'text-text' };
  };

  const getRelativeTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    const m = Math.floor((now - new Date(dateStr)) / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      </div>
    );
  }

  if (error || !approval) {
    return (
      <div className="max-w-6xl mx-auto">
        <EmptyState message="Approval not found." />
        <div className="mt-4 flex justify-center">
          <button onClick={() => navigate('/app/dashboard')} className="px-4 py-2 bg-primary text-white rounded">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const { canSubmit, reason: submitReason } = getSubmitState();
  const sla = getSLA(approval.slaDeadline);
  const currentStep =
    ['approved', 'rejected'].includes(approval.status) ? 'Decision' :
    ['submitted', 'under_review', 'query_raised'].includes(approval.status) ? 'Review' :
    'Submitted';

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {submitSuccess && successBanner && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 rounded px-5 py-3 shadow-sm">
          <CheckCircle2 size={20} className="shrink-0 text-green-600" />
          <span className="text-sm font-medium">{successBanner}</span>
        </div>
      )}

      {import.meta.env.DEV && (
        <div className="flex justify-end">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RotateCcw size={11} /> Reset demo
          </button>
        </div>
      )}

      <div>
        <Link to="/app/dashboard" className="text-sm text-gray-500 hover:text-primary flex items-center gap-1 w-fit mb-4">
          <ArrowLeft size={16} /> Back to dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 bg-white p-6 border border-border rounded shadow-sm">
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-headings text-[#0A1128]">{approval.name}</h1>
              <StatusBadge status={approval.status} />
              <RiskBadge tier={approval.riskTier} />
              {approval.escalated && (
                <span className="px-2 py-0.5 bg-red-100 text-red-800 text-[10px] uppercase font-bold rounded tracking-wide">Escalated</span>
              )}
            </div>
            <div className="text-sm text-gray-600 flex items-center gap-4">
              <span>{approval.department}</span>
              {approval.assignedOfficerName ? (
                <span className="flex items-center gap-1.5"><UserIcon size={14} /> {approval.assignedOfficerName}, Desk {approval.deskNo}</span>
              ) : <span>Unassigned</span>}
              <span className="text-slate-300">&bull;</span>
              <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Form: {approval.formName}</span>
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-2 w-full md:w-64">
            <div className={`font-mono text-sm font-medium flex items-center gap-1.5 ${sla.color}`}>
              <Clock size={16} /> {sla.text}
            </div>
            <RouteTrack currentStep={currentStep} />
          </div>
        </div>
      </div>

      <div className="flex md:hidden border-b border-border mb-4">
        {['documents', 'thread', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              mobileTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        <div className="hidden md:block md:col-span-3 space-y-4">
          <h2 className="font-headings text-sm text-gray-500 uppercase tracking-wider mb-2">All Approvals</h2>
          <div className="space-y-1">
            {allApprovals.map((a) => (
              <button
                key={a.id}
                onClick={() => navigate(`/app/approvals/${a.id}`)}
                className={`w-full text-left px-3 py-2 rounded text-sm flex items-center gap-2 transition-colors ${
                  a.id === id ? 'bg-primary/10 text-[#0A1128] font-medium' : 'hover:bg-gray-50 text-gray-600'
                }`}
              >
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  a.status === 'approved' ? 'bg-status-approved' :
                  a.status === 'rejected' ? 'bg-status-rejected' : 'bg-orange-400'
                }`} />
                <span className="truncate">{a.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className={`md:col-span-5 space-y-6 ${mobileTab !== 'documents' ? 'hidden md:block' : ''}`}>
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headings text-lg text-[#0A1128]">Important Document Pack</h2>
              <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {approval.requiredDocs.filter(req => docsState[req.docType]).length} of {approval.requiredDocs.length} documents ready
              </div>
            </div>

            {['submitted', 'under_review', 'approved'].includes(approval.status) && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 rounded p-4 text-sm flex gap-3 shadow-sm">
                <AlertTriangle size={18} className="shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <strong>Application submitted. Under regulatory officer review.</strong>
                  <div className="mt-1 text-blue-700/80">Document pack is locked. You can only view the files.</div>
                </div>
              </div>
            )}

            <div className="space-y-6">
              {approval.requiredDocs.map((req) => {
                const doc = docsState[req.docType];

                return (
                  <div key={req.docType} className="border border-border rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#0A1128]">{req.label}</span>
                        {req.required && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold rounded">Req</span>
                        )}
                      </div>

                      {!doc && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">Missing</span>
                      )}
                    </div>

                    <input
                      ref={(el) => { fileInputRefs.current[req.docType] = el; }}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      id={`file-input-${req.docType}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChosen(req.docType, file);
                        e.target.value = '';
                      }}
                    />

                    {!doc && (
                      isEditable ? (
                        <button
                          onClick={() => fileInputRefs.current[req.docType]?.click()}
                          className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                        >
                          <Upload size={16} /> Upload file
                        </button>
                      ) : (
                        <div className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 italic text-center">
                          Already submitted. Waiting for officer review.
                        </div>
                      )
                    )}

                    {doc && (
                      <div className="bg-slate-50 border border-slate-200/75 rounded-xl p-4 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <FileText size={16} strokeWidth={2.5} />
                          </div>
                          <div className="truncate min-w-0">
                            <div className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 mt-0.5">Uploaded</div>
                          </div>
                        </div>
                        {isEditable && (
                          <button
                            onClick={() => {
                              setDocsState((prev) => {
                                const updated = { ...prev, [req.docType]: null };
                                latestDocsRef.current = updated;
                                return updated;
                              });
                            }}
                            className="text-xs font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-slate-50 active:scale-[0.97] transition-all duration-75 shrink-0 ml-3"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-8 border-t border-slate-100 pt-6 space-y-4">
              {isLocked ? (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-2.5 bg-slate-100 text-slate-500 rounded-lg font-bold disabled:cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200"
                  >
                    <Check size={18} strokeWidth={2.5} /> {approval?.status === 'approved' ? 'Approved' : 'Submitted'}
                  </button>
                  <p className="text-xs font-medium text-slate-500 text-center">
                    Already submitted. Waiting for officer review.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] duration-75 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                  ) : 'Submit for review'}
                </button>
              )}
              {isEditable && !canSubmit && submitReason && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-2 rounded-lg font-medium text-center shadow-sm">{submitReason}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`md:col-span-4 space-y-6 ${mobileTab === 'documents' ? 'hidden md:block' : ''}`}>

          <div
            className={`bg-white border border-border rounded shadow-sm flex flex-col ${
              mobileTab === 'thread' || mobileTab === 'documents' ? 'block' : 'hidden md:block'
            }`}
          >
            <div id="workspace-thread" className="p-4 border-b border-border shrink-0">
              <h2 className="font-headings text-lg text-[#0A1128]">Thread</h2>
            </div>

            <div className="p-4 space-y-4 bg-gray-50/50">
              {uniqueMessages.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">No messages yet.</div>
              ) : (
                uniqueMessages.map((m) => {
                  const isYou = m.senderRole === 'applicant';
                  const effectiveExplanation = m.aiExplanation || customExplanations[m.id];
                  const isShowingExplanation = viewModes[m.id] !== 'original';

                  return (
                    <div key={m.id} className={`flex flex-col ${isYou ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-700">{m.senderName}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{getRelativeTime(m.timestamp)}</span>
                      </div>
                      <div className={`p-3 rounded-lg max-w-[90%] text-sm ${
                        isYou ? 'bg-primary text-white' : 'bg-white border border-border text-[#0A1128] shadow-sm'
                      }`}>
                        {m.text}
                      </div>

                      {/* Explain this button for officer messages without explanation */}
                      {!effectiveExplanation && m.senderRole === 'officer' && (
                        <button
                          onClick={() => handleExplainQuery(m.id, m.text)}
                          disabled={explainingIds[m.id]}
                          className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-teal-800 font-medium transition-colors"
                        >
                          <Sparkles size={12} /> {explainingIds[m.id] ? 'Explaining...' : 'Explain this'}
                        </button>
                      )}

                      {/* Explanation Card */}
                      {effectiveExplanation && (
                        <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg max-w-full text-sm">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-teal-800 font-bold uppercase tracking-wider">
                              <Sparkles size={14} className="shrink-0" />
                              <span>Explained by AI. The officer decides.</span>
                            </div>
                            <button
                              onClick={() => toggleViewMode(m.id)}
                              className="text-[11px] text-teal-700 hover:text-teal-900 underline font-medium shrink-0"
                            >
                              {isShowingExplanation ? 'Show original' : 'Show explanation'}
                            </button>
                          </div>

                          {isShowingExplanation ? (
                            <div className="space-y-3 text-gray-700">
                              <div>
                                <strong className="block text-xs text-teal-900 mb-0.5">What this means</strong>
                                <p className="text-xs leading-relaxed">{effectiveExplanation.explanation}</p>
                              </div>
                              <div>
                                <strong className="block text-xs text-teal-900 mb-0.5">What to do</strong>
                                <ol className="list-decimal pl-4 text-xs space-y-1">
                                  {effectiveExplanation.steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                              <div className="pt-2 border-t border-teal-200/50 flex items-center justify-between gap-2">
                                <p className="text-xs text-gray-600 italic">"{effectiveExplanation.hindi}"</p>
                                <button
                                  onClick={() => handleCopyHindi(m.id, effectiveExplanation.hindi)}
                                  className="text-teal-700 hover:text-teal-900 p-1 rounded hover:bg-teal-100/60 transition-colors shrink-0"
                                  title="Copy Hindi line"
                                  aria-label="Copy Hindi explanation"
                                >
                                  {copiedHindiId === m.id ? (
                                    <Check size={14} className="text-green-600" />
                                  ) : (
                                    <Copy size={14} />
                                  )}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-xs text-gray-700 bg-white p-2.5 rounded border border-teal-100">
                              <span className="text-[10px] text-gray-400 font-mono block mb-1">
                                ORIGINAL OFFICER NOTE:
                              </span>
                              <p className="leading-relaxed">{m.text}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-border bg-white flex items-center gap-2 shrink-0">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type a message..."
                className="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="p-2 bg-primary text-white rounded hover:bg-teal-800 disabled:opacity-50 transition-colors"
              >
                <Send size={18} />
              </button>
            </div>
          </div>

          <div className={`bg-white border border-border rounded shadow-sm p-4 ${
            mobileTab === 'timeline' || mobileTab === 'documents' ? 'block' : 'hidden md:block'
          }`}>
            <h2 className="font-headings text-lg text-[#0A1128] mb-4">Timeline</h2>
            <div className="space-y-4 border-l-2 border-gray-100 ml-2 pl-4">
              {approval.activityLog.map((log, i) => (
                <div key={i} className="relative flex flex-col gap-1">
                  <div className="absolute w-3 h-3 bg-gray-200 rounded-full -left-[1.35rem] top-1.5 border-2 border-white" />
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-sm text-[#0A1128]">{log.action}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{getRelativeTime(log.timestamp)}</span>
                  </div>
                  <span className="text-xs text-gray-500">By {log.by}</span>
                  {log.note && <div className="mt-1 text-xs text-gray-700 bg-gray-50 p-2 rounded">{log.note}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
