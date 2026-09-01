'use client';

import React, { useState } from 'react';
import { RoutePlan, RouteStep } from '@/lib/routing';
import { getEtaColorTokens, getEtaTier } from '@/lib/etaStyle';
import TransitDeparturesModal from '@/components/Transit/TransitDeparturesModal';
import {
  ArrowLeft,
  ArrowUpDown,
  MapPin,
  Clock,
  Footprints,
  Bus,
  TrainTrack,
  Star,
  ChevronRight,
  Map as MapIcon,
  Zap,
  ArrowLeftRight,
  Radio,
  SlidersHorizontal,
  AlertTriangle
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
  timeMode?: 'NOW' | 'DEPART_AT' | 'ARRIVE_BY';
  onTimeModeChange?: (mode: 'NOW' | 'DEPART_AT' | 'ARRIVE_BY', time: string) => void;
  isRouteFavorited?: (route: RoutePlan) => boolean;
  onToggleRouteFavorite?: (route: RoutePlan) => void;
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
  onScheduledTimeChange,
  timeMode = 'NOW',
  onTimeModeChange,
  isRouteFavorited,
  onToggleRouteFavorite
}: TransitRouteResultsProps) {
  const [filterMode, setFilterMode] = useState<'ALL' | 'FASTEST' | 'LESS_WALK' | 'LESS_TRANSFERS'>('ALL');
  const [departuresStep, setDeparturesStep] = useState<RouteStep | null>(null);
  const isScheduled = timeMode !== 'NOW';

  // Aplicar filtros
  const filteredRoutes = [...routes].sort((a, b) => {
    if (filterMode === 'FASTEST') {
      return (
        a.totalDurationMinutes - b.totalDurationMinutes ||
        a.totalWalkDistanceMeters - b.totalWalkDistanceMeters
      );
    }
    if (filterMode === 'LESS_WALK') {
      return (
        a.totalWalkDistanceMeters - b.totalWalkDistanceMeters ||
        a.totalDurationMinutes - b.totalDurationMinutes
      );
    }
    if (filterMode === 'LESS_TRANSFERS') {
      return (
        a.transferCount - b.transferCount ||
        a.totalDurationMinutes - b.totalDurationMinutes
      );
    }
    return 0;
  });

  const filterOptions = [
    { id: 'ALL', label: 'Todas as Rotas', icon: SlidersHorizontal },
    { id: 'FASTEST', label: 'Mais Rápida', icon: Zap },
    { id: 'LESS_WALK', label: 'Menos Caminhada', icon: Footprints },
    { id: 'LESS_TRANSFERS', label: 'Menos Trocas', icon: ArrowLeftRight }
  ];

  // Rota mais rápida do conjunto — usado só para destacar a opção recomendada
  // no topo com a mesma linguagem visual de "acento violeta = escolha
  // principal" já usada no ícone de embarque e na seta de detalhes do rodapé.
  const fastestDurationMinutes = routes.length > 0
    ? Math.min(...routes.map((r) => r.totalDurationMinutes))
    : null;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%', paddingBottom: '24px' }}>
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

        {/* Horário: sair agora, partir às X, ou chegar até X */}
        {onScheduledTimeChange && onTimeModeChange && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              {([
                { id: 'NOW' as const, label: 'Agora' },
                { id: 'DEPART_AT' as const, label: 'Partir às' },
                { id: 'ARRIVE_BY' as const, label: 'Chegar até' }
              ]).map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    if (m.id === 'NOW') {
                      onTimeModeChange(m.id, '');
                    } else {
                      const d = new Date();
                      const nextTime = scheduledTime || `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                      onTimeModeChange(m.id, nextTime);
                    }
                  }}
                  className={`bus-pill ${timeMode === m.id ? 'active' : ''}`}
                  style={{ fontSize: '11.5px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px', flex: 1, justifyContent: 'center' }}
                >
                  <Clock size={13} />
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {timeMode !== 'NOW' && (
              <div
                className="bus-pill active"
                style={{
                  fontSize: '12px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                  width: '100%'
                }}
              >
                <span style={{ fontSize: '11.5px', opacity: 0.9 }}>Horário selecionado:</span>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => onScheduledTimeChange(e.target.value)}
                  className="bus-num"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'inherit',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none',
                    textAlign: 'right'
                  }}
                />
              </div>
            )}

            {routes[selectedRouteIndex]?.arrivalTimeUnreachable && (
              <div style={{ fontSize: '10.5px', color: 'var(--bus-live)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <AlertTriangle size={12} />
                <span>Nem saindo agora dá tempo de chegar nesse horário — mostrando a viagem mais rápida saindo já.</span>
              </div>
            )}
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
          <>
            <div style={{ fontSize: '11.5px', color: 'var(--bus-text-muted)', padding: '2px 2px 4px' }}>
              Buscando trajetos ideais com SPTrans e Metrô...
            </div>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="bus-card animate-fade-in"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  cursor: 'default',
                  animationDelay: `${i * 90}ms`,
                  animationFillMode: 'both'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="bus-skeleton" style={{ width: '92px', height: '26px', borderRadius: 'var(--bus-radius-sm)' }} />
                  <div className="bus-skeleton" style={{ width: '68px', height: '20px', borderRadius: 'var(--bus-radius-full)', animationDelay: '0.15s' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div className="bus-skeleton" style={{ width: '48px', height: '24px', borderRadius: 'var(--bus-radius-sm)', animationDelay: '0.05s' }} />
                  <div className="bus-skeleton" style={{ width: '82px', height: '24px', borderRadius: 'var(--bus-radius-sm)', animationDelay: '0.2s' }} />
                  <div className="bus-skeleton" style={{ width: '48px', height: '24px', borderRadius: 'var(--bus-radius-sm)', animationDelay: '0.1s' }} />
                </div>
                <div className="bus-skeleton" style={{ width: '65%', height: '14px', borderRadius: 'var(--bus-radius-sm)', animationDelay: '0.25s' }} />
              </div>
            ))}
          </>
        ) : filteredRoutes.length > 0 ? (
          filteredRoutes.map((route, idx) => {
            const originalIndex = routes.findIndex(r => r.id === route.id);
            const targetIndex = originalIndex >= 0 ? originalIndex : idx;
            const isSelected = selectedRouteIndex === targetIndex;
            const etaColors = getEtaColorTokens(route.nextBusEtaMinutes);
            const etaTier = getEtaTier(route.nextBusEtaMinutes);
            const isFastest = filteredRoutes.length > 1 && route.totalDurationMinutes === fastestDurationMinutes;

            return (
              <div
                key={route.id || idx}
                onClick={() => onSelectRoute(targetIndex)}
                className={`bus-card bus-card-enter ${isSelected ? 'active' : ''}`}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  animationDelay: `${Math.min(idx, 6) * 45}ms`
                }}
              >
                {/* Header do Card: Duração, Chegada e Próximo Ônibus */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
                    {isFastest && (
                      <span
                        className="bus-num"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          alignSelf: 'flex-start',
                          fontSize: '10px',
                          fontWeight: 700,
                          letterSpacing: '0.3px',
                          color: 'var(--bus-violet)',
                          background: 'var(--bus-violet-soft)',
                          padding: '2px 7px',
                          borderRadius: 'var(--bus-radius-full)'
                        }}
                      >
                        <Zap size={10} />
                        MAIS RÁPIDA
                      </span>
                    )}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
                      <span className="bus-num" style={{ fontSize: '28px', fontWeight: 800, color: 'var(--bus-text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
                        {route.totalDurationMinutes}
                      </span>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bus-text-secondary)' }}>min</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)' }}>
                      Chega às <span className="bus-num" style={{ color: 'var(--bus-text-primary)', fontWeight: 600 }}>{route.arrivalHour}</span>
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                    {onToggleRouteFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRouteFavorite(route);
                        }}
                        className="bus-tap-feedback"
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: isRouteFavorited?.(route) ? 'var(--bus-live)' : 'var(--bus-text-muted)'
                        }}
                        title={isRouteFavorited?.(route) ? 'Remover dos favoritos' : 'Favoritar esta rota'}
                      >
                        <Star size={16} fill={isRouteFavorited?.(route) ? 'var(--bus-live)' : 'none'} />
                      </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {route.trafficDelayMinutes > 0 && (
                        <span
                          className="bus-num"
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: 'var(--bus-red)',
                            background: 'var(--bus-red-soft)',
                            borderRadius: 'var(--bus-radius-sm)',
                            padding: '2px 6px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}
                          title={`Atraso estimado de ${route.trafficDelayMinutes} min devido a lentidão/ocorrência na via`}
                        >
                          <AlertTriangle size={11} />
                          +{route.trafficDelayMinutes}m trânsito
                        </span>
                      )}

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
                          gap: '4px'
                        }}
                      >
                        {etaTier !== 'none' ? (
                          <span style={{ position: 'relative', width: '7px', height: '7px', display: 'inline-flex', flexShrink: 0 }}>
                            <span
                              style={{
                                position: 'absolute',
                                inset: 0,
                                borderRadius: '50%',
                                background: etaColors.color,
                                animation: 'radarPulse 1.6s ease-out infinite'
                              }}
                            />
                            <span style={{ position: 'relative', width: '7px', height: '7px', borderRadius: '50%', background: etaColors.color }} />
                          </span>
                        ) : (
                          <Radio size={10} />
                        )}
                        {route.nextBusEtaMinutes < 0 ? 'Sem previsão' : route.nextBusEtaMinutes <= 2 ? 'Agora' : `em ${route.nextBusEtaMinutes}m`}
                      </span>
                    </div>
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
                          className="bus-badge bus-tap-feedback"
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
                  <div className="bus-card-cta-arrow" style={{ alignItems: 'center', gap: '4px', color: 'var(--bus-violet)', fontWeight: 600 }}>
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
