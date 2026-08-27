'use client';

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  SPTransLinha,
  SPTransParada,
  SPTransVeiculo
} from '@/types/sptrans';
import { StationItem } from '@/lib/stationsData';
import { RoutePlan } from '@/lib/routing';
import { getEtaColorTokens } from '@/lib/etaStyle';
import { TrafficIncident } from '@/types/traffic';
import { getTrafficCorridorsAndHotspots } from '@/lib/trafficService';
import StopArrivalsModal from '@/components/Map/StopArrivalsModal';
import {
  RefreshCw,
  Locate,
  Square,
  Navigation,
  AlertTriangle,
  MapPin,
  X,
  Flame,
  Layers
} from 'lucide-react';

export interface LiveMapProps {
  selectedLine: SPTransLinha | null;
  veiculos: SPTransVeiculo[];
  paradas: SPTransParada[];
  onSelectParada: (parada: SPTransParada) => void;
  isLoading: boolean;
  onRefresh: () => void;
  isMockMode?: boolean;
  activeRoute?: RoutePlan | null;
  userCoords?: [number, number] | null;
  userAccuracyMeters?: number | null;
  isPercursoActive?: boolean;
  onStopPercurso?: () => void;
  onStartPercurso?: () => void;
  stations?: StationItem[];
  selectedStation?: StationItem | null;
  onRouteToStation?: (station: StationItem) => void;
  incidents?: TrafficIncident[];
  focusCoords?: [number, number] | null;
  theme?: 'dark' | 'light';
  isMapFullscreen?: boolean;
  hasBoarded?: boolean;
  isOffRoute?: boolean;
}

// Basemapas Esri "Canvas" (Light/Dark Gray) — não exigem chave de API para o volume
// deste app, ao contrário do CartoDB, que passou a exigir chave mesmo no free tier
// (causava o aviso "API KEY REQUIRED" em produção sempre que a variável de ambiente
// não estava corretamente configurada na Vercel). Zoom nativo até 16; acima disso o
// Leaflet amplia o próprio tile (maxNativeZoom) em vez de pedir um tile inexistente.
function getBasemapTileUrl(theme: 'dark' | 'light'): string {
  const style = theme === 'light' ? 'World_Light_Gray_Base' : 'World_Dark_Gray_Base';
  return `https://services.arcgisonline.com/arcgis/rest/services/Canvas/${style}/MapServer/tile/{z}/{y}/{x}`;
}

export default function LiveMap({
  selectedLine,
  veiculos,
  paradas,
  onSelectParada,
  isLoading,
  onRefresh,
  isMockMode = false,
  activeRoute,
  userCoords,
  userAccuracyMeters,
  isPercursoActive = false,
  onStopPercurso,
  onStartPercurso,
  stations = [],
  selectedStation,
  onRouteToStation,
  incidents = [],
  focusCoords,
  theme = 'dark',
  isMapFullscreen = false,
  hasBoarded = false,
  isOffRoute = false
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const busMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const stopMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const stationMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const trafficHeatmapGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchPositionIdRef = useRef<number | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [liveUserCoords, setLiveUserCoords] = useState<[number, number] | null>(userCoords || null);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showTrafficHeatmap, setShowTrafficHeatmap] = useState(false);
  const [tappedParada, setTappedParada] = useState<SPTransParada | null>(null);
  const [isLocatingTappedStop, setIsLocatingTappedStop] = useState(false);
  const [isArrivalsModalOpen, setIsArrivalsModalOpen] = useState(false);

  const lastFittedRouteIdRef = useRef<string | null>(null);
  const lastFittedLineRef = useRef<number | null>(null);

  // Inicializar o Mapa Leaflet com CartoDB Dark Matter (Modo Noturno Puro)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCoords: [number, number] = userCoords || [-23.5158, -46.6182];

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Basemapa Esri Canvas (Light/Dark Gray) — sem rótulos/POIs do provedor, já que o
    // app desenha seus próprios marcadores por cima. Acompanha o tema claro/escuro do
    // usuário, e não exige chave de API (ao contrário do CartoDB, usado antes).
    tileLayerRef.current = L.tileLayer(getBasemapTileUrl(theme), {
      maxZoom: 19,
      maxNativeZoom: 16
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    busMarkersGroupRef.current = L.layerGroup().addTo(map);
    stopMarkersGroupRef.current = L.layerGroup().addTo(map);
    stationMarkersGroupRef.current = L.layerGroup().addTo(map);
    incidentMarkersGroupRef.current = L.layerGroup().addTo(map);
    trafficHeatmapGroupRef.current = L.layerGroup().addTo(map);
    routePolylinesGroupRef.current = L.layerGroup().addTo(map);

    // Toque em qualquer ponto do mapa: buscar a parada de ônibus real mais próxima
    // ("Linhas que passam neste ponto"), não exige que o usuário acerte um marcador exato.
    map.on('click', async (e: L.LeafletMouseEvent) => {
      setIsLocatingTappedStop(true);
      setTappedParada(null);
      try {
        const res = await fetch(`/api/onibus?tipo=parada_proxima&lat=${e.latlng.lat}&lng=${e.latlng.lng}`);
        const json = await res.json();
        if (json.success && json.data) {
          setTappedParada(json.data);
        }
      } catch (err) {
        console.error('[LiveMap] Erro ao buscar parada mais próxima:', err);
      } finally {
        setIsLocatingTappedStop(false);
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Trocar a camada base do mapa quando o usuário alterna claro/escuro — sem isso
  // o mapa ficava permanentemente escuro mesmo com o resto da UI em tema claro.
  useEffect(() => {
    if (!tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getBasemapTileUrl(theme));
  }, [theme]);

  // Monitorar e seguir GPS continuamente quando "Iniciar Percurso" estiver ativo
  useEffect(() => {
    if (isPercursoActive && typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLiveUserCoords(coords);

          if (mapInstanceRef.current) {
            // Em modo de navegação 3D, posicionar levemente abaixo do centro para vislumbrar a rota à frente
            mapInstanceRef.current.setView(coords, 17, { animate: true });
          }
        },
        (err) => {
          console.warn('[GPS] Erro no monitoramento de percurso:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 6000 }
      );

      watchPositionIdRef.current = watchId;

      return () => {
        if (watchPositionIdRef.current !== null) {
          navigator.geolocation.clearWatch(watchPositionIdRef.current);
          watchPositionIdRef.current = null;
        }
      };
    } else {
      if (watchPositionIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchPositionIdRef.current);
        watchPositionIdRef.current = null;
      }
    }
  }, [isPercursoActive]);

  const effectiveCoords = liveUserCoords || userCoords;
  const hasAutoCenteredRef = useRef(false);

  // Centralizar automaticamente no GPS do usuário assim que as coordenadas forem detectadas
  useEffect(() => {
    if (effectiveCoords && mapInstanceRef.current && !hasAutoCenteredRef.current && !activeRoute && !selectedStation) {
      hasAutoCenteredRef.current = true;
      mapInstanceRef.current.setView(effectiveCoords, 15, { animate: true });
    }
  }, [effectiveCoords, activeRoute, selectedStation]);

  // Ir até um ponto específico do mapa (ex.: local de um incidente selecionado nas Notícias)
  useEffect(() => {
    if (focusCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(focusCoords, 17, { animate: true });
    }
  }, [focusCoords]);

  // Atualizar marcador de localização do usuário com SVG e radar de pulso
  useEffect(() => {
    if (!mapInstanceRef.current || !effectiveCoords) return;

    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(effectiveCoords);
    } else {
      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 38px; height: 38px; border-radius: 50%; background: ${isPercursoActive ? 'var(--bus-emerald-soft)' : 'var(--bus-violet-soft)'}; animation: markerPulse 1.5s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${isPercursoActive ? 'var(--bus-emerald)' : 'var(--bus-violet-ink)'}; border: 2.5px solid #FFFFFF; box-shadow: var(--bus-shadow-raised); display: flex; align-items: center; justify-content: center; color: #fff;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>
            </div>
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [38, 38],
        iconAnchor: [19, 19]
      });

      userMarkerRef.current = L.marker(effectiveCoords, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup('<strong>Sua Localização (GPS)</strong><br/><span style="font-size:11px; color:var(--bus-text-secondary);">Precisão em tempo real</span>')
        .addTo(map);
    }

    // Raio real do círculo de precisão a partir do GPS (position.coords.accuracy, em metros).
    // Sem leitura de precisão ainda, usamos um raio conservador em vez de inventar um valor preciso.
    const accuracyRadius = typeof userAccuracyMeters === 'number' && userAccuracyMeters > 0
      ? Math.min(Math.max(userAccuracyMeters, 8), 300)
      : 50;

    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng(effectiveCoords);
      userAccuracyCircleRef.current.setRadius(accuracyRadius);
    } else {
      userAccuracyCircleRef.current = L.circle(effectiveCoords, {
        radius: accuracyRadius,
        color: isPercursoActive ? '#10B981' : 'var(--bus-violet-ink)',
        fillColor: isPercursoActive ? '#34D399' : 'var(--bus-violet)',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(map);
    }
  }, [effectiveCoords, isPercursoActive, userAccuracyMeters]);

  // Atualizar traçado no mapa com curvas perfeitas de ruas
  useEffect(() => {
    if (!routePolylinesGroupRef.current || !mapInstanceRef.current) return;

    routePolylinesGroupRef.current.clearLayers();

    if (!activeRoute) return;

    const map = mapInstanceRef.current;
    const allCoords: [number, number][] = [];

    // 1. Caminhada a pé inicial até a parada (Linha tracejada azul clara neon)
    if (activeRoute.polyline.walkToStop.length > 0) {
      const walkGlow = L.polyline(activeRoute.polyline.walkToStop, {
        color: 'var(--bus-violet)',
        weight: 8,
        opacity: 0.25
      });
      const walkLine = L.polyline(activeRoute.polyline.walkToStop, {
        color: 'var(--bus-violet)',
        weight: 5,
        dashArray: '6, 8',
        opacity: 0.95
      });
      routePolylinesGroupRef.current.addLayer(walkGlow);
      routePolylinesGroupRef.current.addLayer(walkLine);
      allCoords.push(...activeRoute.polyline.walkToStop);
    }

    // 2. Trajeto do Ônibus (Curvas reais das ruas da rota)
    if (activeRoute.polyline.transit.length > 0) {
      const busGlow = L.polyline(activeRoute.polyline.transit, {
        color: 'var(--bus-violet-ink)',
        weight: 10,
        opacity: 0.4
      });
      const busLine = L.polyline(activeRoute.polyline.transit, {
        color: '#22D3EE',
        weight: 6,
        opacity: 1
      });
      routePolylinesGroupRef.current.addLayer(busGlow);
      routePolylinesGroupRef.current.addLayer(busLine);
      allCoords.push(...activeRoute.polyline.transit);

      // Círculos de cada parada intermediária ao longo do traçado
      if (activeRoute.allRouteStops && activeRoute.allRouteStops.length > 0) {
        activeRoute.allRouteStops.forEach((stop, sIdx) => {
          const isFirst = sIdx === 0;
          const isLast = sIdx === activeRoute.allRouteStops.length - 1;
          if (isFirst || isLast) return;

          const stopCircle = L.circleMarker([stop.lat, stop.lng], {
            radius: 5,
            fillColor: '#FFFFFF',
            fillOpacity: 0.95,
            color: '#0F172A',
            weight: 2
          });
          stopCircle.bindTooltip(stop.name, { direction: 'top', offset: [0, -4] });
          routePolylinesGroupRef.current?.addLayer(stopCircle);
        });
      }

      // Marcador de Embarque no Ônibus (SVG)
      const boardIcon = L.divIcon({
        html: `
          <div style="background: var(--bus-violet-ink); color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.7);">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4C2.9 6 1.9 6.8 1.6 7.8L.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg>
          </div>
        `,
        className: 'bus-board-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });

      const boardMarker = L.marker([activeRoute.departureStop.py, activeRoute.departureStop.px], { icon: boardIcon })
        .bindPopup(`<strong>Embarque: ${activeRoute.departureStop.np}</strong><br/>${activeRoute.nextBusEtaMinutes >= 0 ? `Ônibus chega em <strong>${activeRoute.nextBusEtaMinutes} min</strong>` : 'Sem previsão em tempo real para esta linha agora'}`);
      routePolylinesGroupRef.current.addLayer(boardMarker);
    }

    // 3. Marcadores de Baldeação (SVG)
    if (activeRoute.transferPoints && activeRoute.transferPoints.length > 0) {
      activeRoute.transferPoints.forEach((tp) => {
        const transferHtml = `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(245, 158, 11, 0.45); animation: markerPulse 2s infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #F59E0B; color: #000000; display: flex; align-items: center; justify-content: center; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.7);">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/></svg>
            </div>
          </div>
        `;
        const transferIcon = L.divIcon({
          html: transferHtml,
          className: 'custom-transfer-marker',
          iconSize: [40, 40],
          iconAnchor: [20, 20]
        });

        const transferMarker = L.marker([tp.lat, tp.lng], { icon: transferIcon, zIndexOffset: 950 });
        transferMarker.bindPopup(`
          <div style="font-family: inherit; min-width: 230px; padding: 6px;">
            <div style="background: var(--bus-live); color: var(--bus-text-on-accent); font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: var(--bus-radius-sm); display: inline-block; margin-bottom: 6px;">
              PONTO DE BALDEAÇÃO
            </div>
            <strong style="color: var(--bus-text-primary); font-size: 13px; display: block; margin-bottom: 4px;">
              ${tp.stopName}
            </strong>
            <div style="font-size: 12px; color: var(--bus-text-secondary); display: flex; flex-direction: column; gap: 4px;">
              <div>Desça do ônibus: <strong style="color: var(--bus-rose);">${tp.fromLine}</strong></div>
              <div>Pegue o próximo: <strong style="color: var(--bus-emerald);">${tp.toLine}</strong> (sentido ${tp.toDestination})</div>
              ${tp.walkMeters && tp.walkMeters > 30 ? `<div style="background: var(--bus-surface-sunken); border: 1px solid var(--bus-border-subtle); padding: 4px 6px; border-radius: var(--bus-radius-sm);">Caminhada entre paradas: <strong style="color: var(--bus-violet);">${tp.walkMeters}m (~${tp.walkMinutes} min)</strong></div>` : ''}
            </div>
          </div>
        `);
        routePolylinesGroupRef.current?.addLayer(transferMarker);
        allCoords.push([tp.lat, tp.lng]);
      });
    }

    // 4. Caminhada final a pé até o destino
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

    // 5. Marcador de Destino Final (SVG)
    const destIcon = L.divIcon({
      html: `
        <div style="background: #10B981; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.7);">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
        </div>
      `,
      className: 'dest-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });

    const destMarker = L.marker([activeRoute.destination.lat, activeRoute.destination.lng], {
      icon: destIcon
    }).bindPopup(`<strong>Destino: ${activeRoute.destination.name}</strong><br/>${activeRoute.destination.addressDetails || ''}`);

    routePolylinesGroupRef.current.addLayer(destMarker);

    // Enquadrar no traçado apenas quando a rota for selecionada pela primeira vez (evita arrastar a câmera de volta se o usuário estiver explorando o mapa)
    if (!isPercursoActive && allCoords.length > 0 && activeRoute.id !== lastFittedRouteIdRef.current) {
      lastFittedRouteIdRef.current = activeRoute.id;
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60], maxZoom: 16 });
    }
  }, [activeRoute, isPercursoActive]);

  // Atualizar Marcadores de Incidentes de Trânsito
  useEffect(() => {
    if (!incidentMarkersGroupRef.current) return;

    incidentMarkersGroupRef.current.clearLayers();

    if (!showIncidents || !incidents || incidents.length === 0) return;

    incidents.forEach((inc) => {
      let bgColor = '#F59E0B';
      let pulseColor = 'rgba(245, 158, 11, 0.4)';
      let label = 'Alerta';
      let svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';

      if (inc.type === 'POLICE') {
        bgColor = '#2563EB';
        pulseColor = 'rgba(37, 99, 235, 0.5)';
        label = 'BLITZ / POLÍCIA';
        svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
      } else if (inc.type === 'ACCIDENT') {
        bgColor = '#DC2626';
        pulseColor = 'rgba(220, 38, 38, 0.5)';
        label = 'ACIDENTE';
        svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
      } else if (inc.type === 'CONSTRUCTION') {
        bgColor = '#EA580C';
        pulseColor = 'rgba(234, 88, 12, 0.5)';
        label = 'OBRAS';
        svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2"/><rect width="20" height="8" x="2" y="14" rx="2"/></svg>';
      } else if (inc.type === 'JAM') {
        bgColor = '#991B1B';
        pulseColor = 'rgba(153, 27, 27, 0.5)';
        label = 'LENTIDÃO';
        svgIcon = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
      }

      const htmlIcon = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${pulseColor}; animation: markerPulse 1.8s infinite;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${bgColor}; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; color: #fff;">
            ${svgIcon}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'incident-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([inc.lat, inc.lng], { icon: customIcon, zIndexOffset: 700 });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 230px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <span style="background: ${bgColor}; color: #FFFFFF; font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: var(--bus-radius-sm); display: inline-flex; align-items: center; gap: 4px;">
              ${label}
            </span>
            <span style="font-size: 10px; color: var(--bus-text-muted); font-weight: 600;">
              Fonte: ${inc.source}
            </span>
          </div>

          <strong style="color: var(--bus-text-primary); font-size: 13px; display: block; margin-bottom: 4px; line-height: 1.3;">
            ${inc.title}
          </strong>

          <div style="color: var(--bus-violet); font-size: 11px; font-weight: 600; margin-bottom: 6px;">
            ${inc.street}
          </div>

          <div style="font-size: 12px; color: var(--bus-text-primary); background: var(--bus-surface-sunken); border: 1px solid var(--bus-border-subtle); padding: 6px 8px; border-radius: var(--bus-radius-sm); margin-bottom: 6px; line-height: 1.4;">
            ${inc.description}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: var(--bus-text-muted);">
            <span>Atualizado às ${inc.updatedAt}</span>
            <span style="color: var(--bus-emerald); font-weight: 700;">Confiança: 10/10</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      incidentMarkersGroupRef.current?.addLayer(marker);
    });
  }, [incidents, showIncidents]);

  // Atualizar marcadores de Ônibus no mapa
  useEffect(() => {
    if (!busMarkersGroupRef.current || !mapInstanceRef.current) return;

    busMarkersGroupRef.current.clearLayers();

    if (veiculos.length === 0) return;

    const bounds: [number, number][] = [];

    veiculos.forEach((v) => {
      const heading = v.heading || 0;
      const destinoText = v.destination || (selectedLine ? (selectedLine.sl === 1 ? selectedLine.ts : selectedLine.tp) : 'DESTINO');
      const isRouteLine = activeRoute && (selectedLine?.lt === activeRoute.recommendedLine.lt || v.p === activeRoute.nextBusVehiclePrefix);

      const htmlIcon = `
        <div class="bus-marker-container">
          <div class="bus-marker-pulse" style="${isRouteLine ? 'background: var(--bus-emerald-soft); width: 48px; height: 48px;' : ''}"></div>
          <div class="bus-marker-icon" style="transform: rotate(${heading}deg); ${isRouteLine ? 'background: var(--bus-emerald); border: 2px solid #FFFFFF;' : ''}">
            <div class="bus-marker-arrow"></div>
            <span style="transform: rotate(-${heading}deg); font-weight: 900;">${v.p.slice(-3)}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'custom-leaflet-bus',
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([v.py, v.px], { icon: customIcon, zIndexOffset: isRouteLine ? 500 : 100 });

      const popupContent = `
        <div style="font-family: inherit; min-width: 210px; padding: 6px;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="color: ${isRouteLine ? 'var(--bus-emerald)' : 'var(--bus-violet)'}; font-size: 14px;">
              ${isRouteLine ? 'Ônibus a Caminho' : 'Ônibus'} #${v.p}
            </strong>
            ${v.a ? '<span style="background: var(--bus-emerald-soft); color: var(--bus-emerald); font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: var(--bus-radius-sm);">ACESSÍVEL</span>' : ''}
          </div>
          
          <div style="font-size: 12px; color: var(--bus-text-secondary); display: flex; flex-direction: column; gap: 4px;">
            <div>Linha: <strong style="color: var(--bus-text-primary);">${selectedLine ? `${selectedLine.lt}-${selectedLine.tl}` : 'SPTrans'}</strong></div>
            <div style="background: var(--bus-surface-sunken); border-left: 3px solid ${isRouteLine ? 'var(--bus-emerald)' : 'var(--bus-violet-ink)'}; border: 1px solid var(--bus-border-subtle); border-left-width: 3px; padding: 4px 6px; border-radius: var(--bus-radius-sm); margin: 2px 0;">
              <span style="font-size: 10px; color: var(--bus-violet); font-weight: 700; display: block;">DESTINO LETREIRO:</span>
              <strong style="color: var(--bus-text-primary); font-size: 12px;">${destinoText}</strong>
            </div>
            ${activeRoute ? `
              <div style="background: ${getEtaColorTokens(activeRoute.nextBusEtaMinutes).background}; color: ${getEtaColorTokens(activeRoute.nextBusEtaMinutes).color}; padding: 4px 6px; border-radius: var(--bus-radius-sm); font-weight: 700; font-size: 11px;">
                Previsão no ponto (${activeRoute.departureStop.np}): ~${activeRoute.nextBusEtaMinutes >= 0 ? `${activeRoute.nextBusEtaMinutes} min` : 'sem previsão'}
              </div>
            ` : ''}
            <div style="display: flex; align-items: center; gap: 4px; color: var(--bus-emerald); font-size: 11px; margin-top: 2px;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: var(--bus-emerald);"></span>
              <strong>Sinal GPS Olho Vivo em Tempo Real</strong>
            </div>
            <div style="font-size: 10px; color: var(--bus-text-muted);">Última telemetria: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      busMarkersGroupRef.current?.addLayer(marker);
      bounds.push([v.py, v.px]);
    });

    if (bounds.length > 0 && mapInstanceRef.current && !isPercursoActive) {
      if (!activeRoute && selectedLine && selectedLine.cl !== lastFittedLineRef.current) {
        lastFittedLineRef.current = selectedLine.cl;
        const boundsWithUser = effectiveCoords ? [...bounds, effectiveCoords] : bounds;
        mapInstanceRef.current.fitBounds(L.latLngBounds(boundsWithUser), { padding: [50, 50], maxZoom: 15 });
      }
    }
  }, [veiculos, selectedLine, activeRoute, effectiveCoords, isPercursoActive]);

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
        setTappedParada(p);
      });

      stopMarkersGroupRef.current?.addLayer(marker);
    });
  }, [paradas, onSelectParada]);

  // Atualizar marcadores de Estações e Terminais (SVG)
  useEffect(() => {
    if (!stationMarkersGroupRef.current || !mapInstanceRef.current) return;

    stationMarkersGroupRef.current.clearLayers();

    if (!stations || stations.length === 0) return;

    stations.forEach((st) => {
      const isSelected = selectedStation?.id === st.id;
      const bgColor = st.type === 'METRO' ? '#003399' : st.type === 'CPTM' ? '#A61327' : 'var(--bus-violet-ink)';
      const svgIcon = st.type === 'TERMINAL_BUS'
        ? '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4C2.9 6 1.9 6.8 1.6 7.8L.2 12.8c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3"/><circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/></svg>'
        : '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="16" x="4" y="4" rx="2"/><path d="M4 11h16"/><path d="M12 4v7"/><path d="m8 19-2 3"/><path d="m18 22-2-3"/><circle cx="8" cy="15" r="1"/><circle cx="16" cy="15" r="1"/></svg>';

      const htmlIcon = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isSelected ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: var(--bus-violet-soft); animation: markerPulse 1.5s infinite;"></div>` : ''}
          <div style="background: ${bgColor}; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.6); color: #fff;">
            ${svgIcon}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'station-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker([st.lat, st.lng], { icon: customIcon, zIndexOffset: isSelected ? 800 : 200 });

      const popupHtml = `
        <div style="font-family: inherit; min-width: 220px; padding: 6px;">
          <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${bgColor}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: var(--bus-radius-sm);">
              ${st.type === 'METRO' ? 'METRÔ SP' : st.type === 'CPTM' ? 'TREM CPTM' : 'TERMINAL SPTRANS'}
            </span>
          </div>
          <strong style="color: var(--bus-text-primary); font-size: 14px; display: block; margin-bottom: 2px;">
            ${st.name}
          </strong>
          <div style="color: var(--bus-violet); font-size: 12px; font-weight: 600; margin-bottom: 6px;">
            ${st.address}
          </div>
          <div style="font-size: 11px; color: var(--bus-text-secondary); margin-bottom: 8px;">
            ${st.neighborhood}
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${st.lines.map(l => `<span style="background:${l.color}; color:${l.color === '#FFF000' || l.color === '#A7A8AA' ? '#000' : '#fff'}; font-size:10px; font-weight:700; padding:2px 6px; border-radius:var(--bus-radius-sm);">${l.name}</span>`).join('')}
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      stationMarkersGroupRef.current?.addLayer(marker);

      if (isSelected && mapInstanceRef.current) {
        mapInstanceRef.current.setView([st.lat, st.lng], 16, { animate: true });
        marker.openPopup();
      }
    });
  }, [stations, selectedStation]);

  // Atualizar Mapa de Calor e Corredores de Trânsito com Diagnóstico de Motivos
  useEffect(() => {
    if (!trafficHeatmapGroupRef.current || !mapInstanceRef.current) return;

    trafficHeatmapGroupRef.current.clearLayers();

    if (!showTrafficHeatmap) return;

    const heatmapData = getTrafficCorridorsAndHotspots(incidents);

    heatmapData.hotspots.forEach((h) => {
      // Cores e estilos de alto contraste conforme o status do fluxo
      const colorMap = {
        FLUINDO: {
          main: '#10B981',
          bg: 'rgba(16, 185, 129, 0.22)',
          border: '#059669',
          label: 'FLUINDO NORMAL',
          icon: '🟢'
        },
        MODERADO: {
          main: '#F59E0B',
          bg: 'rgba(245, 158, 11, 0.28)',
          border: '#D97706',
          label: 'TRÁFEGO MODERADO',
          icon: '🟠'
        },
        INTENSO: {
          main: '#EF4444',
          bg: 'rgba(239, 68, 68, 0.35)',
          border: '#DC2626',
          label: 'CONGESTIONAMENTO',
          icon: '🔴'
        },
        CRITICO: {
          main: '#991B1B',
          bg: 'rgba(153, 27, 27, 0.45)',
          border: '#7F1D1D',
          label: 'TRÂNSITO CRÍTICO / RETENÇÃO',
          icon: '🟣'
        }
      };

      const cTokens = colorMap[h.status];

      // 1. Mancha de calor externa translúcida
      const outerGlow = L.circle([h.lat, h.lng], {
        radius: h.radiusMeters,
        fillColor: cTokens.main,
        fillOpacity: 0.24,
        color: cTokens.border,
        weight: 1.5,
        dashArray: '3, 4'
      });

      // 2. Núcleo central de calor
      const innerCore = L.circle([h.lat, h.lng], {
        radius: Math.round(h.radiusMeters * 0.45),
        fillColor: cTokens.main,
        fillOpacity: 0.48,
        color: cTokens.border,
        weight: 2
      });

      // 3. Marcador flutuante com badge de velocidade / atraso
      const htmlIcon = `
        <div style="cursor: pointer; display: flex; align-items: center; justify-content: center;">
          <div style="background: ${cTokens.main}; color: #FFFFFF; font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 12px; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.5); display: flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>${h.delayMinutes > 0 ? `+${h.delayMinutes}m` : `${h.avgSpeedKmh} km/h`}</span>
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: htmlIcon,
        className: 'traffic-heatmap-badge',
        iconSize: [56, 24],
        iconAnchor: [28, 12]
      });

      const marker = L.marker([h.lat, h.lng], { icon: customIcon, zIndexOffset: 300 });

      // 4. Popup detalhado com os "Motivos" do trânsito
      const reasonsListHtml = h.reasons
        .map((r) => {
          const icon = r.type === 'ACCIDENT' ? '💥' : r.type === 'CONSTRUCTION' ? '🚧' : r.type === 'RUSH_HOUR' ? '🚗' : 'ℹ️';
          return `
            <div style="margin-top: 6px; padding: 6px 8px; background: var(--bus-surface-sunken, rgba(255,255,255,0.06)); border-radius: 6px; border-left: 3px solid ${cTokens.main}; font-size: 11.5px; line-height: 1.35;">
              <strong style="color: var(--bus-text-primary, #FFFFFF); display: flex; align-items: center; gap: 4px;">
                <span>${icon}</span> <span>${r.title}</span>
                ${r.delayMinutes > 0 ? `<span style="margin-left: auto; color: ${cTokens.main}; font-weight: 800;">+${r.delayMinutes} min</span>` : ''}
              </strong>
              <div style="color: var(--bus-text-secondary, #94A3B8); margin-top: 2px;">
                ${r.description}
              </div>
            </div>
          `;
        })
        .join('');

      const popupHtml = `
        <div style="font-family: inherit; min-width: 250px; max-width: 300px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 6px; margin-bottom: 4px;">
            <span style="background: ${cTokens.bg}; color: ${cTokens.main}; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px; border: 1px solid ${cTokens.border};">
              ${cTokens.icon} ${cTokens.label}
            </span>
            <span style="font-size: 10.5px; color: var(--bus-text-muted, #64748B);">
              ${h.updatedAt}
            </span>
          </div>

          <strong style="color: var(--bus-text-primary, #FFFFFF); font-size: 14px; display: block; margin-top: 4px; line-height: 1.25;">
            ${h.name}
          </strong>
          <div style="font-size: 11.5px; color: var(--bus-violet, #8B5CF6); font-weight: 600; margin-top: 2px;">
            ${h.corridor}
          </div>
          <div style="font-size: 11px; color: var(--bus-text-secondary, #94A3B8); margin-bottom: 6px;">
            Região: ${h.neighborhood}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bus-surface-elevated, rgba(255,255,255,0.08)); padding: 6px 10px; border-radius: 6px; font-size: 11.5px; margin-bottom: 6px;">
            <span>Velocidade Atual: <strong style="color:${cTokens.main}; font-size: 13px;">${h.avgSpeedKmh} km/h</strong></span>
            <span style="color: var(--bus-text-secondary, #94A3B8);">Padrão: ${h.normalSpeedKmh} km/h</span>
          </div>

          <div style="font-size: 11.5px; font-weight: 700; color: var(--bus-text-primary, #FFFFFF); margin-top: 8px;">
            Diagnóstico dos Motivos:
          </div>
          ${reasonsListHtml}
        </div>
      `;

      marker.bindPopup(popupHtml);
      outerGlow.bindPopup(popupHtml);
      innerCore.bindPopup(popupHtml);

      trafficHeatmapGroupRef.current?.addLayer(outerGlow);
      trafficHeatmapGroupRef.current?.addLayer(innerCore);
      trafficHeatmapGroupRef.current?.addLayer(marker);
    });
  }, [showTrafficHeatmap, incidents]);

  const handleLocateMe = () => {
    if (effectiveCoords && mapInstanceRef.current) {
      mapInstanceRef.current.setView(effectiveCoords, 16, { animate: true });
    }

    if (!navigator.geolocation) {
      alert('Geolocalização não é suportada pelo seu navegador.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setIsLocating(false);
        setLiveUserCoords(coords);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView(coords, 16, { animate: true });
        }
      },
      (err) => {
        console.warn('Erro ao obter localização:', err);
        setIsLocating(false);
        if (!effectiveCoords) {
          alert('Não foi possível obter sua localização. Verifique as permissões de GPS.');
        }
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="map-perspective-viewport">
      {/* Container Leaflet */}
      <div
        ref={mapContainerRef}
        style={{ width: '100%', height: '100%', zIndex: 1 }}
      />

      {/* Barra HUD Flutuante de Percurso Ativo no Topo do Mapa — só quando o mapa é a
          tela em foco; nos demais casos o painel principal fica por cima do mapa, mas
          o vão transparente entre os cards do painel deixava esta barra vazar por trás. */}
      {isPercursoActive && activeRoute && isMapFullscreen && (() => {
        // Status real de embarque/desvio, comparado ao GPS ao vivo — nunca um estado
        // inventado (ver efeitos de detecção em page.tsx).
        const statusColor = isOffRoute ? 'var(--bus-red)' : hasBoarded ? 'var(--bus-emerald)' : 'var(--bus-live)';
        const statusText = isOffRoute ? 'FORA DA ROTA PLANEJADA' : hasBoarded ? 'A BORDO' : 'AGUARDANDO EMBARQUE';
        return (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            maxWidth: '520px',
            margin: '0 auto',
            zIndex: 1000,
            background: 'var(--bus-surface)',
            border: `2px solid ${statusColor}`,
            borderRadius: 'var(--bus-radius-lg)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: 'var(--bus-shadow-dock)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: statusColor,
                color: '#fff',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              {isOffRoute ? <AlertTriangle size={18} /> : <Navigation size={18} className="animate-pulse" />}
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: statusColor, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
                <span>{statusText}</span>
              </div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--bus-text-primary)' }}>
                {activeRoute.steps[0]?.instruction || 'Siga o trajeto no mapa'}
              </div>
            </div>
          </div>

          <button
            onClick={onStopPercurso}
            style={{
              background: 'var(--bus-red)',
              border: 'none',
              borderRadius: 'var(--bus-radius-full)',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            <Square size={13} fill="#fff" />
            <span>Parar</span>
          </button>
        </div>
        );
      })()}

      {/* Botões de Ação Flutuantes */}
      <div
        style={{
          position: 'absolute',
          right: '16px',
          bottom: '84px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '10px',
          zIndex: 999
        }}
      >
        {/* Toggle de Camada do Mapa de Calor de Trânsito com Motivos */}
        <button
          onClick={() => setShowTrafficHeatmap(!showTrafficHeatmap)}
          className="bus-pill"
          style={{
            background: showTrafficHeatmap ? 'linear-gradient(135deg, #EF4444, #F59E0B)' : 'var(--bus-surface-elevated)',
            color: showTrafficHeatmap ? '#FFFFFF' : 'var(--bus-text-primary)',
            border: showTrafficHeatmap ? '1.5px solid #EF4444' : '1px solid var(--bus-border)',
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: showTrafficHeatmap ? '0 0 12px rgba(239, 68, 68, 0.5)' : 'none'
          }}
          title={showTrafficHeatmap ? 'Ocultar Mapa de Calor de Trânsito' : 'Exibir Mapa de Calor de Trânsito'}
          aria-label="Mapa de Calor de Trânsito"
        >
          <Flame size={19} fill={showTrafficHeatmap ? '#FFFFFF' : 'none'} color={showTrafficHeatmap ? '#FFFFFF' : 'var(--bus-red)'} />
        </button>

        {/* Toggle de Camada de Incidentes (Waze/CET) */}
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className="bus-pill"
          style={{
            background: showIncidents ? 'var(--bus-red)' : 'var(--bus-surface-elevated)',
            color: showIncidents ? '#FFFFFF' : 'var(--bus-text-primary)',
            border: showIncidents ? '1.5px solid var(--bus-red)' : '1px solid var(--bus-border)',
            position: 'relative',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title={showIncidents ? 'Ocultar Incidentes de Trânsito' : 'Exibir Incidentes de Trânsito'}
          aria-label="Incidentes de Trânsito"
        >
          <AlertTriangle size={18} />
          {incidents.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: 'var(--bus-red)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--bus-surface)'
              }}
            >
              {incidents.length}
            </span>
          )}
        </button>

        <button
          onClick={handleLocateMe}
          className="bus-pill"
          style={{
            background: 'var(--bus-surface-elevated)',
            border: '1px solid var(--bus-border)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Minha Localização GPS"
          aria-label="Localização atual"
        >
          <Locate size={19} className={isLocating ? 'animate-spin' : ''} color="var(--bus-violet)" />
        </button>

        <button
          onClick={onRefresh}
          className="bus-pill"
          style={{
            background: 'var(--bus-surface-elevated)',
            border: '1px solid var(--bus-border)',
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bus-text-primary)'
          }}
          title="Atualizar posições dos ônibus"
          aria-label="Atualizar posições"
        >
          <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Mini Legenda do Mapa de Calor de Trânsito (Quando ativo) */}
      {showTrafficHeatmap && !isPercursoActive && (
        <div
          style={{
            position: 'absolute',
            bottom: selectedLine ? '124px' : '84px',
            left: '16px',
            zIndex: 990,
            background: 'var(--bus-surface-elevated)',
            border: '1px solid var(--bus-border-highlight)',
            padding: '6px 12px',
            borderRadius: 'var(--bus-radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--bus-text-primary)',
            boxShadow: 'var(--bus-shadow-raised)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10B981' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }} />
            Fluindo
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#F59E0B' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B' }} />
            Moderado
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#EF4444' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
            Intenso
          </span>
        </div>
      )}

      {/* Legenda de Destino e Frota Flutuante (Oculta durante percurso ativo para não colidir com controles) */}
      {!isPercursoActive && selectedLine && (
        <div
          style={{
            position: 'absolute',
            bottom: '84px',
            left: '16px',
            zIndex: 990,
            background: 'var(--bus-surface-elevated)',
            border: '1px solid var(--bus-border)',
            padding: '6px 14px',
            borderRadius: 'var(--bus-radius-full)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11.5px',
            color: 'var(--bus-text-secondary)',
            boxShadow: 'var(--bus-shadow-raised)'
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--bus-emerald)'
            }}
          />
          <span>
            <strong style={{ color: 'var(--bus-text-primary)' }}>Linha:</strong> {selectedLine.lt}-{selectedLine.tl} · {veiculos.length} veículos transmitindo GPS
          </span>
        </div>
      )}

      {/* Cartão flutuante: "Linhas que passam neste ponto" — aparece ao tocar em qualquer
          lugar do mapa (a parada real mais próxima é localizada automaticamente). */}
      {isLocatingTappedStop && (
        <div
          className="bus-glass-panel animate-fade-in"
          style={{
            position: 'absolute',
            bottom: '84px',
            left: '16px',
            right: '16px',
            maxWidth: '420px',
            margin: '0 auto',
            zIndex: 995,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12.5px',
            color: 'var(--bus-text-secondary)'
          }}
        >
          <div style={{ width: '16px', height: '16px', border: '2px solid var(--bus-violet-soft)', borderTopColor: 'var(--bus-violet)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <span>Procurando parada mais próxima deste ponto...</span>
        </div>
      )}

      {!isLocatingTappedStop && tappedParada && !isArrivalsModalOpen && (
        <div
          className="bus-glass-panel animate-slide-up"
          style={{
            position: 'absolute',
            bottom: '84px',
            left: '16px',
            right: '16px',
            maxWidth: '420px',
            margin: '0 auto',
            zIndex: 995,
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            border: '1px solid var(--bus-border-highlight)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--bus-radius-sm)',
                background: 'var(--bus-violet-ink)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <MapPin size={16} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10.5px', color: 'var(--bus-text-secondary)', fontWeight: 700 }}>PARADA MAIS PRÓXIMA</div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--bus-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tappedParada.np}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            <button
              onClick={() => setIsArrivalsModalOpen(true)}
              className="bus-btn-primary"
              style={{ padding: '8px 12px', fontSize: '11.5px', whiteSpace: 'nowrap' }}
            >
              Linhas neste ponto
            </button>
            <button
              onClick={() => setTappedParada(null)}
              style={{ background: 'none', border: 'none', color: 'var(--bus-text-muted)', cursor: 'pointer', padding: '4px' }}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {isArrivalsModalOpen && tappedParada && (
        <StopArrivalsModal
          parada={tappedParada}
          onClose={() => setIsArrivalsModalOpen(false)}
        />
      )}
    </div>
  );
}
