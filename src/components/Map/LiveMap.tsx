'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SPTransLinha, SPTransParada, SPTransVeiculo } from '@/types/sptrans';
import { RoutePlan } from '@/lib/routing';
import { Compass, Locate, RefreshCw, Bus, MapPin, Accessibility, Clock, AlertCircle, ShieldCheck, Footprints, Flag } from 'lucide-react';

interface LiveMapProps {
  selectedLine: SPTransLinha | null;
  veiculos: SPTransVeiculo[];
  paradas: SPTransParada[];
  onSelectParada: (parada: SPTransParada) => void;
  isLoading: boolean;
  onRefresh: () => void;
  isMockMode?: boolean;
  activeRoute?: RoutePlan | null;
  userCoords?: [number, number] | null;
}

// Centro padrão: Avenida Paulista, São Paulo
const DEFAULT_CENTER: [number, number] = [-23.5615, -46.6559];
const DEFAULT_ZOOM = 14;

export default function LiveMap({
  selectedLine,
  veiculos,
  paradas,
  onSelectParada,
  isLoading,
  onRefresh,
  isMockMode,
  activeRoute,
  userCoords
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const stopMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);

  const [isLocating, setIsLocating] = useState(false);

  // Inicializar o Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: userCoords || DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false,
      attributionControl: false
    });

    // Camada escura / Voyager de alta qualidade
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Grupos de camadas
    const routeGroup = L.layerGroup().addTo(map);
    const stopGroup = L.layerGroup().addTo(map);
    const busGroup = L.layerGroup().addTo(map);

    routePolylinesGroupRef.current = routeGroup;
    stopMarkersGroupRef.current = stopGroup;
    busMarkersGroupRef.current = busGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualizar posição do usuário (GPS) no mapa com radar de precisão
  useEffect(() => {
    if (!mapInstanceRef.current || !userCoords) return;

    const map = mapInstanceRef.current;

    // Criar ou atualizar marcador do usuário
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userCoords);
    } else {
      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: markerPulse 2s infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284C7; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup('<strong>📍 Você está aqui</strong><br/><span style="font-size:11px; color:#94A3B8;">Precisão GPS Ativa</span>')
        .addTo(map);
    }

    // Círculo de precisão
    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng(userCoords);
    } else {
      userAccuracyCircleRef.current = L.circle(userCoords, {
        radius: 40,
        color: '#0284C7',
        fillColor: '#38BDF8',
        fillOpacity: 0.12,
        weight: 1
      }).addTo(map);
    }
  }, [userCoords]);

  // Atualizar rota no mapa (quando uma rota ativa for calculada)
  useEffect(() => {
    if (!routePolylinesGroupRef.current || !mapInstanceRef.current) return;

    routePolylinesGroupRef.current.clearLayers();

    if (!activeRoute) return;

    const map = mapInstanceRef.current;
    const allCoords: [number, number][] = [];

    // 1. Caminhada até o ponto (linha tracejada azul)
    if (activeRoute.polyline.walkToStop.length > 0) {
      const walkLine = L.polyline(activeRoute.polyline.walkToStop, {
        color: '#38BDF8',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.85
      });
      routePolylinesGroupRef.current.addLayer(walkLine);
      allCoords.push(...activeRoute.polyline.walkToStop);
    }

    // 2. Trajeto do ônibus (linha sólida vermelha com brilho)
    if (activeRoute.polyline.transit.length > 0) {
      // Glow exterior
      const busGlow = L.polyline(activeRoute.polyline.transit, {
        color: '#E30613',
        weight: 8,
        opacity: 0.35
      });
      const busLine = L.polyline(activeRoute.polyline.transit, {
        color: '#E30613',
        weight: 5,
        opacity: 0.95
      });
      routePolylinesGroupRef.current.addLayer(busGlow);
      routePolylinesGroupRef.current.addLayer(busLine);
      allCoords.push(...activeRoute.polyline.transit);
    }

    // 3. Caminhada final até o destino
    if (activeRoute.polyline.walkToDest.length > 0) {
      const walkDestLine = L.polyline(activeRoute.polyline.walkToDest, {
        color: '#10B981',
        weight: 4,
        dashArray: '6, 8',
        opacity: 0.85
      });
      routePolylinesGroupRef.current.addLayer(walkDestLine);
      allCoords.push(...activeRoute.polyline.walkToDest);
    }

    // 4. Marcador de Destino
    const destIcon = L.divIcon({
      html: `
        <div style="background: #10B981; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.5);">
          🏁
        </div>
      `,
      className: 'dest-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destMarker = L.marker([activeRoute.destination.lat, activeRoute.destination.lng], {
      icon: destIcon
    }).bindPopup(`<strong>Destino: ${activeRoute.destination.name}</strong>`);

    routePolylinesGroupRef.current.addLayer(destMarker);

    // Ajustar zoom para englobar toda a rota
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60], maxZoom: 16 });
    }
  }, [activeRoute]);

  // Atualizar marcadores de Ônibus no mapa com selos de precisão
  useEffect(() => {
    if (!busMarkersGroupRef.current || !mapInstanceRef.current) return;

    busMarkersGroupRef.current.clearLayers();

    if (veiculos.length === 0) return;

    const bounds: [number, number][] = [];

    veiculos.forEach((v) => {
      const heading = v.heading || 0;
      const htmlIcon = `
        <div class="bus-marker-container">
          <div class="bus-marker-pulse"></div>
          <div class="bus-marker-icon" style="transform: rotate(${heading}deg);">
            <div class="bus-marker-arrow"></div>
            <span style="transform: rotate(-${heading}deg);">${v.p.slice(-3)}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'custom-leaflet-bus',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([v.py, v.px], { icon: customIcon });

      const popupContent = `
        <div style="font-family: inherit; min-width: 190px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #E30613; font-size: 14px;">Ônibus #${v.p}</strong>
            ${v.a ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10B981; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">♿ ACESSÍVEL</span>' : ''}
          </div>
          
          <div style="font-size: 12px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px;">
            <div>Linha: <strong style="color: #fff;">${selectedLine ? `${selectedLine.lt}-${selectedLine.tl}` : 'Em Operação'}</strong></div>
            <div>Sentido: <strong style="color: #fff;">${selectedLine ? (selectedLine.sl === 1 ? selectedLine.tp : selectedLine.ts) : 'Principal'}</strong></div>
            <div style="display: flex; align-items: center; gap: 4px; color: #10B981; font-size: 11px; margin-top: 4px;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10B981;"></span>
              <strong>Sinal GPS em Tempo Real</strong>
            </div>
            <div style="font-size: 10px; color: #64748B;">Última telemetria: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      busMarkersGroupRef.current?.addLayer(marker);
      bounds.push([v.py, v.px]);
    });

    if (bounds.length > 0 && selectedLine && !activeRoute && mapInstanceRef.current) {
      const leafletBounds = L.latLngBounds(bounds);
      mapInstanceRef.current.fitBounds(leafletBounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [veiculos, selectedLine, activeRoute]);

  // Atualizar marcadores de Paradas
  useEffect(() => {
    if (!stopMarkersGroupRef.current) return;

    stopMarkersGroupRef.current.clearLayers();

    paradas.forEach((p) => {
      const htmlIcon = `
        <div class="stop-marker-icon" title="${p.np}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'custom-leaflet-stop',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([p.py, p.px], { icon: customIcon });

      marker.on('click', () => {
        onSelectParada(p);
      });

      stopMarkersGroupRef.current?.addLayer(marker);
    });
  }, [paradas, onSelectParada]);

  // Obter localização do usuário (GPS)
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setIsLocating(false);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 16, { animate: true });
        }
      },
      (err) => {
        console.warn('Erro ao obter localização:', err);
        setIsLocating(false);
        alert('Não foi possível obter sua localização. Verifique as permissões de GPS.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Container Leaflet */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Botões de Ação Flutuantes */}
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: '84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 999
        }}
      >
        <button
          onClick={handleLocateMe}
          className="btn-icon"
          title="Minha Localização GPS"
          aria-label="Localização atual"
        >
          <Locate size={20} className={isLocating ? 'animate-spin' : ''} color="#38BDF8" />
        </button>

        <button
          onClick={onRefresh}
          className="btn-icon"
          title="Atualizar posições dos ônibus"
          aria-label="Atualizar posições"
        >
          <RefreshCw size={19} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Legenda de Precisão Flutuante */}
      <div
        style={{
          position: 'absolute',
          bottom: '76px',
          left: '16px',
          zIndex: 990,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 12px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--text-secondary)'
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: '#10B981',
            boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
          }}
        />
        <span>
          <strong>GPS Ativo:</strong> {veiculos.length > 0 ? `${veiculos.length} ônibus monitorados` : 'Selecione uma linha'}
        </span>
      </div>
    </div>
  );
}
