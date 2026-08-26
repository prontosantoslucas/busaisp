'use client';

import React, { useEffect, useState } from 'react';
import { SPTransParada, SPTransPrevisaoLinha } from '@/types/sptrans';
import {
  X,
  Bus,
  Radio,
  MapPin,
  RefreshCw
} from 'lucide-react';

interface StopArrivalsModalProps {
  parada: SPTransParada;
  onClose: () => void;
}

interface LineArrival {
  codigo: number;
  letreiro: string;
  destino: string;
  acessivel: boolean;
  etasMinutos: number[];
}

// Converte "HH:MM" (horário previsto da SPTrans) em minutos a partir de agora,
// cuidando da virada de meia-noite (ex.: consulta às 23:58, previsão às 00:05).
// Uma diferença negativa GRANDE (> 1h) não é virada de meia-noite — é previsão
// desatualizada/no passado; nesse caso não inventamos um horário futuro.
function toMinutesFromNow(horario: string): number | null {
  const partes = horario.split(':').map(Number);
  if (partes.length !== 2 || partes.some(Number.isNaN)) return null;
  const [horas, minutos] = partes;
  const agora = new Date();
  const diffBruto = (horas * 60 + minutos) - (agora.getHours() * 60 + agora.getMinutes());
  if (diffBruto < -60) return null;
  return diffBruto < 0 ? diffBruto + 24 * 60 : diffBruto;
}

export default function StopArrivalsModal({ parada, onClose }: StopArrivalsModalProps) {
  const [linhas, setLinhas] = useState<LineArrival[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const res = await fetch(`/api/onibus?tipo=previsao_parada&codigo=${parada.cp}`);
      const json = await res.json();

      if (json.success && json.data?.p?.l) {
        const linhasPrevisao: SPTransPrevisaoLinha[] = json.data.p.l;

        const parsed: LineArrival[] = linhasPrevisao.map((l) => {
          const etas = (l.vs || [])
            .map((v) => toMinutesFromNow(v.t))
            .filter((m): m is number => m !== null)
            .sort((a, b) => a - b);

          return {
            codigo: l.cl,
            letreiro: l.c,
            destino: l.lt1 || l.lt0 || '',
            acessivel: (l.vs || []).some((v) => v.a),
            etasMinutos: etas
          };
        });

        // Ordenar por tempo de chegada da primeira previsão de cada linha —
        // quem chega primeiro nessa parada aparece primeiro na lista.
        parsed.sort((a, b) => {
          const aEta = a.etasMinutos[0] ?? Infinity;
          const bEta = b.etasMinutos[0] ?? Infinity;
          return aEta - bEta;
        });

        setLinhas(parsed);
        setLastUpdated(json.data.hr || null);
      } else {
        setLinhas([]);
      }
    } catch (err) {
      console.error('[StopArrivalsModal] Erro ao buscar previsão da parada:', err);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parada.cp]);

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
        <div style={{ width: '36px', height: '4px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '9999px', margin: '10px auto 4px auto' }} />

        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <MapPin size={17} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 700 }}>LINHAS NESTE PONTO</div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {parada.np}
              </div>
            </div>
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
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Status */}
        <div style={{ padding: '10px 20px', background: 'rgba(0, 0, 0, 0.25)', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', fontWeight: 800, color: '#34D399' }}>
            <Radio size={12} className="animate-pulse" />
            <span>AO VIVO{lastUpdated ? ` · ${lastUpdated}` : ''}</span>
          </div>
          <button
            onClick={load}
            style={{ background: 'none', border: 'none', color: '#38BDF8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', fontWeight: 700 }}
          >
            <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
            <span>Atualizar</span>
          </button>
        </div>

        {/* Lista de linhas ordenada por chegada */}
        <div style={{ padding: '14px 20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '28px 0' }}>
              <div style={{ width: '26px', height: '26px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: '12.5px', color: '#94A3B8' }}>Consultando linhas em tempo real...</span>
            </div>
          ) : hasError ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
              Não foi possível consultar as linhas desta parada agora. Tente atualizar.
            </div>
          ) : linhas.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontSize: '13px' }}>
              Nenhuma linha com previsão de chegada nesta parada agora.
            </div>
          ) : (
            linhas.map((l, idx) => {
              const proximaEta = l.etasMinutos[0];
              return (
                <div
                  key={`${l.codigo}-${idx}`}
                  style={{
                    background: idx === 0 ? 'rgba(6, 182, 212, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                    border: idx === 0 ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div className="bus-badge" style={{ flexShrink: 0 }}>
                      <Bus size={13} />
                      <span>{l.letreiro}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        → {l.destino}
                      </span>
                      {l.acessivel && (
                        <span style={{ fontSize: '10.5px', color: '#10B981', fontWeight: 700 }}>Acessível ♿</span>
                      )}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 900,
                        color: proximaEta !== undefined && proximaEta <= 3 ? '#10B981' : '#F8FAFC',
                        background: proximaEta !== undefined && proximaEta <= 3 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                        padding: '4px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {proximaEta === undefined ? 'Sem previsão' : proximaEta <= 1 ? 'Agora' : `${proximaEta} min`}
                    </span>
                    {l.etasMinutos.length > 1 && (
                      <div style={{ fontSize: '10px', color: '#64748B', marginTop: '3px' }}>
                        depois: {l.etasMinutos.slice(1, 3).join(', ')} min
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
