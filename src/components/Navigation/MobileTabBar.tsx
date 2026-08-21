'use client';

import React from 'react';
import { Map, Navigation, Clock, TrainTrack, Star } from 'lucide-react';

export type ActiveTabType = 'MAPA' | 'ROTAS' | 'PREVISOES' | 'TRILHOS' | 'FAVORITOS';

interface MobileTabBarProps {
  activeTab: ActiveTabType;
  onChangeTab: (tab: ActiveTabType) => void;
  onOpenSearch: () => void;
}

export default function MobileTabBar({
  activeTab,
  onChangeTab,
  onOpenSearch
}: MobileTabBarProps) {
  const tabs = [
    { id: 'MAPA', label: 'Ao Vivo', icon: Map },
    { id: 'ROTAS', label: 'Rotas', icon: Navigation },
    { id: 'PREVISOES', label: 'Previsões', icon: Clock },
    { id: 'TRILHOS', label: 'Trilhos', icon: TrainTrack },
    { id: 'FAVORITOS', label: 'Favoritos', icon: Star }
  ];

  return (
    <nav className="mobile-tab-bar" aria-label="Navegação Principal">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id as ActiveTabType)}
            className={`tab-btn ${isActive ? 'active' : ''}`}
            aria-label={tab.label}
          >
            <div className="tab-icon-wrapper">
              <Icon size={19} />
            </div>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
