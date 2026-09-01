'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FavoriteItem } from '@/lib/supabase';
import { RoutePlan, RouteLocation } from '@/lib/routing';
import { getEtaColorTokens } from '@/lib/etaStyle';
import {
  Search,
  ChevronRight,
  Sparkles,
  Footprints,
  Bus,
  MapPin,
  Home,
  Briefcase,
  X,
  ArrowRight,
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
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Destinos Favoritos ou Populares em SP — endereços reais (Casa/Trabalho) aparecem
  // primeiro, com ícone próprio; linhas favoritadas não são "destinos" navegáveis.
  const addressFavorites = favorites
    .filter(f => f.type === 'endereco')
    .sort((a, b) => (a.ref_code === 'home' ? -1 : b.ref_code === 'home' ? 1 : 0))
    .map(f => ({
      title: f.label || f.title,
      destinationName: f.title,
      icon: f.ref_code === 'home' ? Home : f.ref_code === 'work' ? Briefcase : MapPin
    }));

  const otherFavoritesList = favorites
    .filter(f => f.type === 'parada')
    .map(f => ({
      title: f.title,
      destinationName: f.details?.ed || f.title,
      icon: MapPin
    }));

  const userFavoritesList = [...addressFavorites, ...otherFavoritesList];

  // "Mais buscados" vem de buscas reais registradas em search_events — nunca uma
  // lista fixa fingindo ser popular. Sem histórico real ainda, fica vazio mesmo.
  const [popularDestinations, setPopularDestinations] = useState<string[]>([]);
  useEffect(() => {
    let isMounted = true;
    fetch('/api/rotas?tipo=destinos_populares')
      .then(res => res.json())
      .then(json => {
        if (isMounted && json.success && Array.isArray(json.data)) {
          setPopularDestinations(json.data);
        }
      })
      .catch(err => console.warn('[TransitHomeHub] Erro ao buscar destinos populares:', err));
    return () => { isMounted = false; };
  }, []);

  const popularDestinationsList = popularDestinations.map((name) => ({
    title: name,
    destinationName: name,
    icon: MapPin
  }));

  const activeDestinationsList = userFavoritesList.length > 0 ? userFavoritesList : popularDestinationsList;
  const currentFrequent = activeDestinationsList.length > 0
    ? activeDestinationsList[frequentIndex % activeDestinationsList.length]
    : undefined;

  // A posição do GPS por si só não dispara mais essa busca — tentar detectar
  // "andou o suficiente" por distância sofria com o jitter real do watchPosition
  // (variação de sinal em prédio/canyon urbano) e reiniciava a busca sem parar.
  // Guardamos sempre a leitura mais recente aqui e atualizamos por tempo (relógio),
  // não por movimento.
  const userCoordsRef = useRef(userCoords);
  useEffect(() => {
    userCoordsRef.current = userCoords;
  }, [userCoords]);

  const REFRESH_INTERVAL_MS = 30000;

  // Carregar telemetria em tempo real para o destino ativo, e atualizar a cada
  // 30s de relógio (não a cada leitura de GPS).
  useEffect(() => {
    if (!currentFrequent) return;

    let isMounted = true;

    const fetchLive = () => {
      // Spinner só aparece na primeira carga; atualizações periódicas depois disso
      // trocam o conteúdo silenciosamente em vez de "piscar" de volta pro loading.
      if (!liveRoutePlan) setIsLoadingLive(true);

      const origCoords = userCoordsRef.current || [-23.5158, -46.6182];
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
    };

    fetchLive();
    const interval = setInterval(fetchLive, REFRESH_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frequentIndex, currentFrequent?.destinationName]);

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
    <div className="thh-hub animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Luz ambiente atrás dos cartões de vidro — dá profundidade ao blur sem pesar */}
      <div className="thh-orb thh-orb--violet" aria-hidden="true" />
      <div className="thh-orb thh-orb--amber" aria-hidden="true" />

      {/* 1. BARRA DE BUSCA "PARA ONDE VAMOS?" */}
      <div
        className="thh-glass thh-rise"
        style={{
          padding: '14px 16px',
          position: 'relative',
          // Sem isso, o dropdown de sugestões (absolutamente posicionado, abaixo
          // deste card) fica escondido atrás do card "RADAR AO VIVO" seguinte:
          // superfícies irmãs formam contextos de empilhamento próprios, então a
          // ordem no DOM decide a pintura a menos que este card tenha z-index maior.
          zIndex: 20,
          animationDelay: '0.02s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--bus-violet)" className="thh-breathe" />
            <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--bus-violet)' }}>
              Planejador de Viagem
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--bus-text-muted)' }}>São Paulo • SPTrans</span>
        </div>

        <form onSubmit={handleManualSearch} style={{ position: 'relative' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="thh-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Para onde você quer ir hoje?"
              style={{
                width: '100%',
                height: '46px',
                paddingLeft: '40px',
                paddingRight: searchQuery ? '70px' : '40px',
                borderRadius: 'var(--bus-radius-md)',
                color: 'var(--bus-text-primary)',
                fontFamily: 'var(--font-body)',
                fontSize: '14px',
                fontWeight: 500,
                outline: 'none'
              }}
            />
            <Search
              size={18}
              color={isSearchFocused ? 'var(--bus-violet)' : 'var(--bus-text-secondary)'}
              style={{ position: 'absolute', left: '14px', pointerEvents: 'none', transition: 'color 0.2s ease' }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="thh-icon-btn"
                style={{
                  position: 'absolute',
                  right: '42px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--bus-text-secondary)',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '50%',
                  display: 'flex'
                }}
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              className="thh-icon-btn"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'linear-gradient(135deg, var(--bus-violet) 0%, var(--bus-violet-ink) 100%)',
                border: 'none',
                borderRadius: 'var(--bus-radius-sm)',
                color: '#FFFFFF',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px -4px var(--bus-violet-soft)'
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
            className="thh-glass"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 999,
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {isLoadingSuggestions ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '8px' }}>
                <div className="thh-skeleton" style={{ height: '34px' }} />
                <div className="thh-skeleton" style={{ height: '34px' }} />
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="thh-suggestion"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--bus-radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                    animationDelay: `${idx * 0.04}s`
                  }}
                >
                  <MapPin size={16} color="var(--bus-violet)" style={{ flexShrink: 0 }} />
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--bus-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {item.name}
                    </span>
                    {item.addressDetails && (
                      <span style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.addressDetails}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--bus-text-secondary)', fontSize: '13px' }}>
                Nenhum local encontrado para &quot;{searchQuery}&quot;
              </div>
            )}
          </div>
        )}

        {/* Chips de Destinos Rápidos: favoritos, ou os mais buscados de verdade (search_events) */}
        {activeDestinationsList.length > 0 ? (
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginTop: '12px', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            {activeDestinationsList.map((dest, idx) => {
              const Icon = dest.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectDestination(dest.destinationName)}
                  className="thh-chip"
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--bus-text-secondary)',
                    borderRadius: 'var(--bus-radius-full)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    animationDelay: `${0.1 + idx * 0.05}s`
                  }}
                >
                  <Icon size={14} color="var(--bus-violet)" />
                  <span>{dest.title}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <p style={{ fontSize: '11.5px', color: 'var(--bus-text-muted)', marginTop: '10px' }}>
            Seus destinos favoritos e os mais buscados em SP vão aparecer aqui.
          </p>
        )}
      </div>

      {/* 2. RADAR DA PRÓXIMA VIAGEM (TELEMETRIA EM TEMPO REAL) */}
      <div
        className="thh-glass thh-rise"
        style={{
          padding: '16px',
          position: 'relative',
          animationDelay: '0.09s'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="thh-live-dot">
              <div className="thh-live-dot-core" />
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--bus-live)', letterSpacing: '0.4px' }}>
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
                  background: frequentIndex === idx ? 'var(--bus-violet)' : 'var(--bus-border)',
                  boxShadow: frequentIndex === idx ? '0 0 8px 0 var(--bus-violet-soft)' : 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.25s ease, width 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card Content */}
        {isLoadingLive ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '4px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div className="thh-skeleton" style={{ height: '14px', width: '55%' }} />
              <div className="thh-skeleton" style={{ height: '18px', width: '25%' }} />
            </div>
            <div className="thh-skeleton" style={{ height: '46px', width: '100%' }} />
            <div className="thh-skeleton" style={{ height: '38px', width: '100%' }} />
          </div>
        ) : liveRoutePlan ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>DESTINO SUGERIDO</div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                  {currentFrequent?.title}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  key={liveRoutePlan.totalDurationMinutes}
                  className="bus-num thh-value-pop"
                  style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bus-violet)' }}
                >
                  {liveRoutePlan.totalDurationMinutes} min
                </div>
                <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                  Chegada ~{liveRoutePlan.arrivalHour}
                </div>
              </div>
            </div>

            {/* Linha Recomendada & Próximo Ônibus */}
            {(() => {
              const etaColors = getEtaColorTokens(liveRoutePlan.nextBusEtaMinutes);
              return (
            <div
              style={{
                background: 'var(--bus-glass-highlight)',
                border: '1px solid var(--bus-glass-border)',
                borderRadius: 'var(--bus-radius-md)',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                <div className="bus-badge" style={{ flexShrink: 0 }}>
                  <Bus size={14} />
                  <span>{liveRoutePlan.mode === 'RAIL' ? liveRoutePlan.recommendedLine.lt : `${liveRoutePlan.recommendedLine.lt}-${liveRoutePlan.recommendedLine.tl}`}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bus-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {liveRoutePlan.departureStop.np}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    <Footprints size={12} style={{ flexShrink: 0 }} /> {liveRoutePlan.totalWalkDurationMinutes} min a pé até o ponto
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <span
                  key={liveRoutePlan.nextBusEtaMinutes}
                  className="bus-num thh-value-pop"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: etaColors.color,
                    background: etaColors.background,
                    padding: '4px 8px',
                    borderRadius: 'var(--bus-radius-sm)',
                    whiteSpace: 'nowrap',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {liveRoutePlan.nextBusEtaMinutes < 0 ? 'Sem previsão' : liveRoutePlan.nextBusEtaMinutes <= 2 ? 'Chegando agora' : `em ${liveRoutePlan.nextBusEtaMinutes} min`}
                </span>
              </div>
            </div>
              );
            })()}

            {/* Botão Ação Rápida */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
              <button
                onClick={() => currentFrequent && onSelectDestination(currentFrequent.destinationName)}
                className="thh-btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '13px', minHeight: '44px' }}
              >
                <span>Ver Opções de Rota</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--bus-text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--bus-text-primary)' }}>Previsão em Tempo Real</span>
            <span style={{ fontSize: '12px' }}>
              {activeDestinationsList.length > 0
                ? 'Toque em um dos destinos rápidos acima para calcular o trajeto e próximo ônibus.'
                : 'Busque um destino para ver o trajeto e o próximo ônibus em tempo real.'}
            </span>
          </div>
        )}
      </div>

      {/* 3. ATALHO PARA NOTÍCIAS AO VIVO */}
      {onOpenNews && (
        <div
          className="thh-glass thh-rise"
          onClick={onOpenNews}
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animationDelay: '0.16s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: 'var(--bus-radius-sm)',
                background: 'var(--bus-violet-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--bus-violet)',
                flexShrink: 0
              }}
              className={incidents.length > 0 ? 'thh-breathe' : undefined}
            >
              <Newspaper size={15} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                Notícias & Ocorrências ao Vivo
              </div>
              <div style={{ fontSize: '11px', color: 'var(--bus-text-secondary)' }}>
                {incidents.length > 0
                  ? `${incidents.length} ocorrências e comunicados ativos em SP`
                  : 'Acompanhe trânsito, metrô e SPTrans'}
              </div>
            </div>
          </div>

          <div className="thh-arrow" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bus-violet)', fontSize: '11.5px', fontWeight: 600 }}>
            <span>Abrir</span>
            <ChevronRight size={15} />
          </div>
        </div>
      )}
    </div>
  );
}
