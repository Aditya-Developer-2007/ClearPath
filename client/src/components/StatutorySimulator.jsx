import React, { useState, useMemo } from 'react';
import {
  evaluateStatutoryApprovals,
  evaluateEligibleSchemes,
} from '../lib/api';
import {
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Users,
  Coins,
} from 'lucide-react';

export default function StatutorySimulator({ baselineBusiness = {} }) {
  const [isOpen, setIsOpen] = useState(true);

  // Baseline values
  const defaultWorkers = baselineBusiness.employees || 12;
  const defaultInvestment = baselineBusiness.investmentLakh || 30;
  const defaultHazardous = Boolean(baselineBusiness.hazardous);

  const [workers, setWorkers] = useState(defaultWorkers);
  const [investment, setInvestment] = useState(defaultInvestment);
  const [hazardous, setHazardous] = useState(defaultHazardous);

  // Dynamic statutory evaluation in real time
  const simulatedInput = useMemo(() => {
    return {
      ...baselineBusiness,
      sector: baselineBusiness.sector || 'Textile',
      city: baselineBusiness.city || 'Surat',
      state: baselineBusiness.state || 'Gujarat',
      employees: workers,
      investmentLakh: investment,
      hazardous,
    };
  }, [baselineBusiness, workers, investment, hazardous]);

  const simulatedApprovals = useMemo(() => {
    return evaluateStatutoryApprovals(simulatedInput);
  }, [simulatedInput]);

  const simulatedSchemes = useMemo(() => {
    return evaluateEligibleSchemes(simulatedInput);
  }, [simulatedInput]);

  // Fee calculation
  const totalFees = useMemo(() => {
    return simulatedApprovals.reduce((acc, a) => acc + (a.statutoryFeeInr || 0), 0);
  }, [simulatedApprovals]);

  // Baseline comparisons
  const isChanged = workers !== defaultWorkers || investment !== defaultInvestment || hazardous !== defaultHazardous;

  // Law triggers & threshold insights
  const insights = useMemo(() => {
    const list = [];

    // Factories Act threshold (10 workers)
    if (workers >= 10) {
      list.push({
        id: 'factories-act',
        type: 'triggered',
        title: 'The Factories Act, 1948 (Sec 2m & Sec 6) Triggered',
        badge: 'Mandatory',
        detail: 'Workforce >= 10 with electrical power requires DISH Factory Building Plan Approval and Manufacturing Licence [IND-03].',
      });
    } else {
      list.push({
        id: 'shops-act',
        type: 'exempt',
        title: 'Exempt from Factories Act (< 10 Workers)',
        badge: 'Exempted / Switched',
        detail: 'Unit exempt from factory licensing; falls under State Shop & Establishment Registration [LAB-04]. SLA reduced to 7 days.',
      });
    }

    // Contract Labour threshold (20 workers)
    if (workers >= 20) {
      list.push({
        id: 'clra-act',
        type: 'triggered',
        title: 'Contract Labour (R&A) Act & OSH Code Triggered',
        badge: 'New Mandate',
        detail: 'Workforce >= 20 mandates Principal Employer Registration and statutory welfare amenities provision.',
      });
    }

    // Hazardous threshold
    if (hazardous) {
      list.push({
        id: 'hazard-act',
        type: 'triggered',
        title: 'Hazardous Waste (HOWM Rules, 2016) Authorization Triggered',
        badge: 'High Risk Tier',
        detail: 'Requires State Pollution Control Board Form-1 Authorization & Chief Fire Officer Special Safety Clearance [HAZ-11].',
      });
    }

    // PMEGP Subsidy threshold (<= 50 Lakh)
    if (investment <= 50) {
      list.push({
        id: 'pmegp-scheme',
        type: 'scheme',
        title: 'PMEGP 15% - 35% Capital Subsidy Applicable',
        badge: 'Govt Subsidy Active',
        detail: 'Project investment within ₹50 Lakh ceiling qualifies for KVIC margin money subsidy under MSME norms.',
      });
    } else {
      list.push({
        id: 'cgtmse-scheme',
        type: 'scheme',
        title: 'PMEGP Subsidy Ceiling Exceeded (Switched to CGTMSE)',
        badge: 'Credit Guarantee',
        detail: 'Project exceeds ₹50 Lakh PMEGP ceiling. Eligible for collateral-free credit guarantee under CGTMSE up to ₹5 Crore.',
      });
    }

    return list;
  }, [workers, investment, hazardous]);

  const handleReset = () => {
    setWorkers(defaultWorkers);
    setInvestment(defaultInvestment);
    setHazardous(defaultHazardous);
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden mb-8 transition-all">
      {/* Top Banner Bar */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-teal-500/20 text-teal-400 rounded-lg border border-teal-500/30">
            <SlidersHorizontal size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm tracking-tight font-headings text-white">
                Statutory Threshold Simulator
              </h3>
              <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/60">
                Interactive "What-If"
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulate workforce headcount, capital investment, or hazardous processes to test statutory triggers live.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isChanged && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <RotateCcw size={12} />
              <span>Reset to Baseline</span>
            </button>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
            aria-label="Toggle simulator"
          >
            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="p-5 space-y-5 bg-slate-50/40">
          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-white p-4 rounded-xl border border-slate-200/80">
            {/* Workforce Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Users size={14} className="text-slate-400" />
                  <span>Workforce Headcount</span>
                </span>
                <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                  {workers} Workers
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                step="1"
                value={workers}
                onChange={(e) => setWorkers(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>5 (Shops Act)</span>
                <span className="text-teal-700 font-bold">10 (Factories Act)</span>
                <span>20 (CLRA)</span>
                <span>50</span>
              </div>
            </div>

            {/* Capital Investment Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Coins size={14} className="text-slate-400" />
                  <span>Project Investment</span>
                </span>
                <span className="font-mono text-sm font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-900 border border-slate-200">
                  ₹ {investment} Lakh
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={investment}
                onChange={(e) => setInvestment(parseInt(e.target.value, 10))}
                className="w-full accent-teal-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>₹10L</span>
                <span className="text-teal-700 font-bold">₹50L (PMEGP Max)</span>
                <span>₹100L</span>
                <span>₹200L</span>
              </div>
            </div>

            {/* Hazardous Process Toggle */}
            <div className="space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-slate-400" />
                  <span>Process Classification</span>
                </span>
                <span
                  className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded border ${
                    hazardous
                      ? 'bg-rose-50 text-rose-800 border-rose-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {hazardous ? 'Hazardous (HOWM Rules)' : 'Standard Process'}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setHazardous(false)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    !hazardous
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Standard
                </button>
                <button
                  type="button"
                  onClick={() => setHazardous(true)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    hazardous
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Hazardous
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Stat Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Mandated Clearances</span>
              <span className="font-mono text-xl font-bold text-slate-900">{simulatedApprovals.length}</span>
              <span className="text-[10px] text-slate-500 block">statutory licenses</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Statutory Fees</span>
              <span className="font-mono text-xl font-bold text-teal-800">
                ₹{totalFees.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500 block">scheduled govt charges</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Matched Schemes</span>
              <span className="font-mono text-xl font-bold text-slate-900">{simulatedSchemes.length}</span>
              <span className="text-[10px] text-slate-500 block">subsidies &amp; guarantees</span>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Status Diff</span>
              <span className="font-mono text-xs font-bold text-slate-900 flex items-center gap-1 mt-1">
                {isChanged ? (
                  <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Simulating Diff
                  </span>
                ) : (
                  <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    Unit Baseline
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Live Statutory Law Delta Insights */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles size={13} className="text-teal-600" />
              <span>Real-Time Legal Threshold Triggers</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {insights.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border text-xs flex flex-col justify-between ${
                    item.type === 'triggered'
                      ? 'bg-amber-50/60 border-amber-200 text-amber-950'
                      : item.type === 'exempt'
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                      : 'bg-teal-50/60 border-teal-200 text-teal-950'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="font-bold text-xs">{item.title}</span>
                      <span
                        className={`text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.type === 'triggered'
                            ? 'bg-amber-100 text-amber-800'
                            : item.type === 'exempt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-teal-100 text-teal-800'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
