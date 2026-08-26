'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FavoriteItem, fetchFavorites, toggleFavorite } from '@/lib/supabase';
import { RouteLocation } from '@/lib/routing';
import { Star, Bus, MapPin, Home, Briefcase, Trash2, ArrowRight, Plus, Search, X, Pencil } from 'lucide-react';
import { SPTransLinha, SPTransParada } from '@/types/sptrans';

interface FavoritesDrawerProps {
  onSelectLinha: (linha: SPTransLinha) => void;
  onSelectParada: (parada: SPTransParada) => void;
  onOpenSearch: () => void;
  onSelectDestination?: (destinationName: string) => void;
}

const ADDRESS_SLOTS: Array<{ refCode: 'home' | 'work'; label: string; icon: typeof Home; placeholder: string }> = [
  { refCode: 'home', label: 'Casa', icon: Home, placeholder: 'Definir endereço de casa' },
  { refCode: 'work', label: 'Trabalho', icon: Briefcase, placeholder: 'Definir endereço de trabalho' }
];

export default function FavoritesDrawer({
  onSelectLinha,
  onSelectParada,
  onOpenSearch,
  onSelectDestination
}: FavoritesDrawerProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'linha' | 'parada' | 'trilho'>('ALL');
  const [editingSlot, setEditingSlot] = useState<'home' | 'work' | null>(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RouteLocation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    } else if (item.type === 'endereco' && onSelectDestination) {
      onSelectDestination(item.title);
    }
  };

  const handleAddressSearchChange = (value: string) => {
    setAddressQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/rotas?tipo=sugestoes&q=${encodeURIComponent(value.trim())}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
        }
      } catch (e) {
        console.error('[FavoritesDrawer] Erro ao buscar sugestões de endereço:', e);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);
  };

  const handleSaveAddress = async (slot: 'home' | 'work', place: RouteLocation) => {
    const slotMeta = ADDRESS_SLOTS.find((s) => s.refCode === slot)!;
    // Remove o slot antigo (se já existia um endereço salvo aqui) antes de salvar o novo.
    const existing = favorites.find((f) => f.type === 'endereco' && f.ref_code === slot);
    let current = favorites;
    if (existing) {
      current = await toggleFavorite(existing);
    }
    const newItem: FavoriteItem = {
      type: 'endereco',
      ref_code: slot,
      title: place.name,
      label: slotMeta.label,
      details: { lat: place.lat, lng: place.lng, addressDetails: place.addressDetails }
    };
    // toggleFavorite alterna: como o slot antigo já foi removido, isso sempre adiciona o novo.
    setFavorites(current);
    const updated = await toggleFavorite(newItem);
    setFavorites(updated);
    setEditingSlot(null);
    setAddressQuery('');
    setSuggestions([]);
  };

  const addressFavorites = favorites.filter((f) => f.type === 'endereco');
  const filtered = favorites.filter((f) => {
    if (f.type === 'endereco') return false;
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
            { id: 'ALL', label: `Todos (${filtered.length})` },
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

      {/* Meus Endereços: Casa e Trabalho reais, definidos pelo usuário */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {ADDRESS_SLOTS.map((slot) => {
          const saved = addressFavorites.find((f) => f.ref_code === slot.refCode);
          const Icon = slot.icon;
          const isEditing = editingSlot === slot.refCode;

          if (isEditing) {
            return (
              <div key={slot.refCode} className="bus-glass-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--bus-text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Icon size={15} color="var(--bus-violet)" />
                    {slot.placeholder}
                  </span>
                  <button
                    onClick={() => { setEditingSlot(null); setAddressQuery(''); setSuggestions([]); }}
                    style={{ background: 'none', border: 'none', color: 'var(--bus-text-secondary)', cursor: 'pointer' }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={15} color="var(--bus-violet)" style={{ position: 'absolute', left: '10px', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    autoFocus
                    className="bus-input"
                    value={addressQuery}
                    onChange={(e) => handleAddressSearchChange(e.target.value)}
                    placeholder="Digite o endereço completo..."
                    style={{ paddingLeft: '32px', height: '40px', fontSize: '13px' }}
                  />
                </div>
                {isLoadingSuggestions ? (
                  <div style={{ fontSize: '12px', color: 'var(--bus-text-secondary)', padding: '8px 0' }}>Buscando endereço...</div>
                ) : suggestions.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {suggestions.map((sug, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSaveAddress(slot.refCode, sug)}
                        style={{
                          padding: '8px 10px',
                          borderRadius: 'var(--bus-radius-sm)',
                          background: 'var(--bus-surface-sunken)',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column'
                        }}
                      >
                        <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>{sug.name}</span>
                        {sug.addressDetails && (
                          <span style={{ fontSize: '10.5px', color: 'var(--bus-text-secondary)' }}>{sug.addressDetails}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          }

          return (
            <div
              key={slot.refCode}
              className="bus-card"
              onClick={() => (saved ? handleItemClick(saved) : setEditingSlot(slot.refCode))}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--bus-radius-sm)',
                    background: saved ? 'var(--bus-violet-soft)' : 'var(--bus-surface-sunken)',
                    border: `1px solid ${saved ? 'var(--bus-border-highlight)' : 'var(--bus-border)'}`,
                    color: saved ? 'var(--bus-violet)' : 'var(--bus-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Icon size={19} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--bus-text-primary)' }}>{slot.label}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {saved ? saved.title : `Toque para ${slot.placeholder.toLowerCase()}`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                {saved ? (
                  <>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingSlot(slot.refCode); }}
                      style={{ background: 'transparent', border: 'none', color: 'var(--bus-text-muted)', cursor: 'pointer', padding: '6px' }}
                      title="Editar endereço"
                    >
                      <Pencil size={15} />
                    </button>
                    <ArrowRight size={16} color="var(--bus-violet-ink)" />
                  </>
                ) : (
                  <Plus size={18} color="var(--bus-text-muted)" />
                )}
              </div>
            </div>
          );
        })}
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
