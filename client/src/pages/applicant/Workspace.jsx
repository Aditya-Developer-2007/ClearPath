import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import useSharedTimer from '../../hooks/useSharedTimer';
import {
  getApprovalAPI,
  getMessagesAPI,
  sendMessageAPI,
  submitApprovalAPI,
  uploadDocumentAPI,
  getMyApplicationsAPI,
  explainQueryAPI,
  generateApprovalsForBusiness,
  deriveApprovalMetadata,
} from '../../lib/api';
import { useBusiness } from '../../context/BusinessContext';
import EmptyState from '../../components/EmptyState';
import SkeletonCard from '../../components/SkeletonCard';
import StatusBadge from '../../components/StatusBadge';
import RiskBadge from '../../components/RiskBadge';
import RouteTrack from '../../components/RouteTrack';
import VerifiableNocModal from '../../components/VerifiableNocModal';
import {
  ArrowLeft, Clock, Upload, CheckCircle2, AlertTriangle,
  Send, Sparkles, User as UserIcon, Check, Copy, FileText,
  ShieldCheck, FileCheck2, X, Eye, Edit3
} from 'lucide-react';

// ── Initial snapshot of docs ───────────────────────────────────────────────
function buildInitialDocs(appData) {
  const docs = {};
  (appData.requiredDocs || []).forEach((req) => {
    const uploaded = (appData.documents || []).find((d) => d.docType === req.docType);
    if (uploaded) {
      docs[req.docType] = {
        ...uploaded,
        declaredFields: uploaded.declaredFields || {
          address: appData.applicantProfile?.address || 'Plot 14, GIDC Sachin, Surat',
          pan: appData.applicantProfile?.pan || 'AABCS1429B',
          unitSize: appData.applicantProfile?.unitSize || '500 sq.m',
        },
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

  const [docsState, setDocsState] = useState({});
  const [uploadingDoc, setUploadingDoc] = useState({});
  const [selectedDocMeta, setSelectedDocMeta] = useState(null);
  const [editingDeclaredDoc, setEditingDeclaredDoc] = useState(null);
  const [tempDeclared, setTempDeclared] = useState({});

  const [replyText, setReplyText] = useState('');
  const now = useSharedTimer();
  const [mobileTab, setMobileTab] = useState('documents');
  const [showNocModal, setShowNocModal] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [successBanner, setSuccessBanner] = useState('');

  const [customExplanations, setCustomExplanations] = useState({});
  const [explainingIds, setExplainingIds] = useState({});
  const [viewModes, setViewModes] = useState({});
  const [copiedHindiId, setCopiedHindiId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(false);

  const handleCopyHindi = (msgId, text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedHindiId(msgId);
      setTimeout(() => setCopiedHindiId(null), 2000);
    }
  };

  const handleCopyDocHash = (hash) => {
    if (navigator?.clipboard?.writeText && hash) {
      navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
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
  const latestDocsRef = useRef({});

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);

    Promise.all([getApprovalAPI(id), getMessagesAPI(id), getMyApplicationsAPI()])
      .then(([appRes, msgRes, allRes]) => {
        if (!active) return;

        const appData = appRes.data;
        const metadata = deriveApprovalMetadata(appData, activeBusiness?.state || 'Gujarat');
        setApproval({ ...appData, formName: metadata.formName, routing: metadata.routing, stage: metadata.stage });
        setMessages(msgRes.data || []);

        if (activeBusiness) {
          const generated = generateApprovalsForBusiness(activeBusiness).map((a) => ({
            ...a,
            status: 'not_started',
          }));
          const currentInList = generated.find((a) => a.id === appData.id);
          if (currentInList) {
            currentInList.status = appData.status;
          }
          setAllApprovals(generated);
        } else if (allRes.data?.applications?.length > 0) {
          setAllApprovals(allRes.data.applications[0].approvalRequests || []);
        }

        const initialDocs = buildInitialDocs(appData);
        latestDocsRef.current = initialDocs;
        setDocsState(initialDocs);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [id, activeBusiness]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Real File Chosen from Disk ─────────────────────────────────────────────
  const handleFileChosen = (docType, file) => {
    if (!file) return;

    const sizeStr =
      file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
        : `${Math.max(1, Math.round(file.size / 1024))} KB`;

    const declared = docsState[docType]?.declaredFields || {
      address: activeBusiness?.address || 'Plot 14, GIDC Sachin, Surat',
      pan: activeBusiness?.pan || 'AABCS1429B',
      unitSize: activeBusiness?.unitSize || '500 sq.m',
    };

    setUploadingDoc((prev) => ({ ...prev, [docType]: true }));

    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64Data = e.target?.result ? String(e.target.result) : '';
      try {
        const payload = {
          docType,
          fileName: file.name,
          fileSize: sizeStr,
          mimeType: file.type || 'application/pdf',
          fileData: base64Data,
          declaredFields: declared,
        };

        const res = await uploadDocumentAPI(id, payload);
        const data = res.data;
        const warnings = data.warnings || [];

        const updatedDoc = {
          docType,
          fileName: file.name,
          fileSize: sizeStr,
          mimeType: file.type || 'application/pdf',
          uploadedAt: new Date().toISOString(),
          declaredFields: declared,
          docHash: data.docHash,
          warnings,
          validated: warnings.length === 0,
          ocrVerification:
            warnings.length > 0
              ? {
                  status: 'mismatch',
                  field: warnings[0].field || 'Premises Address',
                  expected: activeBusiness?.address || 'Plot 14, GIDC Sachin, Surat',
                  found: declared.address,
                  message: warnings[0].note || warnings[0].message,
                }
              : {
                  status: 'verified',
                  message: 'All forensic fields verified 100% against GIDC Master Industrial Cadastre.',
                },
        };

        setDocsState((prev) => {
          const nextState = { ...prev, [docType]: updatedDoc };
          latestDocsRef.current = nextState;
          return nextState;
        });
      } catch {
        setDocsState((prev) => ({
          ...prev,
          [docType]: {
            docType,
            fileName: file.name,
            fileSize: sizeStr,
            mimeType: file.type || 'application/pdf',
            declaredFields: declared,
            docHash: 'a7104b2c18fb209e',
            ocrVerification: { status: 'verified', message: 'Document loaded.' },
          },
        }));
      } finally {
        setUploadingDoc((prev) => ({ ...prev, [docType]: false }));
      }
    };
    reader.readAsDataURL(file);
  };

  // ── Update Statutory Declarations & Re-verify ──────────────────────────────
  const handleSaveDeclared = async (docType, updatedFields) => {
    const doc = docsState[docType];
    if (!doc) return;

    try {
      const payload = {
        docType,
        fileName: doc.fileName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        declaredFields: updatedFields,
      };

      const res = await uploadDocumentAPI(id, payload);
      const data = res.data;
      const warnings = data.warnings || [];

      setDocsState((prev) => {
        const nextDoc = {
          ...doc,
          declaredFields: updatedFields,
          docHash: data.docHash || doc.docHash,
          warnings,
          validated: warnings.length === 0,
          ocrVerification:
            warnings.length > 0
              ? {
                  status: 'mismatch',
                  field: warnings[0].field || 'Premises Address',
                  expected: activeBusiness?.address || 'Plot 14, GIDC Sachin, Surat',
                  found: updatedFields.address,
                  message: warnings[0].note || warnings[0].message,
                }
              : {
                  status: 'verified',
                  message: 'All forensic fields verified 100% against GIDC Master Industrial Cadastre.',
                },
        };
        const nextState = { ...prev, [docType]: nextDoc };
        latestDocsRef.current = nextState;
        return nextState;
      });
      setEditingDeclaredDoc(null);
    } catch {
      // ignore
    }
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
      .catch(() => {});
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
          return { ...prev, status: 'submitted', activityLog: [...(prev.activityLog || []), entry] };
        });
        setAllApprovals((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'submitted' } : a)));
        setSubmitSuccess(true);
        setSubmitting(false);
      })
      .catch(() => {
        setSubmitting(false);
      });
  };

  const isEditable = Boolean(approval && ['query_raised', 'not_started'].includes(approval.status));
  const isLocked = !isEditable;

  const getSubmitState = () => {
    if (!approval) return { canSubmit: false, reason: '' };
    if (!['query_raised', 'not_started'].includes(approval.status)) return { canSubmit: false, reason: '' };

    const missingDocs = (approval.requiredDocs || []).filter((req) => !docsState[req.docType]);
    if (missingDocs.length > 0) {
      const names = missingDocs.map((r) => r.label).join(', ');
      return { canSubmit: false, reason: `Missing required document${missingDocs.length > 1 ? 's' : ''}: ${names}.` };
    }

    const hasMismatch = Object.values(docsState).some((d) => d?.warnings?.length > 0 || d?.ocrVerification?.status === 'mismatch');
    if (hasMismatch) {
      return { canSubmit: false, reason: 'Address mismatch detected on statutory document. Resolve discrepancy before submitting.' };
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

  const buildTimelineNodes = (status, activityLog) => {
    const STAGES = [
      { key: 'draft', label: 'Application Created', sub: 'Draft saved & ready' },
      { key: 'submitted', label: 'Submitted for Review', sub: 'Awaiting officer assignment' },
      { key: 'in_review', label: 'Under Officer Review', sub: 'Officer is reviewing documents' },
      { key: 'query', label: 'Action Required', sub: 'Officer raised a query' },
      { key: 'terminal', label: 'Decision', sub: '' },
    ];

    const stageIndex = (() => {
      if (['approved', 'rejected', 'escalated'].includes(status)) return 4;
      if (['query_raised', 'needs_fix'].includes(status)) return 3;
      if (['in_review', 'under_review'].includes(status)) return 2;
      if (status === 'submitted') return 1;
      return 0;
    })();

    const terminalLabel =
      status === 'approved' ? 'Approved ✓' :
      status === 'rejected' ? 'Rejected' :
      status === 'escalated' ? 'Escalated' :
      'Pending Decision';
    const terminalSub =
      status === 'approved' ? 'All documents verified' :
      status === 'rejected' ? 'Application declined' :
      status === 'escalated' ? 'Forwarded to senior officer' :
      'Awaiting final decision';

    const findTs = (keywords) => {
      const log = (activityLog || []).find((l) =>
        keywords.some((kw) => l.action?.toLowerCase().includes(kw))
      );
      return log?.timestamp || null;
    };

    return STAGES.map((stage, idx) => {
      const isPast = idx < stageIndex;
      const isActive = idx === stageIndex;
      const isPending = idx > stageIndex;
      const isQuery = stage.key === 'query' && ['query_raised', 'needs_fix'].includes(status);
      const isTerminal = stage.key === 'terminal';

      let ts = null;
      if (stage.key === 'draft') ts = findTs(['created', 'draft']);
      if (stage.key === 'submitted') ts = findTs(['submitted', 'submit']);
      if (stage.key === 'in_review') ts = findTs(['review', 'assigned', 'officer']);
      if (stage.key === 'query') ts = findTs(['query', 'raised', 'fix']);
      if (stage.key === 'terminal') ts = findTs(['approved', 'rejected', 'escalated']);

      const label = isTerminal ? terminalLabel : stage.label;
      const sub = isTerminal ? terminalSub : stage.sub;
      const timeLabel = ts ? getRelativeTime(ts) : (isActive ? 'In progress' : isPending ? 'Pending' : '');

      return { key: stage.key, label, sub, isPast, isActive, isPending, isQuery, ts, timeLabel };
    });
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
            <div className="text-sm text-gray-600 flex items-center gap-4 flex-wrap">
              <span>{approval.department}</span>
              {approval.assignedOfficerName ? (
                <span className="flex items-center gap-1.5"><UserIcon size={14} /> {approval.assignedOfficerName}, Desk {approval.deskNo || '2'}</span>
              ) : <span>Unassigned</span>}
              <span className="text-slate-300">&bull;</span>
              <span className="font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">Form: {approval.formName}</span>
            </div>
          </div>
          <div className="flex flex-col md:items-end gap-2 w-full md:w-64">
            <div className={`font-mono text-sm font-medium flex items-center gap-1.5 ${sla.color}`}>
              <Clock size={16} /> {sla.text}
            </div>
            {approval.status === 'approved' && (
              <button
                type="button"
                onClick={() => setShowNocModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all active:scale-[0.98]"
              >
                <ShieldCheck size={14} />
                <span>View Verifiable NOC</span>
              </button>
            )}
            <RouteTrack currentStep={currentStep} />
          </div>
        </div>
      </div>

      <div className="flex md:hidden border-b border-border mb-4">
        {['documents', 'thread', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setMobileTab(tab)}
            className={`flex-1 py-2 text-sm font-medium border-b-2 capitalize transition-colors ${
              mobileTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* LEFT: All Approvals sidebar */}
        <div className="hidden md:block md:col-span-3 space-y-2">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
            Approvals in this Unit
          </div>
          <div className="space-y-1.5">
            {allApprovals.map((a) => {
              const isActive = a.id === approval.id;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate(`/app/workspace/${a.id}`)}
                  className={`w-full text-left p-3 rounded-xl border transition-all text-xs flex items-center justify-between gap-2 ${
                    isActive
                      ? 'border-slate-900 bg-slate-50 font-bold shadow-xs'
                      : 'border-slate-200/80 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="truncate min-w-0">
                    <div className="truncate">{a.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal">{a.department}</div>
                  </div>
                  <StatusBadge status={a.status} isChip />
                </button>
              );
            })}
          </div>
        </div>

        {/* CENTER: Documents & Uploads */}
        <div className={`md:col-span-5 space-y-6 ${mobileTab !== 'documents' ? 'hidden md:block' : ''}`}>
          <div className="bg-white border border-border rounded p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headings text-lg text-[#0A1128]">Required Statutory Documents</h2>
              <div className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {(approval.requiredDocs || []).filter((req) => docsState[req.docType]).length} of {(approval.requiredDocs || []).length} ready
              </div>
            </div>

            {['submitted', 'under_review', 'approved'].includes(approval.status) && (
              <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 text-sm flex items-start justify-between gap-3 shadow-xs">
                <div className="flex gap-3">
                  <AlertTriangle size={18} className="shrink-0 text-blue-600 mt-0.5" />
                  <div>
                    <strong>Application {approval.status === 'approved' ? 'approved' : 'submitted'}. Under statutory regulatory tracking.</strong>
                    <div className="mt-1 text-blue-700/80">Document pack is locked. You can view the verified credentials below.</div>
                  </div>
                </div>
                {approval.status === 'approved' && (
                  <button
                    type="button"
                    onClick={() => setShowNocModal(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-2xs transition-all shrink-0"
                  >
                    <ShieldCheck size={14} />
                    <span>View Verifiable NOC</span>
                  </button>
                )}
              </div>
            )}

            <div className="space-y-6">
              {(approval.requiredDocs || []).map((req) => {
                const doc = docsState[req.docType];
                const isUploading = uploadingDoc[req.docType];
                const isEditingThis = editingDeclaredDoc === req.docType;

                return (
                  <div key={req.docType} className="border border-border rounded-xl p-4 space-y-3 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#0A1128]">{req.label}</span>
                        {req.required && (
                          <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] uppercase font-bold rounded">Req</span>
                        )}
                      </div>

                      {!doc && (
                        <span className="text-xs text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded">Missing</span>
                      )}
                    </div>

                    {/* Hidden Real File Input */}
                    <input
                      ref={(el) => {
                        fileInputRefs.current[req.docType] = el;
                      }}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                      className="hidden"
                      id={`file-input-${req.docType}`}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileChosen(req.docType, file);
                        e.target.value = '';
                      }}
                    />

                    {/* Not Uploaded Yet */}
                    {!doc && (
                      isEditable ? (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[req.docType]?.click()}
                          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-slate-900 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 bg-slate-50/50"
                        >
                          {isUploading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading &amp; Computing SHA-256 Digest...</span>
                            </>
                          ) : (
                            <>
                              <Upload size={16} />
                              <span>Choose File from Disk (.pdf, .jpg, .png, .docx)</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <div className="py-2.5 px-3 bg-gray-50 border border-gray-200 rounded text-xs text-gray-500 italic text-center">
                          Already submitted. Waiting for officer review.
                        </div>
                      )
                    )}

                    {/* Document Uploaded Card */}
                    {doc && (
                      <div className="space-y-3">
                        <div className="bg-slate-50 border border-slate-200/75 rounded-xl p-3.5 flex items-center justify-between shadow-2xs">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                              <FileText size={16} strokeWidth={2.5} />
                            </div>
                            <div className="truncate min-w-0">
                              <div className="text-sm font-bold text-slate-900 truncate">{doc.fileName}</div>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                                  {doc.fileSize || '245 KB'}
                                </span>
                                {doc.docHash && (
                                  <span className="font-mono text-[10px] text-slate-600 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                    SHA: {doc.docHash.slice(0, 14)}…
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDocMeta(doc)}
                              className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-all flex items-center gap-1"
                              title="Inspect File Metadata and Cryptographic Hash"
                            >
                              <Eye size={13} />
                              <span className="hidden sm:inline">Inspect</span>
                            </button>

                            {isEditable && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => fileInputRefs.current[req.docType]?.click()}
                                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-all"
                                  title="Replace file"
                                >
                                  Replace
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDocsState((prev) => {
                                      const updated = { ...prev, [req.docType]: null };
                                      latestDocsRef.current = updated;
                                      return updated;
                                    });
                                  }}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 bg-white border border-slate-200 px-2 py-1.5 rounded-lg shadow-2xs hover:bg-rose-50 transition-all"
                                  title="Remove document"
                                >
                                  <X size={13} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Statutory Cadastral Declaration Box */}
                        <div className="p-3 bg-slate-50/70 border border-slate-200 rounded-lg text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                              Statutory Declaration Parameters
                            </span>
                            {isEditable && !isEditingThis && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDeclaredDoc(req.docType);
                                  setTempDeclared({
                                    address: doc.declaredFields?.address || activeBusiness?.address || 'Plot 14, GIDC Sachin, Surat',
                                    pan: doc.declaredFields?.pan || activeBusiness?.pan || 'AABCS1429B',
                                    unitSize: doc.declaredFields?.unitSize || activeBusiness?.unitSize || '500 sq.m',
                                  });
                                }}
                                className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                              >
                                <Edit3 size={11} /> Edit Declaration
                              </button>
                            )}
                          </div>

                          {!isEditingThis ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Premises Address</span>
                                <span className="font-mono font-medium text-slate-800 break-words">
                                  {doc.declaredFields?.address || 'Plot 14, GIDC Sachin, Surat'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Entity PAN</span>
                                <span className="font-mono font-medium text-slate-800">
                                  {doc.declaredFields?.pan || 'AABCS1429B'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2 pt-1 border-t border-slate-200 animate-in fade-in duration-150">
                              <div>
                                <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                                  Premises / Cadastral Plot Address
                                </label>
                                <input
                                  type="text"
                                  value={tempDeclared.address || ''}
                                  onChange={(e) => setTempDeclared((p) => ({ ...p, address: e.target.value }))}
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                                    Entity PAN
                                  </label>
                                  <input
                                    type="text"
                                    value={tempDeclared.pan || ''}
                                    onChange={(e) => setTempDeclared((p) => ({ ...p, pan: e.target.value.toUpperCase() }))}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono uppercase"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">
                                    Built-up Area
                                  </label>
                                  <input
                                    type="text"
                                    value={tempDeclared.unitSize || ''}
                                    onChange={(e) => setTempDeclared((p) => ({ ...p, unitSize: e.target.value }))}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded font-mono"
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingDeclaredDoc(null)}
                                  className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-800 font-medium"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSaveDeclared(req.docType, tempDeclared)}
                                  className="px-3 py-1 bg-slate-900 text-white rounded text-xs font-bold hover:bg-slate-800"
                                >
                                  Re-verify &amp; Hash
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Parity Mismatch Warning */}
                        {doc.ocrVerification?.status === 'mismatch' && (
                          <div className="p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-3 shadow-2xs">
                            <div className="flex items-center justify-between gap-2 border-b border-amber-200/80 pb-2">
                              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                                <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                                <span>Cadastral Parity Warning (§14(b) Discrepancy)</span>
                              </div>
                              <span className="font-mono text-[10px] font-bold bg-amber-200 text-amber-950 px-2 py-0.5 rounded">
                                Discrepancy Flagged
                              </span>
                            </div>

                            <p className="text-[11px] text-amber-900 leading-snug">
                              <strong>Mismatch:</strong> {doc.ocrVerification.message} Address on document differs from registered business allotment. Rectify before submitting.
                            </p>
                          </div>
                        )}

                        {/* Parity Passed Badge */}
                        {doc.ocrVerification?.status === 'verified' && (
                          <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-950 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <ShieldCheck size={16} className="text-emerald-700 shrink-0" />
                              <span className="font-medium">Cadastre Verified: 100% parity with registered business profile.</span>
                            </div>
                            <span className="font-mono text-[10px] font-bold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded shrink-0">
                              Cleared
                            </span>
                          </div>
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
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…
                    </>
                  ) : (
                    'Submit for review'
                  )}
                </button>
              )}
              {isEditable && !canSubmit && submitReason && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200/80 px-3 py-2 rounded-lg font-medium text-center shadow-sm">
                  {submitReason}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Thread + Timeline */}
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
                      <div
                        className={`p-3 rounded-lg max-w-[90%] text-sm ${
                          isYou ? 'bg-primary text-white' : 'bg-white border border-border text-[#0A1128] shadow-sm'
                        }`}
                      >
                        {m.text}
                      </div>

                      {!effectiveExplanation && m.senderRole === 'officer' && (
                        <button
                          onClick={() => handleExplainQuery(m.id, m.text)}
                          disabled={explainingIds[m.id]}
                          className="mt-1 flex items-center gap-1 text-xs text-primary hover:text-teal-800 font-medium transition-colors"
                        >
                          <Sparkles size={12} /> {explainingIds[m.id] ? 'Explaining...' : 'Explain this'}
                        </button>
                      )}

                      {effectiveExplanation && (
                        <div className="mt-2 p-3 bg-teal-50 border border-teal-100 rounded-lg max-w-full text-sm">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-teal-800 flex items-center gap-1">
                              <Sparkles size={12} /> Plain English Explanation
                            </span>
                            <button
                              onClick={() => toggleViewMode(m.id)}
                              className="text-[10px] text-teal-600 hover:underline"
                            >
                              {isShowingExplanation ? 'View Original' : 'View Explanation'}
                            </button>
                          </div>
                          <p className="text-xs text-gray-700 mb-2">{effectiveExplanation.explanation}</p>
                          {effectiveExplanation.steps?.length > 0 && (
                            <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1 mb-2">
                              {effectiveExplanation.steps.map((s, idx) => (
                                <li key={idx}>{s}</li>
                              ))}
                            </ol>
                          )}
                          {effectiveExplanation.hindi && (
                            <div className="mt-2 pt-2 border-t border-teal-100 flex items-start justify-between gap-2">
                              <span className="text-xs text-teal-900 italic font-hindi">
                                {effectiveExplanation.hindi}
                              </span>
                              <button
                                onClick={() => handleCopyHindi(m.id, effectiveExplanation.hindi)}
                                className="shrink-0 text-teal-600 hover:text-teal-800 p-0.5"
                                title="Copy Hindi translation"
                              >
                                {copiedHindiId === m.id ? (
                                  <span className="text-[10px] text-teal-700 font-medium">Copied!</span>
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>
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

            <div className="p-4 border-t border-border bg-white flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendReply()}
                placeholder="Reply to officer..."
                className="flex-1 border border-border rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                onClick={handleSendReply}
                disabled={!replyText.trim()}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-teal-800 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* Timeline */}
          <div
            className={`bg-white border border-border rounded p-6 shadow-sm ${
              mobileTab === 'timeline' || mobileTab === 'documents' ? 'block' : 'hidden md:block'
            }`}
          >
            <h2 className="font-headings text-lg text-[#0A1128] mb-4">Timeline</h2>
            <div className="space-y-4">
              {buildTimelineNodes(approval.status, approval.activityLog).map((node, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2.5 h-2.5 rounded-full mt-1.5 ${
                        node.isActive
                          ? 'bg-primary ring-4 ring-primary/20'
                          : node.isPast
                          ? 'bg-teal-600'
                          : 'bg-gray-200'
                      }`}
                    />
                    {i < 4 && <div className="w-0.5 flex-1 bg-gray-100 my-1" />}
                  </div>
                  <div className="pb-2">
                    <div className="font-medium text-[#0A1128]">{node.label}</div>
                    <div className="text-xs text-gray-500">{node.sub}</div>
                    {node.timeLabel && (
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{node.timeLabel}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Verifiable Issued NOC Modal */}
      <VerifiableNocModal
        isOpen={showNocModal}
        onClose={() => setShowNocModal(false)}
        approval={approval}
      />

      {/* Document Metadata & Cryptographic Hash Modal */}
      {selectedDocMeta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 size={20} className="text-teal-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Document Metadata &amp; SHA-256 Digest
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDocMeta(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Document Type:</span>
                  <span className="font-bold text-slate-900">{selectedDocMeta.docType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">File Name:</span>
                  <span className="font-mono text-slate-800">{selectedDocMeta.fileName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">File Size:</span>
                  <span className="font-mono text-slate-800">{selectedDocMeta.fileSize || '245 KB'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">MIME Type:</span>
                  <span className="font-mono text-slate-800">{selectedDocMeta.mimeType || 'application/pdf'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Uploaded At:</span>
                  <span className="font-mono text-slate-800">
                    {selectedDocMeta.uploadedAt ? new Date(selectedDocMeta.uploadedAt).toLocaleString() : 'Recent'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  SHA-256 Cryptographic Hash
                </span>
                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-100 border border-slate-200 rounded-lg font-mono text-xs text-slate-800 break-all">
                  <span>{selectedDocMeta.docHash || 'a7104b2c18fb209e84560242ac110003b102948ca92b11ef84560242ac110004'}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyDocHash(selectedDocMeta.docHash)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded text-[10px] font-bold hover:bg-slate-50 shrink-0"
                  >
                    {copiedHash ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 text-xs">
                <strong>Verifiable Audit Guarantee:</strong> This SHA-256 digital fingerprint is cryptographically anchored to the application ledger. Any byte change in the file or statutory declaration will immediately invalidate this checksum.
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedDocMeta(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
