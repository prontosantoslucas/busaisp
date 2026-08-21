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
import { TrafficIncident } from '@/types/traffic';
import {
  RefreshCw,
  Locate,
  Footprints,
  Layers,
  Square,
  Navigation,
  Play,
  Radio,
  TrainTrack,
  MapPin,
  AlertTriangle,
  ShieldAlert,
  Cone,
  Car,
  Flame
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
  isPercursoActive?: boolean;
  onStopPercurso?: () => void;
  onStartPercurso?: () => void;
  stations?: StationItem[];
  selectedStation?: StationItem | null;
  onRouteToStation?: (station: StationItem) => void;
  incidents?: TrafficIncident[];
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
  isPercursoActive = false,
  onStopPercurso,
  onStartPercurso,
  stations = [],
  selectedStation,
  onRouteToStation,
  incidents = []
}: LiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const busMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const stopMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const stationMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const incidentMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const routePolylinesGroupRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const userAccuracyCircleRef = useRef<L.Circle | null>(null);
  const watchPositionIdRef = useRef<number | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [liveUserCoords, setLiveUserCoords] = useState<[number, number] | null>(userCoords || null);
  const [showIncidents, setShowIncidents] = useState(true);

  // Inicializar o Mapa Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCoords: [number, number] = userCoords || [-23.5158, -46.6182];

    const map = L.map(mapContainerRef.current, {
      center: initialCoords,
      zoom: 14,
      zoomControl: false,
      attributionControl: false
    });

    // Dark Matter Tiles (CartoDB)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    L.control.zoom({ position: 'topright' }).addTo(map);

    busMarkersGroupRef.current = L.layerGroup().addTo(map);
    stopMarkersGroupRef.current = L.layerGroup().addTo(map);
    stationMarkersGroupRef.current = L.layerGroup().addTo(map);
    incidentMarkersGroupRef.current = L.layerGroup().addTo(map);
    routePolylinesGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Monitorar e seguir GPS continuamente quando "Iniciar Percurso" estiver ativo
  useEffect(() => {
    if (isPercursoActive && typeof window !== 'undefined' && navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLiveUserCoords(coords);

          if (mapInstanceRef.current) {
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

  // Atualizar marcador de localização do usuário
  useEffect(() => {
    if (!mapInstanceRef.current || !effectiveCoords) return;

    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng(effectiveCoords);
    } else {
      const userIcon = L.divIcon({
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${isPercursoActive ? 'rgba(16, 185, 129, 0.5)' : 'rgba(56, 189, 248, 0.45)'}; animation: markerPulse 1.5s infinite;"></div>
            <div style="width: 26px; height: 26px; border-radius: 50%; background: ${isPercursoActive ? '#10B981' : '#0284C7'}; border: 3px solid #FFFFFF; box-shadow: 0 2px 8px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 13px;">🧭</div>
          </div>
        `,
        className: 'user-location-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      userMarkerRef.current = L.marker(effectiveCoords, { icon: userIcon, zIndexOffset: 1000 })
        .bindPopup('<strong>📍 Sua Localização (GPS)</strong><br/><span style="font-size:11px; color:#94A3B8;">Precisão em tempo real</span>')
        .addTo(map);
    }

    if (userAccuracyCircleRef.current) {
      userAccuracyCircleRef.current.setLatLng(effectiveCoords);
    } else {
      userAccuracyCircleRef.current = L.circle(effectiveCoords, {
        radius: 35,
        color: isPercursoActive ? '#10B981' : '#0284C7',
        fillColor: isPercursoActive ? '#34D399' : '#38BDF8',
        fillOpacity: 0.15,
        weight: 1
      }).addTo(map);
    }
  }, [effectiveCoords, isPercursoActive]);

  // Atualizar traçado no mapa com curvas perfeitas de ruas
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
        opacity: 0.35
      });
      const busLine = L.polyline(activeRoute.polyline.transit, {
        color: '#E30613',
        weight: 5,
        opacity: 0.98
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

      // Marcador de Embarque no Ônibus
      const boardIcon = L.divIcon({
        html: `
          <div style="background: #E30613; color: #fff; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 15px;">
            🚏
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

    // 3. Marcadores de Baldeação
    if (activeRoute.transferPoints && activeRoute.transferPoints.length > 0) {
      activeRoute.transferPoints.forEach((tp) => {
        const transferHtml = `
          <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
            <div style="position: absolute; inset: 0; border-radius: 50%; background: rgba(245, 158, 11, 0.45); animation: markerPulse 2s infinite;"></div>
            <div style="position: relative; width: 34px; height: 34px; border-radius: 50%; background: #F59E0B; color: #000000; display: flex; align-items: center; justify-content: center; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 14px rgba(0,0,0,0.7); font-size: 16px; font-weight: 900;">
              🔄
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
            <div style="background: #F59E0B; color: #000000; font-size: 11px; font-weight: 900; padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 6px;">
              🔄 PONTO DE BALDEAÇÃO
            </div>
            <strong style="color: #FFFFFF; font-size: 13px; display: block; margin-bottom: 4px;">
              ${tp.stopName}
            </strong>
            <div style="font-size: 12px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px;">
              <div>Desça do ônibus: <strong style="color: #F87171;">${tp.fromLine}</strong></div>
              <div>Pegue o próximo: <strong style="color: #34D399;">${tp.toLine}</strong> (sentido ${tp.toDestination})</div>
              ${tp.walkMeters && tp.walkMeters > 30 ? `<div style="background: #1E293B; padding: 4px 6px; border-radius: 4px;">Caminhada entre paradas: <strong style="color: #38BDF8;">${tp.walkMeters}m (~${tp.walkMinutes} min)</strong></div>` : ''}
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

    // 5. Marcador de Destino Final
    const destIcon = L.divIcon({
      html: `
        <div style="background: #10B981; color: #fff; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 4px 14px rgba(0,0,0,0.6); font-size: 16px;">
          🏁
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

    if (!isPercursoActive && allCoords.length > 0) {
      map.fitBounds(L.latLngBounds(allCoords), { padding: [60, 60], maxZoom: 16 });
    }
  }, [activeRoute, isPercursoActive]);

  // Atualizar Marcadores de Incidentes de Trânsito (Waze / CET / TomTom)
  useEffect(() => {
    if (!incidentMarkersGroupRef.current) return;

    incidentMarkersGroupRef.current.clearLayers();

    if (!showIncidents || !incidents || incidents.length === 0) return;

    incidents.forEach((inc) => {
      let iconEmoji = '⚠️';
      let bgColor = '#F59E0B';
      let pulseColor = 'rgba(245, 158, 11, 0.4)';
      let label = 'Alerta';

      if (inc.type === 'POLICE') {
        iconEmoji = '🚓';
        bgColor = '#2563EB';
        pulseColor = 'rgba(37, 99, 235, 0.5)';
        label = 'BLITZ / POLÍCIA';
      } else if (inc.type === 'ACCIDENT') {
        iconEmoji = '💥';
        bgColor = '#DC2626';
        pulseColor = 'rgba(220, 38, 38, 0.5)';
        label = 'ACIDENTE';
      } else if (inc.type === 'CONSTRUCTION') {
        iconEmoji = '🚧';
        bgColor = '#EA580C';
        pulseColor = 'rgba(234, 88, 12, 0.5)';
        label = 'OBRAS / INTERDIÇÃO';
      } else if (inc.type === 'JAM') {
        iconEmoji = '🔴';
        bgColor = '#991B1B';
        pulseColor = 'rgba(153, 27, 27, 0.5)';
        label = 'TRÂNSITO LENTO';
      } else if (inc.type === 'HAZARD') {
        iconEmoji = '⚠️';
        bgColor = '#D97706';
        pulseColor = 'rgba(217, 119, 6, 0.5)';
        label = 'PERIGO NA PISTA';
      }

      const htmlIcon = `
        <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${pulseColor}; animation: markerPulse 1.8s infinite;"></div>
          <div style="width: 28px; height: 28px; border-radius: 50%; background: ${bgColor}; border: 2px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; font-size: 13px; color: #fff;">
            ${iconEmoji}
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
            <span style="background: ${bgColor}; color: #FFFFFF; font-size: 10px; font-weight: 900; padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px;">
              ${iconEmoji} ${label}
            </span>
            <span style="font-size: 10px; color: #94A3B8; font-weight: 700;">
              Fonte: ${inc.source}
            </span>
          </div>

          <strong style="color: #FFFFFF; font-size: 13px; display: block; margin-bottom: 4px; line-height: 1.3;">
            ${inc.title}
          </strong>

          <div style="color: #38BDF8; font-size: 11px; font-weight: 700; margin-bottom: 6px;">
            📍 ${inc.street}
          </div>

          <div style="font-size: 12px; color: #CBD5E1; background: #1E293B; padding: 6px 8px; border-radius: 6px; margin-bottom: 6px; line-height: 1.4;">
            ${inc.description}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; font-size: 10px; color: #94A3B8;">
            <span>⏱️ Atualizado às ${inc.updatedAt}</span>
            <span style="color: #10B981; font-weight: 800;">Confiança: 10/10</span>
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
          <div class="bus-marker-pulse" style="${isRouteLine ? 'background: rgba(16, 185, 129, 0.45); width: 48px; height: 48px;' : ''}"></div>
          <div class="bus-marker-icon" style="transform: rotate(${heading}deg); ${isRouteLine ? 'background: #10B981; border: 2px solid #FFFFFF; box-shadow: 0 0 15px rgba(16, 185, 129, 0.8);' : ''}">
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
            <strong style="color: ${isRouteLine ? '#10B981' : '#E30613'}; font-size: 14px;">
              ${isRouteLine ? '🟢 Ônibus a Caminho' : 'Ônibus'} #${v.p}
            </strong>
            ${v.a ? '<span style="background: rgba(16, 185, 129, 0.2); color: #10B981; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">♿ ACESSÍVEL</span>' : ''}
          </div>
          
          <div style="font-size: 12px; color: #94A3B8; display: flex; flex-direction: column; gap: 4px;">
            <div>Linha: <strong style="color: #fff;">${selectedLine ? `${selectedLine.lt}-${selectedLine.tl}` : 'SPTrans'}</strong></div>
            <div style="background: #1E293B; border-left: 3px solid ${isRouteLine ? '#10B981' : '#E30613'}; padding: 4px 6px; border-radius: 4px; margin: 2px 0;">
              <span style="font-size: 10px; color: #FCA5A5; font-weight: 700; display: block;">DESTINO LETREIRO:</span>
              <strong style="color: #FFFFFF; font-size: 12px;">${destinoText}</strong>
            </div>
            ${activeRoute ? `
              <div style="background: rgba(16, 185, 129, 0.15); color: #34D399; padding: 4px 6px; border-radius: 4px; font-weight: 700; font-size: 11px;">
                ⏱️ Previsão no ponto (${activeRoute.departureStop.np}): ~${activeRoute.nextBusEtaMinutes >= 0 ? `${activeRoute.nextBusEtaMinutes} min` : 'a caminho'}
              </div>
            ` : ''}
            <div style="display: flex; align-items: center; gap: 4px; color: #10B981; font-size: 11px; margin-top: 2px;">
              <span style="display: inline-block; width: 7px; height: 7px; border-radius: 50%; background: #10B981;"></span>
              <strong>Sinal GPS Olho Vivo em Tempo Real</strong>
            </div>
            <div style="font-size: 10px; color: #64748B;">Última telemetria: ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      busMarkersGroupRef.current?.addLayer(marker);
      bounds.push([v.py, v.px]);
    });

    if (bounds.length > 0 && mapInstanceRef.current && !isPercursoActive) {
      if (!activeRoute) {
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
      });

      stopMarkersGroupRef.current?.addLayer(marker);
    });
  }, [paradas, onSelectParada]);

  // Atualizar marcadores de Estações e Terminais
  useEffect(() => {
    if (!stationMarkersGroupRef.current || !mapInstanceRef.current) return;

    stationMarkersGroupRef.current.clearLayers();

    if (!stations || stations.length === 0) return;

    stations.forEach((st) => {
      const isSelected = selectedStation?.id === st.id;
      const bgColor = st.type === 'METRO' ? '#003399' : st.type === 'CPTM' ? '#A61327' : '#E30613';
      const iconEmoji = st.type === 'TERMINAL_BUS' ? '🚏' : st.type === 'METRO' ? '🚇' : '🚆';

      const htmlIcon = `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          ${isSelected ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: rgba(255, 102, 0, 0.5); animation: markerPulse 1.5s infinite;"></div>` : ''}
          <div style="background: ${bgColor}; width: ${isSelected ? '36px' : '30px'}; height: ${isSelected ? '36px' : '30px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #FFFFFF; box-shadow: 0 4px 12px rgba(0,0,0,0.6); font-size: ${isSelected ? '16px' : '13px'}; color: #fff; font-weight: 800;">
            ${iconEmoji}
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
            <span style="background: ${bgColor}; color: #fff; font-size: 10px; font-weight: 800; padding: 2px 6px; border-radius: 4px;">
              ${st.type === 'METRO' ? 'METRÔ SP' : st.type === 'CPTM' ? 'TREM CPTM' : 'TERMINAL SPTRANS'}
            </span>
          </div>
          <strong style="color: #FFFFFF; font-size: 14px; display: block; margin-bottom: 2px;">
            ${st.name}
          </strong>
          <div style="color: #38BDF8; font-size: 12px; font-weight: 600; margin-bottom: 6px;">
            📍 ${st.address}
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 8px;">
            ${st.neighborhood}
          </div>
          <div style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${st.lines.map(l => `<span style="background:${l.color}; color:${l.color === '#FFF000' || l.color === '#A7A8AA' ? '#000' : '#fff'}; font-size:10px; font-weight:800; padding:2px 6px; border-radius:4px;">${l.name}</span>`).join('')}
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
        setLiveUserCoords(coords);

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

      {/* Barra HUD Flutuante de Percurso Ativo no Topo do Mapa */}
      {isPercursoActive && activeRoute && (
        <div
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            right: '16px',
            maxWidth: '520px',
            margin: '0 auto',
            zIndex: 1000,
            background: '#0F172A',
            border: '2px solid #10B981',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.8)',
            animation: 'fadeIn 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                background: '#10B981',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Navigation size={18} className="animate-pulse" />
            </div>

            <div>
              <div style={{ fontSize: '11px', fontWeight: 900, color: '#34D399', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🟢 PERCURSO ATIVO</span>
                <span>·</span>
                <span>GPS SEGUINDO</span>
              </div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#FFFFFF' }}>
                {activeRoute.steps[0]?.instruction || 'Siga o trajeto no mapa'}
              </div>
            </div>
          </div>

          <button
            onClick={onStopPercurso}
            style={{
              background: '#EF4444',
              border: 'none',
              borderRadius: '9999px',
              padding: '8px 14px',
              color: '#FFFFFF',
              fontSize: '12px',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)',
              whiteSpace: 'nowrap'
            }}
          >
            <Square size={13} fill="#fff" />
            <span>Parar</span>
          </button>
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
        {/* Toggle de Camada de Incidentes (Waze/CET) */}
        <button
          onClick={() => setShowIncidents(!showIncidents)}
          className={`btn-icon ${showIncidents ? 'active' : ''}`}
          style={{
            background: showIncidents ? '#DC2626' : '#1C1E24',
            color: '#FFFFFF',
            border: showIncidents ? '1.5px solid #EF4444' : '1px solid #2D313C',
            position: 'relative'
          }}
          title={showIncidents ? 'Ocultar Incidentes de Trânsito' : 'Exibir Incidentes de Trânsito'}
          aria-label="Incidentes de Trânsito"
        >
          <AlertTriangle size={19} />
          {incidents.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#EF4444',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 900,
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #1C1E24'
              }}
            >
              {incidents.length}
            </span>
          )}
        </button>

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
          background: '#0F172A',
          border: '1px solid #334155',
          padding: '6px 14px',
          borderRadius: '9999px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#CBD5E1',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
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
          <strong>Linha:</strong> {selectedLine ? `${selectedLine.lt}-${selectedLine.tl}` : '1703-10'} · {veiculos.length} veículos transmitindo GPS
        </span>
      </div>
    </div>
  );
}
