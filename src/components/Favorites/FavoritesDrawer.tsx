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
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)'
              }}
            >
              <Star size={20} fill="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#F8FAFC' }}>Meus Favoritos</h2>
              <p style={{ fontSize: '11px', color: '#94A3B8' }}>
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
              background: 'rgba(255, 255, 255, 0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748B'
            }}
          >
            <Star size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#F8FAFC', marginBottom: '4px' }}>
              Nenhum favorito salvo
            </h3>
            <p style={{ fontSize: '12px', color: '#94A3B8', maxWidth: '280px' }}>
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
                    borderRadius: '10px',
                    background: item.type === 'linha' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                    border: item.type === 'linha' ? '1px solid rgba(6, 182, 212, 0.35)' : '1px solid rgba(56, 189, 248, 0.35)',
                    color: item.type === 'linha' ? '#38BDF8' : '#38BDF8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {item.type === 'linha' ? <Bus size={20} /> : <MapPin size={20} />}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '13.5px', color: '#F8FAFC' }}>
                      {item.title}
                    </strong>
                    {item.label && (
                      <span
                        style={{
                          fontSize: '10px',
                          background: 'rgba(245, 158, 11, 0.15)',
                          color: '#FBBF24',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          padding: '1px 5px',
                          borderRadius: '4px',
                          fontWeight: 700
                        }}
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '2px' }}>
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
                    color: '#64748B',
                    cursor: 'pointer',
                    padding: '6px'
                  }}
                  title="Remover favorito"
                >
                  <Trash2 size={16} />
                </button>
                <ArrowRight size={16} color="#06B6D4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
