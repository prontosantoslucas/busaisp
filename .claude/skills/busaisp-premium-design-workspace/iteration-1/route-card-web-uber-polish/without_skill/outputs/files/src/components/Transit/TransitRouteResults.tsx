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
  Star,
  ChevronRight,
  Map as MapIcon,
  Zap,
  ArrowLeftRight,
  Radio,
  SlidersHorizontal,
  AlertTriangle,
  Check
} from 'lucide-react';

// Cor de cada trecho na barra de composição do trajeto (proporção caminhada x ônibus x trem/metrô)
function getStepBarColor(type: RouteStep['type']): string {
  if (type === 'RAIL') return '#3557C4';
  if (type === 'BUS') return 'var(--bus-violet)';
  return 'var(--bus-border-highlight)';
}

function formatWalkDistance(meters: number): string {
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km a pé`;
  return `${Math.round(meters)} m a pé`;
}

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
  const [pulsingFavoriteKey, setPulsingFavoriteKey] = useState<string | null>(null);
  const isScheduled = timeMode !== 'NOW';

  // Menor duração entre as rotas encontradas — usada para destacar a "rota mais rápida"
  // com uma fita no card, no estilo de "opção recomendada" de apps de mobilidade.
  const fastestDurationMinutes = routes.length > 1
    ? Math.min(...routes.map((r) => r.totalDurationMinutes))
    : -1;

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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 4px 4px', fontSize: '12px', color: 'var(--bus-text-secondary)' }}>
              <div style={{ width: '14px', height: '14px', border: '2px solid var(--bus-violet-soft)', borderTopColor: 'var(--bus-violet)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              <span>Buscando trajetos ideais com SPTrans e Metrô...</span>
            </div>
            {[0, 1, 2].map((i) => (
              <div key={i} className="bus-route-skeleton" style={{ '--route-card-delay': `${i * 90}ms` } as React.CSSProperties}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="bus-skel-bar" style={{ width: '96px', height: '22px' }} />
                  <div className="bus-skel-bar" style={{ width: '54px', height: '18px', borderRadius: 'var(--bus-radius-full)' }} />
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <div className="bus-skel-bar" style={{ width: '64px', height: '24px', borderRadius: 'var(--bus-radius-sm)' }} />
                  <div className="bus-skel-bar" style={{ width: '80px', height: '24px', borderRadius: 'var(--bus-radius-sm)' }} />
                </div>
                <div className="bus-skel-bar" style={{ width: '100%', height: '30px' }} />
              </div>
            ))}
          </>
        ) : filteredRoutes.length > 0 ? (
          filteredRoutes.map((route, idx) => {
            const originalIndex = routes.findIndex(r => r.id === route.id);
            const targetIndex = originalIndex >= 0 ? originalIndex : idx;
            const isSelected = selectedRouteIndex === targetIndex;
            const etaColors = getEtaColorTokens(route.nextBusEtaMinutes);
            const isFastest = fastestDurationMinutes >= 0 && route.totalDurationMinutes === fastestDurationMinutes;
            const isEtaSoon = route.nextBusEtaMinutes >= 0 && route.nextBusEtaMinutes <= 5;
            const favoriteKey = route.id || String(idx);
            const isFavorited = !!isRouteFavorited?.(route);

            return (
              <div
                key={`${filterMode}-${route.id || idx}`}
                onClick={() => onSelectRoute(targetIndex)}
                className={`bus-route-card ${isSelected ? 'is-selected' : ''}`}
                style={{ '--route-card-delay': `${Math.min(idx, 6) * 55}ms` } as React.CSSProperties}
              >
                {isFastest && (
                  <div className="bus-route-ribbon">
                    <Zap size={11} />
                    <span>Mais rápida</span>
                  </div>
                )}

                {/* Header do Card: Duração, Chegada, Favoritar e Próximo Ônibus */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', paddingTop: isFastest ? '8px' : '0' }}>
                    <span className="bus-num" style={{ fontSize: '24px', fontWeight: 800, color: 'var(--bus-text-primary)', letterSpacing: '-0.3px' }}>
                      {route.totalDurationMinutes}
                      <span style={{ fontSize: '13px', fontWeight: 600, marginLeft: '2px', color: 'var(--bus-text-secondary)' }}>min</span>
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)' }}>
                      chega às {route.arrivalHour}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    {isSelected && (
                      <div className="bus-route-check" title="Rota selecionada">
                        <Check size={13} strokeWidth={3} />
                      </div>
                    )}
                    {onToggleRouteFavorite && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleRouteFavorite(route);
                          setPulsingFavoriteKey(favoriteKey);
                          window.setTimeout(() => {
                            setPulsingFavoriteKey((prev) => (prev === favoriteKey ? null : prev));
                          }, 350);
                        }}
                        className={`bus-fav-btn ${pulsingFavoriteKey === favoriteKey ? 'is-pulsing' : ''}`}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          color: isFavorited ? 'var(--bus-live)' : 'var(--bus-text-muted)'
                        }}
                        title={isFavorited ? 'Remover dos favoritos' : 'Favoritar esta rota'}
                      >
                        <Star size={16} fill={isFavorited ? 'var(--bus-live)' : 'none'} />
                      </button>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  {route.trafficDelayMinutes > 0 && (
                    <span
                      className="bus-num"
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#EF4444',
                        background: 'rgba(239, 68, 68, 0.15)',
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
                      gap: '5px'
                    }}
                  >
                    {isEtaSoon ? <span className="bus-live-dot" /> : <Radio size={10} />}
                    {route.nextBusEtaMinutes < 0 ? 'Sem previsão' : route.nextBusEtaMinutes <= 2 ? 'Saindo agora' : `próximo em ${route.nextBusEtaMinutes}m`}
                  </span>
                </div>

                {/* Barra de composição do trajeto: proporção de tempo a pé x ônibus x trem/metrô */}
                <div className="bus-route-modebar" title="Composição do trajeto">
                  {route.steps.map((step, stepIdx) => (
                    <div
                      key={stepIdx}
                      className="bus-route-modebar-seg"
                      style={{
                        flexGrow: Math.max(step.durationMinutes, 1),
                        background: getStepBarColor(step.type)
                      }}
                    />
                  ))}
                </div>

                {/* Estatísticas rápidas: caminhada e baldeações, de relance */}
                <div className="bus-route-stats">
                  <span>
                    <Footprints size={12} />
                    {formatWalkDistance(route.totalWalkDistanceMeters)}
                  </span>
                  <span>
                    <ArrowLeftRight size={12} />
                    {route.transferCount === 0 ? 'Direto, sem baldeações' : `${route.transferCount} ${route.transferCount === 1 ? 'baldeação' : 'baldeações'}`}
                  </span>
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

                {/* Resumo da Partida e CTA de Detalhes */}
                <div className="bus-route-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                    <MapPin size={13} color="var(--bus-violet)" style={{ flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Embarque: <strong style={{ color: 'var(--bus-text-primary)' }}>{route.departureStop.np}</strong>
                    </span>
                  </div>
                  <div className="bus-route-footer-cta" style={{ flexShrink: 0 }}>
                    <span>Detalhes</span>
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bus-glass-panel animate-fade-in" style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--bus-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--bus-surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="var(--bus-text-muted)" />
            </div>
            <span style={{ fontSize: '13px', lineHeight: 1.5, maxWidth: '260px' }}>
              {searchError || 'Nenhuma rota encontrada para este trajeto. Tente ajustar os endereços.'}
            </span>
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
