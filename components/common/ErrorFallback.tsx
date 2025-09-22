import React from 'react';
import { ShieldIcon } from '../icons/ShieldIcon';

interface ErrorFallbackProps {
  onReset: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({ onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-gray-200" role="alert">
      <div className="text-center p-8 bg-gray-800 rounded-lg shadow-xl border border-red-500/30">
        <ShieldIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 mb-6">We've encountered an unexpected error. Please try refreshing the page.</p>
        <button
          onClick={onReset}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          Reload Page
        </button>
      </div>
    </div>
  );
};
