import React, { useState } from 'react';

interface ConsentGateProps {
  estimatedCount: number;
  onGrant: () => void;
  onDeny: () => void;
}

export default function ConsentGate({ estimatedCount, onGrant, onDeny }: ConsentGateProps) {
  const [checked, setChecked] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-[#E0E0E0] text-xl font-bold mb-3">Detailed View Required</h3>
        <p className="text-[#A3A3A3] text-sm mb-4">
          This audience segment has fewer than 1,000 users ({estimatedCount.toLocaleString()}).
          Accessing detailed data requires explicit consent and will be logged to Passport for audit.
        </p>
        <label className="flex items-start gap-3 cursor-pointer mb-6">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          <span className="text-[#A3A3A3] text-sm">
            I agree to access detailed audience data for targeting purposes. This action will be logged.
          </span>
        </label>
        <div className="flex gap-3">
          <button
            onClick={onGrant}
            disabled={!checked}
            className="flex-1 bg-[#3B82F6] text-white py-2 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2563EB] transition-colors"
          >
            Grant Access
          </button>
          <button
            onClick={onDeny}
            className="flex-1 bg-[#2A2A3A] text-[#A3A3A3] py-2 rounded-lg font-semibold hover:bg-[#333344] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
