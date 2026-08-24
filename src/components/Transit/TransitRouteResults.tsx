'use client';

import React, { useState } from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  ArrowLeft,
  ArrowUpDown,
  MapPin,
  Clock,
  Footprints,
  Bus,
  ChevronRight,
  Sparkles,
  Map as MapIcon,
  Zap,
  ArrowLeftRight,
  Radio,
  SlidersHorizontal
} from 'lucide-react';

interface TransitRouteResultsProps {
  origem: string;
  destino: string;
  onOrigemChange: (val: string) => void;
  onDestinoChange: (val: string) => void;
  onSwap: () => void;
  onBack: () => void;
  onToggleMap: () => void;
  isMapVisible: boolean;
  routes: RoutePlan[];
  selectedRouteIndex: number;
  onSelectRoute: (index: number) => void;
  onCalculate: () => void;
  isCalculating: boolean;
  searchError?: string | null;
  scheduledTime?: string;
  onScheduledTimeChange?: (time: string) => void;
}

export default function TransitRouteResults({
  origem,
  destino,
  onOrigemChange,
  onDestinoChange,
  onSwap,
  onBack,
  onToggleMap,
  isMapVisible,
  routes,
  selectedRouteIndex,
  onSelectRoute,
  onCalculate,
  isCalculating,
  searchError,
  scheduledTime = '',
  onScheduledTimeChange
}: TransitRouteResultsProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'FASTEST' | 'LESS_WALK' | 'LESS_TRANSFERS'>('ALL');
  const isScheduled = scheduledTime.length > 0;

  // Aplicar filtros
  const filteredRoutes = [...routes].sort((a, b) => {
    if (filterMode === 'FASTEST') {
      return a.totalDurationMinutes - b.totalDurationMinutes;
    }
    if (filterMode === 'LESS_WALK') {
      return a.totalWalkDurationMinutes - b.totalWalkDurationMinutes;
    }
    if (filterMode === 'LESS_TRANSFERS') {
      return a.steps.length - b.steps.length;
    }
    return 0;
  });

  const filterOptions = [
    { id: 'ALL', label: 'Todas as Rotas', icon: SlidersHorizontal },
    { id: 'FASTEST', label: 'Mais Rápida', icon: Zap },
    { id: 'LESS_WALK', label: 'Menos Caminhada', icon: Footprints },
    { id: 'LESS_TRANSFERS', label: 'Menos Trocas', icon: ArrowLeftRight }
  ];

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. CABEÇALHO COM ORIGEM E DESTINO */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} color="#06B6D4" />
            <span>Voltar ao Início</span>
          </button>

          <button
            onClick={onToggleMap}
            className="bus-pill"
            style={{
              padding: '4px 10px',
              fontSize: '11.5px',
              background: isMapVisible ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.06)',
              borderColor: isMapVisible ? '#06B6D4' : 'rgba(255, 255, 255, 0.1)',
              color: isMapVisible ? '#38BDF8' : '#94A3B8'
            }}
          >
            <MapIcon size={14} />
            <span>{isMapVisible ? 'Ocultar Mapa' : 'Ver no Mapa'}</span>
          </button>
        </div>

        {/* Inputs de Origem e Destino */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="bus-input"
                value={origem}
                onChange={(e) => onOrigemChange(e.target.value)}
                placeholder="Origem (ex: Minha Localização)"
                style={{ height: '36px', fontSize: '13px', paddingLeft: '32px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '14px', width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            </div>

            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="bus-input"
                value={destino}
                onChange={(e) => onDestinoChange(e.target.value)}
                placeholder="Destino"
                style={{ height: '36px', fontSize: '13px', paddingLeft: '32px' }}
              />
              <MapPin size={14} color="#EF4444" style={{ position: 'absolute', left: '8px', top: '11px' }} />
            </div>
          </div>

          <button
            onClick={onSwap}
            title="Inverter origem e destino"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              color: '#94A3B8',
              width: '36px',
              height: '76px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <ArrowUpDown size={16} />
          </button>
        </div>

        {/* Horário de Saída: agora ou planejado */}
        {onScheduledTimeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => onScheduledTimeChange('')}
              className={`bus-pill ${!isScheduled ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Clock size={13} color={!isScheduled ? '#38BDF8' : '#94A3B8'} />
              <span>Sair agora</span>
            </button>

            <div
              className={`bus-pill ${isScheduled ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '2px 10px 2px 12px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
            >
              <Clock size={13} color={isScheduled ? '#38BDF8' : '#94A3B8'} />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isScheduled ? '#F8FAFC' : '#94A3B8',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  colorScheme: 'dark',
                  flex: 1
                }}
              />
            </div>
          </div>
        )}

        {isScheduled && (
          <div style={{ fontSize: '10.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>⚠️ Previsão em tempo real da SPTrans só cobre os próximos ~60 min — horários mais distantes usam o melhor dado disponível, sem garantia.</span>
          </div>
        )}

        {/* Botão Recalcular */}
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="bus-btn-primary"
          style={{ width: '100%', height: '38px', fontSize: '13px', borderRadius: '10px' }}
        >
          {isCalculating ? 'Calculando melhores rotas...' : 'Atualizar Rotas SP'}
        </button>
      </div>

      {/* 2. FILTROS DE ROTA COM ÍCONES SVG */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
        {filterOptions.map((f) => {
          const Icon = f.icon;
          const isActive = filterMode === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilterMode(f.id as any)}
              className={`bus-pill ${isActive ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <Icon size={13} color={isActive ? '#38BDF8' : '#94A3B8'} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. LISTA DE ROTAS ENCONTRADAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isCalculating ? (
          <div className="bus-glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ fontSize: '13px', color: '#94A3B8' }}>Buscando trajetos ideais com SPTrans e Metrô...</span>
          </div>
        ) : filteredRoutes.length > 0 ? (
          filteredRoutes.map((route, idx) => {
            const isSelected = selectedRouteIndex === idx;

            return (
              <div
                key={idx}
                onClick={() => onSelectRoute(idx)}
                className={`bus-card ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Header do Card: Duração, Chegada e Próximo Ônibus */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.5px' }}>
                      {route.totalDurationMinutes} min
                    </span>
                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                      (Chega às {route.arrivalHour})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#10B981',
                        background: 'rgba(16, 185, 129, 0.15)',
                        border: '1px solid rgba(16, 185, 129, 0.35)',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Radio size={10} />
                      {route.nextBusEtaMinutes <= 2 ? 'Agora' : `em ${route.nextBusEtaMinutes}m`}
                    </span>
                  </div>
                </div>

                {/* Linha do Tempo dos Modais (Badges em sequência) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {route.steps.map((step, stepIdx) => (
                    <React.Fragment key={stepIdx}>
                      {step.type === 'WALK' ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11.5px',
                            color: '#94A3B8',
                            background: 'rgba(255, 255, 255, 0.05)',
                            padding: '3px 7px',
                            borderRadius: '6px'
                          }}
                        >
                          <Footprints size={12} />
                          <span>{step.durationMinutes}m</span>
                        </div>
                      ) : step.type === 'BUS' ? (
                        <div className="bus-badge">
                          <Bus size={13} />
                          <span>{step.busLine || `${route.recommendedLine.lt}-${route.recommendedLine.tl}`}</span>
                        </div>
                      ) : null}

                      {stepIdx < route.steps.length - 1 && (
                        <ChevronRight size={12} color="#475569" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Resumo da Partida e Parada */}
                <div
                  style={{
                    fontSize: '12px',
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    paddingTop: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="#06B6D4" />
                    <span>Embarque: <strong>{route.departureStop.np}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8', fontWeight: 700 }}>
                    <span>Detalhes</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bus-glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
            {searchError || 'Nenhuma rota encontrada para este trajeto. Tente ajustar os endereços.'}
          </div>
        )}
      </div>
    </div>
  );
}
