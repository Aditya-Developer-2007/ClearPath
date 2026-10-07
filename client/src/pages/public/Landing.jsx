import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { publicStatsAPI, intakeAPI } from '../../lib/api';
import SkeletonCard from '../../components/SkeletonCard';

export default function Landing() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    publicStatsAPI().then(res => setStats(res.data)).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await intakeAPI(text);
      if (res.data.ok) {
        navigate('/start', { state: { prefill: res.data.data } });
      } else {
        navigate('/start', { state: { error: "Couldn't read that, please fill the steps." } });
      }
    } catch (e) {
      navigate('/start', { state: { error: "Something went wrong, please fill the steps manually." } });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-slate-200/80 bg-white shrink-0">
        <div className="font-headings font-bold text-xl text-slate-900 tracking-tight">ClearPath</div>
        <Link to="/login" className="text-sm font-bold text-slate-900 hover:text-slate-600 transition-colors">Login</Link>
      </header>

      <main className="flex-1 flex flex-col items-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-12 items-start mt-8">
          
          {/* Left Column */}
          <div className="flex-1 flex flex-col items-start w-full stagger-1">
            <h1 className="text-[34px] md:text-[44px] font-headings text-slate-900 tracking-tight leading-[1.1] mb-4 font-bold">
              Starting a factory? Know every permission you need, and get it on time.
            </h1>
            <p className="text-lg text-slate-500 font-medium mb-8">
              Government-grade approvals simplified. No guesswork, just a clear path forward.
            </p>
            
            <div className="w-full bg-white shadow-xl border border-slate-200/50 rounded-2xl p-6 mb-4 relative z-10">
              <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">
                Tell us about your business in your own words (Hindi or English)
              </label>
              <textarea 
                className="w-full h-32 resize-none border border-slate-300 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm text-slate-900 placeholder:text-slate-400 mb-4 transition-all"
                placeholder="e.g. I am starting a textile unit in Surat with 30 lakh investment and 12 workers..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mb-6 items-center">
                <span className="text-xs text-gray-500 font-medium">Try:</span>
                {[
                  "Textile unit in Surat, 30 lakh, 12 workers",
                  "Mujhe Ahmedabad mein food processing unit kholna hai, 50 lakh",
                  "Chemical plant in Vadodara, hazardous, 2 crore",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setText(chip)}
                    className="text-[11px] bg-white border border-slate-200 text-slate-600 font-semibold px-2.5 py-1 rounded-md shadow-sm hover:border-slate-400 hover:text-slate-900 active:scale-[0.97] transition-all duration-75 text-left"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full md:w-auto bg-slate-900 text-white font-bold py-2.5 px-6 rounded-lg shadow-sm hover:bg-slate-800 active:scale-[0.97] transition-all duration-75 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? 'Analyzing...' : 'Find my approvals'}
              </button>
            </div>
            <div className="text-sm px-2">
              <Link to="/start" className="text-slate-900 font-bold hover:underline">or answer step by step</Link>
            </div>
          </div>

          {/* Right Column - Decorative Route SVG */}
          <div className="hidden md:flex flex-1 justify-center w-full">
            <svg width="240" height="400" viewBox="0 0 240 400" className="opacity-90">
              <path d="M40 40 L40 360" stroke="#0F766E" strokeWidth="4" fill="none" strokeDasharray="8 8" />
              
              <circle cx="40" cy="40" r="12" fill="#F7F5F0" stroke="#0F766E" strokeWidth="4" />
              <text x="70" y="45" fontFamily="Bricolage Grotesque" fontSize="16" fill="#14213D" fontWeight="600">Fire NOC</text>
              
              <circle cx="40" cy="120" r="12" fill="#F7F5F0" stroke="#0F766E" strokeWidth="4" />
              <text x="70" y="125" fontFamily="Bricolage Grotesque" fontSize="16" fill="#14213D" fontWeight="600">Pollution</text>
              
              <circle cx="40" cy="200" r="12" fill="#F7F5F0" stroke="#0F766E" strokeWidth="4" />
              <text x="70" y="205" fontFamily="Bricolage Grotesque" fontSize="16" fill="#14213D" fontWeight="600">Labour</text>

              <circle cx="40" cy="280" r="12" fill="#F7F5F0" stroke="#0F766E" strokeWidth="4" />
              <text x="70" y="285" fontFamily="Bricolage Grotesque" fontSize="16" fill="#14213D" fontWeight="600">Electricity</text>

              <circle cx="40" cy="360" r="16" fill="#0F766E" />
              <text x="70" y="365" fontFamily="Bricolage Grotesque" fontSize="18" fill="#14213D" fontWeight="700">Factory</text>
            </svg>
          </div>
        </div>

        {/* Live Stats Strip */}
        <div className="w-full max-w-5xl mt-16 pt-8 border-t border-border">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-6">Live from departments</h3>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map(s => (
                <div key={s.dept} className="flex flex-col">
                  <span className="text-xs text-gray-500 mb-1">{s.dept}</span>
                  <div className="font-mono text-xl font-medium text-text">{s.days} days avg</div>
                </div>
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
