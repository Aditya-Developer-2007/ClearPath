import React from 'react';
import { Inbox } from 'lucide-react';
export default function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 border border-dashed border-border rounded text-gray-500 bg-white">
      <Inbox className="w-8 h-8 mb-2 opacity-50" />
      <p>{message || 'No items found.'}</p>
    </div>
  );
}