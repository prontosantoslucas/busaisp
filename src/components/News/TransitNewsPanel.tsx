'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrafficIncident, IncidentType } from '@/types/traffic';
import { RailsResponse, RailLine } from '@/types/trilhos';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  TrainTrack,
  Bus,
  Clock,
  ShieldAlert,
  Cone,
  Car,
  Newspaper,
  Calendar,
  Sparkles,
  ChevronRight,
  Search,
  SlidersHorizontal,
  BellRing,
  Info,
  Layers,
  ArrowUpRight
} from 'lucide-react';

interface TransitNewsPanelProps {
  incidents: TrafficIncident[];
  onSelectIncidentOnMap?: (inc: TrafficIncident) => void;
  onNavigateToLines?: () => void;
}

export type NewsFilterType = 'ALL' | 'TRANSITO' | 'TRILHOS' | 'SPTRANS' | 'INFORMATIVOS';

export interface UnifiedNewsItem {
  id: string;
  sourceType: 'TRANSITO' | 'TRILHOS' | 'SPTRANS' | 'INFORMATIVOS';
  title: string;
  subtitle?: string;
  description: string;
  timestamp: string;
  badge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  incidentRef?: TrafficIncident;
  railRef?: RailLine;
  source: string;
  categoryTag: string;
}

const STATIC_MOBILITY_NEWS: UnifiedNewsItem[] = [
  {
    id: 'news-tarifa-zero',
    sourceType: 'INFORMATIVOS',
    title: 'Domingão Tarifa Zero: Ônibus da SPTrans são 100% gratuitos',
    subtitle: 'Válido em toda a cidade aos domingos e feriados',
    description: 'A gratuidade no transporte coletivo municipal por ônibus em São Paulo funciona todos os domingos e feriados oficiais da 0h às 23h59. Não é debitada tarifa no validador.',
    timestamp: 'Atualizado hoje',
    badge: {
      label: 'TARIFA ZERO',
      bg: 'rgba(16, 185, 129, 0.18)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.4)'
    },
    source: 'Prefeitura de São Paulo / SPTrans',
    categoryTag: 'Benefícios & Tarifas'
  },
  {
    id: 'news-paulista-aberta',
    sourceType: 'SPTRANS',
    title: 'Avenida Paulista Aberta: Linhas de ônibus com desvios operacionais',
    subtitle: 'Domingos e feriados das 9h às 16h',
    description: 'Durante o programa Ruas Abertas, as linhas municipais que cruzam a Av. Paulista são desviadas pela Alameda Santos e Rua São Carlos do Pinhal. Pontos temporários devidamente sinalizados.',
    timestamp: 'Programação semanal',
    badge: {
      label: 'DESVIOS SPTRANS',
      bg: 'rgba(6, 182, 212, 0.18)',
      text: '#38BDF8',
      border: 'rgba(6, 182, 212, 0.4)'
    },
    source: 'CET / SPTrans',
    categoryTag: 'Desvios de Itinerário'
  },
  {
    id: 'news-bilhete-unico',
    sourceType: 'INFORMATIVOS',
    title: 'Regras do Bilhete Único: Até 4 embarques em ônibus em até 3 horas',
    subtitle: 'Integração temporal no transporte público',
    description: 'O Bilhete Único Comum permite a utilização de até 4 ônibus da SPTrans no intervalo de 3 horas pagando uma única tarifa de R$ 4,40. A integração com trilhos tem desconto especial.',
    timestamp: 'Informativo',
    badge: {
      label: 'BILHETE ÚNICO',
      bg: 'rgba(99, 102, 241, 0.18)',
      text: '#A5B4FC',
      border: 'rgba(99, 102, 241, 0.4)'
    },
    source: 'SPTrans Oficial',
    categoryTag: 'Regras de Uso'
  },
  {
    id: 'news-frota-verde',
    sourceType: 'SPTRANS',
    title: 'Mais de 1.000 novos ônibus elétricos e climatizados em circulação',
    subtitle: 'Renovação da frota municipal sustentável',
    description: 'A SPTrans continua a expansão dos ônibus elétricos a bateria com ar-condicionado, carregadores USB, Wi-Fi e motores silenciosos de emissão zero em corredores da Zona Leste e Sul.',
    timestamp: 'Boletim de Frota',
    badge: {
      label: 'FROTA ELÉTRICA',
      bg: 'rgba(16, 185, 129, 0.18)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.4)'
    },
    source: 'Olho Vivo SPTrans',
    categoryTag: 'Tecnologia & Frota'
  },
  {
    id: 'news-metro-expansao',
    sourceType: 'TRILHOS',
    title: 'Avanço nas obras das Linhas 6-Laranja e 17-Ouro do Metrô',
    subtitle: 'Interligação entre bairros e malha sobre trilhos',
    description: 'Novas estações conectando a Zona Norte à região central e o monotrilho do Aeroporto de Congonhas seguem em fase avançada de montagem eletromecânica e testes de via.',
    timestamp: 'STM Notícias',
    badge: {
      label: 'OBRAS METRÔ',
      bg: 'rgba(245, 158, 11, 0.18)',
      text: '#FBBF24',
      border: 'rgba(245, 158, 11, 0.4)'
    },
    source: 'Secretaria dos Transportes Metropolitanos',
    categoryTag: 'Expansão de Malha'
  }
];

export default function TransitNewsPanel({
  incidents = [],
  onSelectIncidentOnMap
}: TransitNewsPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<NewsFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Status dos Trilhos
  const [railsData, setRailsData] = useState<RailsResponse | null>(null);
  const [isLoadingRails, setIsLoadingRails] = useState(false);

  const fetchRails = async () => {
    setIsLoadingRails(true);
    try {
      const res = await fetch('/api/trilhos/status');
      const json = await res.json();
      if (json.success && json.data) {
        setRailsData(json.data);
      }
    } catch (e) {
      console.error('Erro ao buscar status dos trilhos:', e);
    } finally {
      setIsLoadingRails(false);
    }
  };

  useEffect(() => {
    fetchRails();
  }, []);

  // Converter incidentes de trânsito em itens de notícia unificados
  const incidentNewsItems = useMemo<UnifiedNewsItem[]>(() => {
    return incidents.map((inc) => {
      let badgeLabel = 'Alerta de Trânsito';
      let badgeBg = 'rgba(245, 158, 11, 0.18)';
      let badgeText = '#FBBF24';
      let badgeBorder = 'rgba(245, 158, 11, 0.4)';

      if (inc.type === 'ACCIDENT') {
        badgeLabel = 'Acidente';
        badgeBg = 'rgba(239, 68, 68, 0.18)';
        badgeText = '#F87171';
        badgeBorder = 'rgba(239, 68, 68, 0.4)';
      } else if (inc.type === 'CONSTRUCTION') {
        badgeLabel = 'Obras na Via';
        badgeBg = 'rgba(249, 115, 22, 0.18)';
        badgeText = '#FB923C';
        badgeBorder = 'rgba(249, 115, 22, 0.4)';
      } else if (inc.type === 'JAM') {
        badgeLabel = 'Lentidão Severa';
        badgeBg = 'rgba(234, 179, 8, 0.18)';
        badgeText = '#FACC15';
        badgeBorder = 'rgba(234, 179, 8, 0.4)';
      } else if (inc.type === 'POLICE') {
        badgeLabel = 'Blitz / Policiamento';
        badgeBg = 'rgba(59, 130, 246, 0.18)';
        badgeText = '#60A5FA';
        badgeBorder = 'rgba(59, 130, 246, 0.4)';
      }

      return {
        id: inc.id,
        sourceType: 'TRANSITO',
        title: inc.street ? `${inc.street}` : inc.title,
        subtitle: inc.street && inc.title !== inc.street ? inc.title : undefined,
        description: inc.description || 'Intercorrência registrada no tráfego da via.',
        timestamp: inc.updatedAt ? `Hoje às ${inc.updatedAt}` : 'Ao vivo',
        badge: {
          label: badgeLabel,
          bg: badgeBg,
          text: badgeText,
          border: badgeBorder
        },
        severity: inc.severity,
        incidentRef: inc,
        source: `CET / ${inc.source}`,
        categoryTag: 'Trânsito & Vias'
      };
    });
  }, [incidents]);

  // Converter status de trilhos com ocorrência em itens de notícia
  const railNewsItems = useMemo<UnifiedNewsItem[]>(() => {
    if (!railsData?.lines) return [];
    return railsData.lines.map((line) => {
      const isNormal = line.status === 'NORMAL';
      return {
        id: `rail-${line.id}`,
        sourceType: 'TRILHOS',
        title: `${line.name}: ${line.statusText || (isNormal ? 'Operação Normal' : 'Atenção Operacional')}`,
        subtitle: `${line.operator === 'METRO' ? 'Metrô SP' : line.operator === 'VIAMOBILIDADE' ? 'ViaMobilidade' : line.operator === 'VIAQUATRO' ? 'ViaQuatro' : 'CPTM'} · Linha ${line.id}`,
        description: line.description || (isNormal ? 'Trens circulando com intervalos regulares e fluxo desimpedido em todas as estações.' : 'Intervenção ou velocidade reduzida registrada para adequação de fluxo.'),
        timestamp: line.updatedAt || 'Em tempo real',
        badge: {
          label: isNormal ? 'NORMAL' : line.statusText.toUpperCase(),
          bg: isNormal ? 'rgba(16, 185, 129, 0.18)' : 'rgba(245, 158, 11, 0.18)',
          text: isNormal ? '#34D399' : '#FBBF24',
          border: isNormal ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.4)'
        },
        railRef: line,
        source: 'Diretoria de Operações Metrô/CPTM',
        categoryTag: 'Metrô & Trilhos'
      };
    });
  }, [railsData]);

  // Feed completo unificado
  const allFeedItems = useMemo<UnifiedNewsItem[]>(() => {
    // Colocar incidentes e notícias importantes no topo
    return [...incidentNewsItems, ...STATIC_MOBILITY_NEWS, ...railNewsItems];
  }, [incidentNewsItems, railNewsItems]);

  // Filtro por categoria e busca textual
  const filteredItems = useMemo(() => {
    return allFeedItems.filter((item) => {
      if (selectedFilter !== 'ALL' && item.sourceType !== selectedFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesSubtitle = item.subtitle?.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesTag = item.categoryTag.toLowerCase().includes(q);
        return matchesTitle || matchesSubtitle || matchesDesc || matchesTag;
      }
      return true;
    });
  }, [allFeedItems, selectedFilter, searchQuery]);

  const criticalIncidentsCount = incidents.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH').length;

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. CABEÇALHO UNIFICADO "NOTÍCIAS AO VIVO" */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.96) 0%, rgba(22, 27, 34, 0.92) 100%)',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(6, 182, 212, 0.2) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38BDF8'
              }}
            >
              <Newspaper size={20} />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Notícias ao Vivo</span>
                <span style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.2)', color: '#F87171', padding: '1px 6px', borderRadius: '4px', fontWeight: 800 }}>
                  SP
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Trânsito, Obras, Metrô, Ônibus e Informativos em Tempo Real
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchRails()}
            className="bus-pill"
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              fontWeight: 800,
              gap: '4px',
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34D399'
            }}
            title="Atualizar Feed"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'markerPulse 1.5s infinite' }} />
            <span>AO VIVO</span>
          </button>
        </div>

        {/* BARRA DE PESQUISA NO FEED */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
          <input
            type="text"
            className="bus-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por rua, linha, metrô ou palavra-chave..."
            style={{
              paddingLeft: '38px',
              height: '42px',
              fontSize: '13px',
              background: 'rgba(15, 23, 42, 0.8)'
            }}
          />
          <Search
            size={16}
            color="#06B6D4"
            style={{ position: 'absolute', left: '12px', pointerEvents: 'none' }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* CHIPS DE FILTRO DA CENTRAL */}
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`bus-pill ${selectedFilter === 'ALL' ? 'active' : ''}`}
            style={{ fontSize: '11.5px', padding: '5px 12px' }}
          >
            Tudo ({allFeedItems.length})
          </button>
          <button
            onClick={() => setSelectedFilter('TRANSITO')}
            className={`bus-pill ${selectedFilter === 'TRANSITO' ? 'active' : ''}`}
            style={{ fontSize: '11.5px', padding: '5px 12px' }}
          >
            🚨 Trânsito ({incidents.length})
          </button>
          <button
            onClick={() => setSelectedFilter('TRILHOS')}
            className={`bus-pill ${selectedFilter === 'TRILHOS' ? 'active' : ''}`}
            style={{ fontSize: '11.5px', padding: '5px 12px' }}
          >
            🚆 Metrô & CPTM
          </button>
          <button
            onClick={() => setSelectedFilter('SPTRANS')}
            className={`bus-pill ${selectedFilter === 'SPTRANS' ? 'active' : ''}`}
            style={{ fontSize: '11.5px', padding: '5px 12px' }}
          >
            🚌 SPTrans & Ônibus
          </button>
          <button
            onClick={() => setSelectedFilter('INFORMATIVOS')}
            className={`bus-pill ${selectedFilter === 'INFORMATIVOS' ? 'active' : ''}`}
            style={{ fontSize: '11.5px', padding: '5px 12px' }}
          >
            📢 Tarifas & Regras
          </button>
        </div>
      </div>

      {/* 2. CARD DE PLANTÃO (RESUMO DE URGÊNCIA) */}
      {selectedFilter === 'ALL' && !searchQuery && (
        <div
          className="bus-glass-panel"
          style={{
            padding: '12px 14px',
            border: '1px solid rgba(6, 182, 212, 0.25)',
            background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(13, 17, 23, 0.9) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={16} color="#38BDF8" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '12px', color: '#CBD5E1' }}>
              <strong>Radar São Paulo:</strong> {incidents.length} ocorrências ativas nas vias e malha de trilhos monitorada.
            </div>
          </div>
        </div>
      )}

      {/* 3. FEED DE NOTÍCIAS AO VIVO (CARDS UNIFICADOS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.length === 0 ? (
          <div className="bus-glass-panel" style={{ padding: '28px', textAlign: 'center' }}>
            <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
              Nenhuma notícia ou alerta com o filtro selecionado
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
              Tente selecionar a categoria "Tudo" ou limpar a busca.
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                className="bus-card"
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                style={{
                  padding: '14px',
                  borderLeft: `4px solid ${item.badge.border.replace('0.4', '0.9')}`,
                  borderColor: isExpanded ? item.badge.border : undefined,
                  transition: 'all 0.2s ease'
                }}
              >
                {/* Linha Superior: Categoria, Badge e Horário */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        fontSize: '10.5px',
                        fontWeight: 900,
                        background: item.badge.bg,
                        color: item.badge.text,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: `1px solid ${item.badge.border}`
                      }}
                    >
                      {item.badge.label}
                    </span>

                    <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                      • {item.categoryTag}
                    </span>
                  </div>

                  <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={11} />
                    {item.timestamp}
                  </span>
                </div>

                {/* Título Principal */}
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', marginTop: '8px', lineHeight: 1.35 }}>
                  {item.title}
                </div>

                {/* Subtítulo se houver */}
                {item.subtitle && (
                  <div style={{ fontSize: '12px', color: '#38BDF8', fontWeight: 600, marginTop: '2px' }}>
                    {item.subtitle}
                  </div>
                )}

                {/* Descrição */}
                <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '6px', lineHeight: 1.45 }}>
                  {item.description}
                </div>

                {/* Rodapé e Ações (Expandido) */}
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                    Fonte: <strong style={{ color: '#94A3B8' }}>{item.source}</strong>
                  </span>

                  {item.incidentRef && onSelectIncidentOnMap && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncidentOnMap(item.incidentRef!);
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                        border: 'none',
                        borderRadius: '9999px',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '5px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(6, 182, 212, 0.3)'
                      }}
                    >
                      <MapPin size={12} />
                      <span>Ver no Mapa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
