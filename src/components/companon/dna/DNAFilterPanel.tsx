import React from 'react';
import type { DNAQueryDefinition } from '@/types/companon';

interface DNAFilterPanelProps {
  queryDefinition: DNAQueryDefinition;
  onFilterChange: (dimension: keyof DNAQueryDefinition, value: any) => void;
  disabled: boolean;
}

export default function DNAFilterPanel({ disabled }: DNAFilterPanelProps) {
  return (
    <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-6 space-y-4">
      <h3 className="text-[#E0E0E0] font-semibold">Audience Filters</h3>
      <p className="text-[#A3A3A3] text-sm">
        Filter panel coming soon — Culture, Behavior, Economics, and Spatial dimensions.
      </p>
      {disabled && <p className="text-yellow-500 text-xs">Loading...</p>}
    </div>
  );
}
