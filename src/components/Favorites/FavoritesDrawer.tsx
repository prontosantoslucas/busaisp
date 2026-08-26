'use client';

import React, { useState, useEffect } from 'react';
import { FavoriteItem, fetchFavorites, toggleFavorite } from '@/lib/supabase';
import { Star, Bus, MapPin, TrainTrack, Trash2, Tag, ArrowRight, Plus } from 'lucide-react';
import { SPTransLinha, SPTransParada } from '@/types/sptrans';

interface FavoritesDrawerProps {
  onSelectLinha: (linha: SPTransLinha) => void;
  onSelectParada: (parada: SPTransParada) => void;
  onOpenSearch: () => void;
}

export default function FavoritesDrawer({
  onSelectLinha,
  onSelectParada,
  onOpenSearch
}: FavoritesDrawerProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'linha' | 'parada' | 'trilho'>('ALL');

  const loadFavs = async () => {
    const list = await fetchFavorites();
    setFavorites(list);
  };

  useEffect(() => {
    loadFavs();
  }, []);

  const handleRemove = async (item: FavoriteItem) => {
    const updated = await toggleFavorite(item);
    setFavorites(updated);
  };

  const handleItemClick = (item: FavoriteItem) => {
    if (item.type === 'linha') {
      const parts = item.title.split('-');
      const num = parts[0] || '8000';
      const linha: SPTransLinha = {
        cl: Number(item.ref_code) || 1001,
        lc: false,
        lt: num,
        tl: 10,
        sl: 1,
        tp: item.title,
        ts: 'Destino'
      };
      onSelectLinha(linha);
    } else if (item.type === 'parada') {
      const parada: SPTransParada = {
        cp: Number(item.ref_code) || 340015339,
        np: item.title,
        ed: item.details?.ed || 'São Paulo',
        py: item.details?.py || -23.5615,
        px: item.details?.px || -46.6559
      };
      onSelectParada(parada);
    }
  };

  const filtered = favorites.filter((f) => {
    if (activeFilter === 'ALL') return true;
    return f.type === activeFilter;
  });

  return (
    <div
      className="animate-slide-up"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        width: '100%'
      }}
    >
      {/* Top Banner */}
      <div
        className="bus-glass-panel"
        style={{
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
                borderRadius: 'var(--bus-radius-sm)',
                background: 'var(--bus-live)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bus-text-on-accent)'
              }}
            >
              <Star size={20} fill="currentColor" />
            </div>
            <div>
              <h2 className="bus-display" style={{ fontSize: '17px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>Meus Favoritos</h2>
              <p style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                Acesso rápido para Casa, Trabalho e rotas frequentes
              </p>
            </div>
          </div>

          <button onClick={onOpenSearch} className="bus-btn-primary" style={{ padding: '6px 12px', fontSize: '11.5px', borderRadius: '8px' }}>
            <Plus size={14} />
            <span>Adicionar</span>
          </button>
        </div>

        {/* Filtros */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { id: 'ALL', label: `Todos (${favorites.length})` },
            { id: 'linha', label: 'Linhas' },
            { id: 'parada', label: 'Paradas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`bus-pill ${activeFilter === tab.id ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '4px 10px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Favoritos */}
      {filtered.length === 0 ? (
        <div
          className="bus-glass-panel"
          style={{
            padding: '36px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: 'var(--bus-surface-sunken)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--bus-text-muted)'
            }}
          >
            <Star size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bus-text-primary)', marginBottom: '4px' }}>
              Nenhum favorito salvo
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--bus-text-secondary)', maxWidth: '280px' }}>
              Salve linhas e paradas clicando no ícone de estrela de favoritos para acompanhar o ônibus com 1 toque.
            </p>
          </div>
          <button onClick={onOpenSearch} className="bus-btn-primary" style={{ marginTop: '8px', fontSize: '12.5px' }}>
            Explorar Linhas de SP
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map((item) => (
            <div
              key={item.id || item.ref_code}
              className="bus-card"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px'
              }}
              onClick={() => handleItemClick(item)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--bus-radius-sm)',
                    background: 'var(--bus-violet-soft)',
                    border: '1px solid var(--bus-border-highlight)',
                    color: 'var(--bus-violet)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.type === 'linha' ? <Bus size={20} /> : <MapPin size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13.5px', color: 'var(--bus-text-primary)' }}>
                      {item.title}
                    </strong>
                    {item.label && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'var(--bus-live-soft)',
                          color: 'var(--bus-live)',
                          border: '1px solid var(--bus-live)',
                          padding: '1px 5px',
                          borderRadius: 'var(--bus-radius-sm)',
                          fontWeight: 700
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', marginTop: '2px' }}>
                    {item.type === 'linha' ? 'Ônibus Municipal SPTrans' : 'Ponto de Ônibus'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--bus-text-muted)',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                  title="Remover favorito"
                >
                  <Trash2 size={16} />
                </button>
                <ArrowRight size={16} color="var(--bus-violet-ink)" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
