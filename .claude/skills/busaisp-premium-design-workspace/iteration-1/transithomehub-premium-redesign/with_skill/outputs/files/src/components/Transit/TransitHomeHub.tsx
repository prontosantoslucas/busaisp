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

  // Entradas escalonadas (stagger) dos 3 painéis — cada um usa o mesmo
  // .animate-slide-up/spring cubic-bezier já validado no app (modais,
  // TransitDock, etc.), só com um atraso curto e crescente entre eles em vez
  // de tudo aparecer de uma vez.
  const STAGGER_STEP_MS = 70;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. BARRA DE BUSCA "PARA ONDE VAMOS?" */}
      <div
        className="bus-glass-panel animate-slide-up"
        style={{
          padding: '14px 16px',
          position: 'relative',
          animationDelay: `${STAGGER_STEP_MS * 0}ms`,
          // Sem isso, o dropdown de sugestões (absolutamente posicionado, abaixo
          // deste card) fica escondido atrás do card "RADAR AO VIVO" seguinte:
          // superfícies irmãs formam contextos de empilhamento próprios, então a
          // ordem no DOM decide a pintura a menos que este card tenha z-index maior.
          zIndex: 20
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="var(--bus-violet)" />
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
              color="var(--bus-violet)"
              style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }}
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="bus-icon-btn animate-fade-in"
                style={{
                  position: 'absolute',
                  right: '42px',
                  borderRadius: 'var(--bus-radius-sm)',
                  padding: '6px'
                }}
                aria-label="Limpar busca"
              >
                <X size={15} />
              </button>
            )}

            <button
              type="submit"
              className="bus-icon-btn bus-icon-btn-filled"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'var(--bus-violet-ink)',
                borderRadius: 'var(--bus-radius-sm)',
                color: '#FFFFFF',
                width: '30px',
                height: '30px'
              }}
              aria-label="Buscar rota"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Dropdown de Autocomplete */}
        {isDropdownOpen && (
          <div
            ref={dropdownRef}
            className="animate-slide-up"
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              zIndex: 999,
              background: 'var(--bus-surface-elevated)',
              border: '1px solid var(--bus-border-highlight)',
              borderRadius: 'var(--bus-radius-lg)',
              boxShadow: 'var(--bus-shadow-card)',
              maxHeight: '260px',
              overflowY: 'auto',
              padding: '6px'
            }}
          >
            {isLoadingSuggestions ? (
              <div style={{ padding: '14px', textAlign: 'center', color: 'var(--bus-text-secondary)', fontSize: '13px' }}>
                Buscando paradas e locais em SP...
              </div>
            ) : suggestions.length > 0 ? (
              suggestions.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggestion(item)}
                  className="bus-suggestion-row"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--bus-radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
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
                Nenhum local encontrado para "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Chips de Destinos Rápidos: favoritos, ou os mais buscados de verdade (search_events) */}
        {activeDestinationsList.length > 0 ? (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              marginTop: '12px',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
              // Máscara de desvanecimento nas bordas (não uma cor sólida por cima —
              // isso quebraria no tema claro): sinaliza "tem mais pra rolar" sem
              // depender de saber a cor de fundo atual.
              WebkitMaskImage: activeDestinationsList.length > 3
                ? 'linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)'
                : undefined,
              maskImage: activeDestinationsList.length > 3
                ? 'linear-gradient(90deg, transparent 0, #000 20px, #000 calc(100% - 20px), transparent 100%)'
                : undefined
            }}
          >
            {activeDestinationsList.map((dest, idx) => {
              const Icon = dest.icon;
              return (
                <button
                  key={idx}
                  onClick={() => onSelectDestination(dest.destinationName)}
                  className="bus-pill"
                  style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
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
        className="bus-glass-panel animate-slide-up"
        style={{
          padding: '16px',
          position: 'relative',
          animationDelay: `${STAGGER_STEP_MS * 1}ms`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '10px', height: '10px' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'var(--bus-live)', animation: 'markerPulse 1.5s infinite' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--bus-live)' }} />
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
                className="bus-dot"
                style={{
                  width: frequentIndex === idx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: frequentIndex === idx ? 'var(--bus-violet)' : 'var(--bus-border)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card Content */}
        {isLoadingLive ? (
          // Skeleton no formato exato do card final (título, nome do destino,
          // número grande de ETA) em vez de um spinner genérico — a forma do
          // conteúdo já é conhecida de antemão, então antecipamos ela.
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div className="bus-skeleton" style={{ width: '84px', height: '10px' }} />
                <div className="bus-skeleton" style={{ width: '140px', height: '15px' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                <div className="bus-skeleton" style={{ width: '56px', height: '20px' }} />
                <div className="bus-skeleton" style={{ width: '72px', height: '11px' }} />
              </div>
            </div>
            <div className="bus-skeleton" style={{ width: '100%', height: '54px', borderRadius: 'var(--bus-radius-md)' }} />
            <div className="bus-skeleton" style={{ width: '100%', height: '40px', borderRadius: 'var(--bus-radius-full)' }} />
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
                {/* key força um remount a cada atualização de telemetria (30s ou
                    troca de destino), disparando o fade-in — o número troca com
                    uma respiração suave em vez de "pular" pro novo valor. */}
                <div
                  key={`${currentFrequent?.destinationName}-${liveRoutePlan.totalDurationMinutes}`}
                  className="bus-num animate-fade-in"
                  style={{ fontSize: '22px', fontWeight: 800, color: 'var(--bus-violet)', lineHeight: 1.1 }}
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
                background: 'var(--bus-surface-sunken)',
                border: '1px solid var(--bus-border)',
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
                  className="bus-num"
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: etaColors.color,
                    background: etaColors.background,
                    padding: '4px 8px',
                    borderRadius: 'var(--bus-radius-sm)',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
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
                className="bus-btn-primary"
                style={{ flex: 1, padding: '10px 16px', fontSize: '13px' }}
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
          className="bus-glass-panel bus-panel-pressable animate-slide-up"
          onClick={onOpenNews}
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            animationDelay: `${STAGGER_STEP_MS * 2}ms`
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--bus-violet)', fontSize: '11.5px', fontWeight: 600 }}>
            <span>Abrir</span>
            <ChevronRight size={15} />
          </div>
        </div>
      )}
    </div>
  );
}
