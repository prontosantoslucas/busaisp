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
  Star,
  X,
  ArrowRight,
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

  // Coordenadas arredondadas a ~550m: o GPS real (watchPosition) tem jitter que
  // facilmente passa de 111m em sinal ruim (dentro de prédio, canyon urbano), o que
  // reiniciava esta busca em loop e mantinha o spinner girando pra sempre — nunca dava
  // tempo de uma leitura "assentar" antes da próxima chegar e reiniciar tudo de novo.
  const roundedLat = userCoords ? Math.round(userCoords[0] * 200) / 200 : null;
  const roundedLng = userCoords ? Math.round(userCoords[1] * 200) / 200 : null;

  // Carregar telemetria em tempo real para o destino ativo
  useEffect(() => {
    if (!currentFrequent) return;

    let isMounted = true;
    // Spinner só aparece na primeira carga; atualizações de GPS depois disso trocam o
    // conteúdo silenciosamente em vez de "piscar" de volta pro estado de carregamento.
    if (!liveRoutePlan) setIsLoadingLive(true);

    // Debounce: espera o GPS assentar antes de buscar — sem isso, jitter contínuo do
    // watchPosition dispara uma busca nova antes da anterior terminar, sem nunca convergir.
    const debounceTimer = setTimeout(() => {
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
    }, 1200);

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      {/* 1. BARRA DE BUSCA "PARA ONDE VAMOS?" */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '14px 16px',
          position: 'relative',
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
                style={{
                  position: 'absolute',
                  right: '42px',
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

            <button
              type="submit"
              style={{
                position: 'absolute',
                right: '8px',
                background: 'var(--bus-violet-ink)',
                border: 'none',
                borderRadius: 'var(--bus-radius-sm)',
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
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--bus-radius-sm)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bus-surface-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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

        {/* Chips de Destinos Rápidos */}
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
                <Icon size={14} color="var(--bus-violet)" />
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
          position: 'relative'
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
                style={{
                  width: frequentIndex === idx ? '18px' : '6px',
                  height: '6px',
                  borderRadius: '3px',
                  background: frequentIndex === idx ? 'var(--bus-violet)' : 'var(--bus-border)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease, width 0.2s ease'
                }}
              />
            ))}
          </div>
        </div>

        {/* Card Content */}
        {isLoadingLive ? (
          <div style={{ padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '24px', height: '24px', border: '3px solid var(--bus-violet-soft)', borderTopColor: 'var(--bus-violet)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)' }}>Consultando telemetria SPTrans...</span>
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
                <div className="bus-num" style={{ fontSize: '20px', fontWeight: 700, color: 'var(--bus-violet)' }}>
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
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div className="bus-badge">
                  <Bus size={14} />
                  <span>{liveRoutePlan.recommendedLine.lt}-{liveRoutePlan.recommendedLine.tl}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--bus-text-primary)' }}>
                    {liveRoutePlan.departureStop.np}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--bus-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Footprints size={12} /> {liveRoutePlan.totalWalkDurationMinutes} min a pé até o ponto
                  </span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span
                  className="bus-num"
                  style={{ fontSize: '11px', fontWeight: 700, color: etaColors.color, background: etaColors.background, padding: '3px 7px', borderRadius: 'var(--bus-radius-sm)' }}
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
          <div style={{ padding: '14px 0', textAlign: 'center', color: 'var(--bus-text-secondary)', fontSize: '13px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 600, color: 'var(--bus-text-primary)' }}>Previsão em Tempo Real</span>
            <span style={{ fontSize: '12px' }}>Toque em um dos destinos rápidos acima para calcular o trajeto e próximo ônibus.</span>
          </div>
        )}
      </div>

      {/* 3. ATALHO PARA NOTÍCIAS AO VIVO */}
      {onOpenNews && (
        <div
          className="bus-glass-panel"
          onClick={onOpenNews}
          style={{
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer'
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
