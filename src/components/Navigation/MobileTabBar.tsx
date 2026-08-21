'use client';

import React from 'react';
import { Route, Bus, Train, Star } from 'lucide-react';

export type TabType = 'ROTAS' | 'ITINERARIOS' | 'TRILHOS' | 'FAVORITOS';
export type ActiveTabType = TabType;

export interface MobileTabBarProps {
  activeTab: TabType;
  onTabChange?: (tab: TabType) => void;
  onChangeTab?: (tab: TabType) => void;
  onOpenSearch?: () => void;
  favoritesCount?: number;
}

export default function MobileTabBar({
  activeTab,
  onTabChange,
  onChangeTab,
  favoritesCount = 0
}: MobileTabBarProps) {
  const handleSelect = (tab: TabType) => {
    if (onTabChange) onTabChange(tab);
    if (onChangeTab) onChangeTab(tab);
  };

  const tabs = [
    {
      id: 'ROTAS' as TabType,
      label: 'Rotas',
      icon: <Route size={20} />
    },
    {
      id: 'ITINERARIOS' as TabType,
      label: 'Linhas & Itinerários',
      icon: <Bus size={20} />
    },
    {
      id: 'TRILHOS' as TabType,
      label: 'Metrô & CPTM',
      icon: <Train size={20} />
    },
    {
      id: 'FAVORITOS' as TabType,
      label: 'Favoritos',
      icon: <Star size={20} />,
      badge: favoritesCount > 0 ? String(favoritesCount) : undefined
    }
  ];

  return (
    <nav className="mobile-tab-bar" aria-label="Navegação Principal">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => handleSelect(tab.id)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {tab.icon}
              {tab.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    background: 'var(--accent-sptrans)',
                    color: '#fff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '9999px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.5)'
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
