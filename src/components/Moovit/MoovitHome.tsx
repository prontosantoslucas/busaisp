'use client';

import React, { useState } from 'react';
import { FavoriteItem } from '@/lib/supabase';
import {
  Search,
  Menu,
  ChevronRight,
  Sparkles,
  Footprints,
  Bus,
  Clock,
  Radio,
  MapPin,
  Star
} from 'lucide-react';

interface MoovitHomeProps {
  onSearchClick: () => void;
  onSelectDestination: (dest: string) => void;
  onOpenSettings: () => void;
  favorites?: FavoriteItem[];
}

export default function MoovitHome({
  onSearchClick,
  onSelectDestination,
  onOpenSettings,
  favorites = []
}: MoovitHomeProps) {
  const [frequentIndex, setFrequentIndex] = useState(0);

  // Destinos Reais do Usuário / Populares de SP
  const userFavoritesList = favorites.map(f => ({
    title: f.title,
    destinationName: f.details?.ed || f.title,
    durationText: 'Tempo real',
    arrivalText: f.label || 'Favorito',
    walkBefore: 5,
    busLine: f.type === 'linha' ? f.title.split(' ')[0] : 'SPTrans',
    walkAfter: 4,
    departureText: `Destino salvo em favoritos: ${f.title}`
  }));

  const POPULAR_DESTINATIONS = [
    {
      title: 'Para Casa (Jd. Fontális)',
      destinationName: 'Rua Flor de Maio, 40',
      durationText: '1 h 14 min',
      arrivalText: 'Chegada estimada',
      walkBefore: 13,
      busLine: '1703-10',
      walkAfter: 8,
      departureText: 'Conexão via Av. Zaki Narchi para Jd. Fontális'
    },
    {
      title: 'Shopping Center Norte',
      destinationName: 'Shopping Center Norte',
      durationText: '22 min',
      arrivalText: 'Chegada estimada',
      walkBefore: 5,
      busLine: '2012-10',
      walkAfter: 4,
      departureText: 'Conexão direta Metrô Santana / Center Norte'
    },
    {
      title: 'Avenida Paulista',
      destinationName: 'Avenida Paulista, 1578',
      durationText: '48 min',
      arrivalText: 'Chegada estimada',
      walkBefore: 6,
      busLine: '106A-10',
      walkAfter: 3,
      departureText: 'Conexão via Av. Cruzeiro do Sul'
    }
  ];

  const activeDestinationsList = userFavoritesList.length > 0 ? userFavoritesList : POPULAR_DESTINATIONS;
  const currentFrequent = activeDestinationsList[frequentIndex % activeDestinationsList.length];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
      {/* Top Bar: Menu & Cidade */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 2px' }}>
        <button
          onClick={onOpenSettings}
          style={{
            background: 'none',
            border: 'none',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '6px'
          }}
          title="Abrir Menu"
        >
          <Menu size={24} />
        </button>

        <span style={{ fontSize: '13px', fontWeight: 600, color: '#9CA3AF' }}>
          São Paulo e Região
        </span>
      </div>

      {/* Barra de Busca Gigante (Estilo Exato Moovit) */}
      <div
        onClick={onSearchClick}
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)'
        }}
      >
        <div style={{ flex: 1, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#FF6600', fontWeight: 900, fontSize: '18px' }}>|</span>
          <span style={{ fontSize: '15px', color: '#9CA3AF', fontWeight: 500 }}>
            Para onde você quer ir?
          </span>
        </div>

        <button
          style={{
            background: '#FF6600',
            border: 'none',
            color: '#FFFFFF',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer'
          }}
          aria-label="Buscar"
        >
          <Search size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Card: Meu Destino Frequente / Favorito */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '16px',
          padding: '16px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#9CA3AF' }}>
            {userFavoritesList.length > 0 ? 'Meus Favoritos Salvos' : 'Destino Frequente'}
          </span>
          <div
            style={{
              background: '#2563EB',
              color: '#fff',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Radio size={15} />
          </div>
        </div>

        {/* Título & Horários */}
        <div
          onClick={() => onSelectDestination(currentFrequent.destinationName)}
          style={{ cursor: 'pointer' }}
        >
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#FFFFFF', marginBottom: '3px' }}>
            {currentFrequent.title}
          </h3>
          <div style={{ fontSize: '13px', color: '#9CA3AF', fontWeight: 500 }}>
            <strong style={{ color: '#FFFFFF' }}>{currentFrequent.durationText}</strong> · {currentFrequent.arrivalText}
          </div>
        </div>

        {/* Cadeia Visual da Rota: 🚶 13 > [🚌 1703-10] > 🚶 8 */}
        <div
          onClick={() => onSelectDestination(currentFrequent.destinationName)}
          style={{
            background: '#262932',
            border: '1px solid #323642',
            borderRadius: '10px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#D1D5DB' }}>
            <Footprints size={16} color="#38BDF8" />
            <span>{currentFrequent.walkBefore}</span>
          </div>

          <ChevronRight size={14} color="#6B7280" />

          <div
            style={{
              background: '#1E3A8A',
              border: '1px solid #3B82F6',
              color: '#FFFFFF',
              padding: '3px 8px',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Bus size={14} />
            <span>{currentFrequent.busLine}</span>
          </div>

          <ChevronRight size={14} color="#6B7280" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 700, color: '#D1D5DB' }}>
            <Footprints size={16} color="#38BDF8" />
            <span>{currentFrequent.walkAfter}</span>
          </div>
        </div>

        {/* Dicas Inteligentes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#9CA3AF' }}>
          <Sparkles size={14} color="#C084FC" />
          <span style={{ color: '#C084FC', fontWeight: 700 }}>Dicas inteligentes</span>
        </div>
        <div style={{ fontSize: '12px', color: '#D1D5DB', marginTop: '-6px' }}>
          {currentFrequent.departureText}
        </div>

        {/* Carrossel Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {activeDestinationsList.map((_, i) => (
              <button
                key={i}
                onClick={() => setFrequentIndex(i)}
                style={{
                  width: i === (frequentIndex % activeDestinationsList.length) ? '16px' : '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: i === (frequentIndex % activeDestinationsList.length) ? '#FF6600' : '#4B5563',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              />
            ))}
          </div>

          <button
            onClick={() => onSelectDestination(currentFrequent.destinationName)}
            style={{
              background: '#2563EB',
              border: 'none',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Ver Rota
          </button>
        </div>
      </div>

      {/* Banner Bilhete Único & Recargas */}
      <div
        style={{
          background: '#1C1E24',
          border: '1px solid #2D313C',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              background: '#E30613',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              fontWeight: 900,
              fontSize: '12px'
            }}
          >
            SPTrans
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
              Bilhete Único e GPS Ao Vivo
            </div>
            <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
              Integração de 3h e telemetria oficial Olho Vivo
            </div>
          </div>
        </div>

        <button
          onClick={onSearchClick}
          style={{
            background: '#2563EB',
            border: 'none',
            color: '#fff',
            fontSize: '11px',
            fontWeight: 700,
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Planejar Rota
        </button>
      </div>
    </div>
  );
}
