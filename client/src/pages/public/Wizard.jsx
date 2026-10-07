import React, { useReducer, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitApplicationAPI } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';
import { useBusiness } from '../../context/BusinessContext';

const STEPS = [
  { key: 'sector', label: 'Sector' },
  { key: 'location', label: 'Location' },
  { key: 'investment', label: 'Investment' },
  { key: 'employees', label: 'Employees' },
  { key: 'triggers', label: 'Operations' },
  { key: 'stage', label: 'Stage' },
];

export default function Wizard() {
  const { state: routerState } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addBusiness } = useBusiness();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [returnToConfirm, setReturnToConfirm] = useState(false);

  const initialData = {
    sector: routerState?.prefill?.sector || null,
    customSector: '',
    state: routerState?.prefill?.state || null,
    customState: '',
    city: routerState?.prefill?.city || null,
    investment: routerState?.prefill?.investmentLakh || null,
    employees: routerState?.prefill?.employees || null,
    estate: null, // "estate" or "private" or "other"
    customEstate: '',
    groundwaterBoiler: null,
    wirelessEwaste: null,
    hazardous: routerState?.prefill?.hazardous !== undefined ? routerState.prefill.hazardous : null,
    otherCompliance: false,
    customOtherCompliance: '',
    stage: routerState?.prefill?.stage || null,
    customStage: '',
  };

  const reducer = (state, action) => {
    switch(action.type) {
      case 'SET': return { ...state, [action.field]: action.value };
      default: return state;
    }
  };

  const [data, dispatch] = useReducer(reducer, initialData);

  const isStepValid = (index) => {
    switch(index) {
      case 0: return !!data.sector && (data.sector !== 'Other (Custom Sector / Industry)' || !!data.customSector.trim());
      case 1: return !!data.state && !!data.city && (data.state !== 'Other (Custom State)' || !!data.customState.trim());
      case 2: return !!data.investment;
      case 3: return !!data.employees;
      case 4: 
        const estateValid = !!data.estate && (data.estate !== 'other' || !!data.customEstate.trim());
        const complianceValid = !data.otherCompliance || !!data.customOtherCompliance.trim();
        return estateValid && complianceValid && data.groundwaterBoiler !== null && data.wirelessEwaste !== null && data.hazardous !== null;
      case 5: return !!data.stage && (data.stage !== 'Other' || !!data.customStage.trim());
      default: return true;
    }
  };

  const handleNext = () => {
    if (returnToConfirm && isStepValid(currentStep)) {
      setCurrentStep(STEPS.length);
      setReturnToConfirm(false);
    } else if (currentStep < STEPS.length) {
      setCurrentStep(s => s + 1);
    }
  };

  const handleBack = () => {
    if (returnToConfirm) {
      setCurrentStep(STEPS.length);
      setReturnToConfirm(false);
    } else if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    } else {
      navigate('/');
    }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await submitApplicationAPI(data);
      const sectorCapitalized = data.sector === 'Other (Custom Sector / Industry)' && data.customSector
        ? data.customSector.charAt(0).toUpperCase() + data.customSector.slice(1)
        : (data.sector ? data.sector.charAt(0).toUpperCase() + data.sector.slice(1) : 'Industrial');
      const cityName = data.city || 'Gujarat';
      const stateName = data.state === 'Other (Custom State)' ? data.customState : data.state;
      const businessName = `${sectorCapitalized} unit, ${cityName}`;
      const businessObj = {
        name: businessName,
        sector: sectorCapitalized,
        city: data.city || 'Surat',
        state: stateName || 'Gujarat',
      };

      let created = null;
      if (user) {
        created = addBusiness(businessObj);
      }
      navigate('/result', {
        state: {
          result: res.data,
          newBusiness: created || businessObj,
        },
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const OptionCard = ({ label, selected, onClick }) => (
    <div 
      onClick={onClick}
      className={`border p-4 rounded-xl cursor-pointer transition-all duration-200 ${selected ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900 shadow-sm' : 'border-slate-300 bg-white hover:border-slate-400 hover:shadow-sm'}`}
    >
      <div className="font-bold text-slate-900 tracking-tight">{label}</div>
    </div>
  );

  const isPrefilled = (field) => {
    return routerState?.prefill && routerState.prefill[field] !== null && routerState.prefill[field] !== undefined;
  };

  const renderPrefillTag = (field) => {
    if (isPrefilled(field)) {
      return <span className="inline-block mt-2 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Filled from your description</span>;
    }
    return null;
  };

  const renderConfirmRow = (label, value, stepIndex, prefillField) => (
    <div className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
      <div>
        <span className="text-gray-500 block text-xs uppercase tracking-wider">{label}</span>
        <div className="mt-1 font-medium">{value}</div>
        {isPrefilled(prefillField) && (
          <span className="inline-block mt-1 text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">Filled from your description</span>
        )}
      </div>
      <button 
        onClick={() => {
          setReturnToConfirm(true);
          setCurrentStep(stepIndex);
        }}
        className="text-primary text-sm hover:underline font-medium"
      >
        Edit
      </button>
    </div>
  );

  const renderStepContent = () => {
    if (currentStep === STEPS.length) {
      return (
        <div className="space-y-4 w-full">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Confirm your details</h2>
          <div className="flex flex-col text-sm border border-slate-200 px-4 py-2 rounded-xl bg-slate-50 shadow-sm w-full divide-y divide-slate-200/60">
            {renderConfirmRow('Sector', data.sector === 'Other (Custom Sector / Industry)' ? data.customSector : data.sector, 0, 'sector')}
            {renderConfirmRow('Location', `${data.city}, ${data.state === 'Other (Custom State)' ? data.customState : data.state}`, 1, 'city')}
            {renderConfirmRow('Investment', `${data.investment} Lakh`, 2, 'investmentLakh')}
            {renderConfirmRow('Employees', data.employees, 3, 'employees')}
            {renderConfirmRow('Operations', 'Custom logic', 4, 'triggers')}
            {renderConfirmRow('Stage', data.stage === 'Other' ? data.customStage : data.stage, 5, 'stage')}
          </div>
        </div>
      );
    }

    switch(currentStep) {
      case 0:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">What is your sector?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {['Textile', 'Chemical', 'Food Processing', 'Electronics', 'General Manufacturing', 'Pharmaceuticals & Medical Devices', 'Other (Custom Sector / Industry)'].map(s => (
                <OptionCard key={s} label={s} selected={data.sector === s} onClick={() => dispatch({ type: 'SET', field: 'sector', value: s })} />
              ))}
            </div>
            {data.sector === 'Other (Custom Sector / Industry)' && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Specify your industry/activity</label>
                <input type="text" className="w-full md:max-w-md border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Aerospace, Defense, Renewable Energy" value={data.customSector || ''} onChange={e => dispatch({ type: 'SET', field: 'customSector', value: e.target.value })} />
                {(!data.customSector || !data.customSector.trim()) && <p className="text-xs text-rose-500 mt-1 font-bold">Please specify your custom industry/activity.</p>}
              </div>
            )}
            {renderPrefillTag('sector')}
          </div>
        );
      case 1:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Where will it be located?</h2>
            <div className="space-y-4 w-full md:max-w-md">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">State</label>
                <select className="w-full border border-slate-300 p-3 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm text-slate-900" value={data.state || ''} onChange={e => dispatch({ type: 'SET', field: 'state', value: e.target.value })}>
                  <option value="">Select state...</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Other (Custom State)">Other (Custom State)</option>
                </select>
                {data.state === 'Other (Custom State)' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Enter your state name</label>
                    <input type="text" className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Karnataka" value={data.customState || ''} onChange={e => dispatch({ type: 'SET', field: 'customState', value: e.target.value })} />
                    {(!data.customState || !data.customState.trim()) && <p className="text-xs text-rose-500 mt-1 font-bold">Please specify your custom state.</p>}
                  </div>
                )}
                {renderPrefillTag('state')}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">City / District</label>
                <input type="text" className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Surat" value={data.city || ''} onChange={e => dispatch({ type: 'SET', field: 'city', value: e.target.value })} />
                {renderPrefillTag('city')}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Total investment (in Lakhs)</h2>
            <input type="number" className="w-full md:max-w-md border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm font-mono text-slate-900 placeholder:text-slate-400" placeholder="e.g. 30" value={data.investment || ''} onChange={e => dispatch({ type: 'SET', field: 'investment', value: e.target.value })} />
            <div>{renderPrefillTag('investmentLakh')}</div>
          </div>
        );
      case 3:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Expected number of employees</h2>
            <input type="number" className="w-full md:max-w-md border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm font-mono text-slate-900 placeholder:text-slate-400" placeholder="e.g. 12" value={data.employees || ''} onChange={e => dispatch({ type: 'SET', field: 'employees', value: e.target.value })} />
            <div>{renderPrefillTag('employees')}</div>
          </div>
        );
      case 4:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Operational Details</h2>
            <div className="space-y-6 w-full">
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5">Is your site inside an industrial estate (GIDC/MIDC/SIPCOT/UPSIDA) or private land?</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <OptionCard label="Industrial Estate" selected={data.estate === 'estate'} onClick={() => dispatch({ type: 'SET', field: 'estate', value: 'estate' })} />
                  <OptionCard label="Private Land" selected={data.estate === 'private'} onClick={() => dispatch({ type: 'SET', field: 'estate', value: 'private' })} />
                  <OptionCard label="Other" selected={data.estate === 'other'} onClick={() => dispatch({ type: 'SET', field: 'estate', value: 'other' })} />
                </div>
                {data.estate === 'other' && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Specify premises arrangement</label>
                    <input type="text" className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Plug-and-play incubator, Port land, Free Trade Zone" value={data.customEstate || ''} onChange={e => dispatch({ type: 'SET', field: 'customEstate', value: e.target.value })} />
                    {(!data.customEstate || !data.customEstate.trim()) && <p className="text-xs text-rose-500 mt-1 font-bold">Please specify your custom premises arrangement.</p>}
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5">Will groundwater or boiler/lifting equipment be used?</label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard label="Yes" selected={data.groundwaterBoiler === true} onClick={() => dispatch({ type: 'SET', field: 'groundwaterBoiler', value: true })} />
                  <OptionCard label="No" selected={data.groundwaterBoiler === false} onClick={() => dispatch({ type: 'SET', field: 'groundwaterBoiler', value: false })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5">Does the product include wireless/RF (WPC) or battery/e-waste (EPR)?</label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard label="Yes" selected={data.wirelessEwaste === true} onClick={() => dispatch({ type: 'SET', field: 'wirelessEwaste', value: true })} />
                  <OptionCard label="No" selected={data.wirelessEwaste === false} onClick={() => dispatch({ type: 'SET', field: 'wirelessEwaste', value: false })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2.5">Are hazardous chemicals or hazardous processes involved?</label>
                <div className="grid grid-cols-2 gap-3">
                  <OptionCard label="Yes" selected={data.hazardous === true} onClick={() => dispatch({ type: 'SET', field: 'hazardous', value: true })} />
                  <OptionCard label="No" selected={data.hazardous === false} onClick={() => dispatch({ type: 'SET', field: 'hazardous', value: false })} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer font-bold text-sm mt-4 text-slate-700">
                  <input type="checkbox" checked={data.otherCompliance} onChange={e => dispatch({ type: 'SET', field: 'otherCompliance', value: e.target.checked })} className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 h-4 w-4" />
                  Other compliance/permit
                </label>
                {data.otherCompliance && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Specify any custom clearance</label>
                    <input type="text" className="w-full border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Ground Water Abstraction NOC" value={data.customOtherCompliance || ''} onChange={e => dispatch({ type: 'SET', field: 'customOtherCompliance', value: e.target.value })} />
                    {(!data.customOtherCompliance || !data.customOtherCompliance.trim()) && <p className="text-xs text-rose-500 mt-1 font-bold">Please specify your custom clearance.</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-6">Project stage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {['New', 'Expansion', 'Renewal', 'Other'].map(s => (
                <OptionCard key={s} label={s} selected={data.stage === s} onClick={() => dispatch({ type: 'SET', field: 'stage', value: s })} />
              ))}
            </div>
            {data.stage === 'Other' && (
              <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-1.5">Specify your project stage</label>
                <input type="text" className="w-full md:max-w-md border border-slate-300 p-3 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 bg-white shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="e.g. Modernization, Shift of premises" value={data.customStage || ''} onChange={e => dispatch({ type: 'SET', field: 'customStage', value: e.target.value })} />
                {(!data.customStage || !data.customStage.trim()) && <p className="text-xs text-rose-500 mt-1 font-bold">Please specify your custom stage.</p>}
              </div>
            )}
            {renderPrefillTag('stage')}
          </div>
        );
    }
  };

  const isCurrentValid = currentStep === STEPS.length ? true : isStepValid(currentStep);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <header className="h-16 flex items-center justify-between px-6 lg:px-10 border-b border-slate-200/80 bg-white shrink-0">
        <div className="font-headings font-bold text-xl text-slate-900 tracking-tight">ClearPath</div>
      </header>

      {routerState?.error && (
        <div className="bg-rose-50 border-b border-rose-200 text-rose-800 px-6 py-2 text-sm text-center font-bold shadow-sm">
          {routerState.error}
        </div>
      )}

      <main className="w-full mx-auto p-6 md:p-12 flex flex-col md:my-8 bg-white md:shadow-xl md:border md:border-slate-200/50 md:rounded-2xl max-w-3xl">
        {/* Step Indicator */}
        {currentStep < STEPS.length && (
          <div className="mb-12 w-full">
            <div className="flex items-center w-full relative h-2">
              <div className="absolute inset-0 bg-slate-100 rounded-full"></div>
              <div className="absolute inset-y-0 left-0 bg-slate-900 rounded-full transition-all duration-300" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
              {STEPS.map((step, idx) => (
                <div key={idx} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${(idx / (STEPS.length - 1)) * 100}%` }}>
                  <div className={`w-4 h-4 rounded-full border-2 border-white -ml-2 transition-colors duration-300 ${idx <= currentStep ? 'bg-slate-900' : 'bg-slate-200'}`}></div>
                </div>
              ))}
            </div>
            <div className="text-xs font-bold text-slate-500 mt-4 font-mono tracking-widest uppercase">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
        )}

        <div className="w-full">
          {renderStepContent()}
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200/80 flex justify-between md:relative md:bg-transparent md:border-none md:p-0 md:mt-12 z-10 pb-safe shadow-[0_-8px_16px_-4px_rgba(0,0,0,0.05)] md:shadow-none">
          <button onClick={handleBack} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all duration-75">
            Back
          </button>
          {currentStep === STEPS.length ? (
             <button onClick={handleFinish} disabled={loading} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 active:scale-[0.97] transition-all duration-75 disabled:opacity-50">
               {loading ? 'Submitting...' : 'Show my approvals'}
             </button>
          ) : (
            <button onClick={handleNext} disabled={!isCurrentValid} className="px-6 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-slate-800 active:scale-[0.97] transition-all duration-75 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

