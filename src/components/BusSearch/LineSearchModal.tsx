'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Bus, MapPin, ArrowRight, History, Sparkles } from 'lucide-react';
import { SPTransLinha, SPTransParada } from '@/types/sptrans';

interface LineSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLinha: (linha: SPTransLinha) => void;
  onSelectParada: (parada: SPTransParada) => void;
}

export default function LineSearchModal({
  isOpen,
  onClose,
  onSelectLinha,
  onSelectParada
}: LineSearchModalProps) {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'linhas' | 'paradas'>('linhas');
  const [linhasResults, setLinhasResults] = useState<SPTransLinha[]>([]);
  const [paradasResults, setParadasResults] = useState<SPTransParada[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      // Carregar busca inicial com linhas populares
      handleSearch('8000');
    }
  }, [isOpen]);

  const handleSearch = async (term: string) => {
    setQuery(term);
    if (!term || term.trim().length === 0) {
      setLinhasResults([]);
      setParadasResults([]);
      return;
    }

    setIsLoading(true);
    try {
      // Buscar linhas
      const resLinhas = await fetch(`/api/onibus?tipo=linhas&q=${encodeURIComponent(term)}`);
      const dataLinhas = await resLinhas.json();
      if (dataLinhas.success && dataLinhas.data) {
        setLinhasResults(dataLinhas.data);
      }

      // Buscar paradas
      const resParadas = await fetch(`/api/onibus?tipo=paradas&q=${encodeURIComponent(term)}`);
      const dataParadas = await resParadas.json();
      if (dataParadas.success && dataParadas.data) {
        setParadasResults(dataParadas.data);
      }
    } catch (e) {
      console.error('Erro na pesquisa:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header com Campo de Busca */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search
                size={18}
                style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)' }}
              />
              <input
                ref={inputRef}
                type="text"
                className="input-field"
                style={{ paddingLeft: '42px', paddingRight: query ? '38px' : '14px', height: '46px' }}
                placeholder="Buscar linha (ex: 8000, 8700) ou parada (ex: Paulista)..."
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
              />
              {query && (
                <button
                  onClick={() => handleSearch('')}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '10px 14px', fontSize: '13px' }}
            >
              Fechar
            </button>
          </div>

          {/* Abas Linhas / Paradas */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={() => setActiveTab('linhas')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'linhas' ? 'var(--accent-sptrans)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'linhas' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <Bus size={15} />
              Linhas ({linhasResults.length})
            </button>

            <button
              onClick={() => setActiveTab('paradas')}
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: 'none',
                background: activeTab === 'paradas' ? 'var(--accent-sptrans)' : 'rgba(255, 255, 255, 0.06)',
                color: activeTab === 'paradas' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
            >
              <MapPin size={15} />
              Paradas ({paradasResults.length})
            </button>
          </div>
        </div>

        {/* Lista de Resultados */}
        <div className="modal-body" style={{ maxHeight: '420px', padding: '12px' }}>
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
              <div className="animate-spin" style={{ display: 'inline-block', marginBottom: '8px' }}>
                <Bus size={24} color="var(--accent-sptrans)" />
              </div>
              <div>Consultando Olho Vivo...</div>
            </div>
          )}

          {!isLoading && activeTab === 'linhas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {linhasResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Nenhuma linha encontrada para &quot;{query}&quot;
                </div>
              ) : (
                linhasResults.map((linha) => (
                  <div
                    key={`${linha.cl}_${linha.sl}`}
                    onClick={() => {
                      onSelectLinha(linha);
                      onClose();
                    }}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(227, 6, 19, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(227, 6, 19, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          background: 'var(--accent-sptrans)',
                          color: '#fff',
                          fontWeight: 800,
                          fontSize: '13px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          minWidth: '70px',
                          textAlign: 'center'
                        }}
                      >
                        {linha.lt}-{linha.tl}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {linha.sl === 1 ? linha.tp : linha.ts}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Sentido: {linha.sl === 1 ? 'Terminal Secundário' : 'Terminal Principal'}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                ))
              )}
            </div>
          )}

          {!isLoading && activeTab === 'paradas' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {paradasResults.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '14px' }}>
                  Nenhuma parada encontrada para &quot;{query}&quot;
                </div>
              ) : (
                paradasResults.map((parada) => (
                  <div
                    key={parada.cp}
                    onClick={() => {
                      onSelectParada(parada);
                      onClose();
                    }}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          background: 'rgba(56, 189, 248, 0.2)',
                          color: '#38BDF8',
                          padding: '8px',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <MapPin size={18} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                          {parada.np}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {parada.ed}
                        </span>
                      </div>
                    </div>
                    <ArrowRight size={16} color="var(--text-muted)" />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
