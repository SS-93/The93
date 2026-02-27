import React from 'react';

interface MetricCardProps {
  title: string;
  value: number;
  icon?: string;
  trend?: { value: number; isPositive: boolean };
  format?: 'number' | 'percentage';
}

function formatValue(value: number, format?: 'number' | 'percentage'): string {
  if (format === 'percentage') return `${value.toFixed(1)}%`;
  if (format === 'number') return value.toLocaleString();
  return String(value);
}

export default function MetricCard({ title, value, icon, trend, format }: MetricCardProps) {
  return (
    <div className="bg-[#1E1E2A] rounded-lg p-6 border border-[#2A2A3A]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[#A3A3A3] text-sm font-medium">{title}</span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-[#E0E0E0]">{formatValue(value, format)}</div>
      {trend && (
        <div className={`text-sm mt-1 ${trend.isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {trend.isPositive ? '↑' : '↓'} {trend.value}%
        </div>
      )}
    </div>
  );
}
