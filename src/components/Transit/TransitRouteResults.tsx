'use client';

import React, { useState } from 'react';
import { RoutePlan, RouteStep } from '@/lib/routing';
import { getEtaColorTokens } from '@/lib/etaStyle';
import TransitDeparturesModal from '@/components/Transit/TransitDeparturesModal';
import {
  ArrowLeft,
  ArrowUpDown,
  MapPin,
  Clock,
  Footprints,
  Bus,
  TrainTrack,
  ChevronRight,
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
  const [departuresStep, setDeparturesStep] = useState<RouteStep | null>(null);
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
              color: 'var(--bus-text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={18} color="var(--bus-violet)" />
            <span>Voltar ao Início</span>
          </button>

          <button
            onClick={onToggleMap}
            className={`bus-pill ${isMapVisible ? 'active' : ''}`}
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
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
              <span style={{ position: 'absolute', left: '10px', top: '14px', width: '8px', height: '8px', borderRadius: '50%', background: 'var(--bus-emerald)' }} />
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
              <MapPin size={14} color="var(--bus-rose)" style={{ position: 'absolute', left: '8px', top: '11px' }} />
            </div>
          </div>

          <button
            onClick={onSwap}
            title="Inverter origem e destino"
            style={{
              background: 'var(--bus-surface-elevated)',
              border: '1px solid var(--bus-border)',
              borderRadius: 'var(--bus-radius-sm)',
              color: 'var(--bus-text-secondary)',
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
              <Clock size={13} />
              <span>Sair agora</span>
            </button>

            <div
              className={`bus-pill ${isScheduled ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '2px 10px 2px 12px', display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}
            >
              <Clock size={13} />
              <input
                type="time"
                value={scheduledTime}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
                className="bus-num"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  flex: 1
                }}
              />
            </div>
          </div>
        )}

        {isScheduled && (
          <div style={{ fontSize: '10.5px', color: 'var(--bus-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span>Previsão em tempo real da SPTrans só cobre os próximos ~60 min — horários mais distantes usam o melhor dado disponível, sem garantia.</span>
          </div>
        )}

        {/* Botão Recalcular */}
        <button
          onClick={onCalculate}
          disabled={isCalculating}
          className="bus-btn-primary"
          style={{ width: '100%', height: '38px', fontSize: '13px', borderRadius: 'var(--bus-radius-sm)' }}
        >
          {isCalculating ? 'Calculando melhores rotas...' : 'Atualizar Rotas SP'}
        </button>
      </div>

      {/* 2. FILTROS DE ROTA */}
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
              <Icon size={13} />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. LISTA DE ROTAS ENCONTRADAS */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isCalculating ? (
          <div className="bus-glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
            <div style={{ width: '28px', height: '28px', border: '3px solid var(--bus-violet-soft)', borderTopColor: 'var(--bus-violet)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
            <span style={{ fontSize: '13px', color: 'var(--bus-text-secondary)' }}>Buscando trajetos ideais com SPTrans e Metrô...</span>
          </div>
        ) : filteredRoutes.length > 0 ? (
          filteredRoutes.map((route, idx) => {
            const isSelected = selectedRouteIndex === idx;
            const etaColors = getEtaColorTokens(route.nextBusEtaMinutes);

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
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span className="bus-num" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                      {route.totalDurationMinutes} min
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)' }}>
                      (Chega às {route.arrivalHour})
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className="bus-num"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: etaColors.color,
                        background: etaColors.background,
                        borderRadius: 'var(--bus-radius-sm)',
                        padding: '2px 6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                    >
                      <Radio size={10} />
                      {route.nextBusEtaMinutes < 0 ? 'Sem previsão' : route.nextBusEtaMinutes <= 2 ? 'Agora' : `em ${route.nextBusEtaMinutes}m`}
                    </span>
                  </div>
                </div>

                {/* Linha do Tempo dos Modais (Badges em sequência) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {route.steps.map((step, stepIdx) => (
                    <React.Fragment key={stepIdx}>
                      {step.type === 'WALK' ? (
                        <div
                          className="bus-num"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                            fontSize: '11.5px',
                            color: 'var(--bus-text-secondary)',
                            background: 'var(--bus-surface-sunken)',
                            padding: '3px 7px',
                            borderRadius: 'var(--bus-radius-sm)'
                          }}
                        >
                          <Footprints size={12} />
                          <span>{step.durationMinutes}m</span>
                        </div>
                      ) : step.type === 'BUS' || step.type === 'RAIL' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeparturesStep(step);
                          }}
                          className="bus-badge"
                          style={{ border: 'none', cursor: 'pointer' }}
                          title="Ver próximas partidas desta linha"
                        >
                          {step.type === 'RAIL' ? <TrainTrack size={13} /> : <Bus size={13} />}
                          <span>{step.busLine || `${route.recommendedLine.lt}-${route.recommendedLine.tl}`}</span>
                          {step.departureEtas && step.departureEtas.length > 0 && (
                            <span className="bus-num" style={{ fontSize: '10.5px', opacity: 0.9 }}>
                              · {step.departureEtas[0] <= 1 ? 'agora' : `${step.departureEtas[0]}m`}
                            </span>
                          )}
                        </button>
                      ) : null}

                      {stepIdx < route.steps.length - 1 && (
                        <ChevronRight size={12} color="var(--bus-text-dim)" />
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Resumo da Partida e Parada */}
                <div
                  style={{
                    fontSize: '12px',
                    color: 'var(--bus-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderTop: '1px solid var(--bus-border-subtle)',
                    paddingTop: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} color="var(--bus-violet)" />
                    <span>Embarque: <strong style={{ color: 'var(--bus-text-primary)' }}>{route.departureStop.np}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bus-violet)', fontWeight: 600 }}>
                    <span>Detalhes</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bus-glass-panel" style={{ padding: '24px', textAlign: 'center', color: 'var(--bus-text-secondary)' }}>
            {searchError || 'Nenhuma rota encontrada para este trajeto. Tente ajustar os endereços.'}
          </div>
        )}
      </div>

      {departuresStep && (
        <TransitDeparturesModal
          busLine={departuresStep.busLine || ''}
          busDestination={departuresStep.busDestination || ''}
          boardStopName={departuresStep.boardStopName || ''}
          departureEtas={departuresStep.departureEtas || []}
          onClose={() => setDeparturesStep(null)}
        />
      )}
    </div>
  );
}
