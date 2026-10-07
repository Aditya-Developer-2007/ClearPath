import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';
import { loginAPI } from '../../lib/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { addBusiness } = useBusiness();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemoLogin = async (email) => {
    setLoading(true);
    try {
      const { data } = await loginAPI(email);
      login(data.user, data.token);
      if (location.state?.newBusiness) {
        addBusiness(location.state.newBusiness);
      }
      const returnUrl = location.state?.returnUrl;
      if (returnUrl) {
        navigate(returnUrl);
      } else if (data.user.role === 'applicant') {
        navigate('/app/dashboard');
      } else if (data.user.role === 'officer') {
        navigate('/officer/queue');
      } else if (data.user.role === 'admin') {
        navigate('/admin/analytics');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-slate-200/75 shadow-xl rounded-2xl p-8 md:p-10">
        <h1 className="text-3xl font-bold tracking-tight text-center text-slate-900 mb-2">ClearPath</h1>
        <p className="text-center text-slate-500 mb-8 text-sm font-medium tracking-wide">Industrial Approvals Platform</p>
        
        <form className="space-y-4 mb-8" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Email</label>
            <input type="email" disabled className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none shadow-sm" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Password</label>
            <input type="password" disabled className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none shadow-sm" placeholder="••••••••" />
          </div>
          <button disabled className="w-full bg-slate-900 text-white rounded-lg py-2.5 text-sm font-bold opacity-50 shadow-sm mt-2">Sign In</button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-slate-400"><span className="px-3 bg-white">Or use demo accounts</span></div>
        </div>

        <div className="space-y-3">
          <button onClick={() => handleDemoLogin('alice@applicant.com')} disabled={loading} className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.97] transition-all duration-75">Demo: Applicant</button>
          <button onClick={() => handleDemoLogin('bob@officer.com')} disabled={loading} className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.97] transition-all duration-75">Demo: Officer</button>
          <button onClick={() => handleDemoLogin('charlie@admin.com')} disabled={loading} className="w-full bg-white border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 shadow-sm active:scale-[0.97] transition-all duration-75">Demo: Admin</button>
        </div>
      </div>
    </div>
  );
}
