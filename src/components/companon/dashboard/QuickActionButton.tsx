import React from 'react';

interface QuickActionButtonProps {
  label: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export default function QuickActionButton({ label, description, icon, onClick }: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start p-4 bg-[#16161E] border border-[#2A2A3A] rounded-lg hover:border-[#3B82F6] transition-colors text-left w-full"
    >
      <span className="text-2xl mb-2">{icon}</span>
      <span className="text-[#E0E0E0] font-semibold">{label}</span>
      <span className="text-[#A3A3A3] text-sm mt-1">{description}</span>
    </button>
  );
}
