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
        background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.96) 0%, rgba(22, 27, 34, 0.94) 100%)',
        border: '1px solid rgba(6, 182, 212, 0.35)',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(6, 182, 212, 0.2)',
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
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 12px rgba(6, 182, 212, 0.5)',
              overflow: 'hidden'
            }}
          >
            <Smartphone size={22} color="#FFFFFF" />
          </div>

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.2px' }}>
                Instalar BusaÍ SP
              </span>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  background: 'rgba(6, 182, 212, 0.2)',
                  color: '#38BDF8',
                  padding: '1px 5px',
                  borderRadius: '4px',
                  border: '1px solid rgba(6, 182, 212, 0.4)'
                }}
              >
                APP PWA
              </span>
            </div>
            <div
              style={{
                fontSize: '11px',
                color: '#94A3B8',
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
              fontWeight: 800,
              borderRadius: '10px',
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
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#94A3B8',
              borderRadius: '8px',
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
            background: 'rgba(15, 23, 42, 0.9)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '10px 12px',
            fontSize: '11.5px',
            color: '#E2E8F0',
            lineHeight: 1.5,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38BDF8', fontWeight: 700 }}>
            <Sparkles size={13} />
            <span>Como instalar no iPhone / iPad:</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38BDF8',
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
                background: 'rgba(6, 182, 212, 0.2)',
                color: '#38BDF8',
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
