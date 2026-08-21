'use client';

import React, { useState } from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  Navigation,
  MapPin,
  Locate,
  ArrowUpDown,
  Bus,
  Clock,
  Footprints,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

interface RoutePlannerProps {
  onRouteCalculated: (route: RoutePlan) => void;
  userCoords: [number, number] | null;
}

export default function RoutePlanner({ onRouteCalculated, userCoords }: RoutePlannerProps) {
  const [origem, setOrigem] = useState('Minha Localização');
  const [destino, setDestino] = useState('Terminal Lapa');
  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<RoutePlan | null>(null);

  const handleSwap = () => {
    const temp = origem;
    setOrigem(destino);
    setDestino(temp);
  };

  const handleCalculate = async (destOverride?: string) => {
    const targetDest = destOverride || destino;
    if (!targetDest) return;

    setIsCalculating(true);
    try {
      let url = `/api/rotas?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(targetDest)}`;
      if (origem === 'Minha Localização' && userCoords) {
        url += `&origLat=${userCoords[0]}&origLng=${userCoords[1]}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setCalculatedRoute(json.data);
        onRouteCalculated(json.data);
      }
    } catch (e) {
      console.error('Erro ao calcular rota:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%',
        maxWidth: '700px',
        margin: '0 auto',
        padding: '16px 12px 100px 12px'
      }}
    >
      {/* Top Banner de Roteirização */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Navigation size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Planejador de Rotas</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Melhor trajeto com tempo de chegada do ônibus no seu ponto
            </p>
          </div>
        </div>

        {/* Inputs de Origem e Destino */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
          {/* Origem */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#38BDF8',
                border: '2px solid #fff'
              }}
            />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '38px', height: '44px' }}
              placeholder="Onde você está? (ex: Minha Localização)"
              value={origem}
              onChange={(e) => setOrigem(e.target.value)}
            />
          </div>

          {/* Botão de Inverter */}
          <button
            onClick={handleSwap}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 2,
              background: 'rgba(30, 41, 64, 0.9)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Inverter Origem/Destino"
          >
            <ArrowUpDown size={15} />
          </button>

          {/* Destino */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                position: 'absolute',
                left: '14px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: '#10B981',
                border: '2px solid #fff'
              }}
            />
            <input
              type="text"
              className="input-field"
              style={{ paddingLeft: '38px', height: '44px' }}
              placeholder="Para onde você vai? (ex: Av. Paulista, Terminal Lapa)"
              value={destino}
              onChange={(e) => setDestino(e.target.value)}
            />
          </div>
        </div>

        {/* Destinos Populares de São Paulo (Atalhos com 1 toque) */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { label: 'Av. Paulista', query: 'Av. Paulista' },
            { label: 'Terminal Lapa', query: 'Terminal Lapa' },
            { label: 'Faria Lima', query: 'Faria Lima' },
            { label: 'Parque Ibirapuera', query: 'Parque Ibirapuera' },
            { label: 'USP Butantã', query: 'Cidade Universitaria USP' }
          ].map((dest) => (
            <button
              key={dest.query}
              onClick={() => {
                setDestino(dest.query);
                handleCalculate(dest.query);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              📍 {dest.label}
            </button>
          ))}
        </div>

        {/* Botão de Ação */}
        <button
          onClick={() => handleCalculate()}
          disabled={isCalculating}
          className="btn-primary"
          style={{ justifyContent: 'center', height: '44px' }}
        >
          <Sparkles size={16} />
          {isCalculating ? 'Calculando Trajeto & Ônibus...' : 'Traçar Melhor Rota'}
        </button>
      </div>

      {/* Resultado da Rota Calculada */}
      {calculatedRoute && (
        <div
          className="glass-panel"
          style={{
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* Card Resumo do Tempo Total */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2), rgba(16, 185, 129, 0.15))',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase' }}>
                Tempo Total Estimado
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#F8FAFC' }}>
                ~{calculatedRoute.totalDurationMinutes} min
              </div>
              <div style={{ fontSize: '12px', color: '#38BDF8', marginTop: '2px' }}>
                Distância: {(calculatedRoute.totalDistanceMeters / 1000).toFixed(1)} km
              </div>
            </div>

            {/* Destaque do Ônibus no Ponto de Partida */}
            <div
              style={{
                background: 'rgba(227, 6, 19, 0.15)',
                border: '1px solid rgba(227, 6, 19, 0.4)',
                borderRadius: '12px',
                padding: '10px 14px',
                textAlign: 'right'
              }}
            >
              <div style={{ fontSize: '10px', color: '#FCA5A5', fontWeight: 700 }}>
                ÔNIBUS NO PONTO EM:
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#E30613' }}>
                {calculatedRoute.nextBusEtaMinutes} min
              </div>
              <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                {calculatedRoute.recommendedLine.lt}-{calculatedRoute.recommendedLine.tl}
              </div>
            </div>
          </div>

          {/* Selo de Precisão dos Dados */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '10px',
              fontSize: '11px',
              color: '#34D399'
            }}
          >
            <ShieldCheck size={16} />
            <span>
              <strong>{calculatedRoute.lastTelemetryText}</strong>
            </span>
          </div>

          {/* Passo a Passo da Rota */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Passo a Passo do Trajeto:
            </h4>

            {calculatedRoute.steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  position: 'relative'
                }}
              >
                {/* Ícone do Passo */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background:
                      step.type === 'WALK'
                        ? 'rgba(56, 189, 248, 0.15)'
                        : step.type === 'BUS'
                        ? 'rgba(227, 6, 19, 0.15)'
                        : 'rgba(16, 185, 129, 0.15)',
                    color:
                      step.type === 'WALK'
                        ? '#38BDF8'
                        : step.type === 'BUS'
                        ? '#E30613'
                        : '#10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  {step.type === 'WALK' && <Footprints size={16} />}
                  {step.type === 'BUS' && <Bus size={16} />}
                  {step.type === 'DESTINATION' && <CheckCircle2 size={16} />}
                </div>

                {/* Descrição do Passo */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {step.instruction}
                  </div>
                  {step.distanceMeters > 0 && (
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {step.distanceMeters}m · ~{step.durationMinutes} min
                    </div>
                  )}
                  {step.nextBusEtaMinutes !== undefined && (
                    <div
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        color: '#E30613',
                        marginTop: '4px',
                        background: 'rgba(227, 6, 19, 0.08)',
                        display: 'inline-block',
                        padding: '2px 6px',
                        borderRadius: '4px'
                      }}
                    >
                      ⏱️ Próximo ônibus previsto em {step.nextBusEtaMinutes} min no ponto
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
