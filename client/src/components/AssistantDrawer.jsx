import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Send, Sparkles, MessageSquare, RotateCcw } from 'lucide-react';
import { askAssistantAPI } from '../lib/api';

const SUGGESTED_QUESTIONS = [
  'Which documents for Fire NOC?',
  'How long does Pollution Consent take?',
  'Can inspections be combined?',
];

export default function AssistantDrawer({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // stores last failed question
  const drawerRef = useRef(null);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'Tab' && drawerRef.current) {
        const focusable = drawerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, error]);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || input).trim();
    if (!q || loading) return;

    setInput('');
    setError(null);

    const userMsg = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: q,
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await askAssistantAPI(q);
      if (res?.data?.ok) {
        const botMsg = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          text: res.data.answer,
          sources: res.data.sources || [],
          confident: res.data.confident,
        };
        setMessages((prev) => [...prev, botMsg]);
      } else {
        setError(q);
      }
    } catch {
      setError(q);
    } finally {
      setLoading(false);
    }
  };

  const handleTalkToOfficer = () => {
    onClose();
    if (location.pathname.startsWith('/app/approvals/')) {
      const threadEl = document.getElementById('workspace-thread');
      if (threadEl) {
        threadEl.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (location.pathname.startsWith('/app')) {
      navigate('/app/approvals/req2');
    } else {
      navigate('/app/dashboard');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container (right drawer on desktop, bottom sheet on mobile) */}
      <div
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        className="relative w-full sm:w-[420px] max-h-[85vh] sm:max-h-full sm:h-full bg-white border-t sm:border-t-0 sm:border-l border-border rounded-t-2xl sm:rounded-none shadow-2xl flex flex-col z-10 self-end sm:self-auto overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 border-b border-border bg-white flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 id="assistant-title" className="font-headings font-bold text-lg text-[#0A1128]">
                Assistant
              </h2>
              <span className="text-[10px] text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono">
                Verified Rules
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">Answers only from verified rule data</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 hover:text-[#0A1128] hover:bg-gray-100 rounded-md transition-colors"
            aria-label="Close assistant"
          >
            <X size={20} />
          </button>
        </div>

        {/* Golden Rule Banner */}
        <div className="px-4 py-2 bg-[#F7F5F0] border-b border-border text-[11px] text-[#0A1128] font-medium flex items-center gap-1.5 shrink-0">
          <Sparkles size={13} className="text-primary shrink-0" />
          <span>Rules decide. AI explains. Officers approve.</span>
        </div>

        {/* Drawer Body — ONLY Allowed Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="p-4 bg-white border border-border rounded-lg text-xs text-gray-600 leading-relaxed shadow-sm">
                Ask any question regarding approvals, statutory SLA timelines, required documentation,
                or combined inspections.
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 block mb-2">
                  Suggested questions
                </span>
                <div className="flex flex-col gap-2">
                  {SUGGESTED_QUESTIONS.map((sq) => (
                    <button
                      key={sq}
                      onClick={() => handleSend(sq)}
                      className="text-left text-xs bg-white hover:bg-teal-50/50 hover:border-primary/50 text-[#0A1128] border border-border p-2.5 rounded-lg transition-colors font-medium"
                    >
                      {sq}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((m) => {
            const isUser = m.role === 'user';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`p-3 rounded-lg text-sm max-w-[88%] ${
                    isUser
                      ? 'bg-primary text-white rounded-br-none shadow-sm'
                      : 'bg-white border border-border text-[#0A1128] rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed">{m.text}</p>

                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pt-2 border-t border-gray-100">
                      {m.sources.map((src, i) => (
                        <span
                          key={i}
                          className="text-[10px] font-mono bg-teal-50 border border-teal-200 text-teal-800 px-2 py-0.5 rounded font-medium"
                        >
                          Source: {src}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isUser && m.confident === false && (
                    <div className="mt-3 pt-2 border-t border-gray-100">
                      <button
                        onClick={handleTalkToOfficer}
                        className="inline-flex items-center gap-1.5 text-xs bg-primary text-white hover:bg-teal-800 font-medium px-3 py-1.5 rounded transition-colors"
                      >
                        <MessageSquare size={13} /> Talk to officer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start">
              <div className="p-3 bg-white border border-border rounded-lg text-sm rounded-bl-none shadow-sm flex items-center gap-1.5">
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-center justify-between gap-2">
              <span>Assistant unavailable. You can still use the checklist.</span>
              <button
                onClick={() => handleSend(error)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:text-red-900 underline shrink-0"
              >
                <RotateCcw size={12} /> Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-border bg-white shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              maxLength={300}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about approvals, rules, documents..."
              className="flex-1 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:bg-gray-50 text-[#0A1128]"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 bg-primary text-white rounded-lg hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              aria-label="Send question"
            >
              <Send size={18} />
            </button>
          </form>
          <div className="flex justify-between items-center mt-1 px-1 text-[10px] text-gray-400">
            <span>Press Enter to send</span>
            <span className="font-mono">{input.length}/300</span>
          </div>
        </div>
      </div>
    </div>
  );
}
