'use client';

import React, { useState } from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  ArrowLeft,
  ArrowUpDown,
  Plus,
  Map as MapIcon,
  SlidersHorizontal,
  Footprints,
  ArrowLeftRight,
  ChevronRight,
  Globe,
  Bus,
  Clock,
  Sparkles
} from 'lucide-react';

interface MoovitRouteResultsProps {
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
}

export default function MoovitRouteResults({
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
  isCalculating
}: MoovitRouteResultsProps) {
  const [filterSort, setFilterSort] = useState<'duration' | 'walk' | 'transfers'>('duration');

  // Separar rotas de Bilhete Único (SPTrans) e Outras
  const buRoutes = routes.filter((r) => r.fareType === 'BILHETE_UNICO' || r.transferCount <= 1);
  const otherRoutes = routes.filter((r) => !buRoutes.includes(r));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Header com Inputs de Origem / Destino (Screenshot 2) */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
        }}
      >
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
            title="Voltar"
          >
            <ArrowLeft size={22} />
          </button>

          {/* Form de Endereços */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', position: 'relative' }}>
            {/* Origem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#262932', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #9CA3AF', display: 'inline-block' }} />
              <input
                type="text"
                value={origem}
                onChange={(e) => onOrigemChange(e.target.value)}
                placeholder="Local atual"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>

            {/* Destino */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#262932', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#FF6600', display: 'inline-block' }} />
              <input
                type="text"
                value={destino}
                onChange={(e) => onDestinoChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onCalculate()}
                placeholder="Para onde você quer ir?"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFFFFF',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  width: '100%'
                }}
              />
            </div>
          </div>

          {/* Botões Laterais: Inverter e Adicionar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <button
              onClick={onSwap}
              style={{
                background: '#262932',
                border: '1px solid #323642',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Inverter Origem e Destino"
            >
              <ArrowUpDown size={15} />
            </button>
            <button
              onClick={onCalculate}
              style={{
                background: '#262932',
                border: '1px solid #323642',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Recalcular"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Pílulas de Opções: Sair agora & Ver Mapa (Screenshot 2) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <button className="moovit-pill">
            <Clock size={14} color="#9CA3AF" />
            <span>Sair agora ▾</span>
          </button>

          <button
            onClick={onToggleMap}
            className={`moovit-pill ${isMapVisible ? 'active' : ''}`}
          >
            <MapIcon size={14} />
            <span>{isMapVisible ? 'Esconder Mapa' : 'Ver Mapa'}</span>
          </button>
        </div>
      </div>

      {/* Pílulas de Filtros e Ordenação (Screenshot 2) */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setFilterSort('duration')}
          className={`moovit-pill ${filterSort === 'duration' ? 'active' : ''}`}
        >
          <SlidersHorizontal size={13} />
          <span>Ordenar: Mais Rápido</span>
        </button>

        <button
          onClick={() => setFilterSort('walk')}
          className={`moovit-pill ${filterSort === 'walk' ? 'active' : ''}`}
        >
          <Footprints size={13} />
          <span>Menos passos</span>
        </button>

        <button
          onClick={() => setFilterSort('transfers')}
          className={`moovit-pill ${filterSort === 'transfers' ? 'active' : ''}`}
        >
          <ArrowLeftRight size={13} />
          <span>Menos trocas</span>
        </button>
      </div>

      {/* Seção: Rotas apenas com Bilhete Único (Screenshot 2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#9CA3AF', paddingLeft: '4px' }}>
          Rotas apenas com Bilhete Único (SPTrans)
        </div>

        {isCalculating && (
          <div style={{ background: '#1C1E24', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            <div className="animate-spin" style={{ margin: '0 auto 8px auto', width: '24px', height: '24px', border: '3px solid #FF6600', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Calculando melhores alternativas em tempo real...
          </div>
        )}

        {!isCalculating && routes.length === 0 && (
          <div style={{ background: '#1C1E24', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            Nenhuma rota encontrada para os endereços informados.
          </div>
        )}

        {!isCalculating && routes.map((route, idx) => {
          const isSelected = idx === selectedRouteIndex;
          const walkSteps = route.steps.filter((s) => s.type === 'WALK');
          const busSteps = route.steps.filter((s) => s.type === 'BUS');

          return (
            <div
              key={route.id || idx}
              onClick={() => onSelectRoute(idx)}
              className={`moovit-card ${isSelected ? 'selected' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                {/* Lado Esquerdo: Duração e Horários */}
                <div style={{ minWidth: '70px' }}>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                    {Math.floor(route.totalDurationMinutes / 60) > 0
                      ? `${Math.floor(route.totalDurationMinutes / 60)} h ${route.totalDurationMinutes % 60} min`
                      : `${route.totalDurationMinutes} min`}
                  </div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <span>{route.departureHour}</span>
                    <span>⇣</span>
                    <span>{route.arrivalHour}</span>
                  </div>
                </div>

                {/* Lado Direito: Cadeia Visual de Transporte */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {/* Visual Chain: 🚶 13 > [🚌 1703-10] > 🚶 8 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    {route.steps.map((step, sIdx) => (
                      <React.Fragment key={sIdx}>
                        {step.type === 'WALK' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#D1D5DB' }}>
                            <Footprints size={14} color="#38BDF8" />
                            <span>{step.durationMinutes}</span>
                          </div>
                        )}

                        {step.type === 'BUS' && (
                          <div
                            style={{
                              background: '#1E3A8A',
                              border: '1px solid #3B82F6',
                              color: '#FFFFFF',
                              padding: '2px 7px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Bus size={13} />
                            <span>{step.busLine}</span>
                          </div>
                        )}

                        {sIdx < route.steps.length - 2 && (
                          <ChevronRight size={12} color="#6B7280" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Subtítulo: Sai em ⏱️ 14, 22, 30 min de Av. Zaki Narchi • R$ 5,30 */}
                  <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>
                    <span>Sai em ⏱️ <strong style={{ color: '#FFFFFF' }}>{route.departureEtas.join(', ')} min</strong> de {route.departureStop.np} • <strong style={{ color: '#34D399' }}>{route.farePrice}</strong></span>
                  </div>

                  {/* Badge Ecológico: 🌍 CO2e: 156 g */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#10B981' }}>
                    <Globe size={12} />
                    <span>CO2e: {route.carbonGrams} g</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
