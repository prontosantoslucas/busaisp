'use client';

import React from 'react';
import {
  Volume2,
  VolumeX,
  Navigation,
  Settings,
  Radio
} from 'lucide-react';

interface TransitHeaderProps {
  isVoiceMuted: boolean;
  onToggleVoice: () => void;
  onOpenSettings: () => void;
  hasGps: boolean;
  activeVehiclesCount?: number;
}

export default function TransitHeader({
  isVoiceMuted,
  onToggleVoice,
  onOpenSettings,
  hasGps,
  activeVehiclesCount = 0
}: TransitHeaderProps) {
  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        background: 'rgba(13, 17, 23, 0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        width: '100%'
      }}
    >
      {/* Logo & Marca */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px rgba(6, 182, 212, 0.4)'
          }}
        >
          <Navigation size={18} color="#FFFFFF" />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '15px', fontWeight: 900, letterSpacing: '-0.3px', color: '#F8FAFC' }}>
              BusaÍ<span style={{ color: '#06B6D4' }}>SP</span>
            </span>
            <span
              style={{
                fontSize: '9.5px',
                fontWeight: 800,
                background: 'rgba(6, 182, 212, 0.15)',
                color: '#38BDF8',
                padding: '1px 5px',
                borderRadius: '4px',
                border: '1px solid rgba(6, 182, 212, 0.3)'
              }}
            >
              PRO
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#94A3B8' }}>
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
                <span style={{ color: '#475569' }}>•</span>
                <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Radio size={10} /> {activeVehiclesCount} ônibus
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ações Rápidas: Toggle de Voz e Configurações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={onToggleVoice}
          title={isVoiceMuted ? 'Ativar avisos de voz' : 'Desativar avisos de voz'}
          style={{
            background: isVoiceMuted ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.15)',
            border: isVoiceMuted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(16, 185, 129, 0.4)',
            color: isVoiceMuted ? '#94A3B8' : '#34D399',
            borderRadius: '10px',
            padding: '7px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {isVoiceMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          <span style={{ display: 'inline-block' }}>{isVoiceMuted ? 'Mudo' : 'Voz'}</span>
        </button>

        <button
          onClick={onOpenSettings}
          title="Configurar Chave SPTrans"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94A3B8',
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
