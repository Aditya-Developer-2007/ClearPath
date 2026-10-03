import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  getApprovalAPI,
  getMessagesAPI,
  sendMessageAPI,
  checkDocumentAPI,
  submitApprovalAPI,
  getMyApplicationsAPI,
} from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import RouteTrack from '../../components/RouteTrack';
import {
  ArrowLeft, Clock, Upload, CheckCircle2, AlertTriangle,
  Send, Sparkles, User as UserIcon, RefreshCw, Check, RotateCcw, Circle,
} from 'lucide-react';

// ── Constants ──────────────────────────────────────────────────────────────
const PROFILE_ADDRESS = 'plot 14, gidc sachin, surat';

const DEFAULT_DECLARED_FIELDS = {
  address: 'Plot 14, GIDC Sachin, Surat',
  pan: 'ABCDE1234F',
  unitSize: '1500 sqft',
};

const ADDRESS_WARNING = {
  field: 'Business Address',
  doc1: 'Application form',
  doc2: 'Lease deed',
  note: 'Address on the lease deed differs from your application. Fix it before submitting.',
};

/**
 * Pure, derived validation for one document.
 * Called on every render - no stale stored flags.
 *
 * Returns:
 *   status  : 'valid' | 'needs_fix' | 'unchecked'
 *   warnings: Warning[]
 */
function computeDocValidation(doc) {
  if (!doc) return null;

  // If the user has edited a field since the last Re-check, mark unchecked.
  if (doc.unchecked) {
    return { status: 'unchecked', warnings: [] };
  }

  // Only the Lease Deed carries the address check.
  if (doc.docType === 'Lease Deed') {
    const declared = (doc.declaredFields?.address ?? '').trim().toLowerCase();
    if (declared !== PROFILE_ADDRESS) {
      return { status: 'needs_fix', warnings: [ADDRESS_WARNING] };
    }
  }

  // All other docs (or Lease Deed with matching address) are valid once checked.
  return { status: 'valid', warnings: [] };
}

/**
 * Derived checklist status, icon, and short reason for blocking checklist above Submit.
 */
function getDocChecklistInfo(req, doc, validation, isChecking) {
  if (!doc) {
    return {
      status: 'missing',
      reason: 'missing',
      icon: 'circle',
    };
  }

  if (isChecking) {
    return {
      status: 'checking',
      reason: 'checking…',
      icon: 'checking',
    };
  }

  if (validation?.status === 'unchecked') {
    return {
      status: 'unchecked',
      reason: 'unchecked',
      icon: 'circle',
    };
  }

  if (validation?.status === 'needs_fix') {
    const warning = validation?.warnings?.[0];
    let reason = 'needs fix';
    if (warning?.field) {
      if (warning.field.toLowerCase().includes('address')) {
        reason = 'address mismatch';
      } else {
        reason = `${warning.field.toLowerCase()} mismatch`;
      }
    }
    return {
      status: 'needs_fix',
      reason,
      icon: 'warning',
    };
  }

  if (validation?.status === 'valid') {
    return {
      status: 'valid',
      reason: 'valid',
      icon: 'tick',
    };
  }

  return {
    status: 'missing',
    reason: 'missing',
    icon: 'circle',
  };
}

// ── Initial snapshot of mock docs for Reset demo ───────────────────────────
function buildInitialDocs(appData) {
  const docs = {};
  appData.requiredDocs.forEach((req) => {
    const uploaded = appData.documents.find((d) => d.docType === req.docType);
    if (uploaded) {
      docs[req.docType] = {
        docType: req.docType,
        fileName: uploaded.fileName,
        declaredFields: uploaded.declaredFields
          ? { ...uploaded.declaredFields }
          : req.docType === 'Lease Deed'
            ? { ...DEFAULT_DECLARED_FIELDS, address: 'Plot 12, GIDC Sachin, Surat' }
            : { ...DEFAULT_DECLARED_FIELDS },
        unchecked: false,
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [approval, setApproval] = useState(null);
  const [originalApproval, setOriginalApproval] = useState(null);
  const [allApprovals, setAllApprovals] = useState([]);
  const [messages, setMessages] = useState([]);

  /**
   * docsState[docType] = {
   *   docType, fileName, declaredFields,
   *   unchecked: bool   <- true after a field edit, cleared by Re-check
   * } | null
   */
  const [docsState, setDocsState] = useState({});
  const [originalDocsState, setOriginalDocsState] = useState({});

  const [replyText, setReplyText] = useState('');
  const [now, setNow] = useState(new Date());
  const [mobileTab, setMobileTab] = useState('documents');
  const [checkingDoc, setCheckingDoc] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

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
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    Promise.all([getApprovalAPI(id), getMessagesAPI(id), getMyApplicationsAPI()])
      .then(([appRes, msgRes, allRes]) => {
        if (!active) return;

        const appData = appRes.data;
        setApproval(appData);
        setOriginalApproval(appData);
        setMessages(msgRes.data);

        if (allRes.data.applications.length > 0) {
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

  const applyCheckResult = (docType, checkedFields, fileName) => {
    setDocsState((prev) => {
      const current = prev[docType];
      if (!current) return prev;
      const isStillSame = JSON.stringify(current.declaredFields) === JSON.stringify(checkedFields);
      if (!isStillSame) {
        return prev;
      }
      const updated = {
        ...prev,
        [docType]: {
          ...current,
          fileName: fileName || current.fileName,
          unchecked: false,
        },
      };
      latestDocsRef.current = updated;
      return updated;
    });
    setCheckingDoc((curr) => (curr === docType ? null : curr));
  };

  const runCheck = (docType, declaredFields, fileName) => {
    setCheckingDoc(docType);
    checkDocumentAPI(id, { docType, fileName, declaredFields })
      .then(() => applyCheckResult(docType, declaredFields, fileName))
      .catch(() => applyCheckResult(docType, declaredFields, fileName));
  };

  const handleFileChosen = (docType, file) => {
    if (debounceTimersRef.current[docType]) {
      clearTimeout(debounceTimersRef.current[docType]);
      delete debounceTimersRef.current[docType];
    }
    const fields = { ...DEFAULT_DECLARED_FIELDS };
    const updated = {
      ...latestDocsRef.current,
      ...docsState,
      [docType]: { docType, fileName: file.name, declaredFields: fields, unchecked: true },
    };
    latestDocsRef.current = updated;
    setDocsState(updated);
    runCheck(docType, fields, file.name);
  };

  const handleRecheck = (docType) => {
    if (debounceTimersRef.current[docType]) {
      clearTimeout(debounceTimersRef.current[docType]);
      delete debounceTimersRef.current[docType];
    }
    const doc = latestDocsRef.current[docType] || docsState[docType];
    if (!doc) return;
    runCheck(docType, doc.declaredFields, doc.fileName);
  };

  const updateDeclaredField = (docType, field, value) => {
    if (debounceTimersRef.current[docType]) {
      clearTimeout(debounceTimersRef.current[docType]);
    }

    const currentDoc = latestDocsRef.current[docType] || docsState[docType];
    const updatedFields = {
      ...currentDoc?.declaredFields,
      [field]: value,
    };
    const fileName = currentDoc?.fileName;

    const updated = {
      ...latestDocsRef.current,
      ...docsState,
      [docType]: {
        ...currentDoc,
        declaredFields: updatedFields,
        unchecked: true,
      },
    };
    latestDocsRef.current = updated;
    setDocsState(updated);

    debounceTimersRef.current[docType] = setTimeout(() => {
      runCheck(docType, updatedFields, fileName);
    }, 800);
  };

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    const text = replyText;
    setReplyText('');
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), senderRole: 'applicant', senderName: 'You', text, timestamp: new Date().toISOString() },
    ]);
    sendMessageAPI(id, text).catch(console.error);
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

  // Derived validation computed on every render
  const computedDocs = {};
  if (approval) {
    approval.requiredDocs.forEach((req) => {
      const doc = docsState[req.docType];
      computedDocs[req.docType] = computeDocValidation(doc);
    });
  }

  const getSubmitState = () => {
    if (!approval) return { canSubmit: false, reason: '' };
    if (!['query_raised', 'not_started'].includes(approval.status)) return { canSubmit: false, reason: '' };

    const missingDocs = approval.requiredDocs.filter((req) => !docsState[req.docType]);
    if (missingDocs.length > 0) {
      const names = missingDocs.map((r) => r.label).join(', ');
      return { canSubmit: false, reason: `Missing required document${missingDocs.length > 1 ? 's' : ''}: ${names}.` };
    }

    const uncheckedDocs = approval.requiredDocs.filter(
      (req) => computedDocs[req.docType]?.status === 'unchecked'
    );
    if (uncheckedDocs.length > 0) {
      const names = uncheckedDocs.map((r) => r.label).join(', ');
      return { canSubmit: false, reason: `Click Re-check after editing: ${names}.` };
    }

    const warningDocs = approval.requiredDocs.filter(
      (req) => computedDocs[req.docType]?.status === 'needs_fix'
    );
    if (warningDocs.length > 0) {
      const names = warningDocs.map((r) => r.label).join(', ');
      return { canSubmit: false, reason: `Fix warnings on: ${names}.` };
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
            <h2 className="font-headings text-lg text-[#0A1128] mb-4">Documents</h2>

            <div className="space-y-6">
              {approval.requiredDocs.map((req) => {
                const doc = docsState[req.docType];
                const validation = computedDocs[req.docType];
                const isChecking = checkingDoc === req.docType;

                const isUnchecked = validation?.status === 'unchecked';
                const isValid = validation?.status === 'valid';
                const hasWarnings = validation?.status === 'needs_fix';
                const warnings = validation?.warnings ?? [];

                return (
                  <div key={req.docType} className="border border-border rounded p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#0A1128]">{req.label}</span>
                        {req.required && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold rounded">Req</span>
                        )}
                      </div>

                      {!doc && !isChecking && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-1 rounded">Missing</span>
                      )}
                      {!doc && isChecking && (
                        <span className="text-xs text-gray-400 font-medium animate-pulse">Checking…</span>
                      )}
                      {doc && isChecking && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium bg-teal-50 px-2 py-1 rounded">
                          <RefreshCw size={11} className="animate-spin text-primary" /> Checking…
                        </span>
                      )}
                      {doc && !isChecking && isUnchecked && (
                        <span className="flex items-center gap-1 text-xs text-teal-800 font-medium bg-teal-50 px-2 py-1 rounded border border-teal-200">
                          Unchecked
                        </span>
                      )}
                      {doc && !isChecking && isValid && (
                        <span className="flex items-center gap-1 text-xs text-status-approved font-medium">
                          <CheckCircle2 size={14} /> Valid
                        </span>
                      )}
                      {doc && !isChecking && hasWarnings && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle size={14} /> Needs fix
                        </span>
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

                    {!doc && !isChecking && (
                      <button
                        onClick={() => fileInputRefs.current[req.docType]?.click()}
                        className="w-full py-2 border-2 border-dashed border-gray-300 rounded text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
                      >
                        <Upload size={16} /> Upload file
                      </button>
                    )}

                    {!doc && isChecking && (
                      <div className="py-2 text-sm text-gray-500 flex items-center justify-center gap-2 animate-pulse">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" /> Checking…
                      </div>
                    )}

                    {doc && (
                      <div className="bg-gray-50 rounded p-3 text-sm space-y-3">
                        <div className="flex items-center justify-between text-gray-700">
                          <span className="truncate font-mono text-xs">{doc.fileName}</span>
                          {!submitSuccess && (
                            <button
                              onClick={() => {
                                if (debounceTimersRef.current[req.docType]) {
                                  clearTimeout(debounceTimersRef.current[req.docType]);
                                  delete debounceTimersRef.current[req.docType];
                                }
                                setDocsState((prev) => {
                                  const updated = { ...prev, [req.docType]: null };
                                  latestDocsRef.current = updated;
                                  return updated;
                                });
                              }}
                              className="text-xs text-primary hover:underline shrink-0 ml-2"
                            >
                              Change
                            </button>
                          )}
                        </div>

                        {hasWarnings && warnings.length > 0 && (
                          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 space-y-2">
                            {warnings.map((w, idx) => (
                              <div key={idx} className="flex gap-2 items-start">
                                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                                <div>
                                  <div className="font-semibold text-xs uppercase tracking-wider text-amber-800">{w.field} Mismatch</div>
                                  <div className="text-xs mt-0.5 leading-relaxed">{w.note}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="pt-2 border-t border-gray-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-teal-700 bg-teal-50 px-2 py-1 rounded inline-block">
                              Auto-filled from your profile
                            </span>
                            {!submitSuccess && (
                              <button
                                type="button"
                                onClick={() => handleRecheck(req.docType)}
                                disabled={isChecking}
                                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded transition-colors font-medium ${
                                  isUnchecked
                                    ? 'bg-primary text-white hover:bg-teal-800 shadow-sm'
                                    : 'text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10'
                                }`}
                              >
                                <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} /> {isChecking ? 'Checking…' : 'Re-check'}
                              </button>
                            )}
                          </div>

                          {Object.entries(doc.declaredFields || {}).map(([key, val]) => (
                            <div key={key}>
                              <label className="block text-xs text-gray-500 capitalize mb-1">{key}</label>
                              {submitSuccess ? (
                                <div className="w-full border border-border rounded px-2 py-1 text-sm bg-gray-100 text-gray-600 select-none">
                                  {val}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  value={val}
                                  onChange={(e) => updateDeclaredField(req.docType, key, e.target.value)}
                                  className="w-full border border-border rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                                />
                              )}
                            </div>
                          ))}

                          {isUnchecked && (
                            <div className="text-xs text-teal-800 bg-teal-50 border border-teal-200/80 rounded px-2.5 py-1.5 flex items-center gap-1.5 font-medium">
                              <span>You changed the details. Click Re-check to validate.</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 border-t border-border pt-4 space-y-3">
              {/* Document readiness checklist */}
              <div className="bg-gray-50 border border-border rounded p-3 space-y-1.5">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  Document Checklist
                </div>
                {approval.requiredDocs.map((req) => {
                  const doc = docsState[req.docType];
                  const validation = computedDocs[req.docType];
                  const isChecking = checkingDoc === req.docType;
                  const { status, reason, icon } = getDocChecklistInfo(req, doc, validation, isChecking);

                  return (
                    <div key={req.docType} className="flex items-center gap-2 text-xs">
                      {icon === 'tick' && <CheckCircle2 size={14} className="text-green-600 shrink-0" />}
                      {icon === 'warning' && <AlertTriangle size={14} className="text-amber-500 shrink-0" />}
                      {icon === 'circle' && <Circle size={14} className="text-gray-400 shrink-0" />}
                      {icon === 'checking' && (
                        <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin shrink-0" />
                      )}
                      <span className="text-gray-700">
                        <span className="font-medium text-[#0A1128]">{req.label}:</span>{' '}
                        <span
                          className={
                            status === 'valid'
                              ? 'text-green-700 font-medium'
                              : status === 'needs_fix'
                              ? 'text-amber-700 font-medium'
                              : status === 'checking'
                              ? 'text-primary font-medium'
                              : 'text-gray-500'
                          }
                        >
                          {reason}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              {submitSuccess ? (
                <button
                  disabled
                  className="w-full py-2.5 bg-green-600 text-white rounded font-medium disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check size={18} /> Submitted
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit || submitting}
                  className="w-full py-2.5 bg-primary text-white rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
                  ) : 'Submit for review'}
                </button>
              )}
              {!canSubmit && !submitSuccess && submitReason && (
                <p className="text-sm text-gray-700 font-medium text-center">{submitReason}</p>
              )}
            </div>
          </div>
        </div>

        <div className={`md:col-span-4 space-y-6 ${mobileTab === 'documents' ? 'hidden md:block' : ''}`}>

          <div
            className={`bg-white border border-border rounded shadow-sm flex flex-col ${
              mobileTab === 'thread' || mobileTab === 'documents' ? 'block' : 'hidden md:block'
            }`}
            style={{ height: '500px' }}
          >
            <div className="p-4 border-b border-border shrink-0">
              <h2 className="font-headings text-lg text-[#0A1128]">Thread</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
              {messages.length === 0 ? (
                <div className="text-center text-sm text-gray-400 py-8">No messages yet.</div>
              ) : (
                messages.map((m) => {
                  const isYou = m.senderRole === 'applicant';
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

                      {m.aiExplanation && (
                        <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg max-w-full text-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5 text-xs text-teal-800 font-bold uppercase tracking-wider">
                              <Sparkles size={14} /> Explained by AI
                            </div>
                            <span className="text-[9px] text-teal-600 font-medium bg-teal-100 px-1 rounded uppercase tracking-widest">
                              The officer decides
                            </span>
                          </div>
                          <div className="space-y-3 text-gray-700">
                            <div>
                              <strong className="block text-xs text-teal-900 mb-0.5">What this means</strong>
                              <p className="text-xs leading-relaxed">{m.aiExplanation.explanation}</p>
                            </div>
                            <div>
                              <strong className="block text-xs text-teal-900 mb-0.5">What to do</strong>
                              <ol className="list-decimal pl-4 text-xs space-y-1">
                                {m.aiExplanation.steps.map((step, idx) => <li key={idx}>{step}</li>)}
                              </ol>
                            </div>
                            <div className="pt-2 border-t border-teal-200/50">
                              <p className="text-xs text-gray-600 italic">"{m.aiExplanation.hindi}"</p>
                            </div>
                          </div>
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
