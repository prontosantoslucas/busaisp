'use client';

import React from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  actionButton
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle-bar" />
        <div className="sheet-header">
          <div className="sheet-title">{title}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {actionButton}
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="sheet-content">{children}</div>
      </div>
    </>
  );
}
