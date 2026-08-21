'use client';

import React, { useState, useMemo } from 'react';
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
  Bus,
  Clock,
  Sparkles,
  ArrowRight,
  Calendar,
  Check,
  X
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

type TimeMode = 'NOW' | 'DEPART_AT' | 'ARRIVE_BY';

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
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);
  const [timeMode, setTimeMode] = useState<TimeMode>('NOW');
  const [customTime, setCustomTime] = useState<string>(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });

  // Ordenação Real dos Resultados
  const sortedRoutes = useMemo(() => {
    const list = [...routes];
    if (filterSort === 'duration') {
      list.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes || a.transferCount - b.transferCount);
    } else if (filterSort === 'walk') {
      list.sort((a, b) => a.totalWalkDistanceMeters - b.totalWalkDistanceMeters || a.totalDurationMinutes - b.totalDurationMinutes);
    } else if (filterSort === 'transfers') {
      list.sort((a, b) => a.transferCount - b.transferCount || a.totalDurationMinutes - b.totalDurationMinutes);
    }
    return list;
  }, [routes, filterSort]);

  // Formatação de Horários com base na seleção de Saída/Chegada
  const formatRouteTimes = (route: RoutePlan) => {
    if (timeMode === 'NOW') {
      return {
        departureHour: route.departureHour,
        arrivalHour: route.arrivalHour
      };
    }

    const [hours, minutes] = customTime.split(':').map(Number);
    if (timeMode === 'DEPART_AT') {
      const depDate = new Date();
      depDate.setHours(hours, minutes, 0, 0);
      const arrDate = new Date(depDate.getTime() + route.totalDurationMinutes * 60000);
      return {
        departureHour: `${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`,
        arrivalHour: `${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`
      };
    } else {
      // ARRIVE_BY
      const arrDate = new Date();
      arrDate.setHours(hours, minutes, 0, 0);
      const depDate = new Date(arrDate.getTime() - route.totalDurationMinutes * 60000);
      return {
        departureHour: `${String(depDate.getHours()).padStart(2, '0')}:${String(depDate.getMinutes()).padStart(2, '0')}`,
        arrivalHour: `${String(arrDate.getHours()).padStart(2, '0')}:${String(arrDate.getMinutes()).padStart(2, '0')}`
      };
    }
  };

  const getTimeButtonLabel = () => {
    if (timeMode === 'NOW') return 'Sair Agora ▾';
    if (timeMode === 'DEPART_AT') return `Partida: ${customTime} ▾`;
    return `Chegada: ${customTime} ▾`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* Top Header com Inputs de Origem / Destino */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px', position: 'relative' }}>
          <button
            onClick={() => setIsTimeModalOpen(!isTimeModalOpen)}
            className="moovit-pill"
            style={{
              background: timeMode !== 'NOW' ? '#2563EB' : '#262932',
              color: '#FFFFFF',
              borderColor: timeMode !== 'NOW' ? '#3B82F6' : '#323642'
            }}
          >
            <Clock size={14} color={timeMode !== 'NOW' ? '#FFFFFF' : '#9CA3AF'} />
            <span>{getTimeButtonLabel()}</span>
          </button>

          <button
            onClick={onToggleMap}
            className={`moovit-pill ${isMapVisible ? 'active' : ''}`}
          >
            <MapIcon size={14} />
            <span>{isMapVisible ? 'Esconder Mapa' : 'Ver Mapa'}</span>
          </button>
        </div>

        {/* Menu Dropdown de Seleção de Horário */}
        {isTimeModalOpen && (
          <div
            style={{
              background: '#262932',
              border: '1px solid #3B82F6',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '6px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                Horário da Viagem
              </span>
              <button
                onClick={() => setIsTimeModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'NOW' as TimeMode, label: 'Sair Agora' },
                { id: 'DEPART_AT' as TimeMode, label: 'Partida em' },
                { id: 'ARRIVE_BY' as TimeMode, label: 'Chegar até' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => setTimeMode(m.id)}
                  style={{
                    flex: 1,
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: 'none',
                    background: timeMode === m.id ? '#FF6600' : '#1C1E24',
                    color: '#FFFFFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {timeMode !== 'NOW' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#1C1E24', padding: '8px 12px', borderRadius: '8px' }}>
                <Clock size={16} color="#38BDF8" />
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '15px',
                    fontWeight: 800,
                    outline: 'none',
                    width: '100%'
                  }}
                />
              </div>
            )}

            <button
              onClick={() => {
                setIsTimeModalOpen(false);
                onCalculate();
              }}
              style={{
                background: '#2563EB',
                border: 'none',
                borderRadius: '8px',
                padding: '8px',
                color: '#fff',
                fontWeight: 800,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              Aplicar Horário
            </button>
          </div>
        )}
      </div>

      {/* Pílulas de Filtros e Ordenação 100% Funcionais */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
        <button
          onClick={() => setFilterSort('duration')}
          className={`moovit-pill ${filterSort === 'duration' ? 'active' : ''}`}
          style={{
            background: filterSort === 'duration' ? '#FF6600' : '#1C1E24',
            color: '#FFFFFF',
            borderColor: filterSort === 'duration' ? '#FF6600' : '#2D313C'
          }}
        >
          <SlidersHorizontal size={13} />
          <span>Ordenar: Mais Rápido</span>
        </button>

        <button
          onClick={() => setFilterSort('walk')}
          className={`moovit-pill ${filterSort === 'walk' ? 'active' : ''}`}
          style={{
            background: filterSort === 'walk' ? '#FF6600' : '#1C1E24',
            color: '#FFFFFF',
            borderColor: filterSort === 'walk' ? '#FF6600' : '#2D313C'
          }}
        >
          <Footprints size={13} />
          <span>Menos passos</span>
        </button>

        <button
          onClick={() => setFilterSort('transfers')}
          className={`moovit-pill ${filterSort === 'transfers' ? 'active' : ''}`}
          style={{
            background: filterSort === 'transfers' ? '#FF6600' : '#1C1E24',
            color: '#FFFFFF',
            borderColor: filterSort === 'transfers' ? '#FF6600' : '#2D313C'
          }}
        >
          <ArrowLeftRight size={13} />
          <span>Menos trocas</span>
        </button>
      </div>

      {/* Lista de Rotas Encontradas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {isCalculating && (
          <div style={{ background: '#1C1E24', borderRadius: '14px', padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            <div className="animate-spin" style={{ margin: '0 auto 8px auto', width: '24px', height: '24px', border: '3px solid #FF6600', borderTopColor: 'transparent', borderRadius: '50%' }} />
            Calculando melhores alternativas em tempo real...
          </div>
        )}

        {!isCalculating && sortedRoutes.length === 0 && (
          <div style={{ background: '#1C1E24', borderRadius: '14px', padding: '20px', textAlign: 'center', color: '#9CA3AF', fontSize: '13px' }}>
            Nenhuma rota encontrada para os endereços informados.
          </div>
        )}

        {!isCalculating && sortedRoutes.map((route, idx) => {
          const isSelected = idx === selectedRouteIndex;
          const { departureHour, arrivalHour } = formatRouteTimes(route);

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
                borderLeft: isSelected ? '4px solid #38BDF8' : '1px solid #2D313C',
                cursor: 'pointer'
              }}
            >
              {/* Linha Superior: Cadeia Visual + Duração Total com Seta */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                {/* Cadeia de Trajeto */}
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

                {/* Duração Total e Seta */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '16px', fontWeight: 900, color: '#FFFFFF' }}>
                    {route.totalDurationMinutes} min
                  </span>
                  <ArrowRight size={18} color="#38BDF8" />
                </div>
              </div>

              {/* Linha Inferior: Horário e Ponto de Embarque */}
              <div style={{ fontSize: '12px', color: '#9CA3AF', lineHeight: 1.4 }}>
                <span style={{ color: '#FFFFFF', fontWeight: 700 }}>
                  às {departureHour} (chega às {arrivalHour})
                </span>
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
