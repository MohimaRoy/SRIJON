import React from 'react';

export default function LoadingSpinner({ message = 'Checking permissions…' }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">{message}</p>
      </div>
    </div>
  );
}
