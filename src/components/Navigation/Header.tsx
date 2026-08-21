'use client';

import React from 'react';
import { Bus, Settings, Sparkles, Download, Wifi } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  isMockMode?: boolean;
}

export default function Header({ onOpenSettings, isMockMode }: HeaderProps) {
  return (
    <header className="app-header">
      {/* Logotipo BusaÍ SP */}
      <div className="header-brand">
        <div className="logo-badge">SP</div>
        <div className="brand-title">
          <span>BusaÍ</span>
          <span style={{ color: 'var(--accent-sptrans)' }}>SP</span>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="header-actions">
        {/* Status da Conexão */}
        <button
          onClick={onOpenSettings}
          className="glass-pill"
          style={{
            padding: '6px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 700,
            color: isMockMode ? '#FBBF24' : '#34D399',
            cursor: 'pointer'
          }}
          title="Status da API"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: isMockMode ? '#F59E0B' : '#10B981',
              boxShadow: isMockMode
                ? '0 0 8px rgba(245, 158, 11, 0.6)'
                : '0 0 8px rgba(16, 185, 129, 0.6)'
            }}
          />
          <span>{isMockMode ? 'SIMULADOR' : 'AO VIVO'}</span>
        </button>

        {/* Botão de Configurações */}
        <button
          onClick={onOpenSettings}
          className="btn-icon"
          title="Configurações & Token"
          aria-label="Ajustes e Token"
        >
          <Settings size={18} />
        </button>
      </div>
    </header>
  );
}
