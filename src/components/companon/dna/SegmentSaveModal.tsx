import React, { useState } from 'react';

interface SegmentSaveModalProps {
  estimatedSize: number;
  onSave: (name: string, description?: string) => Promise<void>;
  onCancel: () => void;
}

export default function SegmentSaveModal({ estimatedSize, onSave, onCancel }: SegmentSaveModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    await onSave(name.trim(), description.trim() || undefined);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1E1E2A] border border-[#2A2A3A] rounded-xl p-8 max-w-md w-full mx-4">
        <h3 className="text-[#E0E0E0] text-xl font-bold mb-1">Save Audience Segment</h3>
        <p className="text-[#A3A3A3] text-sm mb-6">
          Estimated reach: <span className="text-[#3B82F6] font-semibold">{estimatedSize.toLocaleString()}</span>
        </p>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-[#A3A3A3] text-sm mb-1">Segment Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Engagement Denver Fans"
              className="w-full bg-[#2A2A3A] border border-[#3A3A4A] text-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6]"
            />
          </div>
          <div>
            <label className="block text-[#A3A3A3] text-sm mb-1">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#2A2A3A] border border-[#3A3A4A] text-[#E0E0E0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#3B82F6] resize-none"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="flex-1 bg-[#3B82F6] text-white py-2 rounded-lg font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#2563EB] transition-colors"
          >
            {saving ? 'Saving...' : 'Save Segment'}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-[#2A2A3A] text-[#A3A3A3] py-2 rounded-lg font-semibold hover:bg-[#333344] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
