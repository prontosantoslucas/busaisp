'use client';

import React from 'react';
import { SPTransPrevisaoLinha, SPTransPrevisaoVeiculo } from '@/types/sptrans';
import { Clock, Accessibility, Bus, ChevronRight, Navigation } from 'lucide-react';

interface LineArrivalCardProps {
  linhaPrevisao: SPTransPrevisaoLinha;
  onSelectVehicle?: (veiculo: SPTransPrevisaoVeiculo) => void;
}

export default function LineArrivalCard({
  linhaPrevisao,
  onSelectVehicle
}: LineArrivalCardProps) {
  // Calcular minutos até a chegada para cada veículo
  const calculateMinutes = (timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const now = new Date();
      const arrival = new Date();
      arrival.setHours(hours, minutes, 0, 0);

      // Se passou da meia-noite
      if (arrival.getTime() < now.getTime()) {
        arrival.setDate(arrival.getDate() + 1);
      }

      const diffMs = arrival.getTime() - now.getTime();
      const diffMins = Math.max(1, Math.round(diffMs / 60000));
      return diffMins;
    } catch {
      return 5;
    }
  };

  return (
    <div
      style={{
        background: 'rgba(23, 32, 51, 0.7)',
        borderRadius: '14px',
        border: '1px solid var(--border-color)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Header do Card de Linha */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #E30613, #99000A)',
              color: '#fff',
              fontWeight: 800,
              fontSize: '14px',
              padding: '4px 10px',
              borderRadius: '6px',
              boxShadow: '0 2px 8px rgba(227, 6, 19, 0.3)'
            }}
          >
            {linhaPrevisao.c}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>
              {linhaPrevisao.lt0}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {linhaPrevisao.qv} {linhaPrevisao.qv === 1 ? 'veículo previsto' : 'veículos previstos'}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Veículos Previstos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {linhaPrevisao.vs.map((v, idx) => {
          const mins = calculateMinutes(v.t);
          const isUrgent = mins <= 3;

          return (
            <div
              key={`${v.p}_${idx}`}
              onClick={() => onSelectVehicle && onSelectVehicle(v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 12px',
                background: isUrgent ? 'rgba(227, 6, 19, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: isUrgent ? '1px solid rgba(227, 6, 19, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                cursor: onSelectVehicle ? 'pointer' : 'default'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bus size={15} color={isUrgent ? '#E30613' : 'var(--text-secondary)'} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Ônibus #{v.p}
                </span>
                {v.a && (
                  <span
                    title="Veículo Acessível com Elevador"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      background: 'rgba(16, 185, 129, 0.15)',
                      color: '#10B981',
                      borderRadius: '4px',
                      padding: '2px 4px'
                    }}
                  >
                    <Accessibility size={12} />
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: isUrgent ? '#E30613' : '#38BDF8'
                    }}
                  >
                    {mins} min
                  </div>
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                    previsto às {v.t}
                  </div>
                </div>
                {onSelectVehicle && <ChevronRight size={14} color="var(--text-muted)" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
