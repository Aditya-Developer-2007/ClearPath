import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { loginAPI } from '../../lib/api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDemoLogin = async (email) => {
    setLoading(true);
    try {
      const { data } = await loginAPI(email);
      login(data.user, data.token);
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
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-border rounded-lg p-8">
        <h1 className="text-3xl font-headings mb-6 text-center">ClearPath</h1>
        <p className="text-center text-gray-500 mb-8 text-sm">Industrial Approvals Platform</p>
        
        <form className="space-y-4 mb-8" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" disabled className="w-full border border-border rounded px-3 py-2 text-sm bg-gray-50" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" disabled className="w-full border border-border rounded px-3 py-2 text-sm bg-gray-50" placeholder="••••••••" />
          </div>
          <button disabled className="w-full bg-primary text-white rounded py-2 text-sm font-medium opacity-50">Sign In</button>
        </form>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or use demo accounts</span></div>
        </div>

        <div className="space-y-3">
          <button onClick={() => handleDemoLogin('alice@applicant.com')} disabled={loading} className="w-full border border-border rounded py-2 text-sm hover:bg-gray-50 transition-colors">Demo: Applicant</button>
          <button onClick={() => handleDemoLogin('bob@officer.com')} disabled={loading} className="w-full border border-border rounded py-2 text-sm hover:bg-gray-50 transition-colors">Demo: Officer</button>
          <button onClick={() => handleDemoLogin('charlie@admin.com')} disabled={loading} className="w-full border border-border rounded py-2 text-sm hover:bg-gray-50 transition-colors">Demo: Admin</button>
        </div>
      </div>
    </div>
  );
}
