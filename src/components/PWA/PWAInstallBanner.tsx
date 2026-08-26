'use client';

import React, { useState } from 'react';
import { usePWA } from './PWAProvider';
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import Image from 'next/image';

export default function PWAInstallBanner() {
  const { showBanner, isInstalled, isIOS, isInstallable, installApp, dismissBanner } = usePWA();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  if (!showBanner || isInstalled) {
    return null;
  }

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSInstructions(!showIOSInstructions);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      await installApp();
      setIsInstalling(false);
    }
  };

  return (
    <aside
      aria-label="Instalar aplicativo"
      className="bus-glass-panel"
      style={{
        position: 'fixed',
        top: 'max(12px, env(safe-area-inset-top, 12px))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 24px)',
        maxWidth: '440px',
        zIndex: 10000,
        padding: '12px 14px',
        background: 'var(--bus-surface)',
        border: '1px solid var(--bus-border-highlight)',
        boxShadow: 'var(--bus-shadow-dock)',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        {/* App Icon + Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--bus-radius-sm)',
              background: 'var(--bus-violet-ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              overflow: 'hidden'
            }}
          >
            <Smartphone size={20} color="#FFFFFF" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="bus-display" style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bus-text-primary)', letterSpacing: '-0.2px' }}>
                Instalar BusaÍ SP
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  background: 'var(--bus-violet-soft)',
                  color: 'var(--bus-violet)',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid var(--bus-border-highlight)'
                }}
              >
                PWA
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: 'var(--bus-text-secondary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
            >
              Acesso em tela cheia & modo offline
            </div>
          </div>
        </div>

        {/* Action Button & Dismiss */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="bus-btn-primary"
            style={{
              padding: '7px 12px',
              fontSize: '12px',
              fontWeight: 700,
              borderRadius: 'var(--bus-radius-sm)',
              gap: '5px'
            }}
          >
            {isIOS ? (
              <>
                <Share size={13} />
                <span>Instalar</span>
                {showIOSInstructions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </>
            ) : (
              <>
                <Download size={13} />
                <span>{isInstalling ? 'Instalando...' : 'Instalar'}</span>
              </>
            )}
          </button>

          <button
            onClick={dismissBanner}
            style={{
              background: 'var(--bus-surface-elevated)',
              border: '1px solid var(--bus-border)',
              color: 'var(--bus-text-secondary)',
              borderRadius: 'var(--bus-radius-sm)',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Fechar banner"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* iOS Step-by-Step Installation Guide */}
      {isIOS && showIOSInstructions && (
        <div
          style={{
            background: 'var(--bus-surface-sunken)',
            border: '1px solid var(--bus-border)',
            borderRadius: 'var(--bus-radius-md)',
            padding: '10px 12px',
            fontSize: '11.5px',
            color: 'var(--bus-text-primary)',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--bus-violet)', fontWeight: 700 }}>
            <Sparkles size={13} />
            <span>Como instalar no iPhone / iPad:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--bus-violet-soft)',
                color: 'var(--bus-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              1
            </span>
            <span>
              Toque no botão de <strong>Compartilhar</strong> (<Share size={12} style={{ display: 'inline' }} />) na
              barra do Safari.
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'var(--bus-violet-soft)',
                color: 'var(--bus-violet)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: 800,
                flexShrink: 0
              }}
            >
              2
            </span>
            <span>
              Role para baixo e selecione <strong>Adicionar à Tela de Início</strong> (
              <PlusSquare size={12} style={{ display: 'inline' }} />
              ).
            </span>
          </div>
        </div>
      )}
    </aside>
  );
}
