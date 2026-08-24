'use client';

import React from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  X,
  Bus,
  Radio,
  Clock,
  CheckCircle2
} from 'lucide-react';

interface TransitDeparturesModalProps {
  route: RoutePlan;
  onClose: () => void;
}

export default function TransitDeparturesModal({
  route,
  onClose
}: TransitDeparturesModalProps) {
  const line = route.recommendedLine;
  const etas = route.departureEtas || [];

  const now = new Date();
  const currentHourText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        className="bus-glass-panel"
        style={{
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          borderBottom: 'none',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.85)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div style={{ width: '36px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', margin: '10px auto 4px auto' }} />

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bus-badge" style={{ padding: '4px 10px', fontSize: '14px' }}>
              <Bus size={16} />
              <span>{line.lt}-{line.tl}</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
              {line.ts}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#F8FAFC',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Informações da Parada */}
        <div style={{ padding: '14px 20px', background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)' }}>
          <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>PARADA DE EMBARQUE SELECIONADA</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#38BDF8', marginTop: '2px' }}>
            {route.departureStop.np}
          </div>
          <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
            Horário atual de referência: {currentHourText}
          </div>
        </div>

        {/* Lista de Partidas em Tempo Real */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: '#34D399' }}>
            <Radio size={14} />
            <span>PRÓXIMAS PARTIDAS (GPS AO VIVO + PROGRAMAÇÃO SPTRANS)</span>
          </div>

          {etas.length > 0 ? (
            etas.map((minutesUntil, idx) => {
              const departureDate = new Date(now.getTime() + minutesUntil * 60000);
              const departureTimeStr = `${String(departureDate.getHours()).padStart(2, '0')}:${String(departureDate.getMinutes()).padStart(2, '0')}`;

              return (
                <div
                  key={idx}
                  style={{
                    background: idx === 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: idx === 0 ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: idx === 0 ? '#38BDF8' : '#F8FAFC' }}>
                      {departureTimeStr}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                        {line.ts}
                      </span>
                      <span style={{ fontSize: '11px', color: idx === 0 ? '#10B981' : '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        {idx === 0 ? (
                          <>
                            <Radio size={10} /> Ônibus rastreado ao vivo
                          </>
                        ) : (
                          <>
                            <Clock size={10} /> Horário programado
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        color: minutesUntil <= 3 ? '#10B981' : '#F8FAFC',
                        background: minutesUntil <= 3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {minutesUntil <= 1 ? 'Agora' : `em ${minutesUntil} min`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
              Nenhuma partida programada para os próximos minutos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
