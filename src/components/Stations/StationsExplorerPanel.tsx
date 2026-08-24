'use client';

import React, { useState, useEffect } from 'react';
import { StationItem, SP_ALL_STATIONS } from '@/lib/stationsData';
import { RailsResponse, RailLine } from '@/types/trilhos';
import {
  MapPin,
  Search,
  TrainTrack,
  Bus,
  Navigation,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
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
  const [subView, setSubView] = useState<'ESTACOES' | 'STATUS'>('STATUS');
  const [filterType, setFilterType] = useState<'ALL' | 'METRO' | 'CPTM' | 'TERMINAL_BUS'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Status dos Trilhos Real
  const [railsData, setRailsData] = useState<RailsResponse | null>(null);
  const [isLoadingRails, setIsLoadingRails] = useState(true);
  const [selectedRailFilter, setSelectedRailFilter] = useState<string>('TODAS');
  const [selectedLineDetail, setSelectedLineDetail] = useState<RailLine | null>(null);

  const fetchRails = async () => {
    setIsLoadingRails(true);
    try {
      const res = await fetch('/api/trilhos/status');
      const json = await res.json();
      if (json.success && json.data) {
        setRailsData(json.data);
      }
    } catch (e) {
      console.error('Erro ao buscar status dos trilhos:', e);
    } finally {
      setIsLoadingRails(false);
    }
  };

  useEffect(() => {
    fetchRails();
    const interval = setInterval(fetchRails, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            <span>Normal</span>
          </span>
        );
      case 'VELOCIDADE_REDUZIDA':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <AlertTriangle size={13} />
            <span>Velocidade Reduzida</span>
          </span>
        );
      case 'OPERACAO_PARCIAL':
      case 'PARALISADA':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <XCircle size={13} />
            <span>Paralisada / Parcial</span>
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            <span>{status}</span>
          </span>
        );
    }
  };

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

  const railLines = railsData?.lines || [];
  const filteredRailLines = railLines.filter((l) => {
    if (selectedRailFilter === 'TODAS') return true;
    if (selectedRailFilter === 'METRO') return l.operator === 'METRO';
    if (selectedRailFilter === 'CPTM') return l.operator === 'CPTM';
    if (selectedRailFilter === 'CONCESSIONARIAS') return l.operator === 'VIAQUATRO' || l.operator === 'VIAMOBILIDADE';
    return true;
  });

  const stationFilterOptions = [
    { id: 'ALL', label: 'Todas as Estações', icon: Layers },
    { id: 'METRO', label: 'Metrô SP', icon: TrainTrack },
    { id: 'CPTM', label: 'Trens CPTM', icon: TrainTrack },
    { id: 'TERMINAL_BUS', label: 'Terminais SPTrans', icon: Bus }
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Toggle: Status da Operação vs Estações no Mapa */}
      <div className="bus-glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #6366F1 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              <TrainTrack size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                Estações & Trilhos SP
              </h2>
              <p style={{ fontSize: '11px', color: '#94A3B8', margin: 0 }}>
                Metrô · CPTM · ViaMobilidade · Terminais
              </p>
            </div>
          </div>

          <button
            onClick={fetchRails}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38BDF8',
              cursor: 'pointer'
            }}
            title="Atualizar Status dos Serviços"
          >
            <RefreshCw size={15} className={isLoadingRails ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Abas Alternadoras Superiores */}
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0, 0, 0, 0.3)', padding: '4px', borderRadius: '12px' }}>
          <button
            onClick={() => setSubView('STATUS')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: subView === 'STATUS' ? 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' : 'transparent',
              color: subView === 'STATUS' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: subView === 'STATUS' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
            }}
          >
            <TrainTrack size={15} />
            <span>Status das Linhas</span>
          </button>

          <button
            onClick={() => setSubView('ESTACOES')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '8px',
              border: 'none',
              background: subView === 'ESTACOES' ? 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)' : 'transparent',
              color: subView === 'ESTACOES' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 800,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              boxShadow: subView === 'ESTACOES' ? '0 4px 12px rgba(6, 182, 212, 0.3)' : 'none'
            }}
          >
            <MapPin size={15} />
            <span>Estações no Mapa</span>
          </button>
        </div>
      </div>

      {/* ================= VISTA 1: STATUS DAS LINHAS (METRÔ / CPTM) ================= */}
      {subView === 'STATUS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Card Resumo de Operação */}
          {railsData && (
            <div
              className="bus-glass-panel"
              style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}
            >
              <div style={{ color: '#CBD5E1' }}>
                Rede: <strong style={{ color: '#F8FAFC' }}>{railsData.summary.total} Linhas Ativas</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981', fontWeight: 700 }}>
                  <CheckCircle2 size={14} />
                  <span>{railsData.summary.normal} normais</span>
                </div>
                {railsData.summary.withIssues > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B', fontWeight: 700 }}>
                    <AlertTriangle size={14} />
                    <span>{railsData.summary.withIssues} lentas</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Filtros de Operadora */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {[
              { id: 'TODAS', label: 'Todas' },
              { id: 'METRO', label: 'Metrô SP' },
              { id: 'CPTM', label: 'CPTM' },
              { id: 'CONCESSIONARIAS', label: 'ViaQuatro / Mobilidade' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedRailFilter(f.id)}
                className={`bus-pill ${selectedRailFilter === f.id ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '5px 12px' }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Linhas com Status Oficial */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredRailLines.map((line) => {
              const isSelected = selectedLineDetail?.id === line.id;

              return (
                <div
                  key={line.id}
                  onClick={() => setSelectedLineDetail(isSelected ? null : line)}
                  className="bus-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    borderLeft: `4px solid ${line.hexColor}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          background: line.hexColor,
                          color: line.hexColor === '#FFF000' || line.hexColor === '#A7A8AA' ? '#111' : '#fff',
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          fontWeight: 900,
                          fontSize: '12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {line.number}
                      </div>

                      <div>
                        <div style={{ fontWeight: 800, fontSize: '14px', color: '#F8FAFC' }}>
                          {line.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                          {line.operator} · {line.updatedAt}
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(line.status)}</div>
                  </div>

                  {(isSelected || line.status !== 'NORMAL') && line.description && (
                    <div
                      style={{
                        fontSize: '12px',
                        color: line.status === 'NORMAL' ? '#94A3B8' : '#FDE68A',
                        background: line.status === 'NORMAL' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(245, 158, 11, 0.15)',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        marginTop: '4px',
                        lineHeight: 1.4
                      }}
                    >
                      {line.description}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= VISTA 2: ESTAÇÕES E ENDEREÇOS NO MAPA ================= */}
      {subView === 'ESTACOES' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Input de Busca de Estações */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={16} color="#06B6D4" style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por estação, linha ou bairro..."
              className="bus-input"
              style={{ paddingLeft: '36px', height: '42px', fontSize: '13px' }}
            />
          </div>

          {/* Filtros em Pílulas com Ícones SVG */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {stationFilterOptions.map((f) => {
              const Icon = f.icon;
              const isActive = filterType === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilterType(f.id as any)}
                  className={`bus-pill ${isActive ? 'active' : ''}`}
                  style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Icon size={13} color={isActive ? '#38BDF8' : '#94A3B8'} />
                  <span>{f.label}</span>
                </button>
              );
            })}
          </div>

          {/* Lista de Estações e Endereços */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredStations.map((station) => {
              const isSelected = selectedStationId === station.id;

              return (
                <div
                  key={station.id}
                  onClick={() => onSelectStation(station)}
                  className={`bus-card ${isSelected ? 'active' : ''}`}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
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
                              : '#06B6D4',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff'
                        }}
                      >
                        {station.type === 'TERMINAL_BUS' ? <Bus size={16} /> : <TrainTrack size={16} />}
                      </div>

                      <div>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', margin: 0 }}>
                          {station.name}
                        </h3>
                        <div style={{ fontSize: '11px', color: '#06B6D4', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
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
                      className="bus-btn-primary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '11px',
                        borderRadius: '8px'
                      }}
                      title="Traçar Rota"
                    >
                      <Navigation size={12} />
                      <span>Traçar Rota</span>
                    </button>
                  </div>

                  {/* Bairro & Linhas Atendidas */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '8px', marginTop: '2px' }}>
                    <span style={{ fontSize: '11px', color: '#94A3B8' }}>
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
      )}
    </div>
  );
}
