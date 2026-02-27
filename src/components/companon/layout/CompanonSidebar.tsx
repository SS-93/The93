import React from 'react';

interface CompanonSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPath: string;
  userRole: string;
  brandLogo?: string | null;
}

export default function CompanonSidebar({ isOpen, onToggle, currentPath, userRole, brandLogo }: CompanonSidebarProps) {
  return (
    <aside className={`fixed left-0 top-0 h-full bg-[#1A1A1A] border-r border-[#2A2A2A] transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4">
        {brandLogo && <img src={brandLogo} alt="Brand logo" className="h-8" />}
      </div>
    </aside>
  );
}
