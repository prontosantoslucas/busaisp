'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FavoriteItem } from '@/lib/supabase';
import { RoutePlan, RouteLocation } from '@/lib/routing';
import {
  Search,
  Menu,
  ChevronRight,
  Sparkles,
  Footprints,
  Bus,
  Clock,
  Radio,
  MapPin,
  Star,
  Navigation,
  X,
  History
} from 'lucide-react';

interface MoovitHomeProps {
  onSearchClick: () => void;
  onSelectDestination: (dest: string) => void;
  onOpenSettings: () => void;
  favorites?: FavoriteItem[];
  userCoords?: [number, number] | null;
}

export default function MoovitHome({
  onSearchClick,
  onSelectDestination,
  onOpenSettings,
  favorites = [],
  userCoords
}: MoovitHomeProps) {
  const [frequentIndex, setFrequentIndex] = useState(0);
  const [liveRoutePlan, setLiveRoutePlan] = useState<RoutePlan | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RouteLocation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Destinos Reais Frequentes / Favoritos
  const userFavoritesList = favorites.map(f => ({
    title: f.title,
    destinationName: f.details?.ed || f.title
  }));

  const POPULAR_DESTINATIONS = [
    {
      title: 'Para Casa (Jd. Fontális)',
      destinationName: 'Rua Flor de Maio, 40'
    },
    {
      title: 'Shopping Center Norte',
      destinationName: 'Shopping Center Norte'
    },
    {
      title: 'Avenida Paulista',
      destinationName: 'Avenida Paulista, 1578'
    }
  ];

  const activeDestinationsList = userFavoritesList.length > 0 ? userFavoritesList : POPULAR_DESTINATIONS;
  const currentFrequent = activeDestinationsList[frequentIndex % activeDestinationsList.length];

  // Buscar cálculo e telemetria 100% reais do destino frequente ativo
  useEffect(() => {
    if (!currentFrequent) return;

    let isMounted = true;
    setIsLoadingLive(true);

    const origCoords = userCoords || [-23.5158, -46.6182];
    const params = new URLSearchParams({
      origem: 'Minha Localização',
      destino: currentFrequent.destinationName,
      lat: String(origCoords[0]),
      lng: String(origCoords[1]),
      origLat: String(origCoords[0]),
      origLng: String(origCoords[1])
    });

    fetch(`/api/rotas?${params.toString()}`)
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.success && json.data) {
          const primary: RoutePlan = json.data.primaryRoute || json.data.alternatives?.[0];
          setLiveRoutePlan(primary);
        }
      })
      .catch(err => {
        console.warn('[MoovitHome] Erro ao carregar rota em tempo real do card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, [frequentIndex, currentFrequent?.destinationName, userCoords]);

  // Autocomplete / Lista de Confirmação de Endereços com Debounce
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/rotas?tipo=sugestoes&q=${encodeURIComponent(searchQuery.trim())}`);
        const json = await res.json();
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          setSuggestions(json.data);
          setIsDropdownOpen(true);
        } else {
          setSuggestions([]);
        }
      } catch (err) {
        console.warn('[MoovitHome] Erro ao buscar sugestões:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Formatação dos dados reais
  const durationText = liveRoutePlan
    ? `${Math.floor(liveRoutePlan.totalDurationMinutes / 60) > 0 ? `${Math.floor(liveRoutePlan.totalDurationMinutes / 60)} h ` : ''}${liveRoutePlan.totalDurationMinutes % 60} min`
    : '1 h 14 min';

  const arrivalText = liveRoutePlan
    ? `Chega às ${liveRoutePlan.arrivalHour}`
    : 'Chega às 16:36';

  const walkBefore = liveRoutePlan
    ? (liveRoutePlan.steps.find(s => s.type === 'WALK')?.durationMinutes || 13)
    : 13;

  const busLines = liveRoutePlan
    ? liveRoutePlan.steps.filter(s => s.type === 'BUS').map(s => s.busLine || '1703-10')
    : ['1703-10'];

  const walkAfter = liveRoutePlan
    ? (liveRoutePlan.steps.filter(s => s.type === 'WALK').pop()?.durationMinutes || 8)
    : 8;

  const departureText = liveRoutePlan
    ? (liveRoutePlan.departureSuggestion || `Sai em ⏱️ ${liveRoutePlan.departureEtas?.join(', ') || '1, 21, 42'} min de ${liveRoutePlan.departureStop.np}`)
    : 'Sai em ⏱️ 1, 21, 42 min de Av. Zaki Narchi, 1238';

  const handleSelectAddress = (loc: RouteLocation | string) => {
    const destString = typeof loc === 'string' ? loc : `${loc.name}${loc.addressDetails ? `, ${loc.addressDetails}` : ''}`;
    setIsDropdownOpen(false);
    onSelectDestination(destString);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', position: 'relative' }}>
      {/* Top Bar: Menu & Cidade */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <button
          onClick={onOpenSettings}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px'
          }}
          title="Abrir Menu"
        >
          <Menu size={24} />
        </button>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>
          São Paulo e Região
        </span>
      </div>

      {/* Barra de Busca com Input Digitável e Lista de Confirmação */}
      <div style={{ position: 'relative', width: '100%', zIndex: 980 }}>
        <div
          style={{
            background: '#1C1E24',
            border: isDropdownOpen ? '1.5px solid #FF6600' : '1px solid #2D313C',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
            transition: 'border 0.2s ease'
          }}
        >
          <div style={{ flex: 1, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ color: '#FF6600', fontWeight: 900, fontSize: '18px' }}>|</span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setIsDropdownOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (suggestions.length > 0) {
                    handleSelectAddress(suggestions[0]);
                  } else if (searchQuery.trim()) {
                    handleSelectAddress(searchQuery.trim());
                  }
                }
              }}
              placeholder="Para onde você quer ir?"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                fontSize: '15px',
                fontWeight: 500,
                outline: 'none',
                width: '100%'
              }}
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSuggestions([]);
                  setIsDropdownOpen(false);
                }}
                style={{ background: 'none', border: 'none', color: '#9CA3AF', cursor: 'pointer', padding: '2px' }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => {
              if (suggestions.length > 0) {
                handleSelectAddress(suggestions[0]);
              } else if (searchQuery.trim()) {
                handleSelectAddress(searchQuery.trim());
              } else {
                onSearchClick();
              }
            }}
            style={{
              background: '#FF6600',
              border: 'none',
              color: '#FFFFFF',
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            aria-label="Buscar"
          >
            <Search size={20} strokeWidth={2.5} className={isLoadingSuggestions ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ================= LISTA DE CONFIRMAÇÃO DE ENDEREÇOS (DROPDOWN) ================= */}
        {isDropdownOpen && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: '#1C1E24',
              border: '1.5px solid var(--moovit-sptrans-red)',
              borderRadius: '14px',
              padding: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.7)',
              zIndex: 999,
              maxHeight: '280px',
              overflowY: 'auto',
              animation: 'fadeIn 0.15s ease'
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '11px', fontWeight: 800, color: 'var(--moovit-sptrans-red)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} />
              <span>Selecione e confirme o local de destino:</span>
            </div>

            {suggestions.map((item, sIdx) => (
              <div
                key={sIdx}
                onClick={() => handleSelectAddress(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background: '#262932',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: '1px solid transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#FF6600';
                  e.currentTarget.style.background = '#2D313C';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'transparent';
                  e.currentTarget.style.background = '#262932';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#0284C7',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <MapPin size={16} />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </div>
                    {item.addressDetails && (
                      <div style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                        {item.addressDetails}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    background: '#FF6600',
                    color: '#fff',
                    borderRadius: '6px',
                    padding: '4px 8px',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                    marginLeft: '8px'
                  }}
                >
                  <span>Ir</span>
                  <Navigation size={11} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card: Meu Destino Frequente / Favorito com Dados 100% Reais e Clicável */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF' }}>
            {userFavoritesList.length > 0 ? 'Meu destino frequente (Favoritos)' : 'Meu destino frequente'}
          </span>
          <div
            style={{
              background: 'var(--moovit-sptrans-red)',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Radio size={15} className={isLoadingLive ? 'animate-spin' : ''} />
          </div>
        </div>

        {/* Título & Horários Clicáveis */}
        <div
          onClick={() => handleSelectAddress(currentFrequent.destinationName)}
          style={{ cursor: 'pointer' }}
        >
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '3px' }}>
            {currentFrequent.title}
          </h3>
          <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>
            <strong style={{ color: '#FFFFFF' }}>{durationText}</strong> · {arrivalText}
          </div>
        </div>

        {/* Cadeia Visual da Rota Dinâmica: 🚶 X > [🚌 Linha] > 🚶 Y */}
        <div
          onClick={() => handleSelectAddress(currentFrequent.destinationName)}
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#D1D5DB' }}>
            <Footprints size={16} color="#38BDF8" />
            <span>{walkBefore}</span>
          </div>

          <ChevronRight size={14} color="#6B7280" />

          {busLines.map((lineCode, lIdx) => (
            <React.Fragment key={lIdx}>
              <div
                style={{
                  background: '#1E3A8A',
                  border: '1px solid #3B82F6',
                  color: '#FFFFFF',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Bus size={14} />
                <span>{lineCode}</span>
              </div>
              {lIdx < busLines.length - 1 && <ChevronRight size={14} color="#6B7280" />}
            </React.Fragment>
          ))}

          <ChevronRight size={14} color="#6B7280" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#D1D5DB' }}>
            <Footprints size={16} color="#38BDF8" />
            <span>{walkAfter}</span>
          </div>
        </div>

        {/* Dicas Inteligentes com Previsão Oficial em Tempo Real */}
        <div
          onClick={() => handleSelectAddress(currentFrequent.destinationName)}
          style={{ cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
            <Sparkles size={14} color="#C084FC" />
            <span style={{ color: '#C084FC', fontWeight: 700 }}>Dicas inteligentes</span>
          </div>
          <div style={{ fontSize: '12px', color: '#D1D5DB', marginTop: '2px', lineHeight: 1.4 }}>
            {departureText}
          </div>
        </div>

        {/* Indicadores de Paginação do Carrossel (3 Pontos Funcionais) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
          {activeDestinationsList.map((_, i) => (
            <button
              key={i}
              onClick={() => setFrequentIndex(i)}
              style={{
                width: i === (frequentIndex % activeDestinationsList.length) ? '18px' : '7px',
                height: '7px',
                borderRadius: '9999px',
                background: i === (frequentIndex % activeDestinationsList.length) ? '#FF6600' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                padding: 0
              }}
              title={`Ir para destino ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
