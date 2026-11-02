import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBusiness } from '../../context/BusinessContext';
import {
  getMyApplicationsAPI,
  getMessagesAPI,
  sendMessageAPI,
  generateApprovalsForBusiness,
  deriveApprovalMetadata,
} from '../../lib/api';
import StatusBadge from '../../components/StatusBadge';
import SkeletonCard from '../../components/SkeletonCard';
import EmptyState from '../../components/EmptyState';
import {
  MessageSquare,
  Send,
  AlertCircle,
  ExternalLink,
  Sparkles,
  UserRound,
} from 'lucide-react';

export default function MessagesHub() {
  const navigate = useNavigate();
  const { activeBusiness } = useBusiness();
  const [approvals, setApprovals] = useState([]);
  const [selectedApprovalId, setSelectedApprovalId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [explanationLang, setExplanationLang] = useState('en'); // 'en' | 'hi'
  const chatBottomRef = useRef(null);

  // Load approvals for active business
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

        // Select the one with query_raised (e.g. req2) or the first one by default
        const queryItem = enhanced.find((a) => a.status === 'query_raised');
        const defaultId = queryItem ? queryItem.id : enhanced[0]?.id;
        setSelectedApprovalId(defaultId);

        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [activeBusiness]);

  // Load messages whenever selectedApprovalId changes
  useEffect(() => {
    if (!selectedApprovalId) return;
    let mounted = true;
    setMessagesLoading(true);

    getMessagesAPI(selectedApprovalId)
      .then((res) => {
        if (!mounted) return;
        setMessages(res.data || []);
        setMessagesLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setMessages([]);
        setMessagesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedApprovalId]);

  // Scroll to bottom of messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const activeApproval = useMemo(() => {
    return approvals.find((a) => a.id === selectedApprovalId) || null;
  }, [approvals, selectedApprovalId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedApprovalId || sending) return;

    setSending(true);
    const textToSend = replyText.trim();
    setReplyText('');

    try {
      const res = await sendMessageAPI(selectedApprovalId, textToSend, 'Aarav Mehta', 'applicant');
      if (res.data?.messages) {
        setMessages(res.data.messages);
      } else if (res.data?.message) {
        setMessages((prev) => [...prev, res.data.message]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}`,
            senderRole: 'applicant',
            senderName: 'Aarav Mehta',
            text: textToSend,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch {
      // Optimistic fallback
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          senderRole: 'applicant',
          senderName: 'Aarav Mehta',
          text: textToSend,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-full pb-16">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                  OFFICIAL COMMUNICATIONS INBOX
                </span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs font-medium text-slate-600">Departmental Scrutiny Threads</span>
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-headings">
                Departmental Communications &amp; Queries
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Direct statutory communication channels with assigned scrutiny officers for{' '}
                <strong>{activeBusiness?.name || 'Surya Vastra Mills Pvt. Ltd.'}</strong>.
              </p>
            </div>

            {activeApproval && (
              <button
                onClick={() => navigate(`/app/workspace/${activeApproval.id}`)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
              >
                <span>Open Filing Workspace</span>
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split-Pane Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {loading ? (
          <SkeletonCard count={3} />
        ) : approvals.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No Departmental Threads"
            description="No active statutory applications found for this business."
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Channels List */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600">
                  Application Threads ({approvals.length})
                </span>
                <span className="text-[11px] font-mono text-slate-400">RTPS Tracked</span>
              </div>

              <div className="divide-y divide-slate-100">
                {approvals.map((a) => {
                  const isSelected = a.id === selectedApprovalId;
                  const hasQuery = a.status === 'query_raised';

                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setSelectedApprovalId(a.id)}
                      className={`w-full text-left p-4 transition-all flex flex-col gap-2 relative ${
                        isSelected
                          ? 'bg-teal-50/40 border-l-4 border-teal-600'
                          : 'hover:bg-slate-50 border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded">
                            {a.code}
                          </span>
                          <span className="font-headings font-bold text-xs text-slate-900 truncate max-w-[200px]">
                            {a.name}
                          </span>
                        </div>
                        <StatusBadge status={a.status} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-0.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <UserRound size={12} className="text-slate-400 shrink-0" />
                          <span className="truncate">
                            {a.assignedOfficerName ? `${a.assignedOfficerName} (Desk ${a.deskNo})` : 'Queue Desk'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {a.department}
                        </span>
                      </div>

                      {hasQuery && (
                        <div className="mt-1 flex items-center gap-1.5 px-2 py-1 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-semibold">
                          <AlertCircle size={12} className="text-amber-600 shrink-0" />
                          <span className="truncate">Active Query: Clarification Required</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Active Conversation */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col min-h-[580px]">
              {activeApproval ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold bg-slate-900 text-white px-2 py-0.5 rounded">
                          {activeApproval.code}
                        </span>
                        <h2 className="font-bold text-sm sm:text-base text-slate-900 font-headings">
                          {activeApproval.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Form: <span className="font-mono font-medium text-slate-700">{activeApproval.formName}</span> • Desk Officer:{' '}
                        <strong>{activeApproval.assignedOfficerName || 'Assigned Scrutiny Officer'}</strong>
                      </p>
                    </div>

                    <button
                      onClick={() => navigate(`/app/workspace/${activeApproval.id}`)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                      <span>Filing Workspace</span>
                      <ExternalLink size={12} />
                    </button>
                  </div>

                  {/* AI Clarification Banner (if query_raised) with 1-Click Bilingual Toggle */}
                  {activeApproval.status === 'query_raised' && (
                    <div className="m-4 p-4 rounded-xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 text-xs text-slate-800 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-bold text-teal-950">
                          <Sparkles size={15} className="text-teal-600" />
                          <span>AI Regulatory Query Breakdown</span>
                        </div>
                        {/* 1-Click Bilingual Language Toggle */}
                        <div className="flex items-center bg-white/80 p-0.5 rounded-lg border border-teal-200 text-[11px] font-mono font-bold">
                          <button
                            type="button"
                            onClick={() => setExplanationLang('en')}
                            className={`px-2 py-0.5 rounded transition-all ${
                              explanationLang === 'en'
                                ? 'bg-teal-700 text-white shadow-2xs'
                                : 'text-teal-900 hover:bg-teal-50'
                            }`}
                          >
                            English
                          </button>
                          <button
                            type="button"
                            onClick={() => setExplanationLang('hi')}
                            className={`px-2 py-0.5 rounded transition-all ${
                              explanationLang === 'hi'
                                ? 'bg-teal-700 text-white shadow-2xs'
                                : 'text-teal-900 hover:bg-teal-50'
                            }`}
                          >
                            हिन्दी
                          </button>
                        </div>
                      </div>

                      {explanationLang === 'en' ? (
                        <p className="text-[12px] leading-relaxed text-slate-800">
                          The scrutiny officer flagged an address discrepancy in your uploaded <strong>Lease Deed</strong>.
                          The deed cites <em>"Plot 22, Udhna, Surat"</em>, whereas your official filing is registered for{' '}
                          <strong>"Plot 14, GIDC Sachin, Surat"</strong>. Under Section 18 of the State Fire Safety Rules, the registered industrial
                          site address must match the premises lease contract exactly.
                        </p>
                      ) : (
                        <p className="text-[12px] leading-relaxed text-slate-800">
                          जांच अधिकारी ने आपके अपलोड किए गए <strong>लीज डीड</strong> में पते की विसंगति दर्ज की है।
                          डीड में <em>"प्लॉट 22, उधना, सूरत"</em> उद्धृत है, जबकि आपका आधिकारिक आवेदन <strong>"प्लॉट 14, जीआईडीसी सचिन, सूरत"</strong> के लिए पंजीकृत है।
                          राज्य अग्नि सुरक्षा नियमों की धारा 18 के तहत, परिसर लीज अनुबंध का पता पंजीकृत औद्योगिक स्थल से हूबहू मेल खाना अनिवार्य है।
                        </p>
                      )}

                      <div className="pt-1.5 flex items-center justify-between border-t border-teal-200/50 flex-wrap gap-2">
                        <button
                          onClick={() => navigate(`/app/workspace/${activeApproval.id}`)}
                          className="text-[11px] font-bold text-teal-800 underline hover:text-teal-950 flex items-center gap-1"
                        >
                          <span>Jump to Filing Workspace &rarr;</span>
                        </button>
                        <span className="font-mono text-[10px] text-teal-700/80">Model: Gemini 2.5 Flash Grounded</span>
                      </div>
                    </div>
                  )}

                  {/* Messages Area */}
                  <div className="flex-1 p-4 space-y-3 bg-slate-50/30">
                    {messagesLoading ? (
                      <div className="text-center py-8 text-xs text-slate-400">Loading messages...</div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-12">
                        <MessageSquare size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="text-xs font-bold text-slate-700">No Messages in this Channel</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Officer queries and applicant clarifications will appear here.
                        </p>
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const isOfficer = m.senderRole === 'officer';
                        const isSystem = m.senderRole === 'system';

                        if (isSystem) {
                          return (
                            <div key={m.id || idx} className="text-center my-2">
                              <span className="font-mono text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                                {m.text}
                              </span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={m.id || idx}
                            className={`flex flex-col ${isOfficer ? 'items-start' : 'items-end'}`}
                          >
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-slate-400">
                              <span className="font-bold text-slate-600">
                                {m.senderName || (isOfficer ? 'Scrutiny Officer' : 'You')}
                              </span>
                              <span>•</span>
                              <span className="font-mono">
                                {m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                              </span>
                            </div>
                            <div
                              className={`p-3 rounded-xl max-w-[85%] text-xs shadow-2xs leading-relaxed ${
                                isOfficer
                                  ? 'bg-white border border-sky-200 text-slate-800 rounded-tl-xs'
                                  : 'bg-slate-900 text-white rounded-tr-xs'
                              }`}
                            >
                              {m.text}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Reply Input Bar */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder={`Reply to ${activeApproval.assignedOfficerName || 'Officer'}...`}
                        disabled={sending}
                        className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 text-slate-900 bg-slate-50/50"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim() || sending}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs shrink-0"
                      >
                        <Send size={13} />
                        <span>Send</span>
                      </button>
                    </div>
                  </form>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

