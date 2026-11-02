import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { loginAPI, registerAPI } from '../../lib/api';
import { ShieldCheck, UserCheck, Building2, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── Status Toast ────────────────────────────────────────────────────────────
function Toast({ message, type = 'error', onDismiss }) {
  const isSuccess = type === 'success';
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
        isSuccess
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-800'
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={17} className="shrink-0 text-emerald-600 mt-0.5" />
      ) : (
        <AlertCircle size={17} className="shrink-0 text-rose-600 mt-0.5" />
      )}
      <span className="flex-1 leading-snug">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 text-base opacity-50 hover:opacity-100 transition-opacity leading-none"
      >
        &times;
      </button>
    </div>
  );
}

// ── Controlled Input Field ──────────────────────────────────────────────────
function Field({ label, id, type, value, onChange, placeholder, autoComplete, icon: Icon, required = false }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </label>
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={`w-full py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all duration-150 ${
            Icon ? 'pl-10 pr-4' : 'px-4'
          }`}
        />
      </div>
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────
export default function Login() {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('applicant'); // 'applicant' | 'officer'
  const [department, setDepartment] = useState('Safety');
  const [organization, setOrganization] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const { login } = useAuth();
  const { addBusiness } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const isLogin = activeTab === 'login';

  const showToast = (message, type = 'error') => setToast({ message, type });
  const clearToast = () => setToast(null);

  const redirectAfterAuth = (userData, isNewRegistration = false) => {
    if (location.state?.newBusiness) {
      addBusiness(location.state.newBusiness);
    }
    const returnUrl = location.state?.returnUrl;
    if (returnUrl) {
      navigate(returnUrl);
      return;
    }

    if (userData.role === 'applicant') {
      if (isNewRegistration && !location.state?.newBusiness) {
        navigate('/wizard');
      } else {
        navigate('/app/dashboard');
      }
    } else if (userData.role === 'officer') {
      navigate('/officer/queue');
    } else if (userData.role === 'admin') {
      navigate('/admin/analytics');
    }
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    clearToast();

    if (!email.trim()) {
      showToast('Please enter your registered email address.');
      return;
    }
    if (!password) {
      showToast('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const res = await loginAPI(email.trim().toLowerCase(), password);
      login(res.data.user, res.data.token);
      redirectAfterAuth(res.data.user, false);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password. Please verify your credentials.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    clearToast();

    if (!fullName.trim()) {
      showToast('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      showToast('Please enter your official email address.');
      return;
    }
    if (!password || password.length < 6) {
      showToast('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        department: role === 'officer' ? department : 'Textile Operations',
        organization: organization.trim() || undefined,
      };

      const res = await registerAPI(payload);
      login(res.data.user, res.data.token);
      showToast('Account registered successfully. Redirecting...', 'success');
      setTimeout(() => {
        redirectAfterAuth(res.data.user, true);
      }, 700);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed. An account with this email may already exist.';
      showToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Blueprint Background Grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 0%, rgba(13,148,136,0.10) 0%, transparent 60%),' +
            'linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px),' +
            'linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)',
          backgroundSize: 'auto, 36px 36px, 36px 36px',
        }}
      />

      <div className="relative w-full max-w-lg">
        {/* Top Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold tracking-wide mb-3">
            <ShieldCheck size={14} className="text-teal-400" />
            <span>National Single Window Regulatory Platform</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">ClearPath</h1>
          <p className="text-xs text-slate-500 font-semibold mt-0.5 tracking-wider uppercase">
            Indian Industrial Clearances &amp; Statutory Governance
          </p>
        </div>

        {/* ── Auth Card ── */}
        <div className="bg-white border border-slate-200/90 shadow-xl rounded-2xl p-6 sm:p-8">
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                clearToast();
                setActiveTab('login');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                clearToast();
                setActiveTab('register');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                !isLogin
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Toast Notification */}
          {toast && (
            <div className="mb-5 animate-in fade-in slide-in-from-top-1 duration-150">
              <Toast message={toast.message} type={toast.type} onDismiss={clearToast} />
            </div>
          )}

          {/* ── SIGN IN TAB ── */}
          {isLogin && (
            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div className="space-y-1 mb-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
                <p className="text-xs text-slate-500">
                  Access your industrial unit filings, clearance status, and compliance docket.
                </p>
              </div>

              <Field
                label="Registered Official Email"
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.in or officer@gov.in"
                autoComplete="email"
                icon={Mail}
                required
              />

              <Field
                label="Password"
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                icon={Lock}
                required
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-sm shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to ClearPath</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── CREATE ACCOUNT TAB ── */}
          {!isLogin && (
            <form onSubmit={handleRegister} className="space-y-4" noValidate>
              <div className="space-y-1 mb-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">Register Official Account</h2>
                <p className="text-xs text-slate-500">
                  Create a verified profile to submit industrial applications or review departmental clearances.
                </p>
              </div>

              <Field
                label="Full Name"
                id="reg-fullname"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Aarav Mehta"
                autoComplete="name"
                icon={User}
                required
              />

              <Field
                label="Official Work / Enterprise Email"
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@enterprise.in"
                autoComplete="email"
                icon={Mail}
                required
              />

              <Field
                label="Account Password"
                id="reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
                icon={Lock}
                required
              />

              {/* Role Selection */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  Select User Role <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('applicant')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      role === 'applicant'
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <Building2
                      size={18}
                      className={role === 'applicant' ? 'text-teal-600' : 'text-slate-400'}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Industrial Applicant</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Factory / MSME Promoter</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('officer')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all ${
                      role === 'officer'
                        ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <UserCheck
                      size={18}
                      className={role === 'officer' ? 'text-teal-600' : 'text-slate-400'}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">Departmental Officer</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Statutory Nodal Authority</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Department Jurisdiction (if Officer) */}
              {role === 'officer' && (
                <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                  <label htmlFor="reg-dept" className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Department Jurisdiction <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="reg-dept"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 text-sm focus:bg-white focus:ring-2 focus:ring-slate-900 focus:outline-none transition-all"
                  >
                    <option value="Safety">Safety &amp; Fire Services (NOC / Evacuation)</option>
                    <option value="Environment">Environment &amp; Pollution Control (CTE / CTO)</option>
                    <option value="Industrial">Industrial Safety &amp; Health / DISH (Factory Licence)</option>
                    <option value="Labour">Labour &amp; Employment (CLRA / Shop &amp; Est)</option>
                    <option value="Utilities">Utilities &amp; Power DISCOM (Grid / Sanction)</option>
                    <option value="MSME">Industries Commissionerate (MSME / Subsidies)</option>
                  </select>
                </div>
              )}

              {/* Organization (Optional) */}
              <Field
                label={role === 'officer' ? 'Government Agency / Directorate' : 'Enterprise / Company Name'}
                id="reg-org"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder={role === 'officer' ? 'e.g. State Fire Prevention Directorate' : 'e.g. Surya Vastra Mills Pvt. Ltd.'}
                icon={Building2}
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-bold text-sm shadow-sm transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Registering Account...</span>
                  </>
                ) : (
                  <>
                    <span>Register Official Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[11px] text-slate-400 mt-6 leading-relaxed">
          ClearPath Enterprise Industrial Regulatory System. Authenticated under Indian Statutory Compliance Framework.
        </p>
      </div>
    </div>
  );
}
