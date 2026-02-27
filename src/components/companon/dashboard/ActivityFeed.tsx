import React from 'react';
import type { PassportActivityItem } from '@/types/companon';

interface ActivityFeedProps {
  activities: PassportActivityItem[];
  brandId: string;
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  return (
    <div className="bg-[#1E1E2A] rounded-lg p-6 border border-[#2A2A3A]">
      <h2 className="text-xl font-semibold text-[#E0E0E0] mb-4">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-[#A3A3A3] text-sm">No recent activity.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((item, i) => (
            <div key={i} className="flex items-start space-x-3 text-sm">
              <span className="text-[#3B82F6] mt-0.5">●</span>
              <div>
                <span className="text-[#E0E0E0]">{item.event_type}</span>
                <span className="text-[#A3A3A3] ml-2">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
