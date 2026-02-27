import React from 'react';
import type { CompanonBrand, CompanonUser, SystemHealthIndicator } from '@/types/companon';

interface CompanonHeaderProps {
  user: CompanonUser;
  brand: CompanonBrand;
  systemHealth: SystemHealthIndicator | null;
  onMenuToggle: () => void;
}

export default function CompanonHeader({ user, brand, systemHealth, onMenuToggle }: CompanonHeaderProps) {
  return (
    <header className="h-16 bg-[#1A1A1A] border-b border-[#2A2A2A] flex items-center px-6">
      <button onClick={onMenuToggle} className="text-[#E0E0E0]">
        ☰
      </button>
      <span className="ml-4 text-[#E0E0E0] font-semibold">{brand.name}</span>
    </header>
  );
}
