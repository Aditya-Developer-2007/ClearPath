import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useBusiness } from '../context/BusinessContext';
import {
  Bell,
  LogOut,
  Settings as SettingsIcon,
  MessageCircle,
  ChevronUp,
  Building2,
  Plus,
  Trash2,
} from 'lucide-react';
import { navConfig } from '../lib/navConfig';
import AssistantDrawer from '../components/AssistantDrawer';

export default function AppShell() {
  const { user, logout } = useAuth();
  const { businesses, activeBusiness, selectBusiness, deleteBusiness } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const [alerts, setAlerts] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [dropUpOpen, setDropUpOpen] = useState(false);

  const dropUpRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Close drop-up on Esc key or click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropUpRef.current && !dropUpRef.current.contains(event.target)) {
        setDropUpOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setDropUpOpen(false);
      }
    }

    if (dropUpOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [dropUpOpen]);

  const roleLinks = user?.role ? navConfig[user.role] : [];
  const navLinks = [...roleLinks];
  if (import.meta.env.DEV === true) {
    navLinks.push({ name: 'Components', path: '/dev/components', icon: SettingsIcon });
  }

  const userName = user?.name || 'Alice Applicant';
  const userEmail = user?.email || 'alice@clearpath.gov';
  const userInitial = (userName.charAt(0) || 'A').toUpperCase();

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col justify-between w-[266px] border-r border-slate-900 bg-slate-950 h-full relative">
        <div className="flex flex-col min-h-0 flex-1">
          <div className="p-5 border-b border-slate-800 flex items-center gap-2.5 shrink-0">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              className="text-teal-400 shrink-0"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="5" cy="12" r="3" fill="currentColor" />
              <circle cx="19" cy="12" r="3" fill="currentColor" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="font-headings font-bold tracking-tight text-xl text-white">ClearPath</span>
          </div>
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-semibold transition-colors duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 focus:outline-none ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  {link.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Profile & Business Drop-up Container */}
        <div className="p-4 border-t border-slate-800 relative shrink-0" ref={dropUpRef}>
          {/* Upward Drop-up Menu */}
          {dropUpOpen && (
            <div
              className="absolute bottom-full mb-2 left-4 right-4 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 text-sm transition-opacity duration-100 ease-out"
              role="menu"
            >
              {/* Section 1: User Profile */}
              <div className="p-4 bg-slate-800/50">
                <div className="font-bold text-sm text-white truncate tracking-tight">{userName}</div>
                <div className="text-xs text-slate-400 truncate mt-0.5">{userEmail}</div>
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setDropUpOpen(false)}
                    className="text-xs text-teal-400 font-semibold hover:text-teal-300 focus-visible:ring-2 focus-visible:ring-teal-500 rounded focus:outline-none transition-colors"
                  >
                    Account Settings
                  </button>
                  <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded-full font-mono uppercase font-bold border border-teal-500/30">
                    {user?.role || 'Applicant'}
                  </span>
                </div>
              </div>

              {/* Section 2: Businesses */}
              <div className="p-2">
                <div className="px-2 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Businesses
                </div>
                <div className="space-y-1 mt-1 max-h-40 overflow-y-auto">
                  {businesses.map((b) => {
                    const isSelected = b.id === activeBusiness?.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          selectBusiness(b.id);
                          setDropUpOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors duration-150 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-teal-500 focus:outline-none ${
                          isSelected
                            ? 'bg-white/10 text-white font-semibold'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Building2
                            size={16}
                            strokeWidth={2}
                            className={`shrink-0 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`}
                          />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">{b.name}</div>
                            <div className="text-[10px] text-slate-500 truncate mt-0.5">
                              {b.sector} • {b.city}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <span className="shrink-0 ml-2 px-1.5 py-0.5 text-[10px] font-mono font-bold rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                              Active
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteBusiness(b.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                            title="Delete business"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Actions */}
              <div className="p-2 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setDropUpOpen(false);
                    navigate('/start');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-teal-400 hover:bg-teal-500/10 active:scale-[0.98] transition-all duration-75 ease-out focus-visible:ring-2 focus-visible:ring-teal-500 focus:outline-none"
                >
                  <Plus size={16} strokeWidth={2.5} />
                  <span>+ Add Business</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDropUpOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold text-rose-400 hover:bg-rose-500/10 active:scale-[0.98] transition-all duration-75 ease-out focus-visible:ring-2 focus-visible:ring-rose-500 focus:outline-none"
                >
                  <LogOut size={16} strokeWidth={2.5} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* Trigger Card with dark styling */}
          <button
            type="button"
            onClick={() => setDropUpOpen((prev) => !prev)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-[0.98] duration-75 ease-out text-left group focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 focus:outline-none shadow-md"
            aria-expanded={dropUpOpen}
            aria-haspopup="menu"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-slate-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-inner">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-200 truncate tracking-tight group-hover:text-white transition-colors">{userName}</div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5">
                  {activeBusiness?.name || 'Textile unit, Surat'}
                </div>
              </div>
            </div>
            <ChevronUp
              size={16}
              strokeWidth={2.5}
              className={`text-slate-600 group-hover:text-slate-400 shrink-0 transition-transform duration-150 ${
                dropUpOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header - Minimal, high contrast */}
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-8 shrink-0">
          <div className="md:hidden font-headings font-semibold tracking-tight text-lg flex items-center gap-2 text-slate-900">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              className="text-primary shrink-0"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="5" cy="12" r="3" fill="currentColor" />
              <circle cx="19" cy="12" r="3" fill="currentColor" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            ClearPath
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4 ml-auto">
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2 text-slate-600 hover:bg-slate-100/80 rounded-full transition-colors active:scale-[0.98] duration-75 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus:outline-none"
                aria-label="Alerts"
              >
                <Bell size={19} strokeWidth={1.75} />
                {alerts.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-600 rounded-full ring-2 ring-white"></span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-border shadow-lg rounded-lg p-2.5 z-50 transition-opacity duration-100 ease-out">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2">
                    Alerts
                  </div>
                  {alerts.length === 0 ? (
                    <div className="text-xs text-slate-500 px-2 py-2">No active alerts</div>
                  ) : (
                    alerts.map((a, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 text-slate-700 hover:bg-slate-50 cursor-pointer rounded border-b border-slate-100 last:border-0 transition-colors"
                        onClick={() => {
                          setBellOpen(false);
                          navigate(`/app/approvals/${a.id}`);
                        }}
                      >
                        {a.text}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 md:pb-8">
          <Outlet context={{ setAlerts }} />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-10 pb-safe">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex flex-col items-center justify-center w-full h-full active:scale-[0.98] transition-all duration-75 ${
                active ? 'text-primary font-semibold' : 'text-slate-500'
              }`}
            >
              <Icon size={19} strokeWidth={active ? 2.2 : 1.75} />
              <span className="text-[10px] mt-1 font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Floating Ask Assistant Button */}
      {(user?.role === 'applicant' || location.pathname.startsWith('/app')) && (
        <>
          <button
            className="fixed bottom-20 md:bottom-8 right-6 w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center shadow-md hover:bg-teal-800 active:scale-[0.98] transition-all duration-75 ease-out z-20 group focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus:outline-none"
            onClick={() => setAssistantOpen(true)}
            aria-label="Ask assistant"
            title="Ask assistant"
          >
            <MessageCircle size={22} strokeWidth={1.75} />
          </button>
          <AssistantDrawer isOpen={assistantOpen} onClose={() => setAssistantOpen(false)} />
        </>
      )}
    </div>
  );
}
