'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TrafficIncident } from '@/types/traffic';
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
  ArrowUpRight,
  Volume2,
  VolumeX,
  Share2,
  X,
  BookOpen,
  ArrowLeft,
  Check
} from 'lucide-react';

interface TransitNewsPanelProps {
  incidents: TrafficIncident[];
  onSelectIncidentOnMap?: (inc: TrafficIncident) => void;
  onNavigateToLines?: () => void;
}

export type NewsFilterType = 'ALL' | 'TRANSITO' | 'TRILHOS' | 'SPTRANS' | 'INFORMATIVOS';
export type FontSizeScale = 'sm' | 'md' | 'lg';

export interface UnifiedNewsItem {
  id: string;
  sourceType: 'TRANSITO' | 'TRILHOS' | 'SPTRANS' | 'INFORMATIVOS';
  title: string;
  subtitle?: string;
  description: string;
  fullContent?: string;
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
    subtitle: 'Válido em toda a capital aos domingos e feriados oficiais',
    description:
      'A gratuidade no transporte coletivo municipal por ônibus em São Paulo funciona todos os domingos e feriados oficiais da 0h às 23h59. Não é debitada tarifa no validador.',
    fullContent:
      'O programa Domingão Tarifa Zero garante acesso livre a todas as mais de 1.300 linhas de ônibus municipais operadas pela SPTrans em São Paulo. A medida incentiva o lazer, a convivência comunitária e o acesso a parques, centros culturais e áreas públicas.\n\n• Horário: De 0h00 até 23h59 de todos os domingos e feriados de São Paulo.\n• Validação: Basta aproximar qualquer Bilhete Único ativo na catraca (nenhum saldo é debitado) ou solicitar liberação pelo cobrador/motorista.\n• Abrangência: Todos os ônibus convencionais, articulados, trólebus e micro-ônibus da SPTrans em todas as zonas da cidade.',
    timestamp: 'Atualizado hoje',
    badge: {
      label: 'TARIFA ZERO',
      bg: 'rgba(16, 185, 129, 0.22)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.5)'
    },
    source: 'Prefeitura de São Paulo / SPTrans',
    categoryTag: 'Benefícios & Tarifas'
  },
  {
    id: 'news-paulista-aberta',
    sourceType: 'SPTRANS',
    title: 'Avenida Paulista Aberta: Linhas de ônibus com desvios operacionais',
    subtitle: 'Domingos e feriados das 9h às 16h',
    description:
      'Durante o programa Ruas Abertas, as linhas municipais que cruzam a Av. Paulista são desviadas pela Alameda Santos e Rua São Carlos do Pinhal. Pontos temporários devidamente sinalizados.',
    fullContent:
      'O tráfego de veículos e ônibus permanece interditado na Avenida Paulista entre a Praça Oswaldo Cruz e a Rua da Consolação aos domingos.\n\n• Desvio Sentido Paraíso/Centro: Os coletivos trafegam pela Alameda Santos, com pontos de embarque e desembarque provisórios instalados.\n• Desvio Sentido Rebouças/Consolação: Os ônibus seguem pela Rua São Carlos do Pinhal e Alameda Jaú.\n• Dica: Utilize as estações da Linha 2-Verde do Metrô (Brigadeiro, Trianon-Masp, Consolação) para travessia rápida.',
    timestamp: 'Programação semanal',
    badge: {
      label: 'DESVIOS SPTRANS',
      bg: 'rgba(6, 182, 212, 0.22)',
      text: '#38BDF8',
      border: 'rgba(6, 182, 212, 0.5)'
    },
    source: 'CET / SPTrans',
    categoryTag: 'Desvios de Itinerário'
  },
  {
    id: 'news-bilhete-unico',
    sourceType: 'INFORMATIVOS',
    title: 'Regras do Bilhete Único: Até 4 embarques em ônibus em até 3 horas',
    subtitle: 'Integração temporal no transporte público',
    description:
      'O Bilhete Único Comum permite a utilização de até 4 ônibus da SPTrans no intervalo de 3 horas pagando uma única tarifa de R$ 4,40. A integração com trilhos tem desconto especial.',
    fullContent:
      'Com o Bilhete Único você economiza em todas as suas viagens na cidade de São Paulo:\n\n• Integração Ônibus + Ônibus: Até 4 embarques em linhas diferentes da SPTrans no período de 3 horas.\n• Integração Ônibus + Metrô/CPTM: Tarifa integrada especial de R$ 8,20 no período de 3 horas.\n• Recarga: Disponível pelo aplicativo oficial, terminais de autoatendimento nas estações e pontos credenciados.',
    timestamp: 'Informativo Oficial',
    badge: {
      label: 'BILHETE ÚNICO',
      bg: 'rgba(99, 102, 241, 0.22)',
      text: '#A5B4FC',
      border: 'rgba(99, 102, 241, 0.5)'
    },
    source: 'SPTrans Oficial',
    categoryTag: 'Regras de Uso'
  },
  {
    id: 'news-frota-verde',
    sourceType: 'SPTRANS',
    title: 'Mais de 1.000 novos ônibus elétricos e climatizados em circulação',
    subtitle: 'Renovação da frota municipal sustentável',
    description:
      'A SPTrans continua a expansão dos ônibus elétricos a bateria com ar-condicionado, carregadores USB, Wi-Fi e motores silenciosos de emissão zero em corredores da Zona Leste e Sul.',
    fullContent:
      'A cidade de São Paulo acelera a transição energética do transporte público:\n\n• Conforto: Veículos 100% elétricos com suspensão a ar pneumática, tomadas USB nos assentos e ar-condicionado digital.\n• Sustentabilidade: Emissão zero de poluentes e ruído reduzido em mais de 70% nas vias públicas.\n• Linhas atendidas: Principais eixos das zonas Sul, Leste e corredores Santo Amaro/9 de Julho.',
    timestamp: 'Boletim de Frota',
    badge: {
      label: 'FROTA ELÉTRICA',
      bg: 'rgba(16, 185, 129, 0.22)',
      text: '#34D399',
      border: 'rgba(16, 185, 129, 0.5)'
    },
    source: 'Olho Vivo SPTrans',
    categoryTag: 'Tecnologia & Frota'
  },
  {
    id: 'news-metro-expansao',
    sourceType: 'TRILHOS',
    title: 'Avanço nas obras das Linhas 6-Laranja e 17-Ouro do Metrô',
    subtitle: 'Interligação entre bairros e malha sobre trilhos',
    description:
      'Novas estações conectando a Zona Norte à região central e o monotrilho do Aeroporto de Congonhas seguem em fase avançada de montagem eletromecânica e testes de via.',
    fullContent:
      'As novas linhas sobre trilhos de São Paulo trarão alívio imediato ao trânsito:\n\n• Linha 6-Laranja: Ligará a Brasilândia e Freguesia do Ó ao centro (São Joaquim/Higienópolis-Mackenzie) com 15 estações.\n• Linha 17-Ouro: Monotrilho ligando o Aeroporto de Congonhas à Linha 9-Esmeralda (Morumbi) e Linha 5-Lilás.\n• Conexão: Maior integração rápida com linhas de ônibus nos terminais intermodais.',
    timestamp: 'STM Notícias',
    badge: {
      label: 'OBRAS METRÔ',
      bg: 'rgba(245, 158, 11, 0.22)',
      text: '#FBBF24',
      border: 'rgba(245, 158, 11, 0.5)'
    },
    source: 'Secretaria dos Transportes Metropolitanos',
    categoryTag: 'Expansão de Malha'
  }
];

export default function TransitNewsPanel({ incidents = [], onSelectIncidentOnMap }: TransitNewsPanelProps) {
  const [selectedFilter, setSelectedFilter] = useState<NewsFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReaderItem, setActiveReaderItem] = useState<UnifiedNewsItem | null>(null);
  const [fontSize, setFontSize] = useState<FontSizeScale>('md');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingItemId, setSpeakingItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  // Text-to-Speech (Leitura em Voz Alta)
  const handleSpeak = (item: UnifiedNewsItem) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (isSpeaking && speakingItemId === item.id) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setSpeakingItemId(null);
      return;
    }

    window.speechSynthesis.cancel();

    const textToRead = `${item.title}. ${item.subtitle ? item.subtitle + '.' : ''} ${item.description}. ${item.fullContent || ''}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'pt-BR';
    utterance.rate = 1.05;

    utterance.onend = () => {
      setIsSpeaking(false);
      setSpeakingItemId(null);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setSpeakingItemId(null);
    };

    setSpeakingItemId(item.id);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleStopSpeak = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setSpeakingItemId(null);
  };

  // Compartilhar notícia
  const handleShare = async (item: UnifiedNewsItem) => {
    const shareText = `📢 [BusaÍ SP] ${item.title}\n\n${item.description}\n\nFonte: ${item.source}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: window.location.href
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  // Converter incidentes de trânsito em itens de notícia unificados
  const incidentNewsItems = useMemo<UnifiedNewsItem[]>(() => {
    return incidents.map((inc) => {
      let badgeLabel = 'Alerta de Trânsito';
      let badgeBg = 'rgba(245, 158, 11, 0.22)';
      let badgeText = '#FBBF24';
      let badgeBorder = 'rgba(245, 158, 11, 0.5)';

      if (inc.type === 'ACCIDENT') {
        badgeLabel = 'Acidente';
        badgeBg = 'rgba(239, 68, 68, 0.22)';
        badgeText = '#F87171';
        badgeBorder = 'rgba(239, 68, 68, 0.5)';
      } else if (inc.type === 'CONSTRUCTION') {
        badgeLabel = 'Obras na Via';
        badgeBg = 'rgba(249, 115, 22, 0.22)';
        badgeText = '#FB923C';
        badgeBorder = 'rgba(249, 115, 22, 0.5)';
      } else if (inc.type === 'JAM') {
        badgeLabel = 'Lentidão Severa';
        badgeBg = 'rgba(234, 179, 8, 0.22)';
        badgeText = '#FACC15';
        badgeBorder = 'rgba(234, 179, 8, 0.5)';
      } else if (inc.type === 'POLICE') {
        badgeLabel = 'Blitz / Operação';
        badgeBg = 'rgba(59, 130, 246, 0.22)';
        badgeText = '#60A5FA';
        badgeBorder = 'rgba(59, 130, 246, 0.5)';
      }

      return {
        id: inc.id,
        sourceType: 'TRANSITO',
        title: inc.street ? `${inc.street}` : inc.title,
        subtitle: inc.street && inc.title !== inc.street ? inc.title : undefined,
        description: inc.description || 'Intercorrência registrada no tráfego da via com impacto no fluxo de ônibus.',
        fullContent: `Ocorrência registrada na via ${inc.street || inc.title}.\n\n• Impacto: ${inc.severity === 'CRITICAL' || inc.severity === 'HIGH' ? 'Grave lentidão e retenção de faixas.' : 'Lentidão moderada.'}\n• Atualização: Monitoramento ativo pela CET e radares de trânsito de São Paulo.`,
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

  // Converter status de trilhos em notícias
  const railNewsItems = useMemo<UnifiedNewsItem[]>(() => {
    if (!railsData?.lines) return [];
    return railsData.lines.map((line) => {
      const isNormal = line.status === 'NORMAL';
      return {
        id: `rail-${line.id}`,
        sourceType: 'TRILHOS',
        title: `${line.name}: ${line.statusText || (isNormal ? 'Operação Normal' : 'Atenção Operacional')}`,
        subtitle: `${line.operator === 'METRO' ? 'Metrô SP' : line.operator === 'VIAMOBILIDADE' ? 'ViaMobilidade' : line.operator === 'VIAQUATRO' ? 'ViaQuatro' : 'CPTM'} · Linha ${line.id}`,
        description:
          line.description ||
          (isNormal
            ? 'Trens circulando com intervalos regulares e fluxo desimpedido em todas as estações.'
            : 'Intervenção operacional registrada para controle de fluxo e segurança dos passageiros.'),
        fullContent: `Situação operacional da ${line.name}:\n\n• Status Atual: ${line.statusText}\n• Operadora: ${line.operator}\n• Detalhes: ${line.description || 'Circulação regular em toda a extensão da linha.'}`,
        timestamp: line.updatedAt || 'Em tempo real',
        badge: {
          label: isNormal ? 'NORMAL' : line.statusText.toUpperCase(),
          bg: isNormal ? 'rgba(16, 185, 129, 0.22)' : 'rgba(245, 158, 11, 0.22)',
          text: isNormal ? '#34D399' : '#FBBF24',
          border: isNormal ? 'rgba(16, 185, 129, 0.5)' : 'rgba(245, 158, 11, 0.5)'
        },
        railRef: line,
        source: 'Diretoria de Operações Metrô/CPTM',
        categoryTag: 'Metrô & Trilhos'
      };
    });
  }, [railsData]);

  // Feed completo unificado
  const allFeedItems = useMemo<UnifiedNewsItem[]>(() => {
    return [...incidentNewsItems, ...STATIC_MOBILITY_NEWS, ...railNewsItems];
  }, [incidentNewsItems, railNewsItems]);

  // Filtro por categoria e busca
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

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* 1. CABEÇALHO DA CENTRAL DE NOTÍCIAS */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '16px',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: 'var(--bus-radius-sm)',
                background: 'var(--bus-violet-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <Newspaper size={22} />
            </div>
            <div>
              <div
                style={{
                  fontSize: '17px',
                  fontWeight: 700,
                  color: 'var(--bus-text-primary)',
                  letterSpacing: '-0.3px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                className="bus-display"
              >
                <span>Notícias & Trânsito</span>
                <span
                  style={{
                    fontSize: '10.5px',
                    background: 'var(--bus-red-soft)',
                    color: 'var(--bus-red)',
                    padding: '2px 6px',
                    borderRadius: 'var(--bus-radius-sm)',
                    fontWeight: 700
                  }}
                >
                  SP AO VIVO
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--bus-text-secondary)' }}>
                CET, Metrô, SPTrans e avisos aos passageiros
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchRails()}
            className="bus-pill"
            style={{
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              gap: '6px',
              background: 'var(--bus-emerald-soft)',
              border: '1px solid var(--bus-emerald)',
              color: 'var(--bus-emerald)',
              minHeight: '36px'
            }}
            title="Atualizar Feed"
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: 'var(--bus-emerald)',
                animation: 'markerPulse 1.5s infinite'
              }}
            />
            <span>AO VIVO</span>
          </button>
        </div>

        {/* BARRA DE PESQUISA */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            className="bus-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por avenida, linha, metrô ou aviso..."
            style={{
              paddingLeft: '40px',
              height: '46px',
              fontSize: '14.5px'
            }}
          />
          <Search size={18} color="var(--bus-violet)" style={{ position: 'absolute', left: '14px', pointerEvents: 'none' }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                background: 'none',
                border: 'none',
                color: 'var(--bus-text-secondary)',
                cursor: 'pointer',
                fontSize: '13px',
                padding: '6px'
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* CHIPS DE FILTRO HORIZONTAIS COM ROLAGEM SUAVE */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '4px',
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch'
          }}
        >
          <button
            onClick={() => setSelectedFilter('ALL')}
            className={`bus-pill ${selectedFilter === 'ALL' ? 'active' : ''}`}
          >
            Tudo ({allFeedItems.length})
          </button>
          <button
            onClick={() => setSelectedFilter('TRANSITO')}
            className={`bus-pill ${selectedFilter === 'TRANSITO' ? 'active' : ''}`}
          >
            🚨 Trânsito ({incidents.length})
          </button>
          <button
            onClick={() => setSelectedFilter('TRILHOS')}
            className={`bus-pill ${selectedFilter === 'TRILHOS' ? 'active' : ''}`}
          >
            🚆 Metrô & CPTM
          </button>
          <button
            onClick={() => setSelectedFilter('SPTRANS')}
            className={`bus-pill ${selectedFilter === 'SPTRANS' ? 'active' : ''}`}
          >
            🚌 SPTrans & Ônibus
          </button>
          <button
            onClick={() => setSelectedFilter('INFORMATIVOS')}
            className={`bus-pill ${selectedFilter === 'INFORMATIVOS' ? 'active' : ''}`}
          >
            📢 Tarifas & Regras
          </button>
        </div>
      </div>

      {/* 2. CARD RESUMO DE STATUS */}
      {selectedFilter === 'ALL' && !searchQuery && (
        <div
          className="bus-glass-panel"
          style={{
            padding: '12px 16px',
            border: '1px solid var(--bus-border-highlight)',
            background: 'var(--bus-surface-elevated)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--bus-violet)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '13px', color: 'var(--bus-text-primary)', lineHeight: 1.4 }}>
              <strong>Radar São Paulo:</strong> {incidents.length} ocorrências ativas nas vias da capital com boletins
              oficiais.
            </div>
          </div>
        </div>
      )}

      {/* 3. LISTA DE NOTÍCIAS COM ALTO CONTRASTE */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredItems.length === 0 ? (
          <div className="bus-glass-panel" style={{ padding: '36px 20px', textAlign: 'center' }}>
            <CheckCircle2 size={36} color="var(--bus-emerald)" style={{ margin: '0 auto 10px' }} />
            <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
              Nenhuma notícia ou alerta no momento com este filtro
            </div>
            <div style={{ fontSize: '13px', color: 'var(--bus-text-secondary)', marginTop: '6px' }}>
              Tente selecionar a categoria "Tudo" ou limpar a busca.
            </div>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isThisSpeaking = isSpeaking && speakingItemId === item.id;

            return (
              <article
                key={item.id}
                className="bus-card"
                onClick={() => setActiveReaderItem(item)}
                style={{
                  borderLeft: `4px solid ${item.badge.border.replace('0.5', '1')}`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                {/* Cabeçalho do Card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 900,
                        background: item.badge.bg,
                        color: item.badge.text,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: `1px solid ${item.badge.border}`
                      }}
                    >
                      {item.badge.label}
                    </span>

                    <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)', fontWeight: 600 }}>
                      • {item.categoryTag}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--bus-text-secondary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      flexShrink: 0
                    }}
                  >
                    <Clock size={12} />
                    {item.timestamp}
                  </span>
                </div>

                {/* Título Principal */}
                <h3
                  style={{
                    fontSize: '15.5px',
                    fontWeight: 700,
                    color: 'var(--bus-text-primary)',
                    lineHeight: 1.4,
                    letterSpacing: '-0.2px'
                  }}
                >
                  {item.title}
                </h3>

                {/* Subtítulo */}
                {item.subtitle && (
                  <div style={{ fontSize: '13px', color: 'var(--bus-violet)', fontWeight: 600, marginTop: '-4px' }}>
                    {item.subtitle}
                  </div>
                )}

                {/* Descrição em Alto Contraste */}
                <p style={{ fontSize: '14px', color: 'var(--bus-text-secondary)', lineHeight: 1.55 }}>{item.description}</p>

                {/* Rodapé do Card com Ações Rápidas */}
                <div
                  style={{
                    marginTop: '4px',
                    paddingTop: '10px',
                    borderTop: '1px solid var(--bus-border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}
                >
                  <span style={{ fontSize: '11.5px', color: 'var(--bus-text-secondary)' }}>
                    Fonte: <strong style={{ color: 'var(--bus-text-primary)' }}>{item.source}</strong>
                  </span>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Botão Ouvir */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSpeak(item);
                      }}
                      style={{
                        background: isThisSpeaking ? 'var(--bus-red-soft)' : 'var(--bus-surface-sunken)',
                        border: isThisSpeaking ? '1px solid var(--bus-red)' : '1px solid var(--bus-border)',
                        borderRadius: 'var(--bus-radius-full)',
                        color: isThisSpeaking ? 'var(--bus-red)' : 'var(--bus-violet)',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        padding: '5px 10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer'
                      }}
                      title="Ouvir notícia"
                    >
                      {isThisSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                      <span>{isThisSpeaking ? 'Parar' : 'Ouvir'}</span>
                    </button>

                    {/* Botão Ler Mais */}
                    <span
                      style={{
                        color: 'var(--bus-violet)',
                        fontSize: '12px',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span>Ler</span>
                      <ChevronRight size={14} />
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      {/* 4. MODAL / DRAWER IMERSIVO DO MODO LEITOR */}
      {activeReaderItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeReaderItem.title}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => {
            handleStopSpeak();
            setActiveReaderItem(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bus-glass-panel"
            style={{
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              borderBottom: 'none',
              maxHeight: '90dvh',
              width: '100%',
              maxWidth: '640px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              overflow: 'hidden'
            }}
          >
            {/* Barra de Controle Superior do Leitor */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--bus-border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px'
              }}
            >
              <button
                onClick={() => {
                  handleStopSpeak();
                  setActiveReaderItem(null);
                }}
                style={{
                  background: 'var(--bus-surface-elevated)',
                  border: '1px solid var(--bus-border)',
                  color: 'var(--bus-text-primary)',
                  borderRadius: 'var(--bus-radius-full)',
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} />
                <span>Voltar</span>
              </button>

              {/* Seletor de Tamanho de Fonte (A- / A / A+) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: 'var(--bus-surface-sunken)',
                  border: '1px solid var(--bus-border)',
                  borderRadius: 'var(--bus-radius-full)',
                  padding: '3px'
                }}
              >
                <button
                  onClick={() => setFontSize('sm')}
                  style={{
                    background: fontSize === 'sm' ? 'var(--bus-violet-ink)' : 'transparent',
                    color: fontSize === 'sm' ? '#FFFFFF' : 'var(--bus-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--bus-radius-full)',
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Fonte Menor"
                >
                  A-
                </button>
                <button
                  onClick={() => setFontSize('md')}
                  style={{
                    background: fontSize === 'md' ? 'var(--bus-violet-ink)' : 'transparent',
                    color: fontSize === 'md' ? '#FFFFFF' : 'var(--bus-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--bus-radius-full)',
                    padding: '4px 10px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Fonte Normal"
                >
                  A
                </button>
                <button
                  onClick={() => setFontSize('lg')}
                  style={{
                    background: fontSize === 'lg' ? 'var(--bus-violet-ink)' : 'transparent',
                    color: fontSize === 'lg' ? '#FFFFFF' : 'var(--bus-text-secondary)',
                    border: 'none',
                    borderRadius: 'var(--bus-radius-full)',
                    padding: '4px 10px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                  title="Fonte Maior"
                >
                  A+
                </button>
              </div>

              <button
                onClick={() => {
                  handleStopSpeak();
                  setActiveReaderItem(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--bus-text-secondary)',
                  padding: '6px',
                  cursor: 'pointer'
                }}
                title="Fechar leitor"
              >
                <X size={20} />
              </button>
            </div>

            {/* Conteúdo do Artigo Formatado para Leitura Mobile */}
            <div
              style={{
                padding: '20px 20px calc(24px + var(--safe-bottom)) 20px',
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}
            >
              {/* Badges e Origem */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 900,
                    background: activeReaderItem.badge.bg,
                    color: activeReaderItem.badge.text,
                    padding: '4px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${activeReaderItem.badge.border}`
                  }}
                >
                  {activeReaderItem.badge.label}
                </span>

                <span style={{ fontSize: '12px', color: 'var(--bus-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} />
                  {activeReaderItem.timestamp}
                </span>
              </div>

              {/* Título */}
              <h2
                className={`reader-title-${fontSize} bus-display`}
                style={{
                  fontWeight: 700,
                  color: 'var(--bus-text-primary)',
                  letterSpacing: '-0.3px'
                }}
              >
                {activeReaderItem.title}
              </h2>

              {/* Subtítulo */}
              {activeReaderItem.subtitle && (
                <div style={{ fontSize: '14.5px', color: 'var(--bus-violet)', fontWeight: 700, marginTop: '-6px' }}>
                  {activeReaderItem.subtitle}
                </div>
              )}

              {/* Fonte e Categoria */}
              <div
                style={{
                  padding: '8px 12px',
                  background: 'var(--bus-surface-sunken)',
                  borderRadius: 'var(--bus-radius-sm)',
                  border: '1px solid var(--bus-border-subtle)',
                  fontSize: '12.5px',
                  color: 'var(--bus-text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  Veículo: <strong style={{ color: 'var(--bus-text-primary)' }}>{activeReaderItem.source}</strong>
                </span>
                <span>{activeReaderItem.categoryTag}</span>
              </div>

              {/* Corpo do Texto Completo */}
              <div
                className={`reader-article reader-size-${fontSize}`}
                style={{
                  whiteSpace: 'pre-line',
                  color: 'var(--bus-text-primary)',
                  fontWeight: 400
                }}
              >
                {activeReaderItem.fullContent || activeReaderItem.description}
              </div>

              {/* Barra de Ações Rápidas no Fim da Leitura */}
              <div
                style={{
                  marginTop: '12px',
                  paddingTop: '16px',
                  borderTop: '1px solid var(--bus-border-subtle)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px'
                }}
              >
                {/* Ouvir notícia com voz */}
                <button
                  onClick={() => handleSpeak(activeReaderItem)}
                  className="bus-btn-primary"
                  style={{
                    flex: '1 1 140px',
                    padding: '12px 16px',
                    fontSize: '13.5px',
                    background:
                      isSpeaking && speakingItemId === activeReaderItem.id
                        ? 'var(--bus-red)'
                        : undefined
                  }}
                >
                  {isSpeaking && speakingItemId === activeReaderItem.id ? (
                    <>
                      <VolumeX size={16} />
                      <span>Parar Leitura</span>
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} />
                      <span>Ouvir Notícia</span>
                    </>
                  )}
                </button>

                {/* Compartilhar */}
                <button
                  onClick={() => handleShare(activeReaderItem)}
                  className="bus-glass-panel"
                  style={{
                    flex: '1 1 120px',
                    padding: '12px 16px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--bus-text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  {copiedId === activeReaderItem.id ? (
                    <>
                      <Check size={16} color="var(--bus-emerald)" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Share2 size={16} color="var(--bus-violet)" />
                      <span>Compartilhar</span>
                    </>
                  )}
                </button>

                {/* Ver no Mapa (se tiver referência de incidente) */}
                {activeReaderItem.incidentRef && onSelectIncidentOnMap && (
                  <button
                    onClick={() => {
                      const inc = activeReaderItem.incidentRef!;
                      handleStopSpeak();
                      setActiveReaderItem(null);
                      onSelectIncidentOnMap(inc);
                    }}
                    className="bus-btn-primary"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: 'var(--bus-radius-full)',
                      fontSize: '14px'
                    }}
                  >
                    <MapPin size={16} />
                    <span>Ver Local do Incidente no Mapa</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
