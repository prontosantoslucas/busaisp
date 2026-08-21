'use client';

import React, { useState, useEffect, useRef } from 'react';
import { RoutePlan, RouteLocation, RouteSearchResult } from '@/lib/routing';
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
  ChevronRight,
  Zap,
  Activity,
  Layers,
  AlertCircle
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
  const [routeResult, setRouteResult] = useState<RouteSearchResult | null>(null);
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number>(0);
  const [popularDestinations, setPopularDestinations] = useState<string[]>([
    'Shopping Center Norte',
    'Metrô / Terminal Tucuruvi',
    'Avenida Paulista, 1578',
    'Metrô / Terminal Santana',
    'Rua Flor de Maio, 40'
  ]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Carregar destinos mais procurados da API
  useEffect(() => {
    fetch('/api/rotas?tipo=destinos_populares')
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setPopularDestinations(json.data);
        }
      })
      .catch(err => console.warn('Erro ao carregar destinos populares:', err));
  }, []);

  // Auto-calcular rota padrão inicial ao abrir o app
  useEffect(() => {
    handleCalculate('Shopping Center Norte', undefined, { silent: true });
  }, []);

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

  const handleCalculate = async (
    destOverride?: string,
    destLocationOverride?: RouteLocation,
    options?: { silent?: boolean }
  ) => {
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
        setCalculationError(null);
        if (json.data.alternatives) {
          setRouteResult(json.data);
          setSelectedAlternativeIndex(0);
        } else if (json.data.primaryRoute) {
          setRouteResult(json.data);
          setSelectedAlternativeIndex(0);
        } else {
          // Formato plano único
          setRouteResult({
            primaryRoute: json.data,
            alternatives: [json.data]
          });
          setSelectedAlternativeIndex(0);
        }
      } else {
        setRouteResult(null);
        if (options?.silent) {
          console.warn('Cálculo inicial de rota falhou silenciosamente:', json.error);
        } else {
          setCalculationError(json.error || 'Não foi possível calcular uma rota para esse endereço.');
        }
      }
    } catch (e) {
      console.error('Erro ao calcular rota:', e);
      setRouteResult(null);
      if (!options?.silent) {
        setCalculationError('Erro de conexão ao calcular a rota. Tente novamente.');
      }
    } finally {
      setIsCalculating(false);
    }
  };

  const activeRoute = routeResult
    ? routeResult.alternatives[selectedAlternativeIndex] || routeResult.primaryRoute
    : null;

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
              Todas as linhas disponíveis para a sua região com tempo a pé
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
              placeholder="Para onde você vai? (ex: Rua Flor de Maio, 40)"
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

        {/* Destinos Mais Procurados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
            🔥 Destinos Mais Procurados:
          </div>
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
            {popularDestinations.map((dest) => (
              <button
                key={dest}
                onClick={() => {
                  setDestino(dest);
                  handleCalculate(dest);
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  color: 'var(--text-secondary)',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
              >
                📍 {dest}
              </button>
            ))}
          </div>
        </div>

        {/* Botão de Ação */}
        <button
          onClick={() => handleCalculate()}
          disabled={isCalculating}
          className="btn-primary"
          style={{ justifyContent: 'center', height: '44px' }}
        >
          <Sparkles size={16} />
          {isCalculating ? 'Calculando Todas as Linhas & Ônibus...' : 'Buscar Melhores Opções de Linhas'}
        </button>
      </div>

      {/* Confirmação de Endereço */}
      {activeRoute && (
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
              Endereço Confirmado: {activeRoute.destination.name}
            </div>
            <div style={{ fontSize: '11px', color: '#6EE7B7', marginTop: '2px' }}>
              {activeRoute.destination.addressDetails || 'São Paulo - SP'}
            </div>
          </div>
        </div>
      )}

      {/* Erro de Cálculo de Rota */}
      {calculationError && !activeRoute && (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px'
          }}
        >
          <AlertCircle size={20} color="#EF4444" style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
              Não foi possível calcular a rota
            </div>
            <div style={{ fontSize: '11px', color: '#FCA5A5', marginTop: '2px' }}>
              {calculationError}
            </div>
          </div>
        </div>
      )}

      {/* SELETOR DE TODAS AS LINHAS DISPONÍVEIS NA REGIÃO */}
      {routeResult && routeResult.alternatives.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
            <Layers size={16} color="#38BDF8" />
            <span>Linhas Disponíveis na Região ({routeResult.alternatives.length} opções):</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {routeResult.alternatives.map((alt, idx) => {
              const isSelected = idx === selectedAlternativeIndex;
              return (
                <div
                  key={alt.id}
                  onClick={() => setSelectedAlternativeIndex(idx)}
                  style={{
                    background: isSelected
                      ? 'linear-gradient(135deg, rgba(2, 132, 199, 0.22), rgba(227, 6, 19, 0.15))'
                      : 'rgba(23, 32, 51, 0.7)',
                    border: isSelected
                      ? '2px solid #38BDF8'
                      : '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 4px 20px rgba(56, 189, 248, 0.25)' : 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Badge da Linha */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div
                        style={{
                          background: 'var(--accent-sptrans)',
                          color: '#fff',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          fontWeight: 900,
                          fontSize: '14px',
                          boxShadow: '0 2px 8px rgba(227, 6, 19, 0.4)'
                        }}
                      >
                        {alt.recommendedLine.lt}-{alt.recommendedLine.tl}
                      </div>

                      {alt.transferCount > 0 && (
                        <div
                          style={{
                            background: 'rgba(251, 191, 36, 0.18)',
                            color: '#FBBF24',
                            border: '1px solid rgba(251, 191, 36, 0.35)',
                            padding: '4px 8px',
                            borderRadius: '8px',
                            fontSize: '10px',
                            fontWeight: 800,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {alt.transferCount} {alt.transferCount === 1 ? 'baldeação' : 'baldeações'}
                        </div>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                        Destino: {alt.recommendedLine.ts}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🚶 {alt.totalWalkDurationMinutes} min a pé ({alt.totalWalkDistanceMeters}m)</span>
                        <span>•</span>
                        <span>⏱️ Total: ~{alt.totalDurationMinutes} min</span>
                      </div>
                    </div>
                  </div>

                  {/* Tempo do Ônibus no Ponto */}
                  <div style={{ textAlign: 'right' }}>
                    {alt.nextBusEtaMinutes >= 0 ? (
                      <>
                        <div style={{ fontSize: '9px', color: '#FCA5A5', fontWeight: 700 }}>
                          NO PONTO EM
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 900, color: '#E30613' }}>
                          {alt.nextBusEtaMinutes} min
                        </div>
                      </>
                    ) : (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#94A3B8', maxWidth: '90px' }}>
                        Sem previsão em tempo real
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detalhes da Linha Selecionada */}
      {activeRoute && (
        <div
          className="glass-panel"
          style={{
            borderRadius: '16px',
            padding: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* Banner de Saída a Pé */}
          <div
            style={{
              background: 'rgba(2, 132, 199, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '12px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <Zap size={20} color="#38BDF8" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#E0F2FE', lineHeight: 1.4 }}>
              {activeRoute.departureSuggestion}
            </div>
          </div>

          {/* Botão de Ver Trajeto no Mapa */}
          <button
            onClick={() => onRouteCalculated(activeRoute)}
            className="btn-primary"
            style={{
              justifyContent: 'center',
              height: '46px',
              background: 'linear-gradient(135deg, #0284C7, #0369A1)',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            <Map size={18} />
            Ver Linha {activeRoute.recommendedLine.lt}-{activeRoute.recommendedLine.tl} no Mapa
          </button>

          {/* Passo a Passo da Rota */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Instruções de Deslocamento:
            </h4>

            {activeRoute.steps.map((step, idx) => (
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
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background:
                      step.type === 'WALK'
                        ? 'rgba(56, 189, 248, 0.18)'
                        : step.type === 'BUS'
                        ? 'rgba(227, 6, 19, 0.18)'
                        : 'rgba(16, 185, 129, 0.18)',
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
                  {step.type === 'WALK' && <Footprints size={17} />}
                  {step.type === 'BUS' && <Bus size={17} />}
                  {step.type === 'DESTINATION' && <CheckCircle2 size={17} />}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {step.instruction}
                  </div>
                  {step.detailedWalkGuide && (
                    <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px', lineHeight: 1.4 }}>
                      🚶 {step.detailedWalkGuide}
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
