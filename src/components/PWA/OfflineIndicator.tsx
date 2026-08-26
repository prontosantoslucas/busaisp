'use client';

import React, { useEffect, useState } from 'react';
import { usePWA } from './PWAProvider';
import { WifiOff, Wifi, CheckCircle2 } from 'lucide-react';

export default function OfflineIndicator() {
  const { isOffline } = usePWA();
  const [showRestored, setShowRestored] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (isOffline) {
      setWasOffline(true);
    } else if (wasOffline) {
      setShowRestored(true);
      const timer = setTimeout(() => {
        setShowRestored(false);
        setWasOffline(false);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOffline, wasOffline]);

  if (!isOffline && !showRestored) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 'max(14px, env(safe-area-inset-top, 14px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 10001,
        padding: '6px 14px',
        borderRadius: 'var(--bus-radius-full)',
        background: isOffline ? 'var(--bus-red)' : 'var(--bus-emerald)',
        color: '#FFFFFF',
        boxShadow: 'var(--bus-shadow-card)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '-0.2px',
        animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '90vw',
        whiteSpace: 'nowrap',
        pointerEvents: 'none'
      }}
    >
      {isOffline ? (
        <>
          <WifiOff size={14} />
          <span>Modo Offline · Exibindo dados locais</span>
        </>
      ) : (
        <>
          <CheckCircle2 size={14} />
          <span>Conexão restabelecida!</span>
        </>
      )}
    </div>
  );
}
