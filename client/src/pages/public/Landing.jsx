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
    <div className="min-h-screen flex flex-col bg-slate-50 relative overflow-hidden">
      {/* Subtle radial gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-200/40 via-slate-50 to-slate-50 -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10 pointer-events-none" />

      <header className="h-20 flex items-center justify-between px-6 lg:px-12 bg-transparent shrink-0 relative z-10">
        <div className="font-headings font-extrabold text-2xl text-slate-900 tracking-tight">ClearPath</div>
        <Link to="/login" className="bg-white border border-slate-200 text-slate-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm">
          Login
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center px-6 md:px-12 py-12 md:py-20 relative z-10">
        <div className="w-full max-w-6xl flex flex-col lg:flex-row gap-16 items-center lg:items-start">
          
          {/* Left Column - Hero & Magic Intake */}
          <div className="flex-1 flex flex-col items-start w-full lg:max-w-2xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tighter leading-[1.05] mb-6 text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-slate-800 to-slate-500 font-headings">
              Starting a factory? Know every permission you need.
            </h1>
            <p className="text-lg md:text-xl text-slate-500 max-w-xl leading-relaxed mb-10 font-medium">
              Government-grade approvals simplified. No guesswork, just a clear path forward for your business.
            </p>
            
            <div className="w-full bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-slate-200/60 mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-4">
                Tell us about your business (Hindi or English)
              </label>
              <textarea 
                className="w-full h-28 bg-transparent text-slate-900 text-lg placeholder:text-slate-400 focus:ring-0 focus:outline-none resize-none leading-relaxed"
                placeholder="e.g. I am starting a textile unit in Surat with 30 lakh investment and 12 workers..."
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2 mt-2 mb-8 items-center">
                <span className="text-xs text-slate-400 font-medium mr-1 uppercase tracking-wider">Try:</span>
                {[
                  "Textile unit in Surat, 30 lakh",
                  "Food processing in Ahmedabad",
                  "Chemical plant, hazardous, 2 crore",
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setText(chip)}
                    className="bg-slate-100 text-slate-600 text-xs font-mono px-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-400 hover:bg-white hover:text-slate-900 cursor-pointer transition-colors"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <button 
                onClick={handleSubmit} 
                disabled={loading}
                className="w-full bg-slate-900 text-white rounded-xl py-4 font-semibold text-lg hover:bg-slate-800 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none flex justify-center items-center gap-2"
              >
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-slate-300 border-t-white rounded-full animate-spin" /> Analyzing...</>
                ) : 'Find my approvals'}
              </button>
            </div>
            <div className="text-sm px-4 w-full flex justify-center lg:justify-start">
              <Link to="/start" className="text-slate-500 hover:text-slate-900 font-medium transition-colors">Or answer step by step manually &rarr;</Link>
            </div>
          </div>

          {/* Right Column - Live Compliance Pipeline */}
          <div className="w-full lg:w-[440px] shrink-0 mt-8 lg:mt-0 relative group">
            <div className="bg-slate-900 p-10 rounded-3xl shadow-2xl border border-slate-800 text-slate-300 relative overflow-hidden h-[480px]">
              
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-3xl pointer-events-none">
                <div className="w-64 h-64 bg-teal-500 rounded-full mix-blend-screen" />
              </div>

              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 mb-8 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                Live Pipeline
              </h3>
              
              <div className="relative pl-6 space-y-12">
                <div className="absolute top-2 bottom-4 left-[9px] border-l-2 border-slate-700/50" />
                
                <div className="relative group/node flex items-center gap-6 cursor-default">
                  <div className="absolute -left-6 w-5 h-5 bg-slate-800 rounded-full border-4 border-slate-900 ring-2 ring-slate-700/50 z-10 transition-colors group-hover/node:ring-slate-500" />
                  <span className="text-lg font-medium text-slate-400 tracking-wide group-hover/node:translate-x-1 transition-transform group-hover/node:text-slate-200">Allotment</span>
                </div>
                
                <div className="relative group/node flex items-center gap-6 cursor-default">
                  <div className="absolute -left-6 w-5 h-5 bg-slate-800 rounded-full border-4 border-slate-900 ring-2 ring-slate-700/50 z-10 transition-colors group-hover/node:ring-slate-500" />
                  <span className="text-lg font-medium text-slate-400 tracking-wide group-hover/node:translate-x-1 transition-transform group-hover/node:text-slate-200">Building Plan</span>
                </div>
                
                <div className="relative group/node flex items-center gap-6 cursor-default">
                  <div className="absolute -left-6 w-5 h-5 bg-slate-800 rounded-full border-4 border-slate-900 ring-2 ring-slate-700/50 z-10 transition-colors group-hover/node:ring-slate-500" />
                  <span className="text-lg font-medium text-slate-400 tracking-wide group-hover/node:translate-x-1 transition-transform group-hover/node:text-slate-200">Fire NOC</span>
                </div>

                <div className="relative group/node flex items-center gap-6 cursor-default">
                  <div className="absolute -left-6 w-5 h-5 bg-slate-800 rounded-full border-4 border-slate-900 ring-2 ring-slate-700/50 z-10 transition-colors group-hover/node:ring-slate-500" />
                  <span className="text-lg font-medium text-slate-400 tracking-wide group-hover/node:translate-x-1 transition-transform group-hover/node:text-slate-200">Pollution (CTE)</span>
                </div>

                <div className="relative group/node flex items-center gap-6 cursor-default">
                  <div className="absolute -left-6 w-5 h-5 bg-teal-500 rounded-full shadow-[0_0_15px_rgba(20,184,166,0.6)] ring-4 ring-teal-500/20 z-10" />
                  <span className="text-xl font-bold text-white tracking-wide group-hover/node:translate-x-1 transition-transform">Factory License</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Live Stats Strip */}
        <div className="w-full max-w-6xl mt-24 pt-10 border-t border-slate-200/60 z-10 relative">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 text-center md:text-left">Live from departments</h3>
          {stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map(s => (
                <div key={s.dept} className="flex flex-col items-center md:items-start">
                  <span className="text-sm font-medium text-slate-500 mb-2">{s.dept}</span>
                  <div className="font-mono text-3xl font-bold text-slate-900 tracking-tight">{s.days} <span className="text-lg text-slate-400 font-sans">days avg</span></div>
                </div>
              ))}
            </div>
          ) : (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
             </div>
          )}
        </div>
      </main>
    </div>
  );
}
