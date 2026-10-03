import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Bell, LogOut, User, Settings as SettingsIcon } from 'lucide-react';
import { navConfig } from '../lib/navConfig';

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [alerts, setAlerts] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLinks = user?.role ? navConfig[user.role] : [];
  const navLinks = [...roleLinks];
  if (import.meta.env.DEV) {
    navLinks.push({ name: 'Components', path: '/dev/components', icon: SettingsIcon });
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-border bg-white h-full">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary shrink-0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
             <circle cx="5" cy="12" r="3" fill="currentColor" />
             <circle cx="19" cy="12" r="3" fill="currentColor" />
             <line x1="8" y1="12" x2="16" y2="12" />
          </svg>
          <span className="font-headings font-bold text-xl">ClearPath</span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map(link => {
            const Icon = link.icon;
            const active = location.pathname.startsWith(link.path);
            return (
              <Link key={link.name} to={link.path} className={`flex items-center gap-3 px-3 py-2 rounded text-sm ${active ? 'bg-primary/10 text-primary font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                <Icon size={18} />
                {link.name}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-8">
          <div className="md:hidden font-headings font-bold text-lg flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-primary shrink-0" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
               <circle cx="5" cy="12" r="3" fill="currentColor" />
               <circle cx="19" cy="12" r="3" fill="currentColor" />
               <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            ClearPath
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <button onClick={() => setBellOpen(!bellOpen)} className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                <Bell size={20} />
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-status-rejected rounded-full"></span>
                )}
              </button>
              {bellOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-border shadow-lg rounded p-2 z-50">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Alerts</div>
                  {alerts.length === 0 ? (
                    <div className="text-sm text-gray-500 px-2 py-1">No new alerts</div>
                  ) : (
                    alerts.map((a, i) => (
                      <div key={i} className="text-sm p-2 hover:bg-gray-50 cursor-pointer rounded border-b border-gray-50 last:border-0" onClick={() => { setBellOpen(false); navigate(`/app/approvals/${a.id}`); }}>
                        {a.text}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium"><User size={16}/></div>
              <div className="hidden sm:flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{user?.name}</p>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] uppercase font-bold rounded">{user?.role}</span>
                </div>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-full ml-2" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 pb-20 md:pb-8">
          <Outlet context={{ setAlerts }} />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-border flex items-center justify-around z-10 pb-safe">
        {navLinks.map(link => {
          const Icon = link.icon;
          const active = location.pathname.startsWith(link.path);
          return (
            <Link key={link.name} to={link.path} className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-primary' : 'text-gray-500'}`}>
              <Icon size={20} />
              <span className="text-[10px] mt-1 font-medium">{link.name}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  );
}
