'use client';

import React, { useState } from 'react';
import { RoutePlan, RouteStep } from '@/lib/routing';
import {
  ArrowLeft,
  Star,
  Footprints,
  Bus,
  TrainTrack,
  ChevronDown,
  ChevronUp,
  Square,
  MapPin,
  Clock,
  Volume2,
  VolumeX
} from 'lucide-react';
import { voiceService } from '@/lib/voiceService';
import { getEtaColorTokens } from '@/lib/etaStyle';
import TransitDeparturesModal from '@/components/Transit/TransitDeparturesModal';

interface TransitRouteDetailProps {
  route: RoutePlan;
  routes?: RoutePlan[];
  selectedRouteIndex?: number;
  onSelectRouteIndex?: (idx: number) => void;
  onBack: () => void;
  onStartLiveNavigation: () => void;
  onToggleFavorite: () => void;
  isFavorited: boolean;
  isPercursoActive?: boolean;
  onStopPercurso?: () => void;
  isVoiceMuted?: boolean;
  onToggleVoice?: () => void;
}

export default function TransitRouteDetail({
  route,
  routes = [],
  selectedRouteIndex = 0,
  onSelectRouteIndex,
  onBack,
  onStartLiveNavigation,
  onToggleFavorite,
  isFavorited,
  isPercursoActive = false,
  onStopPercurso,
  isVoiceMuted = false,
  onToggleVoice
}: TransitRouteDetailProps) {
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});
  const [departuresStep, setDeparturesStep] = useState<RouteStep | null>(null);
  const etaColors = getEtaColorTokens(route.nextBusEtaMinutes);
  const firstBusStep = route.steps.find(s => s.type === 'BUS') || null;

  const toggleStops = (idx: number) => {
    setExpandedStops(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleStartPercursoWithVoice = () => {
    onStartLiveNavigation();
    if (!isVoiceMuted) {
      voiceService.announceBoarding(
        route.mode === 'RAIL' ? route.recommendedLine.lt : `${route.recommendedLine.lt}-${route.recommendedLine.tl}`,
        route.destination.name,
        route.mode === 'RAIL' ? 'metrô/trem' : 'ônibus'
      );
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. BARRA SUPERIOR: DESTINO E AÇÕES */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--bus-text-primary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Voltar às rotas"
            >
              <ArrowLeft size={20} color="var(--bus-violet)" />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>INDO PARA</div>
              <div className="bus-display" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--bus-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {route.destination.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={onToggleFavorite}
              style={{
                background: isFavorited ? 'var(--bus-live-soft)' : 'var(--bus-surface-elevated)',
                border: `1px solid ${isFavorited ? 'var(--bus-live)' : 'var(--bus-border)'}`,
                color: isFavorited ? 'var(--bus-live)' : 'var(--bus-text-secondary)',
                borderRadius: 'var(--bus-radius-sm)',
                padding: '7px',
                cursor: 'pointer'
              }}
              title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star size={16} fill={isFavorited ? 'var(--bus-live)' : 'none'} />
            </button>

            {onToggleVoice && (
              <button
                onClick={onToggleVoice}
                style={{
                  background: isVoiceMuted ? 'var(--bus-surface-elevated)' : 'var(--bus-emerald-soft)',
                  border: `1px solid ${isVoiceMuted ? 'var(--bus-border)' : 'var(--bus-emerald)'}`,
                  color: isVoiceMuted ? 'var(--bus-text-secondary)' : 'var(--bus-emerald)',
                  borderRadius: 'var(--bus-radius-sm)',
                  padding: '7px',
                  cursor: 'pointer'
                }}
                title={isVoiceMuted ? 'Ativar avisos por voz' : 'Desativar avisos por voz'}
              >
                {isVoiceMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            )}
          </div>
        </div>

        {/* Resumo de Tempo, Custo e Chegada */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--bus-border-subtle)',
            paddingTop: '10px',
            marginTop: '4px'
          }}
        >
          <div>
            <div className="bus-num" style={{ fontSize: '22px', fontWeight: 700, color: 'var(--bus-violet)' }}>
              {route.totalDurationMinutes} min
            </div>
            <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
              Previsão de chegada: <strong style={{ color: 'var(--bus-text-primary)' }}>{route.arrivalHour}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span
              className="bus-num"
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: etaColors.color,
                background: etaColors.background,
                padding: '2px 8px',
                borderRadius: 'var(--bus-radius-sm)'
              }}
            >
              {route.nextBusEtaMinutes < 0 ? 'Sem previsão' : route.nextBusEtaMinutes <= 2 ? 'Ônibus no ponto' : `Próximo em ${route.nextBusEtaMinutes} min`}
            </span>
            <span style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>
              Tarifa: <strong style={{ color: 'var(--bus-text-primary)' }}>{route.farePrice}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. BOTÃO PRINCIPAL DE NAVEGAÇÃO COM VOZ */}
      {isPercursoActive ? (
        <button
          onClick={onStopPercurso}
          style={{
            background: 'var(--bus-red)',
            border: 'none',
            borderRadius: 'var(--bus-radius-md)',
            padding: '14px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <Square size={16} fill="#fff" />
          <span>Parar Navegação ao Vivo</span>
        </button>
      ) : (
        <button
          onClick={handleStartPercursoWithVoice}
          className="bus-btn-voice"
          style={{ padding: '14px', fontSize: '14.5px', borderRadius: 'var(--bus-radius-md)' }}
        >
          {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          <span>{isVoiceMuted ? 'Iniciar Percurso' : 'Iniciar Percurso com Alertas de Voz'}</span>
        </button>
      )}

      {/* 3. TIMELINE PASSO A PASSO DA VIAGEM */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bus-violet)', letterSpacing: '0.5px' }}>
            ITINERÁRIO DETALHADO
          </span>
          <button
            onClick={() => firstBusStep && setDeparturesStep(firstBusStep)}
            className="bus-pill"
            style={{ fontSize: '11px', padding: '4px 8px' }}
            disabled={!firstBusStep}
          >
            <Clock size={12} />
            <span>Próximas Partidas</span>
          </button>
        </div>

        {/* Todas as etapas reais da viagem, incluindo baldeações — uma rota com
            transferências tem mais de um ônibus, e cada um precisa aparecer aqui. */}
        {route.steps.map((step, stepIdx) => {
          const isLast = stepIdx === route.steps.length - 1;

          if (step.type === 'BUS' || step.type === 'RAIL') {
            const isRail = step.type === 'RAIL';
            const StepIcon = isRail ? TrainTrack : Bus;
            const stepEtaColors = getEtaColorTokens(step.nextBusEtaMinutes ?? -1);
            return (
              <div key={stepIdx} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bus-violet-soft)', border: '1px solid var(--bus-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StepIcon size={15} color="var(--bus-violet)" />
                  </div>
                  {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '40px', background: 'var(--bus-violet)', margin: '4px 0' }} />}
                </div>

                <div style={{ flex: 1, paddingBottom: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setDeparturesStep(step)}
                      className="bus-badge"
                      style={{ border: 'none', cursor: 'pointer' }}
                      title="Ver próximas partidas desta linha"
                    >
                      <StepIcon size={13} />
                      <span>{step.busLine}</span>
                    </button>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                      {step.busDestination}
                    </span>
                  </div>

                  <div style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', marginTop: '4px' }}>
                    Embarque em <strong style={{ color: 'var(--bus-text-primary)' }}>{step.boardStopName}</strong> · Desça em <strong style={{ color: 'var(--bus-text-primary)' }}>{step.alightStopName}</strong>
                  </div>

                  {/* Tempo de espera: ônibus indicado + próximos, em tempo real */}
                  {step.departureEtas && step.departureEtas.length > 0 ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                      <span
                        className="bus-num"
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: stepEtaColors.color,
                          background: stepEtaColors.background,
                          padding: '3px 9px',
                          borderRadius: 'var(--bus-radius-sm)'
                        }}
                      >
                        {step.departureEtas[0] <= 1 ? 'Chegando agora' : `Chega em ${step.departureEtas[0]} min`}
                      </span>
                      {step.departureEtas.length > 1 && (
                        <span className="bus-num" style={{ fontSize: '10.5px', color: 'var(--bus-text-muted)' }}>
                          depois: {step.departureEtas.slice(1).join(', ')} min
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ fontSize: '10.5px', color: 'var(--bus-text-muted)', marginTop: '6px' }}>
                      Sem previsão em tempo real agora — confira o horário no ponto.
                    </div>
                  )}

                  {/* Paradas intermediárias desta perna (não da viagem inteira) */}
                  {step.intermediateStops && step.intermediateStops.length > 0 && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        onClick={() => toggleStops(stepIdx)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--bus-violet)',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: 0
                        }}
                      >
                        <span>{step.stopCount ?? step.intermediateStops.length} paradas nesta perna</span>
                        {expandedStops[stepIdx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                      {expandedStops[stepIdx] && (
                        <div
                          style={{
                            marginTop: '8px',
                            paddingLeft: '10px',
                            borderLeft: '1px dashed var(--bus-border-highlight)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px'
                          }}
                        >
                          {step.intermediateStops.map((st, sIdx) => (
                            <div key={sIdx} style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                              • {st.name}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          if (step.type === 'DESTINATION') {
            return (
              <div key={stepIdx} style={{ display: 'flex', gap: '12px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bus-red-soft)', border: '1px solid var(--bus-red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={15} color="var(--bus-red)" />
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                    Chegada: {route.destination.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', marginTop: '2px' }}>
                    Previsão estimada: <strong style={{ color: 'var(--bus-text-primary)' }}>{route.arrivalHour}</strong>
                  </div>
                </div>
              </div>
            );
          }

          // WALK (caminhada inicial, baldeação a pé, ou caminhada final até o destino)
          return (
            <div key={stepIdx} style={{ display: 'flex', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bus-surface-sunken)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Footprints size={15} color="var(--bus-text-secondary)" />
                </div>
                {!isLast && <div style={{ width: '2px', flex: 1, minHeight: '30px', background: 'var(--bus-border)', margin: '4px 0' }} />}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>
                  {step.instruction}
                </div>
                {step.durationMinutes > 0 && (
                  <div style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', marginTop: '2px' }}>
                    Aprox. {step.durationMinutes} min ({step.distanceMeters}m)
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Alerta de Desembarque — o app avisa por voz quando você está perto do
            destino final; ainda não avisa em cada baldeação individual. */}
        <div
          style={{
            background: 'var(--bus-emerald-soft)',
            border: '1px solid var(--bus-emerald)',
            borderRadius: 'var(--bus-radius-sm)',
            padding: '8px 10px',
            fontSize: '11.5px',
            color: 'var(--bus-emerald)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Volume2 size={14} />
          <span>O app avisará por voz quando você estiver perto do destino final.</span>
        </div>
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
