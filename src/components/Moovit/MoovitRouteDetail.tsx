'use client';

import React, { useState } from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  ArrowLeft,
  Star,
  Footprints,
  Bus,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Radio,
  Bell,
  Play,
  Square,
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  ArrowLeftRight,
  ArrowRight,
  ListFilter
} from 'lucide-react';

interface MoovitRouteDetailProps {
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
}

export default function MoovitRouteDetail({
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
  onStopPercurso
}: MoovitRouteDetailProps) {
  const [expandedStops, setExpandedStops] = useState<Record<number, boolean>>({});

  const toggleStops = (idx: number) => {
    setExpandedStops(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Bar: Indo para [Destino] */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px'
              }}
              title="Voltar à lista de rotas"
            >
              <ArrowLeft size={22} />
            </button>
            <div>
              <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 500 }}>
                Indo para
              </div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                {route.destination.name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              onClick={onBack}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                borderRadius: '9999px',
                padding: '5px 10px',
                color: 'var(--moovit-sptrans-red)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <ListFilter size={12} />
              <span>Rotas ({routes.length || 1})</span>
            </button>

            <button
              onClick={onToggleFavorite}
              style={{
                background: '#262932',
                border: '1px solid #323642',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: isFavorited ? '#FBBF24' : '#9CA3AF'
              }}
            >
              <Star size={16} fill={isFavorited ? '#FBBF24' : 'none'} />
            </button>
          </div>
        </div>

        {/* Pílulas de Alternativas */}
        {routes.length > 1 && onSelectRouteIndex && (
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingTop: '4px', scrollbarWidth: 'none' }}>
            {routes.map((r, i) => {
              const isSelected = i === selectedRouteIndex;
              return (
                <button
                  key={r.id || i}
                  onClick={() => onSelectRouteIndex(i)}
                  style={{
                    background: isSelected ? 'var(--moovit-sptrans-red)' : '#262932',
                    border: `1px solid ${isSelected ? 'var(--moovit-sptrans-red)' : '#323642'}`,
                    borderRadius: '9999px',
                    padding: '5px 10px',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  Opção {i + 1}: {r.recommendedLine.lt} · {r.totalDurationMinutes} min
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Card Detalhes da Rota */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}
      >
        {/* Header: Detalhes da Rota | 51 min */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2D313C', paddingBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
            Detalhes da Rota
          </span>
          <span style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF' }}>
            {route.totalDurationMinutes} min
          </span>
        </div>

        {/* 1. Sua Localização */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '3px solid #7C3AED',
              background: '#1C1E24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
              flexShrink: 0
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
              Sua Localização
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>
              {route.origin.name}
            </div>
          </div>
        </div>

        {/* 2. Caminhada Inicial */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative', marginLeft: '4px' }}>
          <div style={{ width: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: '#7C3AED', borderStyle: 'dotted' }} />
            <Footprints size={14} color="#A78BFA" />
            <div style={{ width: '2px', height: '24px', background: '#7C3AED', borderStyle: 'dotted' }} />
          </div>

          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.4 }}>
              Caminhe por <strong>{route.totalWalkDurationMinutes} min ({route.totalWalkDistanceMeters} m)</strong> até <strong>{route.departureStop.np}</strong> {route.departureStop.ed ? `- ${route.departureStop.ed}` : ''}
            </div>
          </div>
        </div>

        {/* 3. Steps de Ônibus com Contagem Exata de Paradas e Baldeação */}
        {route.steps.map((step, idx) => {
          if (step.type === 'BUS') {
            const isStopsExpanded = expandedStops[idx] ?? false;
            const stopCountText = step.stopCount ? `${step.stopCount} Paradas` : 'algumas paradas';
            const targetStopName = step.alightStopName || route.arrivalStop.np;

            return (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Linha de Ônibus Header com Botão IR */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'var(--moovit-sptrans-red)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      flexShrink: 0
                    }}
                  >
                    <Bus size={13} />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                      <div>
                        <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
                          Aguarde pelo <strong style={{ color: '#FFFFFF', fontSize: '14px' }}>{step.busLine || route.recommendedLine.lt} {step.busDestination || route.recommendedLine.ts}</strong>
                        </div>
                      </div>

                      <button
                        onClick={onStartLiveNavigation}
                        style={{
                          background: '#5B21B6',
                          border: 'none',
                          color: '#FFFFFF',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          boxShadow: '0 2px 8px rgba(91, 33, 182, 0.4)'
                        }}
                      >
                        <span>IR</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>

                    {/* Previsão ao Vivo */}
                    {(step.departureEtas?.[0] ?? route.departureEtas[0]) !== undefined ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34D399', fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>
                        <Radio size={14} />
                        <span>{step.departureEtas?.[0] ?? route.departureEtas[0]} min</span>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #34D399', display: 'inline-block' }} />
                      </div>
                    ) : (
                      <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '4px' }}>
                        Sem previsão em tempo real — confira o horário no ponto
                      </div>
                    )}

                    {/* Linha de Paradas Expansível */}
                    <div
                      onClick={() => toggleStops(idx)}
                      style={{
                        background: '#262932',
                        border: '1px solid #323642',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        marginTop: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#D1D5DB' }}>
                          <Bus size={14} color="#9CA3AF" />
                          <span>Siga por <strong>{stopCountText}</strong> até <strong>{targetStopName}</strong></span>
                        </div>
                        {isStopsExpanded ? <ChevronUp size={14} color="#9CA3AF" /> : <ChevronDown size={14} color="#9CA3AF" />}
                      </div>

                      {/* Lista Expansível de Paradas */}
                      {isStopsExpanded && step.intermediateStops && (
                        <div style={{ borderTop: '1px solid #323642', paddingTop: '6px', marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '160px', overflowY: 'auto' }}>
                          {step.intermediateStops.map((st, stIdx) => (
                            <div key={stIdx} style={{ fontSize: '11px', color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6B7280' }} />
                              <span>{st.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          if (step.type === 'WALK' && (step.instruction.includes('baldeação') || step.instruction.includes('próxima linha'))) {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
                <div
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '50%',
                    background: '#F59E0B',
                    color: '#000',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '13px',
                    fontWeight: 900,
                    flexShrink: 0
                  }}
                >
                  🔄
                </div>

                <div
                  style={{
                    flex: 1,
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid #F59E0B',
                    borderRadius: '12px',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 900, color: '#FBBF24', textTransform: 'uppercase' }}>
                    🔄 BALDEAÇÃO EM: {step.stopName}
                  </div>
                  <div style={{ fontSize: '13px', color: '#FFFFFF', marginTop: '2px', fontWeight: 700 }}>
                    {step.instruction}
                  </div>
                  {step.detailedWalkGuide && (
                    <div style={{ fontSize: '11px', color: '#D1D5DB', marginTop: '4px' }}>
                      {step.detailedWalkGuide}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          return null;
        })}

        {/* 4. Desembarque e Caminhada Final */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '22px',
              height: '22px',
              borderRadius: '50%',
              background: '#5B21B6',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              flexShrink: 0
            }}
          >
            <Footprints size={13} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', color: '#D1D5DB' }}>
              Desembarque em <strong>{route.arrivalStop.np}</strong>
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '3px' }}>
              Caminhe por <strong>{route.totalWalkDurationMinutes} min ({route.totalWalkDistanceMeters} m)</strong> até seu destino
            </div>
          </div>
        </div>

        {/* 5. Seu Destino */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '3px solid #7C3AED',
              background: '#1C1E24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: '2px',
              flexShrink: 0
            }}
          >
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#7C3AED' }} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
              Seu Destino
            </div>
            <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '1px' }}>
              {route.destination.name} - {route.destination.addressDetails || 'São Paulo'}
            </div>
          </div>
        </div>
      </div>

      {/* Botão Prominente Inferior: Iniciar Percurso / Parar Percurso */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        {isPercursoActive ? (
          <button
            onClick={onStopPercurso}
            style={{
              flex: 1,
              background: '#EF4444',
              border: 'none',
              borderRadius: '9999px',
              padding: '14px 20px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)'
            }}
          >
            <Square size={17} fill="#fff" />
            <span>Parar Percurso</span>
          </button>
        ) : (
          <button
            onClick={onStartLiveNavigation}
            style={{
              flex: 1,
              background: '#10B981',
              border: 'none',
              borderRadius: '9999px',
              padding: '14px 20px',
              color: '#FFFFFF',
              fontSize: '15px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Play size={18} fill="#fff" />
            <span>Iniciar Percurso</span>
          </button>
        )}

        <button
          onClick={onOpenDeparturesModal}
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '9999px',
            padding: '14px 18px',
            color: '#FFFFFF',
            fontSize: '13px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <CreditCard size={17} />
          <span>Passagens</span>
        </button>
      </div>
    </div>
  );
}
