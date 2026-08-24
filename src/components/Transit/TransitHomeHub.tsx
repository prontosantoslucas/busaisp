'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FavoriteItem } from '@/lib/supabase';
import { RoutePlan, RouteLocation } from '@/lib/routing';
import {
  Search,
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
  History,
  AlertTriangle,
  Flame,
  ArrowRight,
  Play,
  Home,
  ShoppingBag,
  Briefcase,
  TrainTrack,
  Newspaper
} from 'lucide-react';
import { TrafficIncident } from '@/types/traffic';

interface TransitHomeHubProps {
  onSearchClick: () => void;
  onSelectDestination: (dest: string) => void;
  onOpenSettings: () => void;
  favorites?: FavoriteItem[];
  userCoords?: [number, number] | null;
  incidents?: TrafficIncident[];
  onStartPercursoQuick?: (route: RoutePlan) => void;
  onOpenNews?: () => void;
}

export default function TransitHomeHub({
  onSearchClick,
  onSelectDestination,
  onOpenSettings,
  favorites = [],
  userCoords,
  incidents = [],
  onStartPercursoQuick,
  onOpenNews
}: TransitHomeHubProps) {
  const [frequentIndex, setFrequentIndex] = useState(0);
  const [liveRoutePlan, setLiveRoutePlan] = useState<RoutePlan | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<RouteLocation[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Destinos Favoritos ou Populares em SP
  const userFavoritesList = favorites.map(f => ({
    title: f.title,
    destinationName: f.details?.ed || f.title,
    icon: Star
  }));

  const POPULAR_DESTINATIONS = [
    {
      title: 'Para Casa (Jd. Fontális)',
      destinationName: 'Rua Flor de Maio, 40',
      icon: Home
    },
    {
      title: 'Shopping Center Norte',
      destinationName: 'Shopping Center Norte, São Paulo',
      icon: ShoppingBag
    },
    {
      title: 'Avenida Paulista (MASP)',
      destinationName: 'Avenida Paulista, 1578, São Paulo',
      icon: Briefcase
    },
    {
      title: 'Metrô Sé / Centro',
      destinationName: 'Praça da Sé, São Paulo',
      icon: TrainTrack
    }
  ];

  const activeDestinationsList = userFavoritesList.length > 0 ? userFavoritesList : POPULAR_DESTINATIONS;
  const currentFrequent = activeDestinationsList[frequentIndex % activeDestinationsList.length];

  // Coordenadas arredondadas a ~111m: o GPS (watchPosition) gera um array novo a cada
  // leitura mesmo com jitter de poucos metros, o que reiniciaria esta busca sem parar
  // e travaria o spinner de carregamento para sempre (nunca dava tempo dela terminar).
  const roundedLat = userCoords ? Math.round(userCoords[0] * 1000) / 1000 : null;
  const roundedLng = userCoords ? Math.round(userCoords[1] * 1000) / 1000 : null;

  // Carregar telemetria em tempo real para o destino ativo
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
        console.warn('[TransitHomeHub] Erro ao carregar rota em tempo real do card:', err);
      })
      .finally(() => {
        if (isMounted) setIsLoadingLive(false);
      });

    return () => {
      isMounted = false;
    };
  }, [frequentIndex, currentFrequent?.destinationName, roundedLat, roundedLng]);

  // Autocomplete de Endereços
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
        if (json.success && Array.isArray(json.data)) {
          setSuggestions(json.data);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error('[TransitHomeHub] Erro ao buscar sugestões:', err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectSuggestion = (item: RouteLocation) => {
    setSearchQuery(item.name);
    setIsDropdownOpen(false);
    onSelectDestination(item.name);
  };

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      setIsDropdownOpen(false);
      onSelectDestination(searchQuery.trim());
    } else {
      onSearchClick();
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. BARRA DE BUSCA INTELIGENTE "PARA ONDE VAMOS?" */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '14px 16px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#06B6D4" />
            <span style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#38BDF8' }}>
              Planejador de Viagem
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748B' }}>São Paulo • SPTrans</span>
        </div>

        <form onSubmit={handleManualSearch} style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="bus-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Para onde você quer ir hoje?"
              style={{
                paddingLeft: '40px',
                paddingRight: searchQuery ? '70px' : '40px',
                height: '46px',
                fontSize: '14px',
                fontWeight: 500
              }}
            />
            <Search
              size={18}
              color="#06B6D4"
              style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '42px',
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#FFFFFF',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Dropdown de Autocomplete */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 999,
              background: 'rgba(13, 17, 23, 0.98)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(6, 182, 212, 0.3)',
              borderRadius: '16px',
              boxShadow: '0 16px 40px rgba(0,0,0,0.85)',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {isLoadingSuggestions ? (
              <div style={{ padding: '14px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Buscando paradas e locais em SP...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <MapPin size={16} color="#06B6D4" style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    {item.addressDetails && (
                      <span style={{ fontSize: '11px', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.addressDetails}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '14px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
                Nenhum local encontrado para "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Chips de Destinos Rápidos com Ícones SVG */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          {activeDestinationsList.map((dest, idx) => {
            const Icon = dest.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectDestination(dest.destinationName)}
                className="bus-pill"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icon size={14} color="#06B6D4" />
                <span>{dest.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. RADAR DA PRÓXIMA VIAGEM (TELEMETRIA EM TEMPO REAL) */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '16px',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          background: 'linear-gradient(180deg, rgba(13, 17, 23, 0.92) 0%, rgba(15, 23, 42, 0.88) 100%)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '10px', height: '10px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#10B981', animation: 'markerPulse 1.5s infinite' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10B981' }} />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#34D399', letterSpacing: '0.4px' }}>
              RADAR AO VIVO
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {activeDestinationsList.map((_, idx) => (
              <div
                key={idx}
                onClick={() => setFrequentIndex(idx)}
                style={{
                  width: frequentIndex === idx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: frequentIndex === idx ? '#06B6D4' : '#334155',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card Content */}
        {isLoadingLive ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', color: '#94A3B8' }}>Consultando telemetria SPTrans...</span>
          </div>
        ) : liveRoutePlan ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>DESTINO SUGERIDO</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#F8FAFC' }}>
                  {currentFrequent?.title}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#38BDF8', letterSpacing: '-0.5px' }}>
                  {liveRoutePlan.totalDurationMinutes} min
                </div>
                <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                  Chegada ~{liveRoutePlan.arrivalHour}
                </div>
              </div>
            </div>

            {/* Linha Recomendada & Próximo Ônibus */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                borderRadius: '12px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="bus-badge">
                  <Bus size={14} />
                  <span>{liveRoutePlan.recommendedLine.lt}-{liveRoutePlan.recommendedLine.tl}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#F8FAFC' }}>
                    {liveRoutePlan.departureStop.np}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Footprints size={12} /> {liveRoutePlan.totalWalkDurationMinutes} min a pé até o ponto
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#10B981', background: 'rgba(16, 185, 129, 0.15)', padding: '3px 7px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                  {liveRoutePlan.nextBusEtaMinutes <= 2 ? 'Chegando agora' : `em ${liveRoutePlan.nextBusEtaMinutes} min`}
                </span>
              </div>
            </div>

            {/* Botão Ação Rápida */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <button
                onClick={() => onSelectDestination(currentFrequent.destinationName)}
                className="bus-btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '13px' }}
              >
                <span>Ver Opções de Rota</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 0', textAlign: 'center', color: '#94A3B8', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: '#F8FAFC' }}>Previsão em Tempo Real</span>
            <span style={{ fontSize: '12px' }}>Toque em um dos destinos rápidos acima para calcular o trajeto e próximo ônibus.</span>
          </div>
        )}
      </div>

      {/* 3. ATALHO ELEGANTE PARA NOTÍCIAS AO VIVO */}
      {onOpenNews && (
        <div
          className="bus-glass-panel"
          onClick={onOpenNews}
          style={{
            padding: '12px 14px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.92) 0%, rgba(22, 27, 34, 0.88) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(6, 182, 212, 0.15)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8',
                flexShrink: 0
              }}
            >
              <Newspaper size={15} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#F8FAFC' }}>
                Notícias & Ocorrências ao Vivo
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                {incidents.length > 0
                  ? `${incidents.length} ocorrências e comunicados ativos em SP`
                  : 'Acompanhe trânsito, metrô e SPTrans'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#38BDF8', fontSize: '11.5px', fontWeight: 700 }}>
            <span>Abrir</span>
            <ChevronRight size={15} />
          </div>
        </div>
      )}
    </div>
  );
}
