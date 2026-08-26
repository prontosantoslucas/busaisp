'use client';

import React, { useState, useRef } from 'react';
import {
  SPTransLinha,
  SPTransVeiculo
} from '@/types/sptrans';
import {
  Search,
  Bus,
  Star,
  ChevronRight,
  Radio,
  X
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
  const [activeCategory, setActiveCategory] = useState<'POPULAR' | 'TRUNK' | 'NIGHT'>('POPULAR');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Linhas Populares & Estruturais de São Paulo
  const POPULAR_LINES: Record<'POPULAR' | 'TRUNK' | 'NIGHT', Array<{ lt: string; tl: number; tp: string; ts: string; cl: number; tag: string }>> = {
    POPULAR: [
      { lt: '1703', tl: 10, tp: 'Jd. Hebron', ts: 'Shopping Center Norte', cl: 1703, tag: 'Zona Norte' },
      { lt: '8700', tl: 10, tp: 'Terminal Campo Limpo', ts: 'Praça Ramos de Azevedo', cl: 8700, tag: 'Zona Sul / Centro' },
      { lt: '8000', tl: 10, tp: 'Terminal Lapa', ts: 'Praça Ramos de Azevedo', cl: 8000, tag: 'Zona Oeste' },
      { lt: '2012', tl: 10, tp: 'Jd. Fontális', ts: 'Metrô Santana', cl: 2012, tag: 'Alimentadora' }
    ],
    TRUNK: [
      { lt: '106A', tl: 10, tp: 'Metrô Santana', ts: 'Itaim Bibi', cl: 106, tag: 'Corredor Norte-Sul' },
      { lt: '6000', tl: 10, tp: 'Terminal Parelheiros', ts: 'Terminal Santo Amaro', cl: 6000, tag: 'Corredor Sul' },
      { lt: '4310', tl: 10, tp: 'ET Itaquera', ts: 'Terminal Parque D. Pedro II', cl: 4310, tag: 'Radial Leste' },
      { lt: '5110', tl: 10, tp: 'Terminal São Mateus', ts: 'Terminal Mercado', cl: 5110, tag: 'Expresso Tiradentes' }
    ],
    NIGHT: [
      { lt: 'N101', tl: 11, tp: 'Terminal Santana', ts: 'Terminal Pq. D. Pedro II', cl: 101, tag: 'Rede Noturna' },
      { lt: 'N201', tl: 11, tp: 'Metrô Tucuruvi', ts: 'Terminal Pq. D. Pedro II', cl: 201, tag: 'Rede Noturna' },
      { lt: 'N501', tl: 11, tp: 'Terminal Sacomã', ts: 'Terminal Pq. D. Pedro II', cl: 501, tag: 'Rede Noturna' },
      { lt: 'N701', tl: 11, tp: 'Terminal Santo Amaro', ts: 'Terminal Pq. D. Pedro II', cl: 701, tag: 'Rede Noturna' }
    ]
  };

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
      }, 280);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  };

  const accessibleVehiclesCount = veiculos.filter(v => v.a).length;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. BUSCA DE LINHAS & RADAR */}
      <div
        className="bus-glass-panel"
        style={{ padding: '16px 18px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--bus-radius-sm)',
                background: 'var(--bus-violet-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <Bus size={18} />
            </div>
            <div>
              <div className="bus-display" style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                Radar de Frotas & Linhas SP
              </div>
              <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                Telemetria GPS Olho Vivo em tempo real
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--bus-live)',
              background: 'var(--bus-live-soft)',
              border: '1px solid var(--bus-live)',
              padding: '3px 8px',
              borderRadius: 'var(--bus-radius-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Radio size={11} className="animate-pulse" />
            <span>AO VIVO</span>
          </div>
        </div>

        {/* Input de Busca */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search
            size={17}
            color="var(--bus-violet)"
            style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
          />
          <input
            type="text"
            className="bus-input"
            style={{
              paddingLeft: '40px',
              paddingRight: searchTerm ? '40px' : '14px',
              height: '44px',
              fontSize: '13.5px',
              fontWeight: 500
            }}
            placeholder="Digite número, letreiro ou bairro (ex: 1703, Paulista, 8700)..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--bus-text-secondary)',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Categorias Rápidas */}
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px' }}>
          {[
            { id: 'POPULAR', label: 'Mais Buscadas' },
            { id: 'TRUNK', label: 'Corredores & Radiais' },
            { id: 'NIGHT', label: 'Linhas Noturnas' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`bus-pill ${activeCategory === cat.id ? 'active' : ''}`}
              style={{ fontSize: '11px', padding: '5px 10px', flex: 1, justifyContent: 'center' }}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Linhas Rápidas da Categoria Selecionada */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', marginTop: '10px' }}>
          {POPULAR_LINES[activeCategory].map((pl) => {
            const isSelected = selectedLine?.lt === pl.lt;

            return (
              <div
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
                className={`bus-card ${isSelected ? 'active' : ''}`}
                style={{
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="bus-badge" style={{ fontSize: '13px', padding: '2px 7px' }}>
                    {pl.lt}-{pl.tl}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--bus-violet)', fontWeight: 700 }}>
                    {pl.tag}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--bus-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pl.ts}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. RESULTADOS DA PESQUISA DINÂMICA */}
      {searchTerm.trim().length >= 2 && (
        <div className="bus-glass-panel animate-slide-up" style={{ padding: '14px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--bus-violet)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={13} />
            <span>
              {isSearching ? 'Pesquisando linhas no banco da SPTrans...' : `Linhas encontradas (${searchResults.length}):`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
            {searchResults.map((l, idx) => (
              <div
                key={idx}
                onClick={() => onSelectLine(l)}
                className="bus-card"
                style={{
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="bus-badge" style={{ fontSize: '14px', padding: '6px 10px' }}>
                    {l.lt}-{l.tl}
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                      {l.tp} → {l.ts}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', marginTop: '2px' }}>
                      Sentido: <strong>{l.sl === 1 ? 'Principal (Ida)' : 'Secundário (Volta)'}</strong>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bus-violet)', fontWeight: 700, fontSize: '11px' }}>
                  <span>Radar</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. PAINEL DE TELEMETRIA AO VIVO DA LINHA ATIVA */}
      {selectedLine && (
        <div
          className="bus-glass-panel animate-slide-up"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Header do Letreiro */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                className="bus-num"
                style={{
                  background: 'var(--bus-violet-ink)',
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: 'var(--bus-radius-sm)'
                }}
              >
                {selectedLine.lt}-{selectedLine.tl}
              </div>

              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                  {selectedLine.sl === 1 ? selectedLine.ts : selectedLine.tp}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', marginTop: '2px' }}>
                  Partindo de: {selectedLine.sl === 1 ? selectedLine.tp : selectedLine.ts}
                </div>
              </div>
            </div>

            {onToggleFavoriteLine && (
              <button
                onClick={onToggleFavoriteLine}
                style={{
                  background: isLineFavorited ? 'var(--bus-live-soft)' : 'var(--bus-surface-elevated)',
                  border: isLineFavorited ? '1px solid var(--bus-live)' : '1px solid var(--bus-border)',
                  borderRadius: 'var(--bus-radius-sm)',
                  padding: '8px',
                  cursor: 'pointer',
                  color: isLineFavorited ? 'var(--bus-live)' : 'var(--bus-text-secondary)'
                }}
                title="Favoritar Linha"
              >
                <Star size={18} fill={isLineFavorited ? 'var(--bus-live)' : 'none'} />
              </button>
            )}
          </div>

          {/* Cards de Métricas da Linha */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <div
              style={{
                background: 'var(--bus-surface-sunken)',
                border: '1px solid var(--bus-border-subtle)',
                borderRadius: 'var(--bus-radius-md)',
                padding: '8px 10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--bus-text-secondary)', fontWeight: 700 }}>FROTA ATIVA</div>
              <div className="bus-num" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bus-violet)', marginTop: '2px' }}>
                {isLoadingVehicles ? '...' : veiculos.length}
              </div>
            </div>

            <div
              style={{
                background: 'var(--bus-surface-sunken)',
                border: '1px solid var(--bus-border-subtle)',
                borderRadius: 'var(--bus-radius-md)',
                padding: '8px 10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--bus-text-secondary)', fontWeight: 700 }}>ACESSÍVEIS</div>
              <div className="bus-num" style={{ fontSize: '16px', fontWeight: 700, color: 'var(--bus-emerald)', marginTop: '2px' }}>
                {isLoadingVehicles ? '...' : accessibleVehiclesCount}
              </div>
            </div>

            <div
              style={{
                background: 'var(--bus-surface-sunken)',
                border: '1px solid var(--bus-border-subtle)',
                borderRadius: 'var(--bus-radius-md)',
                padding: '8px 10px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '10px', color: 'var(--bus-text-secondary)', fontWeight: 700 }}>SINAL GPS</div>
              <div className="bus-num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bus-emerald)', marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bus-emerald)' }} />
                100%
              </div>
            </div>
          </div>

          {/* Lista de Veículos Transmitindo Telemetria */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--bus-text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Veículos em Circulação no Mapa:</span>
              <span style={{ color: 'var(--bus-violet)', fontSize: '11px' }}>{veiculos.length} operando</span>
            </div>

            {veiculos.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {veiculos.map((v, i) => (
                  <div
                    key={i}
                    style={{
                      background: 'var(--bus-surface-sunken)',
                      border: '1px solid var(--bus-border-subtle)',
                      borderRadius: 'var(--bus-radius-sm)',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Bus size={13} color="var(--bus-violet)" />
                      <span className="bus-num" style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                        #{v.p}
                      </span>
                    </div>

                    {v.a && (
                      <span style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--bus-emerald)', background: 'var(--bus-emerald-soft)', padding: '1px 4px', borderRadius: 'var(--bus-radius-sm)' }}>
                        Acessível
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)', padding: '8px 0' }}>
                Nenhum veículo transmitindo GPS neste momento para esta linha.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
