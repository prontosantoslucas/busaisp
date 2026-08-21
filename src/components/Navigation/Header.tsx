'use client';

import React from 'react';
import { Bus, Settings, Sparkles, Download, Wifi } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  isMockMode?: boolean;
}

export default function Header({ onOpenSettings }: HeaderProps) {
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
        {/* Status da Conexão em Produção */}
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
            color: '#34D399',
            cursor: 'pointer'
          }}
          title="Status da API SPTrans"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
            }}
          />
          <span>AO VIVO · SPTRANS</span>
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
