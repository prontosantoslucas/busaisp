'use client';

import React, { useState } from 'react';
import { StationItem, SP_ALL_STATIONS } from '@/lib/stationsData';
import {
  MapPin,
  Search,
  TrainTrack,
  Bus,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';

interface StationsExplorerPanelProps {
  onSelectStation: (station: StationItem) => void;
  onRouteToStation: (station: StationItem) => void;
  selectedStationId?: string | null;
}

export default function StationsExplorerPanel({
  onSelectStation,
  onRouteToStation,
  selectedStationId
}: StationsExplorerPanelProps) {
  const [filterType, setFilterType] = useState<'ALL' | 'METRO' | 'CPTM' | 'TERMINAL_BUS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStations = SP_ALL_STATIONS.filter(st => {
    if (filterType !== 'ALL' && st.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        st.name.toLowerCase().includes(q) ||
        st.address.toLowerCase().includes(q) ||
        st.neighborhood.toLowerCase().includes(q) ||
        st.lines.some(l => l.name.toLowerCase().includes(q) || l.code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Header do Painel */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #003399, #EE1D23)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0, 51, 153, 0.4)'
              }}
            >
              <TrainTrack size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Estações e Terminais (SP)
              </h2>
              <p style={{ fontSize: '11px', color: '#9CA3AF', margin: 0 }}>
                Metrô · Trem CPTM · Terminais de Ônibus
              </p>
            </div>
          </div>

          <span
            style={{
              background: '#2D313C',
              color: '#D1D5DB',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px'
            }}
          >
            {filteredStations.length} locais
          </span>
        </div>

        {/* Input de Busca de Estações */}
        <div
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}
        >
          <Search size={16} color="#9CA3AF" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome, linha ou endereço..."
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 500,
              outline: 'none',
              width: '100%'
            }}
          />
        </div>

        {/* Filtros em Pílulas */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'ALL', label: 'Todas' },
            { id: 'METRO', label: '🚇 Metrô' },
            { id: 'CPTM', label: '🚆 Trem CPTM' },
            { id: 'TERMINAL_BUS', label: '🚏 Terminais SPTrans' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as any)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: filterType === f.id ? '#FF6600' : '#2D313C',
                color: filterType === f.id ? '#FFFFFF' : '#9CA3AF',
                fontWeight: 700,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Estações e Endereços */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredStations.map((station) => {
          const isSelected = selectedStationId === station.id;

          return (
            <div
              key={station.id}
              onClick={() => onSelectStation(station)}
              style={{
                background: isSelected ? '#262932' : '#1C1E24',
                border: isSelected ? '1.5px solid #FF6600' : '1px solid #2D313C',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background:
                        station.type === 'METRO'
                          ? '#003399'
                          : station.type === 'CPTM'
                          ? '#A61327'
                          : '#E30613',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff'
                    }}
                  >
                    {station.type === 'TERMINAL_BUS' ? <Bus size={16} /> : <TrainTrack size={16} />}
                  </div>

                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {station.name}
                    </h3>
                    <div style={{ fontSize: '11px', color: '#38BDF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <MapPin size={12} />
                      <span>{station.address}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRouteToStation(station);
                  }}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '6px 10px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                  title="Traçar Rota"
                >
                  <Navigation size={12} />
                  <span>Traçar Rota</span>
                </button>
              </div>

              {/* Bairro & Linhas Atendidas */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #2D313C', paddingTop: '8px', marginTop: '2px' }}>
                <span style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {station.neighborhood}
                </span>

                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                  {station.lines.map((line, lIdx) => (
                    <span
                      key={lIdx}
                      style={{
                        background: line.color,
                        color: line.color === '#FFF000' || line.color === '#A7A8AA' ? '#000' : '#fff',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      {line.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
