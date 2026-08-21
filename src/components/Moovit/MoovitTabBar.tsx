'use client';

import React from 'react';
import { ArrowLeftRight, MapPin, GitCommitHorizontal, CreditCard, Star } from 'lucide-react';

export type MoovitTabType = 'DIRECOES' | 'ESTACOES' | 'LINHAS' | 'PASSAGENS' | 'FAVORITOS';

interface MoovitTabBarProps {
  activeTab: MoovitTabType;
  onChangeTab: (tab: MoovitTabType) => void;
  favoritesCount?: number;
}

export default function MoovitTabBar({
  activeTab,
  onChangeTab,
  favoritesCount = 0
}: MoovitTabBarProps) {
  const tabs = [
    {
      id: 'DIRECOES' as MoovitTabType,
      label: 'Direções',
      icon: <ArrowLeftRight size={20} />
    },
    {
      id: 'ESTACOES' as MoovitTabType,
      label: 'Estações',
      icon: <MapPin size={20} />
    },
    {
      id: 'LINHAS' as MoovitTabType,
      label: 'Linhas',
      icon: <GitCommitHorizontal size={20} />
    },
    {
      id: 'PASSAGENS' as MoovitTabType,
      label: 'Passagens',
      icon: <CreditCard size={20} />
    },
    {
      id: 'FAVORITOS' as MoovitTabType,
      label: 'Favoritos',
      icon: <Star size={20} />,
      badge: favoritesCount > 0 ? String(favoritesCount) : undefined
    }
  ];

  return (
    <nav
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: '#121316',
        borderTop: '1px solid #2D313C',
        padding: '6px 12px max(8px, var(--safe-bottom)) 12px',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.6)'
      }}
      aria-label="Navegação Principal Moovit"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            style={{
              flex: 1,
              maxWidth: '75px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '3px',
              padding: '6px 0',
              background: 'none',
              border: 'none',
              color: isActive ? '#38BDF8' : '#6B7280',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tab.icon}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-8px',
                    background: '#E30613',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '9999px'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span style={{ fontSize: '11px', fontWeight: isActive ? 700 : 500 }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
