'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoutePlan, RouteLocation } from '@/lib/routing';
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
  CheckCircle2,
  Search,
  Map,
  ChevronRight
} from 'lucide-react';

interface RoutePlannerProps {
  onRouteCalculated: (route: RoutePlan) => void;
  userCoords: [number, number] | null;
}

export default function RoutePlanner({ onRouteCalculated, userCoords }: RoutePlannerProps) {
  const [origem, setOrigem] = useState('Minha Localização');
  const [destino, setDestino] = useState('Shopping Center Norte');
  const [selectedDestLocation, setSelectedDestLocation] = useState<RouteLocation | null>(null);

  const [destSuggestions, setDestSuggestions] = useState<RouteLocation[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);

  const [isCalculating, setIsCalculating] = useState(false);
  const [calculatedRoute, setCalculatedRoute] = useState<RoutePlan | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Buscar sugestões enquanto o usuário digita o destino
  const handleDestinoChange = (text: string) => {
    setDestino(text);
    setSelectedDestLocation(null);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.trim().length >= 2) {
      setIsSearchingSuggestions(true);
      setShowSuggestions(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/rotas?tipo=sugestoes&q=${encodeURIComponent(text)}`);
          const json = await res.json();
          if (json.success && json.data) {
            setDestSuggestions(json.data);
          }
        } catch (e) {
          console.error('Erro ao buscar sugestões:', e);
        } finally {
          setIsSearchingSuggestions(false);
        }
      }, 250);
    } else {
      setDestSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (item: RouteLocation) => {
    setDestino(item.name);
    setSelectedDestLocation(item);
    setShowSuggestions(false);
    handleCalculate(item.name, item);
  };

  const handleSwap = () => {
    const temp = origem;
    setOrigem(destino);
    setDestino(temp);
  };

  const handleCalculate = async (destOverride?: string, destLocationOverride?: RouteLocation) => {
    const targetDest = destOverride || destino;
    if (!targetDest) return;

    setIsCalculating(true);
    try {
      let url = `/api/rotas?origem=${encodeURIComponent(origem)}&destino=${encodeURIComponent(targetDest)}`;
      if (origem === 'Minha Localização' && userCoords) {
        url += `&origLat=${userCoords[0]}&origLng=${userCoords[1]}`;
      }

      const destLoc = destLocationOverride || selectedDestLocation;
      if (destLoc) {
        url += `&destLat=${destLoc.lat}&destLng=${destLoc.lng}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setCalculatedRoute(json.data);
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
            <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Planejador de Rotas SP</h2>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Melhor trajeto com tempo de chegada do ônibus no seu ponto
            </p>
          </div>
        </div>

        {/* Inputs de Origem e Destino com Autocomplete */}
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
              zIndex: 10,
              background: 'rgba(30, 41, 64, 0.95)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
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
              placeholder="Para onde você vai? (ex: Rua Flor de Maio, Center Norte)"
              value={destino}
              onChange={(e) => handleDestinoChange(e.target.value)}
              onFocus={() => destino.trim().length >= 2 && setShowSuggestions(true)}
            />
          </div>

          {/* Dropdown de Sugestões de Endereço */}
          {showSuggestions && (
            <div
              style={{
                position: 'absolute',
                top: '94px',
                left: 0,
                right: 0,
                background: '#131B2A',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.8)',
                zIndex: 100,
                overflow: 'hidden',
                maxHeight: '220px',
                overflowY: 'auto'
              }}
            >
              {isSearchingSuggestions && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Buscando endereços em São Paulo...
                </div>
              )}

              {!isSearchingSuggestions && destSuggestions.length === 0 && (
                <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Nenhum endereço encontrado. Pressione Enter para calcular.
                </div>
              )}

              {!isSearchingSuggestions && destSuggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={16} color="#38BDF8" />
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>
                        {item.name}
                      </div>
                      {item.addressDetails && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {item.addressDetails}
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Atalhos Rápidos */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { label: 'Rua Flor de Maio', query: 'Rua Flor de Maio, 40' },
            { label: 'Center Norte', query: 'Shopping Center Norte' },
            { label: 'Jd. Fontális', query: 'Jardim Fontalis' },
            { label: 'Metrô Tucuruvi', query: 'Metrô Tucuruvi' },
            { label: 'Av. Paulista', query: 'Av. Paulista, 1578' }
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

      {/* Resultado com Confirmação Visual do Endereço e Traçado */}
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
          {/* Card de Confirmação de Endereço */}
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <CheckCircle2 size={20} color="#10B981" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                Endereço Confirmado: {calculatedRoute.destination.name}
              </div>
              <div style={{ fontSize: '11px', color: '#6EE7B7', marginTop: '2px' }}>
                {calculatedRoute.destination.addressDetails || 'São Paulo - SP'}
              </div>
            </div>
          </div>

          {/* Card Resumo do Tempo Total & Destaque do Ônibus */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(16, 185, 129, 0.15))',
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
                background: 'rgba(227, 6, 19, 0.2)',
                border: '1px solid rgba(227, 6, 19, 0.5)',
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

          {/* Botão de Ver Trajeto no Mapa */}
          <button
            onClick={() => onRouteCalculated(calculatedRoute)}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              height: '46px',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Map size={18} />
            Ver Traçado Completo no Mapa
          </button>

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
                        background: 'rgba(227, 6, 19, 0.1)',
                        display: 'inline-block',
                        padding: '3px 8px',
                        borderRadius: '6px'
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
