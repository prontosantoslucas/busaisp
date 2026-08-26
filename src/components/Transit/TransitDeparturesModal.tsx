'use client';

import React from 'react';
import { getEtaColorTokens } from '@/lib/etaStyle';
import { formatSaoPauloTime } from '@/lib/dateUtils';
import {
  X,
  Bus,
  Radio
} from 'lucide-react';

interface TransitDeparturesModalProps {
  busLine: string;
  busDestination: string;
  boardStopName: string;
  departureEtas: number[];
  onClose: () => void;
}

export default function TransitDeparturesModal({
  busLine,
  busDestination,
  boardStopName,
  departureEtas,
  onClose
}: TransitDeparturesModalProps) {
  const etas = departureEtas || [];

  const now = new Date();
  const currentHourText = formatSaoPauloTime(now);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
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
          animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div style={{ width: '36px', height: '4px', background: 'var(--bus-border)', borderRadius: '9999px', margin: '10px auto 4px auto' }} />

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--bus-border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bus-badge" style={{ padding: '4px 10px', fontSize: '14px' }}>
              <Bus size={16} />
              <span>{busLine}</span>
            </div>
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
              {busDestination}
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'var(--bus-surface-elevated)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: 'var(--bus-text-primary)',
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
        <div style={{ padding: '14px 20px', background: 'var(--bus-surface-sunken)', borderBottom: '1px solid var(--bus-border-subtle)' }}>
          <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>PARADA DE EMBARQUE SELECIONADA</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--bus-violet)', marginTop: '2px' }}>
            {boardStopName}
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--bus-text-muted)', marginTop: '2px' }}>
            Horário atual de referência: {currentHourText}
          </div>
        </div>

        {/* Lista de Partidas em Tempo Real */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--bus-live)' }}>
            <Radio size={14} />
            <span>PRÓXIMAS PARTIDAS — PREVISÃO EM TEMPO REAL SPTRANS</span>
          </div>

          {etas.length > 0 ? (
            etas.map((minutesUntil, idx) => {
              const departureDate = new Date(now.getTime() + minutesUntil * 60000);
              const departureTimeStr = formatSaoPauloTime(departureDate);
              const etaColors = getEtaColorTokens(minutesUntil);

              return (
                <div
                  key={idx}
                  style={{
                    background: idx === 0 ? etaColors.background : 'var(--bus-surface-sunken)',
                    border: `1px solid ${idx === 0 ? etaColors.border : 'var(--bus-border-subtle)'}`,
                    borderRadius: 'var(--bus-radius-md)',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div className="bus-num" style={{ fontSize: '18px', fontWeight: 700, color: idx === 0 ? etaColors.color : 'var(--bus-text-primary)' }}>
                      {departureTimeStr}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>
                        {busDestination}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Radio size={10} /> Baseado no rastreamento GPS SPTrans
                      </span>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      className="bus-num"
                      style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: etaColors.color,
                        background: etaColors.background,
                        padding: '4px 8px',
                        borderRadius: 'var(--bus-radius-sm)',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}
                    >
                      {minutesUntil <= 1 ? 'Agora' : `em ${minutesUntil} min`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--bus-text-secondary)', fontSize: '13px' }}>
              Nenhuma partida programada para os próximos minutos.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
