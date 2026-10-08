import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { loginAPI } from '../../lib/api';

// ── Tiny inline toast (no external deps) ───────────────────────────────────
function Toast({ message, type = 'error', onDismiss }) {
  const colors =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-red-50 border-red-200 text-red-700';
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${colors}`}>
      <span className="flex-1 leading-snug">{message}</span>
      <button onClick={onDismiss} className="shrink-0 text-base opacity-50 hover:opacity-100 transition-opacity leading-none">&times;</button>
    </div>
  );
}

// ── Controlled input field ─────────────────────────────────────────────────
function Field({ label, id, type, value, onChange, placeholder, autoComplete }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all duration-150"
      />
    </div>
  );
}

// ── Demo accounts ──────────────────────────────────────────────────────────
const DEMO_ACCOUNTS = [
  { label: 'Applicant', email: 'alice@applicant.com' },
  { label: 'Officer',   email: 'bob@officer.com'     },
  { label: 'Admin',     email: 'charlie@admin.com'   },
];

// ── Component ──────────────────────────────────────────────────────────────
export default function Login() {
  const [mode, setMode]         = useState('login');   // 'login' | 'register'
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading]   = useState(false);
  const [toast, setToast]       = useState(null);      // { message, type }

  const { login }       = useAuth();
  const { addBusiness } = useBusiness();
  const navigate        = useNavigate();
  const location        = useLocation();

  const isLogin    = mode === 'login';
  const isRegister = !isLogin;

  const showToast  = (message, type = 'error') => setToast({ message, type });
  const clearToast = () => setToast(null);

  // ── Post-auth redirect ───────────────────────────────────────────────────
  const redirectAfterLogin = (userData) => {
    if (location.state?.newBusiness) addBusiness(location.state.newBusiness);
    const returnUrl = location.state?.returnUrl;
    if (returnUrl) { navigate(returnUrl); return; }
    if (userData.role === 'applicant') navigate('/app/dashboard');
    else if (userData.role === 'officer') navigate('/officer/queue');
    else if (userData.role === 'admin') navigate('/admin/analytics');
  };

  // ── Real form submit ─────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    clearToast();

    if (!email.trim())                    { showToast('Please enter your email address.'); return; }
    if (!password)                        { showToast('Please enter your password.'); return; }
    if (isRegister && !fullName.trim())   { showToast('Please enter your full name.'); return; }

    setLoading(true);
    try {
      // Try matching a mock user by email; otherwise show backend-pending notice
      const { data } = await loginAPI(email.trim().toLowerCase());
      login(data.user, data.token);
      if (isRegister) {
        showToast(`Welcome, ${data.user.name}! Demo mode — backend integration pending.`, 'success');
        setTimeout(() => redirectAfterLogin(data.user), 1000);
      } else {
        redirectAfterLogin(data.user);
      }
    } catch {
      showToast(
        isLogin
          ? 'No account found for that email. Backend integration is pending — try a demo account below.'
          : 'Registration coming soon! Backend integration is pending. Use a demo account below to explore.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Quick demo login ─────────────────────────────────────────────────────
  const handleDemoLogin = async (demoEmail) => {
    clearToast();
    setLoading(true);
    try {
      const { data } = await loginAPI(demoEmail);
      login(data.user, data.token);
      if (location.state?.newBusiness) addBusiness(location.state.newBusiness);
      const returnUrl = location.state?.returnUrl;
      if (returnUrl) { navigate(returnUrl); return; }
      if (data.user.role === 'applicant')  navigate('/app/dashboard');
      else if (data.user.role === 'officer') navigate('/officer/queue');
      else if (data.user.role === 'admin')   navigate('/admin/analytics');
    } catch (err) {
      console.error(err);
      showToast('Demo login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    clearToast();
    setEmail('');
    setPassword('');
    setFullName('');
    setMode(isLogin ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative CSS grid background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(148,163,184,0.15) 0%, transparent 65%),' +
            'linear-gradient(rgba(148,163,184,0.07) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(148,163,184,0.07) 1px, transparent 1px)',
          backgroundSize: 'auto, 40px 40px, 40px 40px',
        }}
      />

      <div className="relative w-full max-w-md">

        {/* Top branding */}
        <div className="text-center mb-8">
          <p className="text-2xl font-extrabold tracking-tight text-slate-900">ClearPath</p>
          <p className="text-xs text-slate-400 font-semibold mt-1 tracking-widest uppercase">Industrial Approvals Platform</p>
        </div>

        {/* ── Auth Card ── */}
        <div className="bg-white border border-slate-200/75 shadow-xl rounded-2xl p-8">

          {/* Dynamic header */}
          <div className="mb-7">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              {isLogin ? 'Sign in to your account' : 'Create your account'}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isLogin
                ? 'Welcome back. Enter your credentials to continue.'
                : 'Start your free account to manage industrial approvals.'}
            </p>
          </div>

          {/* Toast */}
          {toast && (
            <div className="mb-5">
              <Toast message={toast.message} type={toast.type} onDismiss={clearToast} />
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {isRegister && (
              <Field
                label="Full Name"
                id="auth-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Aditya Saini"
                autoComplete="name"
              />
            )}
            <Field
              label="Email Address"
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />

            {isLogin && (
              <div className="flex justify-end -mt-1">
                <button
                  type="button"
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
                  onClick={() => showToast('Password reset coming soon — backend integration is pending.')}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-slate-900 text-white py-3 rounded-lg font-semibold text-sm hover:bg-slate-800 active:scale-[0.98] shadow-sm transition-all duration-150 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </>
              ) : (
                isLogin ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-sm text-slate-500 text-center mt-5">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button
              type="button"
              onClick={toggleMode}
              className="text-slate-900 font-semibold hover:underline transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </p>

          {/* Divider */}
          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Quick Test Accounts
              </span>
            </div>
          </div>

          {/* Demoted ghost demo buttons */}
          <div className="space-y-2">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleDemoLogin(acc.email)}
                disabled={loading}
                className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-lg py-2 text-xs font-medium hover:bg-slate-100 hover:border-slate-300 hover:text-slate-700 active:scale-[0.98] transition-all duration-100 disabled:opacity-50"
              >
                Demo: {acc.label}
              </button>
            ))}
          </div>

        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
          This is a demo environment. Real authentication is not yet active.
        </p>

      </div>
    </div>
  );
}
