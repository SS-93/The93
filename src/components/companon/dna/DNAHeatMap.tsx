import React from 'react';
import type { GeographicDataPoint, Geofence } from '@/types/companon';

interface DNAHeatMapProps {
  dataPoints: GeographicDataPoint[];
  geofence?: Geofence;
}

export default function DNAHeatMap({ dataPoints }: DNAHeatMapProps) {
  return (
    <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-6">
      <h3 className="text-[#E0E0E0] font-semibold mb-2">Geographic Distribution</h3>
      <div className="space-y-2">
        {dataPoints.slice(0, 5).map((point, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-[#A3A3A3]">{point.city}, {point.country}</span>
            <span className="text-[#E0E0E0] font-medium">{point.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
