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
  CreditCard,
  MapPin,
  Clock,
  Sparkles,
  Share2,
  CheckCircle2
} from 'lucide-react';

interface MoovitRouteDetailProps {
  route: RoutePlan;
  onBack: () => void;
  onStartLiveNavigation: () => void;
  onOpenDeparturesModal: () => void;
  onToggleFavorite: () => void;
  isFavorited: boolean;
}

export default function MoovitRouteDetail({
  route,
  onBack,
  onStartLiveNavigation,
  onOpenDeparturesModal,
  onToggleFavorite,
  isFavorited
}: MoovitRouteDetailProps) {
  const [isWalkExpanded, setIsWalkExpanded] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Bar: ⬅ Direções (Screenshot 3) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Voltar às rotas"
          >
            <ArrowLeft size={22} />
          </button>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF' }}>
            Direções
          </span>
        </div>

        <button
          onClick={onToggleFavorite}
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: isFavorited ? '#FBBF24' : '#9CA3AF'
          }}
          title="Favoritar rota"
        >
          <Star size={18} fill={isFavorited ? '#FBBF24' : 'none'} />
        </button>
      </div>

      {/* Resumo da Rota (Screenshot 3) */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '17px', fontWeight: 900, color: '#FFFFFF' }}>
              {Math.floor(route.totalDurationMinutes / 60) > 0
                ? `${Math.floor(route.totalDurationMinutes / 60)} h ${route.totalDurationMinutes % 60} min`
                : `${route.totalDurationMinutes} min`}{' '}
              <span style={{ fontWeight: 400, color: '#9CA3AF', fontSize: '13px' }}>
                | Horário de chegada: {route.arrivalHour} | {route.farePrice}
              </span>
            </div>
          </div>
        </div>

        {/* Cadeia Visual: 🚶 13 > [🚌 1703-10] > 🚶 8 */}
        <div
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {route.steps.map((step, idx) => (
            <React.Fragment key={idx}>
              {step.type === 'WALK' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '13px', fontWeight: 700, color: '#D1D5DB' }}>
                  <Footprints size={15} color="#38BDF8" />
                  <span>{step.durationMinutes}</span>
                </div>
              )}
              {step.type === 'BUS' && (
                <div
                  style={{
                    background: '#1E3A8A',
                    border: '1px solid #3B82F6',
                    color: '#FFFFFF',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Bus size={14} />
                  <span>{step.busLine}</span>
                </div>
              )}
              {idx < route.steps.length - 2 && <ChevronRight size={13} color="#6B7280" />}
            </React.Fragment>
          ))}
        </div>

        {/* Navegador de Horários: < Antes   15:30 - 16:49   Após > */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: '#9CA3AF', paddingTop: '2px' }}>
          <span style={{ cursor: 'pointer', fontWeight: 600 }}>&lt; Antes</span>
          <span style={{ fontWeight: 700, color: '#FFFFFF' }}>{route.departureHour} - {route.arrivalHour}</span>
          <span style={{ cursor: 'pointer', fontWeight: 600 }}>Após &gt;</span>
        </div>
      </div>

      {/* Linha do Tempo Passo a Passo (Screenshot 4) */}
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
        {/* 1. Origem: Círculo Laranja */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '3px solid #FF6600',
              background: '#1C1E24',
              marginTop: '3px',
              flexShrink: 0
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                {route.origin.name}
              </div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', textAlign: 'right' }}>
                {route.departureHour}
                <span style={{ display: 'block', fontSize: '10px', color: '#9CA3AF', fontWeight: 400 }}>Saia às</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Caminhada a Pé Inicial */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative', marginLeft: '3px' }}>
          <div style={{ width: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '2px', height: '24px', background: '#4B5563', borderStyle: 'dashed' }} />
            <Footprints size={14} color="#9CA3AF" />
            <div style={{ width: '2px', height: '24px', background: '#4B5563', borderStyle: 'dashed' }} />
          </div>

          <div style={{ flex: 1, paddingTop: '10px' }}>
            <div
              onClick={() => setIsWalkExpanded(!isWalkExpanded)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9CA3AF', cursor: 'pointer' }}
            >
              <span>Caminhe {route.totalWalkDistanceMeters}m | {route.totalWalkDurationMinutes} min</span>
              {isWalkExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </div>

            {isWalkExpanded && (
              <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px', lineHeight: 1.4 }}>
                Siga pelas calçadas até o ponto de embarque na parada {route.departureStop.np}.
              </div>
            )}
          </div>
        </div>

        {/* 3. Parada de Embarque e Ônibus (Screenshot 4) */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#2563EB',
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
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
              {route.departureStop.np}
            </div>

            {/* Card da Linha de Ônibus */}
            <div
              style={{
                background: '#262932',
                border: '1px solid #323642',
                borderRadius: '12px',
                padding: '14px',
                marginTop: '10px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      background: '#1E3A8A',
                      border: '1px solid #3B82F6',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 900,
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Bus size={15} />
                    <span>{route.recommendedLine.lt}-{route.recommendedLine.tl}</span>
                  </div>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                    {route.recommendedLine.ts}
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={14} />
                    <span>{route.departureEtas[0] || 1} min</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>
                    {route.departureEtas.slice(1).join(', ')} min
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                Baseado em chegadas anteriores / Sinal GPS Olho Vivo SPTrans
              </div>

              {/* Botões de Ação do Card: Localização em tempo real & Atualizações */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <button
                  onClick={onStartLiveNavigation}
                  style={{
                    background: '#2563EB',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '10px 16px',
                    color: '#FFFFFF',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Radio size={16} />
                  <span>Localização em tempo real</span>
                </button>

                <button
                  onClick={onOpenDeparturesModal}
                  style={{
                    background: '#1E293B',
                    border: '1px solid #3B82F6',
                    borderRadius: '9999px',
                    padding: '10px 16px',
                    color: '#38BDF8',
                    fontSize: '12px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer'
                  }}
                >
                  <Bell size={15} />
                  <span>Atualizações de chegada</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4. Destino Final: Bandeira Quadriculada */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', position: 'relative' }}>
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: '#10B981',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              flexShrink: 0
            }}
          >
            🏁
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
              {route.destination.name}
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
              {route.destination.addressDetails || 'São Paulo - SP'}
            </div>
          </div>
        </div>
      </div>

      {/* Botão Prominente Inferior: Começar (Screenshot 3 & 4) */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
        <button
          onClick={() => {
            setIsNavigating(true);
            onStartLiveNavigation();
          }}
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
          <span>{isNavigating ? 'Navegando...' : 'Começar'}</span>
        </button>

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
