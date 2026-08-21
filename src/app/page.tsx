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
import MoovitTabBar, { MoovitTabType } from '@/components/Moovit/MoovitTabBar';
import MoovitHome from '@/components/Moovit/MoovitHome';
import MoovitRouteResults from '@/components/Moovit/MoovitRouteResults';
import MoovitRouteDetail from '@/components/Moovit/MoovitRouteDetail';
import MoovitDeparturesModal from '@/components/Moovit/MoovitDeparturesModal';
import MoovitPassagens from '@/components/Moovit/MoovitPassagens';
import LineItineraryPanel from '@/components/BusSearch/LineItineraryPanel';
import RailsStatusBoard from '@/components/Rails/RailsStatusBoard';
import FavoritesDrawer from '@/components/Favorites/FavoritesDrawer';
import TokenConfigModal from '@/components/UI/TokenConfigModal';
import {
  Bus,
  Map as MapIcon,
  Play,
  Share2,
  ChevronUp,
  ChevronDown,
  X
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
        backgroundColor: '#121316',
        color: '#9CA3AF',
        gap: '12px'
      }}
    >
      <div className="animate-spin">
        <Bus size={32} color="#FF6600" />
      </div>
      <span style={{ fontSize: '13px' }}>Carregando mapa Moovit SP...</span>
    </div>
  )
});

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<MoovitTabType>('DIRECOES');
  const [screenMode, setScreenMode] = useState<'HOME' | 'RESULTS' | 'DETAIL'>('HOME');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isDeparturesModalOpen, setIsDeparturesModalOpen] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const [origem, setOrigem] = useState('Local atual');
  const [destino, setDestino] = useState('Rua Flor de Maio, 40');
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const [routes, setRoutes] = useState<RoutePlan[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const [selectedLine, setSelectedLine] = useState<SPTransLinha | null>(null);
  const [selectedParada, setSelectedParada] = useState<SPTransParada | null>(null);
  const [veiculos, setVeiculos] = useState<SPTransVeiculo[]>([]);
  const [paradas, setParadas] = useState<SPTransParada[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // GPS
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserCoords([pos.coords.latitude, pos.coords.longitude]),
        () => setUserCoords([-23.5158, -46.6182]),
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
    fetchFavorites().then(setFavorites);
  }, []);

  // Buscar linhas
  const loadVeiculos = useCallback(async (linha: SPTransLinha) => {
    setIsLoadingVehicles(true);
    try {
      const res = await fetch(`/api/onibus?tipo=posicao&codigo=${linha.cl}`);
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
  const handleCalculateRoutes = async (destParam?: string, origParam?: string) => {
    const destToUse = destParam || destino;
    const origToUse = origParam || origem;
    if (!destToUse || destToUse.trim().length < 2) return;

    setIsCalculating(true);
    setScreenMode('RESULTS');

    try {
      const origCoords = userCoords || [-23.5158, -46.6182];
      const params = new URLSearchParams({
        origem: origToUse === 'Local atual' ? 'Minha Localização' : origToUse,
        destino: destToUse,
        lat: String(origCoords[0]),
        lng: String(origCoords[1])
      });

      const res = await fetch(`/api/rotas?${params.toString()}`);
      const json = await res.json();

      if (json.success && json.data) {
        const searchResult: RouteSearchResult = json.data;
        const alts = searchResult.alternatives && searchResult.alternatives.length > 0
          ? searchResult.alternatives
          : [searchResult.primaryRoute];
        setRoutes(alts);
        setSelectedRouteIndex(0);
        setSelectedLine(alts[0].recommendedLine);
      }
    } catch (e) {
      console.error('Erro ao calcular rotas:', e);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleSelectRouteFromList = (idx: number) => {
    setSelectedRouteIndex(idx);
    const sel = routes[idx];
    if (sel) {
      setSelectedLine(sel.recommendedLine);
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

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#121316'
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
        />
      </div>

      {/* 2. BOTÕES FLUTUANTES SOBRE O MAPA NO MODO DETALHES (Screenshot 3) */}
      {screenMode === 'DETAIL' && isMapFullscreen && activeRoute && (
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
          <button
            onClick={() => setIsMapFullscreen(false)}
            style={{
              background: '#10B981',
              border: 'none',
              borderRadius: '9999px',
              padding: '12px 18px',
              color: '#FFFFFF',
              fontSize: '14px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)'
            }}
          >
            <Play size={16} fill="#fff" />
            <span>Começar Navegação</span>
          </button>

          <button
            onClick={() => setIsMapFullscreen(false)}
            style={{
              background: '#1C1E24',
              border: '1px solid #2D313C',
              borderRadius: '9999px',
              padding: '10px 16px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
            }}
          >
            <ChevronUp size={16} />
            <span>Ver Instruções da Viagem</span>
          </button>
        </div>
      )}

      {/* 3. PAINEL PRINCIPAL MOOVIT (Desktop à Esquerda / Mobile Central) */}
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
            maxHeight: 'calc(100vh - 85px)',
            overflowY: 'auto',
            borderRadius: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            scrollbarWidth: 'thin'
          }}
        >
          {activeTab === 'DIRECOES' && screenMode === 'HOME' && (
            <MoovitHome
              onSearchClick={() => {
                setScreenMode('RESULTS');
                handleCalculateRoutes();
              }}
              onSelectDestination={(dest) => {
                setDestino(dest);
                handleCalculateRoutes(dest);
              }}
              onOpenSettings={() => setIsTokenModalOpen(true)}
            />
          )}

          {activeTab === 'DIRECOES' && screenMode === 'RESULTS' && (
            <MoovitRouteResults
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
            />
          )}

          {activeTab === 'DIRECOES' && screenMode === 'DETAIL' && activeRoute && (
            <MoovitRouteDetail
              route={activeRoute}
              onBack={() => setScreenMode('RESULTS')}
              onStartLiveNavigation={() => setIsMapFullscreen(true)}
              onOpenDeparturesModal={() => setIsDeparturesModalOpen(true)}
              onToggleFavorite={handleToggleRouteFavorite}
              isFavorited={isCurrentRouteFavorited}
            />
          )}

          {activeTab === 'ESTACOES' && (
            <div style={{ background: '#1C1E24', border: '1px solid #2D313C', borderRadius: '16px', padding: '16px' }}>
              <RailsStatusBoard />
            </div>
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

          {activeTab === 'PASSAGENS' && (
            <MoovitPassagens />
          )}

          {activeTab === 'FAVORITOS' && (
            <div style={{ background: '#1C1E24', border: '1px solid #2D313C', borderRadius: '16px', padding: '16px' }}>
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

      {/* 4. MODAL DE PRÓXIMAS PARTIDAS (Screenshot 5) */}
      {isDeparturesModalOpen && activeRoute && (
        <MoovitDeparturesModal
          route={activeRoute}
          onClose={() => setIsDeparturesModalOpen(false)}
        />
      )}

      {/* 5. MODAL DE CONFIGURAÇÃO DE TOKEN */}
      <TokenConfigModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* 6. TAB BAR INFERIOR MOOVIT (5 ABAS) */}
      <MoovitTabBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'DIRECOES') setScreenMode('HOME');
          setIsMapFullscreen(false);
        }}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
