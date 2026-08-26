'use client';

import React, { useState } from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  ArrowLeft,
  Star,
  Footprints,
  Bus,
  ChevronDown,
  ChevronUp,
  Radio,
  Play,
  Square,
  CreditCard,
  MapPin,
  Clock,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  ListFilter
} from 'lucide-react';
import { voiceService } from '@/lib/voiceService';

interface TransitRouteDetailProps {
  route: RoutePlan;
  routes?: RoutePlan[];
  selectedRouteIndex?: number;
  onSelectRouteIndex?: (idx: number) => void;
  onBack: () => void;
  onStartLiveNavigation: () => void;
  onOpenDeparturesModal: () => void;
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
  onOpenDeparturesModal,
  onToggleFavorite,
  isFavorited,
  isPercursoActive = false,
  onStopPercurso,
  isVoiceMuted = false,
  onToggleVoice
}: TransitRouteDetailProps) {
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});

  const toggleStops = (idx: number) => {
    setExpandedStops(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleStartPercursoWithVoice = () => {
    onStartLiveNavigation();
    if (!isVoiceMuted) {
      voiceService.announceBoarding(
        `${route.recommendedLine.lt}-${route.recommendedLine.tl}`,
        route.destination.name
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
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Voltar às rotas"
            >
              <ArrowLeft size={20} color="#06B6D4" />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>INDO PARA</div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {route.destination.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onToggleFavorite}
              style={{
                background: isFavorited ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.06)',
                border: isFavorited ? '1px solid #F59E0B' : '1px solid rgba(255, 255, 255, 0.1)',
                color: isFavorited ? '#F59E0B' : '#94A3B8',
                borderRadius: '8px',
                padding: '7px',
                cursor: 'pointer'
              }}
              title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Star size={16} fill={isFavorited ? '#F59E0B' : 'none'} />
            </button>

            {onToggleVoice && (
              <button
                onClick={onToggleVoice}
                style={{
                  background: isVoiceMuted ? 'rgba(255, 255, 255, 0.06)' : 'rgba(16, 185, 129, 0.2)',
                  border: isVoiceMuted ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #10B981',
                  color: isVoiceMuted ? '#94A3B8' : '#34D399',
                  borderRadius: '8px',
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
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            paddingTop: '10px',
            marginTop: '4px'
          }}
        >
          <div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.5px' }}>
              {route.totalDurationMinutes} min
            </div>
            <div style={{ fontSize: '11px', color: '#94A3B8' }}>
              Previsão de chegada: <strong>{route.arrivalHour}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#10B981',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '2px 8px',
                borderRadius: '6px'
              }}
            >
              {route.nextBusEtaMinutes <= 2 ? 'Ônibus no ponto' : `Próximo em ${route.nextBusEtaMinutes} min`}
            </span>
            <span style={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 600 }}>
              Tarifa: <strong style={{ color: '#38BDF8' }}>{route.farePrice}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* 2. BOTÃO PRINCIPAL DE NAVEGAÇÃO COM VOZ */}
      {isPercursoActive ? (
        <button
          onClick={onStopPercurso}
          style={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            border: 'none',
            borderRadius: '16px',
            padding: '14px',
            color: '#FFFFFF',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.35)'
          }}
        >
          <Square size={16} fill="#fff" />
          <span>Parar Navegação ao Vivo</span>
        </button>
      ) : (
        <button
          onClick={handleStartPercursoWithVoice}
          className="bus-btn-voice"
          style={{ padding: '14px', fontSize: '14.5px', borderRadius: '16px' }}
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
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8', letterSpacing: '0.5px' }}>
            ITINERÁRIO DETALHADO
          </span>
          <button
            onClick={onOpenDeparturesModal}
            className="bus-pill"
            style={{ fontSize: '11px', padding: '4px 8px' }}
          >
            <Clock size={12} />
            <span>Próximas Partidas</span>
          </button>
        </div>

        {/* ETAPA 1: CAMINHADA ATÉ O PONTO */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Footprints size={15} color="#94A3B8" />
            </div>
            <div style={{ width: '2px', flex: 1, minHeight: '30px', background: 'rgba(255, 255, 255, 0.15)', margin: '4px 0' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC' }}>
              Caminhe até a parada de embarque
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
              Aprox. {route.totalWalkDurationMinutes} min ({route.totalWalkDistanceMeters}m) até <strong>{route.departureStop.np}</strong>
            </div>
          </div>
        </div>

        {/* ETAPA 2: ÔNIBUS PRINCIPAL */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(6, 182, 212, 0.2)', border: '1px solid #06B6D4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bus size={15} color="#38BDF8" />
            </div>
            <div style={{ width: '2px', flex: 1, minHeight: '40px', background: '#06B6D4', margin: '4px 0' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span className="bus-badge">
                <Bus size={13} />
                <span>{route.recommendedLine.lt}-{route.recommendedLine.tl}</span>
              </span>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
                {route.destination.name}
              </span>
            </div>

            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
              Embarque em <strong>{route.departureStop.np}</strong>
            </div>

            {/* Tempo de espera: ônibus indicado + próximos, em tempo real */}
            {route.departureEtas && route.departureEtas.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    color: route.departureEtas[0] <= 3 ? '#10B981' : '#F8FAFC',
                    background: route.departureEtas[0] <= 3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                    padding: '3px 9px',
                    borderRadius: '6px',
                    border: route.departureEtas[0] <= 3 ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  {route.departureEtas[0] <= 1 ? 'Chegando agora' : `Chega em ${route.departureEtas[0]} min`}
                </span>
                {route.departureEtas.length > 1 && (
                  <span style={{ fontSize: '10.5px', color: '#64748B' }}>
                    depois: {route.departureEtas.slice(1).join(', ')} min
                  </span>
                )}
              </div>
            ) : (
              <div style={{ fontSize: '10.5px', color: '#64748B', marginTop: '6px' }}>
                Sem previsão em tempo real agora — confira o horário no ponto.
              </div>
            )}

            {/* Paradas Intermediárias Expansíveis */}
            {route.allRouteStops && route.allRouteStops.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <button
                  onClick={() => toggleStops(0)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#38BDF8',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0
                  }}
                >
                  <span>{route.allRouteStops.length} paradas no trajeto</span>
                  {expandedStops[0] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedStops[0] && (
                  <div
                    style={{
                      marginTop: '8px',
                      paddingLeft: '10px',
                      borderLeft: '1px dashed rgba(6, 182, 212, 0.4)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    {route.allRouteStops.map((st, sIdx) => (
                      <div key={sIdx} style={{ fontSize: '11px', color: '#94A3B8' }}>
                        • {st.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Alerta de Desembarque */}
            <div
              style={{
                marginTop: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: '8px',
                padding: '8px 10px',
                fontSize: '11.5px',
                color: '#34D399',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Volume2 size={14} />
              <span>O app avisará por voz quando for a hora de descer do ônibus.</span>
            </div>
          </div>
        </div>

        {/* ETAPA 3: CHEGADA AO DESTINO */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={15} color="#EF4444" />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
              Chegada: {route.destination.name}
            </div>
            <div style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '2px' }}>
              Previsão estimada: <strong>{route.arrivalHour}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
