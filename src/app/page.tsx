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
import LineSearchModal from '@/components/BusSearch/LineSearchModal';
import LineArrivalCard from '@/components/BusSearch/LineArrivalCard';
import RailsStatusBoard from '@/components/Rails/RailsStatusBoard';
import FavoritesDrawer from '@/components/Favorites/FavoritesDrawer';
import RoutePlanner from '@/components/Routing/RoutePlanner';
import BottomSheet from '@/components/UI/BottomSheet';
import TokenConfigModal from '@/components/UI/TokenConfigModal';
import {
  Search,
  Bus,
  MapPin,
  Star,
  X,
  Clock,
  Navigation,
  RefreshCw,
  Sparkles,
  Info,
  ShieldCheck
} from 'lucide-react';

// Importação dinâmica do mapa (Leaflet requer client-side)
const LiveMap = dynamic(() => import('@/components/Map/LiveMap'), {
  ssr: false,
  loading: () => (
    <div
      style={{
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
      <span style={{ fontSize: '13px' }}>Carregando mapa de São Paulo...</span>
    </div>
  )
});

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTabType>('MAPA');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);

  const [selectedLine, setSelectedLine] = useState<SPTransLinha | null>(null);
  const [selectedParada, setSelectedParada] = useState<SPTransParada | null>(null);
  const [activeRoute, setActiveRoute] = useState<RoutePlan | null>(null);
  const [userCoords, setUserCoords] = useState<[number, number] | null>(null);

  const [veiculos, setVeiculos] = useState<SPTransVeiculo[]>([]);
  const [paradas, setParadas] = useState<SPTransParada[]>([]);
  const [previsoes, setPrevisoes] = useState<SPTransPrevisaoResponse | null>(null);

  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isLoadingPredictions, setIsLoadingPredictions] = useState(false);
  const [isMockMode, setIsMockMode] = useState(true);
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
          // Posição padrão SP se permissão não concedida
          setUserCoords([-23.5615, -46.6559]);
        },
        { enableHighAccuracy: true, timeout: 5000 }
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
      .catch(() => setIsMockMode(true));

    // Carregar linha inicial solicitada pelo usuário (1703-10 Jd. Hebron / Shopping Center Norte)
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

  // Polling automático a cada 25 segundos para manter os ônibus atualizados
  useEffect(() => {
    if (!selectedLine) return;

    loadVeiculos(selectedLine);
    const interval = setInterval(() => {
      loadVeiculos(selectedLine);
    }, 25000);

    return () => clearInterval(interval);
  }, [selectedLine, loadVeiculos]);

  // Carregar paradas da linha ou populares
  useEffect(() => {
    fetch('/api/onibus?tipo=paradas&q=Paulista')
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setParadas(json.data);
        }
      });
  }, []);

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
    <div className="app-viewport">
      {/* Header com indicador de conexão */}
      <Header
        onOpenSettings={() => setIsTokenModalOpen(true)}
        isMockMode={isMockMode}
      />

      {/* Conteúdo Principal de acordo com a Aba Ativa */}
      {activeTab === 'MAPA' && (
        <main style={{ position: 'relative', width: '100%', height: '100%' }}>
          {/* Botão de Busca Flutuante */}
          <div className="floating-search-container">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="search-trigger-btn"
              aria-label="Buscar linha ou parada"
            >
              <Search size={18} color="var(--text-muted)" />
              <span>
                {selectedLine
                  ? `Linha: ${selectedLine.lt}-${selectedLine.tl} (${veiculos.length} no mapa)`
                  : 'Buscar linha ou parada de ônibus...'}
              </span>
              <span className="search-shortcut">Buscar</span>
            </button>
          </div>

          {/* Banner de Rota Ativa (se houver rota planejada) */}
          {activeRoute && (
            <div
              style={{
                position: 'absolute',
                top: 'max(124px, calc(var(--safe-top) + 116px))',
                left: '16px',
                right: '16px',
                maxWidth: '480px',
                margin: '0 auto',
                zIndex: 998,
                background: 'rgba(15, 23, 42, 0.94)',
                backdropFilter: 'blur(12px)',
                border: '1px solid #38BDF8',
                borderRadius: '14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                animation: 'slideDown 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Navigation size={18} color="#38BDF8" />
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>
                    Rota até {activeRoute.destination.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#38BDF8' }}>
                    ~{activeRoute.totalDurationMinutes} min · Próximo ônibus em {activeRoute.nextBusEtaMinutes} min no ponto
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveRoute(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                title="Limpar rota"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {/* Chip da Linha Selecionada (se não tiver rota aberta) */}
          {selectedLine && !activeRoute && (
            <div className="active-line-pill">
              <span className="line-code-badge">
                {selectedLine.lt}-{selectedLine.tl}
              </span>
              <span className="line-name-text">
                {selectedLine.sl === 1 ? selectedLine.tp : selectedLine.ts}
              </span>

              <button
                onClick={handleToggleFavoriteLine}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLineFavorited ? '#FBBF24' : 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex'
                }}
                title={isLineFavorited ? 'Remover dos favoritos' : 'Favoritar linha'}
              >
                <Star size={16} fill={isLineFavorited ? '#FBBF24' : 'none'} />
              </button>

              <button
                onClick={() => {
                  setSelectedLine(null);
                  setVeiculos([]);
                }}
                className="btn-close-pill"
                title="Fechar linha"
              >
                <X size={15} />
              </button>
            </div>
          )}

          {/* Mapa Leaflet em Tempo Real com Roteirização e GPS */}
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
        </main>
      )}

      {activeTab === 'ROTAS' && (
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: '70px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <RoutePlanner
            userCoords={userCoords}
            onRouteCalculated={(route) => {
              setActiveRoute(route);
              setActiveTab('MAPA');
            }}
          />
        </main>
      )}

      {activeTab === 'PREVISOES' && (
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: '70px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <div style={{ maxWidth: '650px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Header da Aba Previsões */}
            <div className="glass-panel" style={{ borderRadius: '16px', padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: 'rgba(227, 6, 19, 0.15)',
                      color: 'var(--accent-sptrans)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '17px', fontWeight: 800 }}>Previsão de Chegada</h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Consulte o tempo estimado dos próximos ônibus
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '12px' }}
                >
                  <Search size={14} />
                  Trocar Parada
                </button>
              </div>

              {selectedParada ? (
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.25)',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MapPin size={18} color="#38BDF8" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '13px', color: '#fff' }}>
                        {selectedParada.np}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {selectedParada.ed}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleToggleFavoriteStop}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: isStopFavorited ? '#FBBF24' : 'var(--text-muted)',
                      cursor: 'pointer'
                    }}
                  >
                    <Star size={18} fill={isStopFavorited ? '#FBBF24' : 'none'} />
                  </button>
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Selecione uma parada no mapa ou busque pelo nome da via.
                </div>
              )}
            </div>

            {/* Lista de Previsões da Parada Selecionada */}
            {isLoadingPredictions && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
                <div>Calculando horários de chegada...</div>
              </div>
            )}

            {!isLoadingPredictions && previsoes?.p?.l && previsoes.p.l.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Linhas se aproximando agora ({previsoes.p.l.length}):
                </div>
                {previsoes.p.l.map((linhaPrev) => (
                  <LineArrivalCard
                    key={linhaPrev.cl}
                    linhaPrevisao={linhaPrev}
                    onSelectVehicle={(v) => {
                      setActiveTab('MAPA');
                    }}
                  />
                ))}
              </div>
            )}

            {!isLoadingPredictions && (!previsoes?.p?.l || previsoes.p.l.length === 0) && (
              <div
                className="glass-panel"
                style={{
                  borderRadius: '16px',
                  padding: '30px',
                  textAlign: 'center',
                  color: 'var(--text-muted)'
                }}
              >
                <Clock size={32} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ fontSize: '14px' }}>Nenhuma linha com previsão ativa no momento para esta parada.</p>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="btn-secondary"
                  style={{ marginTop: '12px' }}
                >
                  Buscar Outra Parada
                </button>
              </div>
            )}
          </div>
        </main>
      )}

      {activeTab === 'TRILHOS' && (
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: '70px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <RailsStatusBoard />
        </main>
      )}

      {activeTab === 'FAVORITOS' && (
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            paddingTop: '70px',
            paddingBottom: '80px',
            paddingLeft: '16px',
            paddingRight: '16px'
          }}
        >
          <FavoritesDrawer
            onSelectLinha={(linha) => {
              handleSelectLinha(linha);
              setActiveTab('MAPA');
            }}
            onSelectParada={(parada) => {
              handleSelectParada(parada);
              setActiveTab('PREVISOES');
            }}
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        </main>
      )}

      {/* Bottom Sheet com Detalhes da Parada Selecionada */}
      {selectedParada && activeTab === 'MAPA' && (
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

      {/* Modal de Busca de Linhas e Paradas */}
      <LineSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLinha={(linha) => {
          handleSelectLinha(linha);
          setActiveTab('MAPA');
        }}
        onSelectParada={(parada) => {
          handleSelectParada(parada);
          setActiveTab('PREVISOES');
        }}
      />

      {/* Modal de Configuração do Token SPTrans */}
      <TokenConfigModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
      />

      {/* Barra Inferior Mobile-First com 5 Abas */}
      <MobileTabBar
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
      />
    </div>
  );
}
