import React, { useReducer, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { submitApplicationAPI } from '../../lib/api';

const STEPS = [
  { key: 'sector', label: 'Sector' },
  { key: 'location', label: 'Location' },
  { key: 'investment', label: 'Investment' },
  { key: 'employees', label: 'Employees' },
  { key: 'hazardous', label: 'Hazardous process' },
  { key: 'stage', label: 'Stage' },
];

export default function Wizard() {
  const { state: routerState } = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [returnToConfirm, setReturnToConfirm] = useState(false);

  const initialData = {
    sector: routerState?.prefill?.sector || null,
    state: routerState?.prefill?.state || null,
    city: routerState?.prefill?.city || null,
    investment: routerState?.prefill?.investmentLakh || null,
    employees: routerState?.prefill?.employees || null,
    hazardous: routerState?.prefill?.hazardous || null,
    stage: routerState?.prefill?.stage || null,
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
      case 0: return !!data.sector;
      case 1: return !!data.state && !!data.city;
      case 2: return !!data.investment;
      case 3: return !!data.employees;
      case 4: return data.hazardous !== null;
      case 5: return !!data.stage;
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
      navigate('/result', { state: { result: res.data } });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const OptionCard = ({ label, selected, onClick }) => (
    <div 
      onClick={onClick}
      className={`border p-4 rounded cursor-pointer transition-colors ${selected ? 'border-primary bg-primary/5' : 'border-border bg-white hover:border-gray-400'}`}
    >
      <div className="font-medium text-text">{label}</div>
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
          <h2 className="text-2xl font-headings mb-6">Confirm your details</h2>
          <div className="flex flex-col text-sm border border-border px-4 py-2 rounded bg-white w-full">
            {renderConfirmRow('Sector', data.sector, 0, 'sector')}
            {renderConfirmRow('Location', `${data.city}, ${data.state}`, 1, 'city')}
            {renderConfirmRow('Investment', `${data.investment} Lakh`, 2, 'investmentLakh')}
            {renderConfirmRow('Employees', data.employees, 3, 'employees')}
            {renderConfirmRow('Hazardous', data.hazardous ? 'Yes' : 'No', 4, 'hazardous')}
            {renderConfirmRow('Stage', data.stage, 5, 'stage')}
          </div>
        </div>
      );
    }

    switch(currentStep) {
      case 0:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">What is your sector?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {['Textile', 'Chemicals', 'Food Processing', 'Electronics', 'Manufacturing', 'Other'].map(s => (
                <OptionCard key={s} label={s} selected={data.sector === s} onClick={() => dispatch({ type: 'SET', field: 'sector', value: s })} />
              ))}
            </div>
            {renderPrefillTag('sector')}
          </div>
        );
      case 1:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">Where will it be located?</h2>
            <div className="space-y-4 w-full md:max-w-md">
              <div>
                <label className="block text-sm font-medium mb-1">State</label>
                <select className="w-full border border-border p-3 rounded text-sm bg-white" value={data.state || ''} onChange={e => dispatch({ type: 'SET', field: 'state', value: e.target.value })}>
                  <option value="">Select state...</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="UP">UP</option>
                </select>
                {renderPrefillTag('state')}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City / District</label>
                <input type="text" className="w-full border border-border p-3 rounded text-sm" placeholder="e.g. Surat" value={data.city || ''} onChange={e => dispatch({ type: 'SET', field: 'city', value: e.target.value })} />
                {renderPrefillTag('city')}
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">Total investment (in Lakhs)</h2>
            <input type="number" className="w-full md:max-w-md border border-border p-3 rounded text-sm" placeholder="e.g. 30" value={data.investment || ''} onChange={e => dispatch({ type: 'SET', field: 'investment', value: e.target.value })} />
            <div>{renderPrefillTag('investmentLakh')}</div>
          </div>
        );
      case 3:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">Expected number of employees</h2>
            <input type="number" className="w-full md:max-w-md border border-border p-3 rounded text-sm" placeholder="e.g. 12" value={data.employees || ''} onChange={e => dispatch({ type: 'SET', field: 'employees', value: e.target.value })} />
            <div>{renderPrefillTag('employees')}</div>
          </div>
        );
      case 4:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">Does your process involve hazardous materials?</h2>
            <div className="grid grid-cols-2 gap-3 w-full md:max-w-md">
              <OptionCard label="Yes" selected={data.hazardous === true} onClick={() => dispatch({ type: 'SET', field: 'hazardous', value: true })} />
              <OptionCard label="No" selected={data.hazardous === false} onClick={() => dispatch({ type: 'SET', field: 'hazardous', value: false })} />
            </div>
            {renderPrefillTag('hazardous')}
          </div>
        );
      case 5:
        return (
          <div className="w-full">
            <h2 className="text-2xl font-headings mb-6">Project stage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
              {['New', 'Expansion', 'Renewal'].map(s => (
                <OptionCard key={s} label={s} selected={data.stage === s} onClick={() => dispatch({ type: 'SET', field: 'stage', value: s })} />
              ))}
            </div>
            {renderPrefillTag('stage')}
          </div>
        );
    }
  };

  const isCurrentValid = currentStep === STEPS.length ? true : isStepValid(currentStep);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-white shrink-0">
        <div className="font-headings font-bold text-xl text-text">ClearPath</div>
      </header>

      {routerState?.error && (
        <div className="bg-status-rejected_bg text-status-rejected px-6 py-2 text-sm text-center">
          {routerState.error}
        </div>
      )}

      <main className="w-full mx-auto p-6 md:p-12 flex flex-col pb-24 md:pb-12 max-w-3xl">
        {/* Step Indicator */}
        {currentStep < STEPS.length && (
          <div className="mb-12 w-full">
            <div className="flex items-center w-full relative h-2">
              <div className="absolute inset-0 bg-gray-200 rounded"></div>
              <div className="absolute inset-y-0 left-0 bg-primary rounded transition-all duration-300" style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}></div>
              {STEPS.map((step, idx) => (
                <div key={idx} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${(idx / (STEPS.length - 1)) * 100}%` }}>
                  <div className={`w-4 h-4 rounded-full border-2 border-white -ml-2 transition-colors duration-300 ${idx <= currentStep ? 'bg-primary' : 'bg-gray-300'}`}></div>
                </div>
              ))}
            </div>
            <div className="text-xs font-medium text-gray-500 mt-4 font-mono">
              Step {currentStep + 1} of {STEPS.length}
            </div>
          </div>
        )}

        <div className="w-full">
          {renderStepContent()}
        </div>

        {/* Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-border flex justify-between md:relative md:bg-transparent md:border-none md:p-0 md:mt-12 z-10 pb-safe">
          <button onClick={handleBack} className="px-6 py-2 border border-border rounded text-sm font-medium hover:bg-gray-50">
            Back
          </button>
          {currentStep === STEPS.length ? (
             <button onClick={handleFinish} disabled={loading} className="px-6 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-teal-800 disabled:opacity-50">
               {loading ? 'Submitting...' : 'Show my approvals'}
             </button>
          ) : (
            <button onClick={handleNext} disabled={!isCurrentValid} className="px-6 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

