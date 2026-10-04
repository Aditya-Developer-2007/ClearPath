import React from 'react';
export default function Thread() {
  return (
    <div className="border border-border rounded p-4 bg-white flex flex-col">
      <div className="mb-4 border-b border-border text-sm text-gray-600">
        <p className="mb-2"><strong className="text-text">Officer:</strong> Please upload the floor plan.</p>
        <p><strong className="text-text">You:</strong> Attached floor_plan.pdf.</p>
      </div>
      <div className="flex gap-2">
        <input type="text" placeholder="Type a message..." className="flex-1 border border-border rounded px-3 py-1 text-sm focus:outline-none focus:border-primary" />
        <button className="bg-primary text-white px-4 py-1 rounded text-sm hover:bg-teal-800 transition-colors">Send</button>
      </div>
    </div>
  );
}