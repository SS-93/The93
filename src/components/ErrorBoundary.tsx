import React from 'react';
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function ErrorBoundary() {
  const error = useRouteError();

  // Log the error to the console for debugging
  console.error("Application Error Caught by Boundary:", error);

  let errorMessage: string;
  let errorStatus: number | string | undefined;

  if (isRouteErrorResponse(error)) {
    // react-router-dom specific errors
    errorStatus = `${error.status} ${error.statusText}`;
    errorMessage = error.data?.message || 'A routing error occurred.';
  } else if (error instanceof Error) {
    // Standard JavaScript errors
    errorMessage = error.message;
  } else if (typeof error === 'string') {
    errorMessage = error;
  } else {
    errorMessage = 'An unknown error occurred.';
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4" role="alert">
      <div className="text-center p-8 border border-red-800 bg-red-900/20 rounded-lg max-w-lg w-full">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-red-500 mx-auto mb-4">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
          <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
          <circle cx="12" cy="17" r="1" fill="currentColor"/>
        </svg>
        <h1 className="text-2xl font-bold text-red-400 mb-2">Oops! Something Went Wrong.</h1>
        {errorStatus && <p className="text-lg text-gray-400 mb-4">{errorStatus}</p>}
        <p className="text-gray-300 mb-4">We've encountered an unexpected issue. The details have been logged to the developer console.</p>
        <div className="font-mono bg-gray-900/70 p-3 rounded text-red-300 text-sm text-left overflow-x-auto">
          <p><strong>Error:</strong> {errorMessage}</p>
        </div>
        <button
          onClick={() => window.location.replace('/')}
          className="mt-6 px-4 py-2 bg-accent-yellow text-black rounded font-medium hover:bg-yellow-400 transition-colors"
        >
          Go to Homepage
        </button>
      </div>
    </div>
  );
} 