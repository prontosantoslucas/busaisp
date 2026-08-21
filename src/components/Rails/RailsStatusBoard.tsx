'use client';

import React, { useState, useEffect } from 'react';
import { RailsResponse, RailLine, RailOperator } from '@/types/trilhos';
import {
  TrainTrack,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  Filter
} from 'lucide-react';

export default function RailsStatusBoard() {
  const [data, setData] = useState<RailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('TODAS');
  const [selectedLineDetail, setSelectedLineDetail] = useState<RailLine | null>(null);

  const fetchRails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/trilhos/status');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Erro ao buscar status dos trilhos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRails();
    // Auto-refresh a cada 60 segundos
    const interval = setInterval(fetchRails, 60000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span className="status-indicator normal">
            <CheckCircle2 size={13} />
            <span>Normal</span>
          </span>
        );
      case 'VELOCIDADE_REDUZIDA':
        return (
          <span className="status-indicator reduced">
            <AlertTriangle size={13} />
            <span>Velocidade Reduzida</span>
          </span>
        );
      case 'OPERACAO_PARCIAL':
      case 'PARALISADA':
        return (
          <span className="status-indicator paused">
            <XCircle size={13} />
            <span>Paralisada / Parcial</span>
          </span>
        );
      default:
        return (
          <span className="status-indicator normal">
            <CheckCircle2 size={13} />
            <span>{status}</span>
          </span>
        );
    }
  };

  const lines = data?.lines || [];
  const filteredLines = lines.filter((l) => {
    if (selectedFilter === 'TODAS') return true;
    if (selectedFilter === 'METRO') return l.operator === 'METRO';
    if (selectedFilter === 'CPTM') return l.operator === 'CPTM';
    if (selectedFilter === 'CONCESSIONARIAS') return l.operator === 'VIAQUATRO' || l.operator === 'VIAMOBILIDADE';
    return true;
  });

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
      {/* Top Banner do Painel */}
      <div
        className="glass-panel"
        style={{
          borderRadius: '16px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #003399, #EE1D23)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 12px rgba(0, 51, 153, 0.4)'
              }}
            >
              <TrainTrack size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Status dos Trilhos (SP)</h2>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Metrô · CPTM · ViaQuatro · ViaMobilidade
              </p>
            </div>
          </div>

          <button
            onClick={fetchRails}
            className="btn-icon"
            style={{ width: '36px', height: '36px' }}
            title="Atualizar status"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Resumo Rápido de Linhas */}
        {data && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '10px 14px',
              borderRadius: '12px',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total:</span>
              <strong style={{ color: '#fff' }}>{data.summary.total} Linhas</strong>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
                <CheckCircle2 size={14} />
                <span>{data.summary.normal} normais</span>
              </div>

              {data.summary.withIssues > 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
                  <AlertTriangle size={14} />
                  <span>{data.summary.withIssues} com lentidão</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#94A3B8' }}>
                  <span>0 ocorrências</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Filtros de Operadora */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'TODAS', label: 'Todas' },
            { id: 'METRO', label: 'Metrô' },
            { id: 'CPTM', label: 'CPTM' },
            { id: 'CONCESSIONARIAS', label: 'Concessionárias' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFilter(f.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: selectedFilter === f.id ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                color: selectedFilter === f.id ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '12px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Linhas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredLines.map((line) => {
          const isSelected = selectedLineDetail?.id === line.id;

          return (
            <div
              key={line.id}
              onClick={() => setSelectedLineDetail(isSelected ? null : line)}
              className="glass-panel"
              style={{
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                cursor: 'pointer',
                borderLeft: `4px solid ${line.hexColor}`,
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    className="metro-badge"
                    style={{
                      background: line.hexColor,
                      color: line.hexColor === '#FFF000' || line.hexColor === '#A7A8AA' ? '#111' : '#fff'
                    }}
                  >
                    {line.number}
                  </div>

                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                      {line.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {line.operator} · Atualizado: {line.updatedAt}
                    </div>
                  </div>
                </div>

                <div>{getStatusBadge(line.status)}</div>
              </div>

              {/* Descrição expandida */}
              {(isSelected || line.status !== 'NORMAL') && line.description && (
                <div
                  style={{
                    fontSize: '12px',
                    color: line.status === 'NORMAL' ? 'var(--text-secondary)' : '#FDE68A',
                    background: line.status === 'NORMAL' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(245, 158, 11, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginTop: '4px'
                  }}
                >
                  {line.description}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Rodapé Informativo */}
      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
        Fonte: Informações oficiais de operação CCM / Metrô SP / CPTM
      </div>
    </div>
  );
}
