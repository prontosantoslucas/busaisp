'use client';

import React from 'react';
import {
  Compass,
  Bus,
  TrainTrack,
  Star,
  Newspaper
} from 'lucide-react';

export type TransitTabType = 'ROTAS' | 'LINHAS' | 'NOTICIAS' | 'TRILHOS' | 'FAVORITOS';

interface TransitDockProps {
  activeTab: TransitTabType;
  onChangeTab: (tab: TransitTabType) => void;
  favoritesCount?: number;
  incidentsCount?: number;
}

export default function TransitDock({
  activeTab,
  onChangeTab,
  favoritesCount = 0,
  incidentsCount = 0
}: TransitDockProps) {
  const tabs = [
    {
      id: 'ROTAS' as TransitTabType,
      label: 'Rotas',
      icon: Compass
    },
    {
      id: 'LINHAS' as TransitTabType,
      label: 'Linhas',
      icon: Bus
    },
    {
      id: 'NOTICIAS' as TransitTabType,
      label: 'Notícias',
      icon: Newspaper,
      badge: incidentsCount > 0 ? incidentsCount : null
    },
    {
      id: 'TRILHOS' as TransitTabType,
      label: 'Estações',
      icon: TrainTrack
    },
    {
      id: 'FAVORITOS' as TransitTabType,
      label: 'Favoritos',
      icon: Star,
      badge: favoritesCount > 0 ? favoritesCount : null
    }
  ];

  return (
    <nav
      aria-label="Navegação principal"
      className="transit-bottom-dock"
      style={{
        position: 'fixed',
        bottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 24px)',
        maxWidth: '460px',
        padding: '6px 8px',
        borderRadius: 'var(--bus-radius-lg)',
        background: 'var(--bus-surface-elevated)',
        border: '1px solid var(--bus-border)',
        boxShadow: 'var(--bus-shadow-dock)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 2px',
              minHeight: '48px',
              background: isActive ? 'var(--bus-violet-soft)' : 'transparent',
              border: '1px solid transparent',
              borderRadius: 'var(--bus-radius-md)',
              color: isActive ? 'var(--bus-violet)' : 'var(--bus-text-secondary)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, color 0.15s ease',
              outline: 'none',
              touchAction: 'manipulation',
              fontFamily: 'var(--font-body)'
            }}
          >
            {/* Indicador Ativo no Topo do Botão */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  width: '18px',
                  height: '3px',
                  borderRadius: '2px',
                  background: 'var(--bus-violet)'
                }}
              />
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                size={21}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? 'var(--bus-violet)' : 'var(--bus-text-secondary)'}
              />

              {/* Badge de Contagem */}
              {tab.badge && (
                <span
                  className="bus-num"
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: 'var(--bus-live)',
                    color: 'var(--bus-text-on-accent)',
                    fontSize: '10px',
                    fontWeight: 700,
                    width: '17px',
                    height: '17px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--bus-surface-elevated)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11.5px',
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '-0.1px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
