'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  SPTransLinha,
  SPTransParada,
  SPTransVeiculo,
  SPTransPrevisaoResponse
} from '@/types/sptrans';
import { RoutePlan, RouteSearchResult } from '@/lib/routing';
import { FavoriteItem, fetchFavorites, toggleFavorite } from '@/lib/supabase';
import TransitDock, { TransitTabType } from '@/components/Navigation/TransitDock';
import TransitHeader from '@/components/Navigation/TransitHeader';
import TransitHomeHub from '@/components/Transit/TransitHomeHub';
import TransitRouteResults from '@/components/Transit/TransitRouteResults';
import TransitRouteDetail from '@/components/Transit/TransitRouteDetail';
import TransitDeparturesModal from '@/components/Transit/TransitDeparturesModal';
import StationsExplorerPanel from '@/components/Stations/StationsExplorerPanel';
import TransitNewsPanel from '@/components/News/TransitNewsPanel';
import { StationItem, SP_ALL_STATIONS } from '@/lib/stationsData';
import { TrafficIncident } from '@/types/traffic';
import LineItineraryPanel from '@/components/BusSearch/LineItineraryPanel';
import FavoritesDrawer from '@/components/Favorites/FavoritesDrawer';
import TokenConfigModal from '@/components/UI/TokenConfigModal';
import { voiceService } from '@/lib/voiceService';
import {
  Bus,
  Map as MapIcon,
  Play,
  ChevronUp,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';

const LiveMap = dynamic(() => import('@/components/Map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#07090E',
        color: '#94A3B8',
        gap: '12px'
      }}
    >
      <div style={{ width: '32px', height: '32px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#38BDF8' }}>Carregando Radar BusaÍ SP...</span>
    </div>
  )
});

// Utilitário de cálculo de distância (Haversine em metros)
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<TransitTabType>('ROTAS');
  const [screenMode, setScreenMode] = useState<'HOME' | 'RESULTS' | 'DETAIL'>('HOME');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isDeparturesModalOpen, setIsDeparturesModalOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  const [isPercursoActive, setIsPercursoActive] = useState(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [origem, setOrigem] = useState('Minha Localização');
  const [destino, setDestino] = useState('Rua Flor de Maio, 40');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);
  const [userAccuracyMeters, setUserAccuracyMeters] = useState<number | null>(null);

  const [routes, setRoutes] = useState<RoutePlan[]>([]);
  const [routeSearchError, setRouteSearchError] = useState<string | null>(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  // Horário de saída planejado ("HH:MM"); vazio = "sair agora".
  const [scheduledTime, setScheduledTime] = useState('');

  const [selectedLine, setSelectedLine] = useState<SPTransLinha | null>(null);
  const [selectedParada, setSelectedParada] = useState<SPTransParada | null>(null);
  const [selectedStation, setSelectedStation] = useState<StationItem | null>(null);
  const [incidents, setIncidents] = useState<TrafficIncident[]>([]);
  const [mapFocusCoords, setMapFocusCoords] = useState<[number, number] | null>(null);
  const [veiculos, setVeiculos] = useState<SPTransVeiculo[]>([]);
  const [paradas, setParadas] = useState<SPTransParada[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Restaurar preferência de voz salva (senão o mudo "esquece" a cada recarga)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('busaisp_voice_muted');
      if (saved === 'true') {
        setIsVoiceMuted(true);
        voiceService.setMuted(true);
      }
    } catch {
      // Ambiente sem localStorage — usa o padrão (voz ativa).
    }
  }, []);

  // Restaurar tema salvo (o layout.tsx já aplica no <html> antes da 1ª pintura;
  // aqui só sincroniza o estado do React pra manter o botão de alternância certo).
  useEffect(() => {
    try {
      const saved = localStorage.getItem('busaisp_theme');
      if (saved === 'light') setTheme('light');
    } catch {
      // Ambiente sem localStorage — usa o padrão (escuro).
    }
  }, []);

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('busaisp_theme', next);
    } catch {
      // Ambiente sem localStorage — preferência só dura a sessão.
    }
  };

  // GPS Contínuo & Incidentes de Trânsito ao Vivo
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      // 1. Obter posição inicial imediatamente com alta precisão
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setUserAccuracyMeters(pos.coords.accuracy);
        },
        (err) => {
          console.warn('[GPS] Erro ao obter posição inicial:', err?.message);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );

      // 2. Monitorar continuamente atualizações
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
          setUserAccuracyMeters(pos.coords.accuracy);
        },
        () => {
          // Manter coordenadas anteriores se houver oscilação transitória de sinal
        },
        { enableHighAccuracy: true, maximumAge: 3000, timeout: 8000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  useEffect(() => {
    fetchFavorites().then(setFavorites);

    const fetchIncidents = async () => {
      try {
        const res = await fetch('/api/transito/incidentes');
        const json = await res.json();
        if (json.success && json.data?.incidents) {
          setIncidents(json.data.incidents);
        }
      } catch (err) {
        console.error('Erro ao buscar incidentes de trânsito:', err);
      }
    };
    fetchIncidents();
    const incInterval = setInterval(fetchIncidents, 60000);
    return () => clearInterval(incInterval);
  }, []);

  // Monitorar aproximação por voz durante o Percurso Ativo
  useEffect(() => {
    if (!isPercursoActive || !userCoords || isVoiceMuted) return;
    const currentRoute = routes[selectedRouteIndex];
    if (!currentRoute) return;

    // Verificar distância até o destino final
    if (currentRoute.destination?.lat && currentRoute.destination?.lng) {
      const distToDest = getDistanceMeters(
        userCoords[0],
        userCoords[1],
        currentRoute.destination.lat,
        currentRoute.destination.lng
      );

      if (distToDest < 300) {
        voiceService.announceApproachingDestination(currentRoute.destination.name);
      }
    }
  }, [isPercursoActive, userCoords, routes, selectedRouteIndex, isVoiceMuted]);

  // Buscar posição dos veículos da SPTrans
  const loadVeiculos = useCallback(async (linha: SPTransLinha) => {
    setIsLoadingVehicles(true);
    try {
      const letreiroQuery = encodeURIComponent(`${linha.lt}-${linha.tl}`);
      const res = await fetch(`/api/onibus?tipo=posicao&codigo=${linha.cl}&letreiro=${letreiroQuery}`);
      const json = await res.json();
      if (json.success && json.data?.vs) {
        setVeiculos(json.data.vs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedLine) return;
    loadVeiculos(selectedLine);
    const interval = setInterval(() => loadVeiculos(selectedLine), 25000);
    return () => clearInterval(interval);
  }, [selectedLine, loadVeiculos]);

  // Executar Cálculo de Rotas
  const handleCalculateRoutes = async (destParam?: string, origParam?: string, scheduledTimeParam?: string) => {
    const destToUse = destParam || destino;
    const origToUse = origParam || origem;
    // Usa o valor explícito quando fornecido (evita ler o estado antigo antes do
    // re-render, no caso de troca de horário disparar o cálculo imediatamente).
    const timeToUse = scheduledTimeParam !== undefined ? scheduledTimeParam : scheduledTime;
    if (!destToUse || destToUse.trim().length < 2) return;

    setIsCalculating(true);
    setScreenMode('RESULTS');
    setRouteSearchError(null);
    setRoutes([]);

    try {
      const origCoords = userCoords || [-23.5158, -46.6182];
      const params = new URLSearchParams({
        origem: origToUse === 'Local atual' ? 'Minha Localização' : origToUse,
        destino: destToUse,
        lat: String(origCoords[0]),
        lng: String(origCoords[1]),
        origLat: String(origCoords[0]),
        origLng: String(origCoords[1])
      });

      if (timeToUse) {
        const [h, m] = timeToUse.split(':').map(Number);
        if (!Number.isNaN(h) && !Number.isNaN(m)) {
          const agora = new Date();
          let offset = (h * 60 + m) - (agora.getHours() * 60 + agora.getMinutes());
          if (offset < 0) offset += 24 * 60;
          params.set('partidaMinutos', String(offset));
        }
      }

      const res = await fetch(`/api/rotas?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const searchResult: RouteSearchResult = json.data;
        const alts =
          searchResult.alternatives && searchResult.alternatives.length > 0
            ? searchResult.alternatives
            : [searchResult.primaryRoute];
        setRoutes(alts);
        setSelectedRouteIndex(0);
        setSelectedLine(alts[0].recommendedLine);
        loadVeiculos(alts[0].recommendedLine);
      } else {
        setRouteSearchError(json.error || 'Não foi possível calcular uma rota para esse destino.');
      }
    } catch (e) {
      console.error('Erro ao calcular rotas:', e);
      setRouteSearchError('Não foi possível conectar ao serviço de rotas. Tente novamente.');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectRouteFromList = (idx: number) => {
    setSelectedRouteIndex(idx);
    const sel = routes[idx];
    if (sel) {
      setSelectedLine(sel.recommendedLine);
      loadVeiculos(sel.recommendedLine);
    }
    setScreenMode('DETAIL');
  };

  const activeRoute = routes[selectedRouteIndex] || null;

  const isCurrentRouteFavorited = activeRoute
    ? favorites.some((f) => f.ref_code === String(activeRoute.recommendedLine.cl))
    : false;

  const handleToggleRouteFavorite = async () => {
    if (!activeRoute) return;
    const item: FavoriteItem = {
      type: 'linha',
      ref_code: String(activeRoute.recommendedLine.cl),
      title: `${activeRoute.recommendedLine.lt}-${activeRoute.recommendedLine.tl} ${activeRoute.destination.name}`,
      label: 'Rota'
    };
    const updated = await toggleFavorite(item);
    setFavorites(updated);
  };

  const handleToggleVoice = () => {
    const nextState = !isVoiceMuted;
    setIsVoiceMuted(nextState);
    voiceService.setMuted(nextState);
    try {
      localStorage.setItem('busaisp_voice_muted', String(nextState));
    } catch {
      // Ambiente sem localStorage (ex.: navegação privada) — preferência só dura a sessão.
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100dvh',
        overflow: 'hidden',
        background: '#07090E'
      }}
    >
      {/* 1. MAPA PERSISTENTE NO FUNDO */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 1
        }}
      >
        <LiveMap
          selectedLine={selectedLine}
          veiculos={veiculos}
          paradas={paradas}
          onSelectParada={(p) => setSelectedParada(p)}
          isLoading={isLoadingVehicles}
          onRefresh={() => selectedLine && loadVeiculos(selectedLine)}
          activeRoute={activeRoute}
          userCoords={userCoords}
          userAccuracyMeters={userAccuracyMeters}
          focusCoords={mapFocusCoords}
          theme={theme}
          isPercursoActive={isPercursoActive}
          onStartPercurso={() => {
            setIsPercursoActive(true);
            setIsMapFullscreen(true);
            if (!isVoiceMuted && activeRoute) {
              voiceService.announceBoarding(
                `${activeRoute.recommendedLine.lt}-${activeRoute.recommendedLine.tl}`,
                activeRoute.destination.name
              );
            }
          }}
          onStopPercurso={() => {
            setIsPercursoActive(false);
            voiceService.stop();
          }}
          stations={SP_ALL_STATIONS}
          selectedStation={selectedStation}
          onRouteToStation={(st) => {
            setDestino(`${st.name}, ${st.address}`);
            setActiveTab('ROTAS');
            handleCalculateRoutes(`${st.name}, ${st.address}`);
          }}
          incidents={incidents}
        />
      </div>

      {/* 2. BOTÕES FLUTUANTES SOBRE O MAPA NO MODO PERCURSO/FULLSCREEN */}
      {isMapFullscreen && (
        <>
          {/* Se a navegação NÃO estiver ativa, botões no topo */}
          {!isPercursoActive && (
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                zIndex: 960,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                animation: 'fadeIn 0.2s ease'
              }}
            >
              {activeRoute && (
                <button
                  onClick={() => {
                    setIsPercursoActive(true);
                    if (!isVoiceMuted && activeRoute) {
                      voiceService.announceBoarding(
                        `${activeRoute.recommendedLine.lt}-${activeRoute.recommendedLine.tl}`,
                        activeRoute.destination.name
                      );
                    }
                  }}
                  className="bus-btn-voice"
                  style={{ padding: '12px 18px', fontSize: '13.5px' }}
                >
                  <Volume2 size={16} />
                  <span>Iniciar com Voz</span>
                </button>
              )}

              <button
                onClick={() => setIsMapFullscreen(false)}
                className="bus-glass-panel"
                style={{
                  borderRadius: '9999px',
                  padding: '10px 16px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer'
                }}
              >
                <ChevronUp size={16} color="#06B6D4" />
                <span>Ver Painel da Viagem</span>
              </button>
            </div>
          )}

          {/* Se a navegação ESTIVER ativa, posicionar o botão na base esquerda (abaixo do HUD do topo) */}
          {isPercursoActive && (
            <div
              style={{
                position: 'absolute',
                bottom: '84px',
                left: '16px',
                zIndex: 995,
                animation: 'fadeIn 0.2s ease'
              }}
            >
              <button
                onClick={() => setIsMapFullscreen(false)}
                className="bus-glass-panel"
                style={{
                  borderRadius: '9999px',
                  padding: '10px 16px',
                  color: '#F8FAFC',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.7)'
                }}
              >
                <ChevronUp size={16} color="#06B6D4" />
                <span>Ver Painel da Viagem</span>
              </button>
            </div>
          )}
        </>
      )}

      {/* 3. PAINEL PRINCIPAL BUSAÍ SP (Desktop à Esquerda / Mobile Adaptativo) */}
      {!isMapFullscreen && (
        <div
          className="floating-main-panel"
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            zIndex: 950,
            width: 'calc(100% - 32px)',
            maxWidth: '440px',
            maxHeight: 'calc(100dvh - 96px)',
            overflowY: 'auto',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            pointerEvents: 'auto',
            scrollbarWidth: 'none',
            paddingBottom: '8px'
          }}
        >
          {/* Header Compacto com Telemetria e Toggle de Voz/Mapa */}
          <TransitHeader
            isVoiceMuted={isVoiceMuted}
            onToggleVoice={handleToggleVoice}
            onOpenSettings={() => setIsTokenModalOpen(true)}
            hasGps={!!userCoords}
            activeVehiclesCount={veiculos.length}
            onToggleMap={() => setIsMapFullscreen(!isMapFullscreen)}
            isMapFullscreen={isMapFullscreen}
            theme={theme}
            onToggleTheme={handleToggleTheme}
          />

          {/* Abas Principais */}
          {activeTab === 'ROTAS' && screenMode === 'HOME' && (
            <TransitHomeHub
              onSearchClick={() => setScreenMode('RESULTS')}
              onSelectDestination={(dest) => {
                setDestino(dest);
                handleCalculateRoutes(dest);
              }}
              onOpenSettings={() => setIsTokenModalOpen(true)}
              favorites={favorites}
              userCoords={userCoords}
              incidents={incidents}
              onOpenNews={() => setActiveTab('NOTICIAS')}
            />
          )}

          {activeTab === 'ROTAS' && screenMode === 'RESULTS' && (
            <TransitRouteResults
              origem={origem}
              destino={destino}
              onOrigemChange={setOrigem}
              onDestinoChange={setDestino}
              onSwap={() => {
                const temp = origem;
                setOrigem(destino);
                setDestino(temp);
                handleCalculateRoutes(temp, destino);
              }}
              onBack={() => setScreenMode('HOME')}
              onToggleMap={() => setIsMapFullscreen(!isMapFullscreen)}
              isMapVisible={isMapFullscreen}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRoute={handleSelectRouteFromList}
              onCalculate={() => handleCalculateRoutes()}
              isCalculating={isCalculating}
              searchError={routeSearchError}
              scheduledTime={scheduledTime}
              onScheduledTimeChange={(time: string) => {
                setScheduledTime(time);
                handleCalculateRoutes(undefined, undefined, time);
              }}
            />
          )}

          {activeTab === 'ROTAS' && screenMode === 'DETAIL' && activeRoute && (
            <TransitRouteDetail
              route={activeRoute}
              routes={routes}
              selectedRouteIndex={selectedRouteIndex}
              onSelectRouteIndex={(idx) => handleSelectRouteFromList(idx)}
              onBack={() => setScreenMode('RESULTS')}
              onStartLiveNavigation={() => {
                setIsPercursoActive(true);
                setIsMapFullscreen(true);
              }}
              onOpenDeparturesModal={() => setIsDeparturesModalOpen(true)}
              onToggleFavorite={handleToggleRouteFavorite}
              isFavorited={isCurrentRouteFavorited}
              isPercursoActive={isPercursoActive}
              onStopPercurso={() => {
                setIsPercursoActive(false);
                voiceService.stop();
              }}
              isVoiceMuted={isVoiceMuted}
              onToggleVoice={handleToggleVoice}
            />
          )}

          {activeTab === 'NOTICIAS' && (
            <TransitNewsPanel
              incidents={incidents}
              onSelectIncidentOnMap={(inc) => {
                setIsMapFullscreen(true);
                setMapFocusCoords([inc.lat, inc.lng]);
              }}
            />
          )}

          {activeTab === 'TRILHOS' && (
            <StationsExplorerPanel
              selectedStationId={selectedStation?.id}
              onSelectStation={(st) => {
                setSelectedStation(st);
              }}
              onRouteToStation={(st) => {
                setDestino(`${st.name}, ${st.address}`);
                setActiveTab('ROTAS');
                handleCalculateRoutes(`${st.name}, ${st.address}`);
              }}
            />
          )}

          {activeTab === 'LINHAS' && (
            <LineItineraryPanel
              selectedLine={selectedLine}
              onSelectLine={(l) => {
                setSelectedLine(l);
                loadVeiculos(l);
              }}
              veiculos={veiculos}
              isLoadingVehicles={isLoadingVehicles}
            />
          )}

          {activeTab === 'FAVORITOS' && (
            <div className="bus-glass-panel" style={{ padding: '16px' }}>
              <FavoritesDrawer
                onSelectLinha={(linha) => {
                  setSelectedLine(linha);
                  setActiveTab('LINHAS');
                }}
                onSelectParada={(parada) => {
                  setSelectedParada(parada);
                }}
                onOpenSearch={() => setActiveTab('LINHAS')}
              />
            </div>
          )}
        </div>
      )}

      {/* 4. MODAL DE PRÓXIMAS PARTIDAS */}
      {isDeparturesModalOpen && activeRoute && (
        <TransitDeparturesModal
          route={activeRoute}
          onClose={() => setIsDeparturesModalOpen(false)}
        />
      )}

      {/* 5. MODAL DE CONFIGURAÇÃO DE TOKEN */}
      <TokenConfigModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* 6. DOCK FLUTUANTE DE NAVEGAÇÃO INFERIOR */}
      <TransitDock
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'ROTAS') setScreenMode('HOME');
          setIsMapFullscreen(false);
        }}
        favoritesCount={favorites.length}
        incidentsCount={incidents.length}
      />
    </div>
  );
}
