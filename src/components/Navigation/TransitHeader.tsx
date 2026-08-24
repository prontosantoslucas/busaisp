'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Navigation,
  Settings,
  Radio,
  Map as MapIcon,
  Layers
} from 'lucide-react';

interface TransitHeaderProps {
  isVoiceMuted: boolean;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  hasGps: boolean;
  activeVehiclesCount?: number;
  onToggleMap?: () => void;
  isMapFullscreen?: boolean;
}

export default function TransitHeader({
  isVoiceMuted,
  onToggleVoice,
  onOpenSettings,
  hasGps,
  activeVehiclesCount = 0,
  onToggleMap,
  isMapFullscreen = false
}: TransitHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(13, 17, 23, 0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '18px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        width: '100%'
      }}
    >
      {/* Logo & Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '34px',
            height: '34px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(6, 182, 212, 0.4)',
            flexShrink: 0
          }}
        >
          <Navigation size={18} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15.5px', fontWeight: 900, letterSpacing: '-0.3px', color: '#FFFFFF' }}>
              BusaÍ<span style={{ color: '#06B6D4' }}>SP</span>
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                background: 'rgba(6, 182, 212, 0.18)',
                color: '#38BDF8',
                padding: '1px 6px',
                borderRadius: '4px',
                border: '1px solid rgba(6, 182, 212, 0.35)'
              }}
            >
              PRO
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#CBD5E1' }}>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: hasGps ? '#10B981' : '#F59E0B',
                boxShadow: hasGps ? '0 0 6px #10B981' : 'none'
              }}
            />
            <span>{hasGps ? 'GPS Ativo' : 'Buscando GPS...'}</span>
            {activeVehiclesCount > 0 && (
              <>
                <span style={{ color: '#64748B' }}>•</span>
                <span style={{ color: '#34D399', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Radio size={10} /> {activeVehiclesCount} ônibus
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas: Mapa, Voz e Configurações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onToggleMap && (
          <button
            onClick={onToggleMap}
            title={isMapFullscreen ? 'Ver painel de navegação' : 'Ver mapa em tela cheia'}
            style={{
              background: isMapFullscreen ? 'rgba(6, 182, 212, 0.25)' : 'rgba(255, 255, 255, 0.06)',
              border: isMapFullscreen ? '1px solid #06B6D4' : '1px solid rgba(255, 255, 255, 0.12)',
              color: isMapFullscreen ? '#38BDF8' : '#CBD5E1',
              borderRadius: '10px',
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MapIcon size={14} />
            <span>{isMapFullscreen ? 'Painel' : 'Mapa'}</span>
          </button>
        )}

        <button
          onClick={onToggleVoice}
          title={isVoiceMuted ? 'Ativar avisos de voz' : 'Desativar avisos de voz'}
          style={{
            background: isVoiceMuted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.18)',
            border: isVoiceMuted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(16, 185, 129, 0.45)',
            color: isVoiceMuted ? '#94A3B8' : '#34D399',
            borderRadius: '10px',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isVoiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          <span style={{ display: 'inline-block' }}>{isVoiceMuted ? 'Mudo' : 'Voz'}</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Configurações"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#CBD5E1',
            borderRadius: '10px',
            padding: '7px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
