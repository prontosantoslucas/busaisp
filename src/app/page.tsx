'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  SPTransLinha,
  SPTransParada,
  SPTransVeiculo,
  SPTransPrevisaoResponse
} from '@/types/sptrans';
import { RoutePlan } from '@/lib/routing';
import { FavoriteItem, fetchFavorites, toggleFavorite } from '@/lib/supabase';
import Header from '@/components/Navigation/Header';
import MobileTabBar, { ActiveTabType } from '@/components/Navigation/MobileTabBar';
import LineArrivalCard from '@/components/BusSearch/LineArrivalCard';
import LineItineraryPanel from '@/components/BusSearch/LineItineraryPanel';
import RailsStatusBoard from '@/components/Rails/RailsStatusBoard';
import FavoritesDrawer from '@/components/Favorites/FavoritesDrawer';
import RoutePlanner from '@/components/Routing/RoutePlanner';
import BottomSheet from '@/components/UI/BottomSheet';
import TokenConfigModal from '@/components/UI/TokenConfigModal';
import {
  Bus,
  MapPin,
  Star,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  PanelLeftClose,
  PanelLeftOpen,
  Route,
  Navigation
} from 'lucide-react';

// Importação dinâmica do mapa (Leaflet client-side)
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
        backgroundColor: '#0B0F17',
        color: '#94A3B8',
        gap: '12px'
      }}
    >
      <div className="animate-spin">
        <Bus size={32} color="#E30613" />
      </div>
      <span style={{ fontSize: '13px' }}>Carregando mapa interativo de São Paulo...</span>
    </div>
  )
});

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('ROTAS');
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);

  const [selectedLine, setSelectedLine] = useState<SPTransLinha | null>(null);
  const [selectedParada, setSelectedParada] = useState<SPTransParada | null>(null);
  const [activeRoute, setActiveRoute] = useState<RoutePlan | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const [veiculos, setVeiculos] = useState<SPTransVeiculo[]>([]);
  const [paradas, setParadas] = useState<SPTransParada[]>([]);
  const [previsoes, setPrevisoes] = useState<SPTransPrevisaoResponse | null>(null);

  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isMockMode, setIsMockMode] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Monitorar geolocalização do usuário (GPS em tempo real)
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserCoords([pos.coords.latitude, pos.coords.longitude]);
        },
        (err) => {
          console.log('GPS padrão ativado:', err.message);
          setUserCoords([-23.5158, -46.6182]);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  }, []);

  // Carregar favoritos e verificar status da conexão
  useEffect(() => {
    fetchFavorites().then(setFavorites);

    fetch('/api/onibus?tipo=status_auth')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsMockMode(!data.authenticated);
        }
      })
      .catch(() => setIsMockMode(false));

    // Carregar linha inicial padrão
    handleSelectLinha({
      cl: 1703,
      lc: false,
      lt: '1703',
      tl: 10,
      sl: 1,
      tp: 'JD. HEBRON',
      ts: 'SHOPPING CENTER NORTE'
    });
  }, []);

  // Buscar veículos ao vivo da linha selecionada
  const loadVeiculos = useCallback(async (linha: SPTransLinha) => {
    setIsLoadingVehicles(true);
    try {
      const res = await fetch(`/api/onibus?tipo=posicao&codigo=${linha.cl}`);
      const json = await res.json();
      if (json.success && json.data?.vs) {
        setVeiculos(json.data.vs);
      }
    } catch (e) {
      console.error('Erro ao buscar veículos:', e);
    } finally {
      setIsLoadingVehicles(false);
    }
  }, []);

  // Polling automático a cada 25 segundos
  useEffect(() => {
    if (!selectedLine) return;
    loadVeiculos(selectedLine);
    const interval = setInterval(() => {
      loadVeiculos(selectedLine);
    }, 25000);
    return () => clearInterval(interval);
  }, [selectedLine, loadVeiculos]);

  // Selecionar uma linha
  const handleSelectLinha = (linha: SPTransLinha) => {
    setSelectedLine(linha);
    loadVeiculos(linha);
  };

  // Selecionar uma parada e carregar previsões de chegada
  const handleSelectParada = async (parada: SPTransParada) => {
    setSelectedParada(parada);
    setIsLoadingPredictions(true);
    try {
      const res = await fetch(`/api/onibus?tipo=previsao_parada&codigo=${parada.cp}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPrevisoes(json.data);
      }
    } catch (e) {
      console.error('Erro ao buscar previsão da parada:', e);
    } finally {
      setIsLoadingPredictions(false);
    }
  };

  // Favoritar / Desfavoritar linha ou parada
  const isLineFavorited = selectedLine
    ? favorites.some((f) => f.type === 'linha' && String(f.ref_code) === String(selectedLine.cl))
    : false;

  const isStopFavorited = selectedParada
    ? favorites.some((f) => f.type === 'parada' && String(f.ref_code) === String(selectedParada.cp))
    : false;

  const handleToggleFavoriteLine = async () => {
    if (!selectedLine) return;
    const item: FavoriteItem = {
      type: 'linha',
      ref_code: String(selectedLine.cl),
      title: `${selectedLine.lt}-${selectedLine.tl} ${selectedLine.tp}`,
      label: 'Ônibus'
    };
    const updated = await toggleFavorite(item);
    setFavorites(updated);
  };

  const handleToggleFavoriteStop = async () => {
    if (!selectedParada) return;
    const item: FavoriteItem = {
      type: 'parada',
      ref_code: String(selectedParada.cp),
      title: selectedParada.np,
      label: 'Parada',
      details: {
        ed: selectedParada.ed,
        py: selectedParada.py,
        px: selectedParada.px
      }
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
        background: '#0B0F17'
      }}
    >
      {/* 1. MAPA PERSISTENTE NO FUNDO DE TODA A APLICAÇÃO */}
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
          onSelectParada={handleSelectParada}
          isLoading={isLoadingVehicles}
          onRefresh={() => selectedLine && loadVeiculos(selectedLine)}
          isMockMode={isMockMode}
          activeRoute={activeRoute}
          userCoords={userCoords}
        />
      </div>

      {/* 2. HEADER SUPERIOR FIXO */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1000 }}>
        <Header
          onOpenSettings={() => setIsTokenModalOpen(true)}
          isMockMode={isMockMode}
        />
      </div>

      {/* 3. BARRA COMPACTA QUANDO O PAINEL ESTÁ MINIMIZADO OU ROTA ATIVA NO MAPA */}
      {isPanelMinimized && (
        <div
          style={{
            position: 'absolute',
            top: '72px',
            left: '16px',
            right: '16px',
            maxWidth: '520px',
            margin: '0 auto',
            zIndex: 960,
            background: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '9999px',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 25px rgba(0,0,0,0.7)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeRoute ? (
              <>
                <span style={{ background: 'var(--accent-sptrans)', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  {activeRoute.recommendedLine.lt}-{activeRoute.recommendedLine.tl}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  ~{activeRoute.totalDurationMinutes} min
                </span>
              </>
            ) : selectedLine ? (
              <>
                <span style={{ background: 'var(--accent-sptrans)', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                  {selectedLine.lt}-{selectedLine.tl}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                  {selectedLine.ts}
                </span>
              </>
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                BusaÍ SP Mapa
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={() => setIsPanelMinimized(false)}
              style={{
                background: '#1E293B',
                border: '1px solid #334155',
                color: '#38BDF8',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <PanelLeftOpen size={14} />
              <span>Ver Opções</span>
            </button>

            {activeRoute && (
              <button
                onClick={() => setActiveRoute(null)}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
                title="Limpar traçado do mapa"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 4. MENU FLUTUANTE À ESQUERDA (DESKTOP) E CENTRALIZADO (MOBILE) */}
      {!isPanelMinimized && (
        <div
          className="floating-main-panel"
          style={{
            position: 'absolute',
            top: '72px',
            left: '16px',
            zIndex: 950,
            width: 'calc(100% - 32px)',
            maxWidth: '420px',
            maxHeight: 'calc(100vh - 150px)',
            overflowY: 'auto',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            pointerEvents: 'auto',
            scrollbarWidth: 'thin'
          }}
        >
          {/* Botão Superior para Minimizar e ver o mapa livre */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-4px' }}>
            <button
              onClick={() => setIsPanelMinimized(true)}
              style={{
                background: '#0F172A',
                border: '1px solid #334155',
                color: '#94A3B8',
                borderRadius: '8px',
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
              }}
              title="Minimizar para ver o mapa completo"
            >
              <PanelLeftClose size={13} />
              <span>Ver Mapa Livre</span>
            </button>
          </div>

          {activeTab === 'ROTAS' && (
            <RoutePlanner
              userCoords={userCoords}
              onRouteCalculated={(route) => {
                setActiveRoute(route);
                // Minimiza automaticamente para mostrar a rota clara no mapa
                setIsPanelMinimized(true);
              }}
            />
          )}

          {activeTab === 'ITINERARIOS' && (
            <LineItineraryPanel
              selectedLine={selectedLine}
              onSelectLine={(l) => {
                handleSelectLinha(l);
              }}
              veiculos={veiculos}
              isLoadingVehicles={isLoadingVehicles}
              onToggleFavoriteLine={handleToggleFavoriteLine}
              isLineFavorited={isLineFavorited}
            />
          )}

          {activeTab === 'TRILHOS' && (
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '16px' }}>
              <RailsStatusBoard />
            </div>
          )}

          {activeTab === 'FAVORITOS' && (
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '16px' }}>
              <FavoritesDrawer
                onSelectLinha={(linha) => {
                  handleSelectLinha(linha);
                  setActiveTab('ITINERARIOS');
                }}
                onSelectParada={(parada) => {
                  handleSelectParada(parada);
                }}
                onOpenSearch={() => setActiveTab('ITINERARIOS')}
              />
            </div>
          )}
        </div>
      )}

      {/* 5. BOTTOM SHEET COM DETALHES DA PARADA SELECIONADA */}
      {selectedParada && (
        <BottomSheet
          isOpen={Boolean(selectedParada)}
          onClose={() => setSelectedParada(null)}
          title={
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={18} color="#38BDF8" />
              <span style={{ fontSize: '15px', fontWeight: 700 }}>{selectedParada.np}</span>
            </div>
          }
          actionButton={
            <button
              onClick={handleToggleFavoriteStop}
              style={{
                background: 'transparent',
                border: 'none',
                color: isStopFavorited ? '#FBBF24' : 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px'
              }}
              title={isStopFavorited ? 'Remover favorito' : 'Salvar parada'}
            >
              <Star size={18} fill={isStopFavorited ? '#FBBF24' : 'none'} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              📍 {selectedParada.ed}
            </div>

            {isLoadingPredictions ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 6px auto' }} />
                Consultando chegadas em tempo real...
              </div>
            ) : previsoes?.p?.l && previsoes.p.l.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {previsoes.p.l.map((l) => (
                  <LineArrivalCard key={l.cl} linhaPrevisao={l} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: '13px' }}>
                Sem previsões no momento para esta parada.
              </div>
            )}
          </div>
        </BottomSheet>
      )}

      {/* 6. MODAL DE CONFIGURAÇÃO DE TOKEN */}
      <TokenConfigModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* 7. TAB BAR MOBILE-FIRST INFERIOR */}
      <MobileTabBar
        activeTab={activeTab}
        onChangeTab={(tab) => {
          setActiveTab(tab);
          setIsPanelMinimized(false);
        }}
        favoritesCount={favorites.length}
      />
    </div>
  );
}
