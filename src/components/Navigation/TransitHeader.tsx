'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Navigation,
  Settings,
  Radio,
  Map as MapIcon,
  Sun,
  Moon
} from 'lucide-react';

interface TransitHeaderProps {
  isVoiceMuted: boolean;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  hasGps: boolean;
  gpsStatus?: 'INITIALIZING' | 'ACTIVE' | 'DENIED' | 'UNAVAILABLE';
  onRequestGps?: () => void;
  activeVehiclesCount?: number;
  onToggleMap?: () => void;
  isMapFullscreen?: boolean;
}

const actionButtonBase: React.CSSProperties = {
  border: '1px solid var(--bus-border)',
  borderRadius: 'var(--bus-radius-sm)',
  width: '34px',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  cursor: 'pointer',
  transition: 'background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease'
};

export default function TransitHeader({
  isVoiceMuted,
  onToggleVoice,
  onOpenSettings,
  hasGps,
  gpsStatus = hasGps ? 'ACTIVE' : 'INITIALIZING',
  onRequestGps,
  activeVehiclesCount = 0,
  onToggleMap,
  isMapFullscreen = false
}: TransitHeaderProps) {
  const getGpsLabel = () => {
    if (gpsStatus === 'ACTIVE' || hasGps) return 'GPS Ativo';
    if (gpsStatus === 'DENIED') return 'GPS Desativado (toque p/ ativar)';
    return 'Buscando GPS...';
  };

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'var(--bus-surface)',
        border: '1px solid var(--bus-border)',
        borderRadius: 'var(--bus-radius-lg)',
        boxShadow: 'var(--bus-shadow-card)',
        width: '100%'
      }}
    >
      {/* Logo & Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, overflow: 'hidden' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: 'var(--bus-radius-sm)',
            background: 'var(--bus-violet-ink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          <Navigation size={18} color="#FFFFFF" />
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="bus-display" style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.2px', color: 'var(--bus-text-primary)' }}>
              BusaÍ<span style={{ color: 'var(--bus-violet)' }}>SP</span>
            </span>
          </div>
          <div
            onClick={onRequestGps}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              color: 'var(--bus-text-secondary)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              cursor: onRequestGps ? 'pointer' : 'default'
            }}
            title="Status do GPS — Toque para atualizar localização"
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: hasGps ? 'var(--bus-emerald)' : 'var(--bus-live)',
                flexShrink: 0,
                boxShadow: hasGps ? '0 0 6px rgba(61, 220, 151, 0.6)' : 'none',
                animation: !hasGps ? 'radarPulse 1.5s infinite' : 'none'
              }}
            />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{getGpsLabel()}</span>
            {activeVehiclesCount > 0 && (
              <>
                <span style={{ color: 'var(--bus-text-dim)', flexShrink: 0 }}>•</span>
                <span className="bus-num" style={{ color: 'var(--bus-live)', display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0 }}>
                  <Radio size={10} /> {activeVehiclesCount}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas: Mapa, Voz e Configurações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {onToggleMap && (
          <button
            onClick={onToggleMap}
            title={isMapFullscreen ? 'Ver painel de navegação' : 'Ver mapa em tela cheia'}
            style={{
              ...actionButtonBase,
              background: isMapFullscreen ? 'var(--bus-violet-soft)' : 'var(--bus-surface-elevated)',
              borderColor: isMapFullscreen ? 'var(--bus-violet)' : 'var(--bus-border)',
              color: isMapFullscreen ? 'var(--bus-violet)' : 'var(--bus-text-secondary)'
            }}
          >
            <MapIcon size={16} />
          </button>
        )}

        <button
          onClick={onToggleVoice}
          title={isVoiceMuted ? 'Ativar avisos de voz' : 'Desativar avisos de voz'}
          style={{
            ...actionButtonBase,
            background: isVoiceMuted ? 'var(--bus-surface-elevated)' : 'var(--bus-emerald-soft)',
            borderColor: isVoiceMuted ? 'var(--bus-border)' : 'var(--bus-emerald)',
            color: isVoiceMuted ? 'var(--bus-text-secondary)' : 'var(--bus-emerald)'
          }}
        >
          {isVoiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button
          onClick={onOpenSettings}
          title="Configurações"
          style={{
            ...actionButtonBase,
            background: 'var(--bus-surface-elevated)',
            color: 'var(--bus-text-secondary)'
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
