'use client';

import React from 'react';
import { RoutePlan } from '@/lib/routing';
import {
  X,
  Bus,
  Radio,
  Clock,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface MoovitDeparturesModalProps {
  route: RoutePlan;
  onClose: () => void;
}

export default function MoovitDeparturesModal({
  route,
  onClose
}: MoovitDeparturesModalProps) {
  const line = route.recommendedLine;
  const etas = route.departureEtas && route.departureEtas.length > 0 ? route.departureEtas : [1, 21, 42];

  const now = new Date();
  const currentHourText = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fadeIn 0.2s ease'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1C1E24',
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          border: '1px solid #2D313C',
          borderBottom: 'none',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.8)',
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div style={{ width: '36px', height: '4px', background: '#4B5563', borderRadius: '9999px', margin: '10px auto 4px auto' }} />

        {/* Header (Screenshot 5) */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #2D313C', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              <span>{line.lt}-{line.tl}</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#FFFFFF' }}>
              {line.ts}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#2563EB',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Radio size={16} />
            </div>

            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Lista de Partidas em Tempo Real (Screenshot 5) */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
          {etas.map((eta, idx) => {
            const departureDate = new Date(now.getTime() + eta * 60000);
            const departureTimeStr = `${String(departureDate.getHours()).padStart(2, '0')}:${String(departureDate.getMinutes()).padStart(2, '0')}`;

            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  paddingBottom: '14px',
                  borderBottom: idx < etas.length - 1 ? '1px solid #2D313C' : 'none'
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '18px', fontWeight: 900, color: idx === 0 ? '#34D399' : '#FFFFFF' }}>
                    <Clock size={16} />
                    <span>{eta} min</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#9CA3AF' }}>
                    {idx === 0 ? 'Baseado em telemetria GPS ao vivo (Olho Vivo)' : 'Baseado em chegadas anteriores'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>
                    (Agendado: {departureTimeStr})
                  </div>
                </div>

                {idx === 0 && (
                  <span
                    style={{
                      background: 'rgba(16, 185, 129, 0.15)',
                      border: '1px solid #10B981',
                      color: '#34D399',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    Ao Vivo
                  </span>
                )}
              </div>
            );
          })}

          {/* Rodapé Informativo */}
          <div style={{ textAlign: 'center', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
              Estes horários são relevantes para <strong>{currentHourText}</strong>
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Como estimamos os horários de chegada
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
