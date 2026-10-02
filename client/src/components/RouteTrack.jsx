import React from 'react';
export default function RouteTrack({ currentStep }) {
  const steps = ['Submitted', 'Review', 'Decision'];
  const currentIndex = steps.indexOf(currentStep);
  return (
    <div className="flex items-center w-full my-4">
      {steps.map((step, idx) => (
        <React.Fragment key={step}>
          <div className="flex flex-col items-center">
            <div className={`w-4 h-4 rounded-full ${idx <= currentIndex ? 'bg-primary' : 'bg-gray-300'} ${idx === currentIndex ? 'animate-pulse' : ''}`} />
            <span className="text-xs mt-1 text-gray-600">{step}</span>
          </div>
          {idx < steps.length - 1 && <div className={`flex-1 h-0.5 mx-2 ${idx < currentIndex ? 'bg-primary' : 'bg-gray-300'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}