'use client';

import React, { useState, useEffect } from 'react';
import { TrafficIncident, IncidentType } from '@/types/traffic';
import { RailsResponse, RailLine } from '@/types/trilhos';
import {
  AlertTriangle,
  Flame,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  ExternalLink,
  TrainTrack,
  Bus,
  Clock,
  ShieldAlert,
  Cone,
  Car,
  Newspaper,
  Calendar,
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface TransitNewsPanelProps {
  incidents: TrafficIncident[];
  onSelectIncidentOnMap?: (inc: TrafficIncident) => void;
  onNavigateToLines?: () => void;
}

interface NewsArticle {
  id: string;
  title: string;
  category: 'SPTRANS' | 'METRO' | 'TRANSITO' | 'BENEFICIOS';
  date: string;
  summary: string;
  fullText?: string;
  badge: string;
  source: string;
}

const SP_MOBILITY_NEWS: NewsArticle[] = [
  {
    id: 'news-1',
    title: 'Domingão Tarifa Zero: Ônibus da SPTrans são 100% gratuitos aos domingos',
    category: 'BENEFICIOS',
    date: 'Atualizado para 2026',
    summary: 'A gratuidade no transporte coletivo por ônibus municipal em São Paulo funciona todos os domingos e feriados oficiais da 0h às 23h59.',
    badge: 'TARIFA ZERO',
    source: 'Prefeitura de São Paulo / SPTrans'
  },
  {
    id: 'news-2',
    title: 'Avenida Paulista Aberta para pedestres e ciclistas aos domingos e feriados',
    category: 'TRANSITO',
    date: 'Domingos das 9h às 16h',
    summary: 'Linhas de ônibus que trafegam na Av. Paulista são desviadas para Alameda Santos e Rua São Carlos do Pinhal durante o período.',
    badge: 'DESVIOS',
    source: 'CET / SPTrans'
  },
  {
    id: 'news-3',
    title: 'Integração Temporal do Bilhete Único: Até 4 ônibus em 3 horas',
    category: 'SPTRANS',
    date: 'Vigente em toda a capital',
    summary: 'Comum: permite até 4 embarques em ônibus da SPTrans no período de 3 horas pagando uma única tarifa de R$ 4,40.',
    badge: 'BILHETE ÚNICO',
    source: 'SPTrans'
  },
  {
    id: 'news-4',
    title: 'Obras de Modernização e Expansão da Malha de Trilhos (Metrô & CPTM)',
    category: 'METRO',
    date: 'Diário',
    summary: 'Acompanhe intervenções programadas de manutenção preventiva nos fins de semana nas linhas 8-Diamante e 9-Esmeralda.',
    badge: 'EXPANSÃO',
    source: 'Secretaria dos Transportes Metropolitanos'
  },
  {
    id: 'news-5',
    title: 'Frota com Ar-condicionado e Acessibilidade Total na Zona Norte e Sul',
    category: 'SPTRANS',
    date: 'Operacional',
    summary: 'Mais de 95% da frota ativa de São Paulo conta com ar-condicionado, tomadas USB e elevadores para cadeirantes.',
    badge: 'FROTA SP',
    source: 'Olho Vivo SPTrans'
  }
];

export default function TransitNewsPanel({
  incidents = [],
  onSelectIncidentOnMap
}: TransitNewsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'ALERTAS' | 'TRILHOS' | 'NOTICIAS'>('ALERTAS');
  const [incidentFilter, setIncidentFilter] = useState<'ALL' | IncidentType>('ALL');
  const [selectedIncident, setSelectedIncident] = useState<TrafficIncident | null>(null);

  // Status dos Trilhos
  const [railsData, setRailsData] = useState<RailsResponse | null>(null);
  const [isLoadingRails, setIsLoadingRails] = useState(false);
  const [selectedRailLine, setSelectedRailLine] = useState<RailLine | null>(null);

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
    if (activeSubTab === 'TRILHOS' && !railsData) {
      fetchRails();
    }
  }, [activeSubTab, railsData]);

  // Filtragem de Incidentes
  const filteredIncidents = incidents.filter(inc => {
    if (incidentFilter === 'ALL') return true;
    return inc.type === incidentFilter;
  });

  const getIncidentIcon = (type: IncidentType) => {
    switch (type) {
      case 'ACCIDENT':
        return <Flame size={16} color="#EF4444" />;
      case 'CONSTRUCTION':
        return <Cone size={16} color="#F97316" />;
      case 'JAM':
        return <Car size={16} color="#EAB308" />;
      case 'POLICE':
        return <ShieldAlert size={16} color="#3B82F6" />;
      default:
        return <AlertTriangle size={16} color="#F59E0B" />;
    }
  };

  const getIncidentBadge = (type: IncidentType) => {
    switch (type) {
      case 'ACCIDENT':
        return { label: 'Acidente', bg: 'rgba(239, 68, 68, 0.18)', border: '#EF4444', text: '#F87171' };
      case 'CONSTRUCTION':
        return { label: 'Obras na Via', bg: 'rgba(249, 115, 22, 0.18)', border: '#F97316', text: '#FB923C' };
      case 'JAM':
        return { label: 'Lentidão Severa', bg: 'rgba(234, 179, 8, 0.18)', border: '#EAB308', text: '#FACC15' };
      case 'POLICE':
        return { label: 'Blitz / Policiamento', bg: 'rgba(59, 130, 246, 0.18)', border: '#3B82F6', text: '#60A5FA' };
      default:
        return { label: 'Alerta de Tráfego', bg: 'rgba(245, 158, 11, 0.18)', border: '#F59E0B', text: '#FBBF24' };
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NORMAL':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            <span>Normal</span>
          </span>
        );
      case 'VELOCIDADE_REDUZIDA':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <AlertTriangle size={13} />
            <span>Velocidade Reduzida</span>
          </span>
        );
      case 'OPERACAO_PARCIAL':
      case 'PARALISADA':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(239, 68, 68, 0.15)', color: '#F87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <XCircle size={13} />
            <span>Paralisada / Parcial</span>
          </span>
        );
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '3px 8px', borderRadius: '9999px', fontSize: '11px', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            <span>{status}</span>
          </span>
        );
    }
  };

  return (
    <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {/* 1. CABEÇALHO DO PAINEL DE NOTÍCIAS */}
      <div
        className="bus-glass-panel"
        style={{
          padding: '16px',
          background: 'linear-gradient(135deg, rgba(13, 17, 23, 0.95) 0%, rgba(22, 27, 34, 0.9) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.18)',
                border: '1px solid rgba(239, 68, 68, 0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444'
              }}
            >
              <Newspaper size={18} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.3px' }}>
                Notícias & Alertas SP
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                Trânsito, Obras, Metrô e Mobilidade Urbana
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(16, 185, 129, 0.15)',
              padding: '4px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.3)'
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', animation: 'markerPulse 1.5s infinite' }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#34D399' }}>AO VIVO</span>
          </div>
        </div>

        {/* SUB-ABAS (ALERTAS | METRÔ & CPTM | NOTÍCIAS) */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(15, 23, 42, 0.6)',
            borderRadius: '12px',
            padding: '4px',
            gap: '4px',
            border: '1px solid rgba(255, 255, 255, 0.06)'
          }}
        >
          <button
            onClick={() => setActiveSubTab('ALERTAS')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'ALERTAS' ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'transparent',
              color: activeSubTab === 'ALERTAS' ? '#FFFFFF' : '#94A3B8',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <AlertTriangle size={14} />
            <span>Alertas ({incidents.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('TRILHOS')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'TRILHOS' ? 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' : 'transparent',
              color: activeSubTab === 'TRILHOS' ? '#FFFFFF' : '#94A3B8',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <TrainTrack size={14} />
            <span>Trilhos SP</span>
          </button>

          <button
            onClick={() => setActiveSubTab('NOTICIAS')}
            style={{
              flex: 1,
              padding: '8px 10px',
              borderRadius: '8px',
              border: 'none',
              background: activeSubTab === 'NOTICIAS' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
              color: activeSubTab === 'NOTICIAS' ? '#FFFFFF' : '#94A3B8',
              fontSize: '12px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Newspaper size={14} />
            <span>Notícias</span>
          </button>
        </div>
      </div>

      {/* 2. CONTEÚDO DA SUB-ABA DE ALERTAS DE TRÂNSITO */}
      {activeSubTab === 'ALERTAS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Pílulas de Filtro de Incidentes */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            <button
              onClick={() => setIncidentFilter('ALL')}
              className={`bus-pill ${incidentFilter === 'ALL' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              Todos ({incidents.length})
            </button>
            <button
              onClick={() => setIncidentFilter('ACCIDENT')}
              className={`bus-pill ${incidentFilter === 'ACCIDENT' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              Acidentes
            </button>
            <button
              onClick={() => setIncidentFilter('CONSTRUCTION')}
              className={`bus-pill ${incidentFilter === 'CONSTRUCTION' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              Obras & Vias
            </button>
            <button
              onClick={() => setIncidentFilter('JAM')}
              className={`bus-pill ${incidentFilter === 'JAM' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '5px 12px' }}
            >
              Lentidão
            </button>
          </div>

          {filteredIncidents.length === 0 ? (
            <div className="bus-glass-panel" style={{ padding: '24px', textAlign: 'center' }}>
              <CheckCircle2 size={32} color="#10B981" style={{ margin: '0 auto 8px' }} />
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#F8FAFC' }}>
                Nenhum incidente crítico registrado
              </div>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '4px' }}>
                O trânsito nas principais vias monitoradas está fluindo normalmente.
              </div>
            </div>
          ) : (
            filteredIncidents.map((inc) => {
              const badge = getIncidentBadge(inc.type);
              const isSelected = selectedIncident?.id === inc.id;

              return (
                <div
                  key={inc.id}
                  className="bus-card"
                  onClick={() => setSelectedIncident(isSelected ? null : inc)}
                  style={{
                    padding: '14px',
                    borderColor: isSelected ? badge.border : undefined,
                    borderLeft: `4px solid ${badge.border}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {getIncidentIcon(inc.type)}
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          background: badge.bg,
                          color: badge.text,
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: `1px solid ${badge.border}40`
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <span style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 600 }}>
                      {inc.updatedAt}
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', marginTop: '8px', lineHeight: 1.3 }}>
                    {inc.street || inc.title}
                  </div>

                  <div style={{ fontSize: '12.5px', color: '#CBD5E1', marginTop: '4px', lineHeight: 1.4 }}>
                    {inc.description}
                  </div>

                  {/* Detalhes Expandidos */}
                  {isSelected && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                        Fonte: <strong style={{ color: '#F8FAFC' }}>{inc.source}</strong> · Gravidade: <strong style={{ color: badge.text }}>{inc.severity}</strong>
                      </div>

                      {onSelectIncidentOnMap && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectIncidentOnMap(inc);
                          }}
                          style={{
                            background: 'linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)',
                            border: 'none',
                            borderRadius: '9999px',
                            color: '#FFFFFF',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '6px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          <MapPin size={12} />
                          <span>Ver no Mapa</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 3. CONTEÚDO DA SUB-ABA METRÔ & CPTM (TRILHOS) */}
      {activeSubTab === 'TRILHOS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94A3B8' }}>
              STATUS OPERACIONAL DAS LINHAS
            </span>
            <button
              onClick={fetchRails}
              style={{
                background: 'none',
                border: 'none',
                color: '#38BDF8',
                fontSize: '11.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={12} className={isLoadingRails ? 'animate-spin' : ''} />
              <span>Atualizar</span>
            </button>
          </div>

          {isLoadingRails && !railsData ? (
            <div className="bus-glass-panel" style={{ padding: '24px', textAlign: 'center', color: '#94A3B8' }}>
              <div style={{ width: '24px', height: '24px', border: '3px solid rgba(6, 182, 212, 0.2)', borderTopColor: '#06B6D4', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <span>Consultando operação do Metrô e CPTM...</span>
            </div>
          ) : railsData ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {railsData.lines.map((line) => {
                const isSelected = selectedRailLine?.id === line.id;
                return (
                  <div
                    key={line.id}
                    className="bus-card"
                    onClick={() => setSelectedRailLine(isSelected ? null : line)}
                    style={{ padding: '12px 14px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: line.hexColor,
                            color: line.hexColor === '#FFF000' || line.hexColor === '#A7A8AA' ? '#000000' : '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 900,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                          }}
                        >
                          {line.id}
                        </div>
                        <div>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#F8FAFC' }}>
                            {line.name}
                          </div>
                          <div style={{ fontSize: '11px', color: '#94A3B8' }}>
                            {line.operator === 'METRO' ? 'Metrô SP' : line.operator === 'VIAMOBILIDADE' ? 'ViaMobilidade' : line.operator === 'VIAQUATRO' ? 'ViaQuatro' : 'Trem CPTM'}
                          </div>
                        </div>
                      </div>

                      {getStatusBadge(line.status)}
                    </div>

                    {line.description && isSelected && (
                      <div
                        style={{
                          marginTop: '10px',
                          paddingTop: '8px',
                          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                          fontSize: '12px',
                          color: '#CBD5E1',
                          lineHeight: 1.4
                        }}
                      >
                        {line.description}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bus-glass-panel" style={{ padding: '20px', textAlign: 'center', color: '#94A3B8', fontSize: '13px' }}>
              Informações dos trilhos temporariamente indisponíveis.
            </div>
          )}
        </div>
      )}

      {/* 4. CONTEÚDO DA SUB-ABA NOTÍCIAS & INFORMATIVOS */}
      {activeSubTab === 'NOTICIAS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {SP_MOBILITY_NEWS.map((art) => (
            <div key={art.id} className="bus-card" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span
                  style={{
                    fontSize: '10.5px',
                    fontWeight: 900,
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    color: '#38BDF8',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}
                >
                  {art.badge}
                </span>

                <span style={{ fontSize: '11px', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} /> {art.date}
                </span>
              </div>

              <div style={{ fontSize: '14px', fontWeight: 800, color: '#F8FAFC', lineHeight: 1.3, marginBottom: '6px' }}>
                {art.title}
              </div>

              <div style={{ fontSize: '12.5px', color: '#94A3B8', lineHeight: 1.4, marginBottom: '8px' }}>
                {art.summary}
              </div>

              <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600 }}>
                Fonte: {art.source}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
