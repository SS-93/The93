import React from 'react';
import type { DNAQueryPreview } from '@/types/companon';

interface DNAPreviewPanelProps {
  preview: DNAQueryPreview | null;
  loading: boolean;
  error: string | null;
  consentGranted: boolean;
}

export default function DNAPreviewPanel({ preview, loading, error }: DNAPreviewPanelProps) {
  if (loading) {
    return (
      <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-6">
        <div className="animate-pulse h-6 bg-[#2A2A3A] rounded w-1/3 mb-3" />
        <div className="animate-pulse h-4 bg-[#2A2A3A] rounded w-2/3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#1E1E2A] border border-red-800 rounded-xl p-6">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-6">
      <h3 className="text-[#E0E0E0] font-semibold mb-2">Audience Preview</h3>
      {preview ? (
        <p className="text-3xl font-bold text-[#3B82F6]">
          {preview.estimated_count.toLocaleString()}
          <span className="text-sm text-[#A3A3A3] ml-2 font-normal">estimated reach</span>
        </p>
      ) : (
        <p className="text-[#A3A3A3] text-sm">Apply filters to preview your audience.</p>
      )}
    </div>
  );
}
