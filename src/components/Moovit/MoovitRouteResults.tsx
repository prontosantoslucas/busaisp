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
  Sparkles,
  ArrowRight
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Header com Inputs de Origem / Destino (Screenshot 1 do novo print) */}
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
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Origem */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#262932', borderRadius: '8px', padding: '6px 12px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #9CA3AF', display: 'inline-block' }} />
              <input
                type="text"
                value={origem}
                onChange={(e) => onOrigemChange(e.target.value)}
                placeholder="Minha Localização"
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
                placeholder="Tremembé, São Paulo, 02363"
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

          {/* Botões Laterais */}
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

        {/* Pílulas de Opções */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
          <button className="moovit-pill">
            <Clock size={14} color="#9CA3AF" />
            <span>Sair Agora ▾</span>
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

      {/* Pílulas de Filtros e Ordenação */}
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

      {/* Lista de Rotas Encontradas (Foto 1) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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

          return (
            <div
              key={route.id || idx}
              onClick={() => onSelectRoute(idx)}
              className={`moovit-card ${isSelected ? 'selected' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                padding: '16px',
                borderLeft: isSelected ? '4px solid #38BDF8' : '1px solid #2D313C'
              }}
            >
              {/* Linha Superior: Cadeia Visual + Duração Total com Seta (Foto 1) */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                {/* Cadeia de Trajeto: 🚶 13 min > [ 🚌 1703-10 ] > [ 🚌 2029-10 ] > 🚶 3 min */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
                  {route.steps.map((step, sIdx) => (
                    <React.Fragment key={sIdx}>
                      {step.type === 'WALK' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '12px', fontWeight: 700, color: '#D1D5DB' }}>
                          <Footprints size={14} color="#38BDF8" />
                          <span>{step.durationMinutes} min</span>
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

                {/* Duração Total e Seta (ex: 51 min ➔) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
                    {route.totalDurationMinutes} min
                  </span>
                  <ArrowRight size={18} color="#38BDF8" />
                </div>
              </div>

              {/* Linha Inferior: Horário e Ponto de Embarque (Foto 1) */}
              <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>às {route.departureHour}</span>
                <span style={{ display: 'block', color: '#CBD5E1', marginTop: '2px' }}>
                  Embarque em <strong>{route.departureStop.np}</strong> {route.departureStop.ed ? `- ${route.departureStop.ed}` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
