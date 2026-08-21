'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { SPTransLinha, SPTransParada, SPTransVeiculo } from '@/types/sptrans';
import { RoutePlan } from '@/lib/routing';
import { Compass, Locate, RefreshCw, Bus, MapPin, Accessibility, Clock, AlertCircle, ShieldCheck, Footprints, Flag, Zap, X } from 'lucide-react';

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

const DEFAULT_CENTER: [number, number] = [-23.5000, -46.6050];
const DEFAULT_ZOOM = 13;

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

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

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

  // Atualizar posição do usuário (GPS) no mapa com radar
  useEffect(() => {
    if (!mapInstanceRef.current || !userCoords) return;

    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(userCoords);
    } else {
      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; background: rgba(56, 189, 248, 0.45); animation: markerPulse 2s infinite;"></div>
            <div style="width: 16px; height: 16px; border-radius: 50%; background: #0284C7; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.5);"></div>
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      userMarkerRef.current = L.marker(userCoords, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup('<strong>📍 Você está aqui (A Pé)</strong><br/><span style="font-size:11px; color:#94A3B8;">Precisão GPS Ativa</span>')
        .addTo(map);
    }

    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng(userCoords);
    } else {
      userAccuracyCircleRef.current = L.circle(userCoords, {
        radius: 45,
        color: '#0284C7',
        fillColor: '#38BDF8',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(map);
    }
  }, [userCoords]);

  // Atualizar traçado no mapa com destaque especial para a caminhada a pé do pedestre
  useEffect(() => {
    if (!routePolylinesGroupRef.current || !mapInstanceRef.current) return;

    routePolylinesGroupRef.current.clearLayers();

    if (!activeRoute) return;

    const map = mapInstanceRef.current;
    const allCoords: [number, number][] = [];

    // 1. Caminhada a pé inicial até a parada (Linha tracejada azul clara)
    if (activeRoute.polyline.walkToStop.length > 0) {
      const walkGlow = L.polyline(activeRoute.polyline.walkToStop, {
        color: '#38BDF8',
        weight: 8,
        opacity: 0.25
      });
      const walkLine = L.polyline(activeRoute.polyline.walkToStop, {
        color: '#38BDF8',
        weight: 5,
        dashArray: '6, 8',
        opacity: 0.95
      });
      routePolylinesGroupRef.current.addLayer(walkGlow);
      routePolylinesGroupRef.current.addLayer(walkLine);
      allCoords.push(...activeRoute.polyline.walkToStop);

      // Marcador de Início da Caminhada
      const startWalkIcon = L.divIcon({
        html: `
          <div style="background: #0284C7; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 14px;">
            🚶
          </div>
        `,
        className: 'walk-start-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const startMarker = L.marker(activeRoute.polyline.walkToStop[0], { icon: startWalkIcon })
        .bindPopup(`<strong>Início da Caminhada a Pé</strong><br/>Caminhe até ${activeRoute.departureStop.np}`);
      routePolylinesGroupRef.current.addLayer(startMarker);
    }

    // 2. Trajeto de Ônibus (Linha sólida vermelha SPTrans)
    if (activeRoute.polyline.transit.length > 0) {
      const busGlow = L.polyline(activeRoute.polyline.transit, {
        color: '#E30613',
        weight: 9,
        opacity: 0.3
      });
      const busLine = L.polyline(activeRoute.polyline.transit, {
        color: '#E30613',
        weight: 5,
        opacity: 0.95
      });
      routePolylinesGroupRef.current.addLayer(busGlow);
      routePolylinesGroupRef.current.addLayer(busLine);
      allCoords.push(...activeRoute.polyline.transit);

      // Marcador de Embarque no Ônibus
      const boardIcon = L.divIcon({
        html: `
          <div style="background: #E30613; color: #fff; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 10px rgba(0,0,0,0.5); font-size: 14px;">
            🚏
          </div>
        `,
        className: 'bus-board-marker',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      const boardMarker = L.marker([activeRoute.departureStop.py, activeRoute.departureStop.px], { icon: boardIcon })
        .bindPopup(`<strong>Ponto de Embarque: ${activeRoute.departureStop.np}</strong><br/>Ônibus chega em <strong>${activeRoute.nextBusEtaMinutes} min</strong>`);
      routePolylinesGroupRef.current.addLayer(boardMarker);
    }

    // 3. Caminhada final a pé até o destino
    if (activeRoute.polyline.walkToDest.length > 0) {
      const walkDestLine = L.polyline(activeRoute.polyline.walkToDest, {
        color: '#10B981',
        weight: 5,
        dashArray: '6, 8',
        opacity: 0.95
      });
      routePolylinesGroupRef.current.addLayer(walkDestLine);
      allCoords.push(...activeRoute.polyline.walkToDest);
    }

    // 4. Marcador de Destino Final
    const destIcon = L.divIcon({
      html: `
        <div style="background: #10B981; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 15px;">
          🏁
        </div>
      `,
      className: 'dest-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const destMarker = L.marker([activeRoute.destination.lat, activeRoute.destination.lng], {
      icon: destIcon
    }).bindPopup(`<strong>Destino: ${activeRoute.destination.name}</strong><br/>${activeRoute.destination.addressDetails || ''}`);

    routePolylinesGroupRef.current.addLayer(destMarker);

    // Ajustar zoom
    if (allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [70, 70], maxZoom: 16 });
    }
  }, [activeRoute]);

  // Atualizar marcadores de Ônibus no mapa com Destino explícito
  useEffect(() => {
    if (!busMarkersGroupRef.current || !mapInstanceRef.current) return;

    busMarkersGroupRef.current.clearLayers();

    if (veiculos.length === 0) return;

    const bounds: [number, number][] = [];

    veiculos.forEach((v) => {
      const heading = v.heading || 0;
      const destinoText = v.destination || (selectedLine ? (selectedLine.sl === 1 ? selectedLine.ts : selectedLine.tp) : 'SHOPPING CENTER NORTE');

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
        <div style="font-family: inherit; min-width: 200px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: #E30613; font-size: 14px;">Ônibus #${v.p}</strong>
            ${v.a ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10B981; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">♿ ACESSÍVEL</span>' : ''}
          </div>
          
          <div style="font-size: 12px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px;">
            <div>Linha: <strong style="color: #fff;">${selectedLine ? `${selectedLine.lt}-${selectedLine.tl}` : '1703-10'}</strong></div>
            <div style="background: rgba(227, 6, 19, 0.15); border-left: 3px solid #E30613; padding: 4px 6px; border-radius: 4px; margin: 2px 0;">
              <span style="font-size: 10px; color: #FCA5A5; font-weight: 700; display: block;">DESTINO LETREIRO:</span>
              <strong style="color: #FFFFFF; font-size: 12px;">${destinoText}</strong>
            </div>
            <div style="display: flex; align-items: center; gap: 4px; color: #10B981; font-size: 11px; margin-top: 2px;">
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

      {/* Card Flutuante de Rota com Caminhada Detalhada */}
      {activeRoute && (
        <div
          style={{
            position: 'absolute',
            top: '76px',
            left: '12px',
            right: '12px',
            maxWidth: '460px',
            margin: '0 auto',
            zIndex: 990,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            borderRadius: '14px',
            padding: '12px 14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  background: '#0284C7',
                  color: '#fff',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}
              >
                🚶
              </div>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#fff' }}>
                Rota a Pé + Ônibus
              </span>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#38BDF8' }}>
              ~{activeRoute.totalDurationMinutes} min total
            </span>
          </div>

          {/* Métricas a Pé & Ônibus no Ponto */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '11px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#94A3B8' }}>
              <Footprints size={14} color="#38BDF8" />
              <span>A pé: <strong style={{ color: '#38BDF8' }}>{activeRoute.totalWalkDurationMinutes} min</strong> ({activeRoute.totalWalkDistanceMeters}m)</span>
            </div>
            <div style={{ color: '#FCA5A5', fontWeight: 700 }}>
              Ônibus chega em: <strong style={{ color: '#E30613' }}>{activeRoute.nextBusEtaMinutes} min</strong>
            </div>
          </div>
        </div>
      )}

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

      {/* Legenda de Destino e Frota Flutuante */}
      <div
        style={{
          position: 'absolute',
          bottom: '76px',
          left: '16px',
          zIndex: 990,
          background: 'rgba(15, 23, 42, 0.94)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '6px 14px',
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
          <strong>Destino:</strong> {selectedLine ? (selectedLine.sl === 1 ? selectedLine.ts : selectedLine.tp) : 'SHOPPING CENTER NORTE'} · {veiculos.length} veículos
        </span>
      </div>
    </div>
  );
}
