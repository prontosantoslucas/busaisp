'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  SPTransLinha,
  SPTransVeiculo
} from '@/types/sptrans';
import {
  Search,
  Bus,
  ArrowRightLeft,
  Star,
  Activity,
  MapPin,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface LineItineraryPanelProps {
  selectedLine: SPTransLinha | null;
  onSelectLine: (line: SPTransLinha) => void;
  veiculos: SPTransVeiculo[];
  isLoadingVehicles: boolean;
  onToggleFavoriteLine?: () => void;
  isLineFavorited?: boolean;
}

export default function LineItineraryPanel({
  selectedLine,
  onSelectLine,
  veiculos,
  isLoadingVehicles,
  onToggleFavoriteLine,
  isLineFavorited
}: LineItineraryPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SPTransLinha[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Linhas populares de SP para acesso rápido
  const POPULAR_LINES = [
    { lt: '1703', tl: 10, tp: 'Jd. Hebron', ts: 'Shopping Center Norte', cl: 1703 },
    { lt: '8700', tl: 10, tp: 'Terminal Campo Limpo', ts: 'Praça Ramos de Azevedo', cl: 8700 },
    { lt: '8000', tl: 10, tp: 'Terminal Lapa', ts: 'Praça Ramos de Azevedo', cl: 8000 },
    { lt: '106A', tl: 10, tp: 'Metrô Santana', ts: 'Itaim Bibi', cl: 106 },
    { lt: '2012', tl: 10, tp: 'Jd. Fontális', ts: 'Metrô Santana', cl: 2012 }
  ];

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (term.trim().length >= 2) {
      setIsSearching(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/onibus?tipo=linhas&q=${encodeURIComponent(term)}`);
          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            setSearchResults(json.data);
          }
        } catch (e) {
          console.error('Erro ao buscar linhas:', e);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Header do Painel */}
      <div className="glass-panel" style={{ borderRadius: '16px', padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #E30613, #99000B)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(227, 6, 19, 0.4)'
            }}
          >
            <Bus size={19} />
          </div>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800 }}>Linhas & Itinerários</h3>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Acompanhe qualquer linha municipal e veículos em tempo real
            </p>
          </div>
        </div>

        {/* Input de Busca de Linhas */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={16}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px', height: '42px', fontSize: '13px' }}
            placeholder="Digite o número da linha ou bairro (ex: 1703, Santana, 8700)..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Atalhos Rápidos de Linhas */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginTop: '10px', paddingBottom: '2px' }}>
          {POPULAR_LINES.map((pl) => (
            <button
              key={pl.lt}
              onClick={() => {
                onSelectLine({
                  cl: pl.cl,
                  lc: false,
                  lt: pl.lt,
                  tl: pl.tl,
                  sl: 1,
                  tp: pl.tp,
                  ts: pl.ts
                });
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: selectedLine?.lt === pl.lt ? 'rgba(227, 6, 19, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                borderColor: selectedLine?.lt === pl.lt ? '#E30613' : 'rgba(255, 255, 255, 0.08)',
                color: selectedLine?.lt === pl.lt ? '#fff' : 'var(--text-secondary)',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              🚌 {pl.lt}-{pl.tl}
            </button>
          ))}
        </div>
      </div>

      {/* Resultados da Busca */}
      {searchTerm.trim().length >= 2 && (
        <div className="glass-panel" style={{ borderRadius: '14px', padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            {isSearching ? 'Buscando linhas na SPTrans...' : `Linhas encontradas (${searchResults.length}):`}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '240px', overflowY: 'auto' }}>
            {searchResults.map((l, idx) => (
              <div
                key={idx}
                onClick={() => onSelectLine(l)}
                style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(227, 6, 19, 0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      background: 'var(--accent-sptrans)',
                      color: '#fff',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '12px'
                    }}
                  >
                    {l.lt}-{l.tl}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                      {l.tp} → {l.ts}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      Sentido: {l.sl === 1 ? 'Principal (Ida)' : 'Secundário (Volta)'}
                    </div>
                  </div>
                </div>
                <ChevronRight size={14} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cartão de Detalhes da Linha Ativa no Mapa */}
      {selectedLine && (
        <div
          className="glass-panel"
          style={{
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            border: '1px solid rgba(227, 6, 19, 0.35)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'var(--accent-sptrans)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontWeight: 900,
                  fontSize: '15px'
                }}
              >
                {selectedLine.lt}-{selectedLine.tl}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                  {selectedLine.tp} ⇄ {selectedLine.ts}
                </div>
                <div style={{ fontSize: '11px', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <Activity size={12} />
                  <span>{isLoadingVehicles ? 'Atualizando GPS...' : `${veiculos.length} veículos em circulação`}</span>
                </div>
              </div>
            </div>

            {onToggleFavoriteLine && (
              <button
                onClick={onToggleFavoriteLine}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '8px',
                  cursor: 'pointer',
                  color: isLineFavorited ? '#FBBF24' : 'var(--text-muted)'
                }}
                title="Favoritar Linha"
              >
                <Star size={18} fill={isLineFavorited ? '#FBBF24' : 'none'} />
              </button>
            )}
          </div>

          {/* Veículos em Tempo Real */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              borderRadius: '10px',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Status da Frota:</span>
              <span style={{ color: '#38BDF8', fontWeight: 700 }}>🟢 GPS ao vivo no mapa</span>
            </div>

            {veiculos.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {veiculos.map((v, i) => (
                  <span
                    key={i}
                    style={{
                      background: 'rgba(227, 6, 19, 0.15)',
                      color: '#FCA5A5',
                      border: '1px solid rgba(227, 6, 19, 0.3)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700
                    }}
                  >
                    🚌 #{v.p}
                  </span>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Nenhum veículo transmitindo GPS neste exato momento para esta linha.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
