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
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: 'calc(100% - 32px)',
        maxWidth: '460px',
        padding: '6px 8px',
        borderRadius: '24px',
        background: 'rgba(13, 17, 23, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(6, 182, 212, 0.15)',
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
              padding: '8px 4px',
              background: isActive
                ? 'linear-gradient(180deg, rgba(6, 182, 212, 0.18) 0%, rgba(59, 130, 246, 0.08) 100%)'
                : 'transparent',
              border: isActive ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid transparent',
              borderRadius: '16px',
              color: isActive ? '#38BDF8' : '#94A3B8',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              outline: 'none'
            }}
          >
            {/* Indicador Ativo no Topo do Botão */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  width: '16px',
                  height: '3px',
                  borderRadius: '2px',
                  background: 'linear-gradient(90deg, #06B6D4 0%, #3B82F6 100%)',
                  boxShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
                }}
              />
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? '#38BDF8' : '#94A3B8'}
              />

              {/* Badge de Contagem */}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: '#06B6D4',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 900,
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #0D1117',
                    boxShadow: '0 0 6px rgba(6, 182, 212, 0.6)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>

            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 800 : 600,
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
