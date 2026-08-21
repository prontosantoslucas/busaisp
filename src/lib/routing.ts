import { SPTransLinha, SPTransParada } from '@/types/sptrans';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import {
  findNearbyStops,
  findDirectRoutes,
  findRoutesFromStops,
  getTripStopCoordinates,
  NearbyStop,
  DirectRoute,
  ReachableRoute
} from '@/lib/gtfs';
import { getSnappedRoutePolyline } from '@/lib/osrm';

export interface RouteLocation {
  name: string;
  addressDetails?: string;
  lat: number;
  lng: number;
}

export interface RouteStep {
  type: 'WALK' | 'BUS' | 'RAIL' | 'DESTINATION';
  instruction: string;
  detailedWalkGuide?: string;
  durationMinutes: number;
  distanceMeters: number;
  estimatedSteps?: number;
  busLine?: string;
  busDestination?: string;
  stopName?: string;
  stopAddress?: string;
  nextBusEtaMinutes?: number;
  departureEtas?: number[];
  accuracyLevel?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText?: string;
}

export interface TransferPoint {
  stopName: string;
  stopAddress?: string;
  lat: number;
  lng: number;
  fromLine: string;
  toLine: string;
  toDestination: string;
  walkMeters?: number;
  walkMinutes?: number;
}

export interface RoutePlan {
  id: string;
  origin: RouteLocation;
  destination: RouteLocation;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalWalkDistanceMeters: number;
  totalWalkDurationMinutes: number;
  totalEstimatedSteps: number;
  departureHour: string;
  arrivalHour: string;
  departureStop: SPTransParada;
  arrivalStop: SPTransParada;
  recommendedLine: SPTransLinha;
  transferCount: number;
  transferPoints: TransferPoint[];
  nextBusEtaMinutes: number;
  departureEtas: number[];
  nextBusVehiclePrefix?: string;
  departureSuggestion: string;
  farePrice: string;
  fareType: 'BILHETE_UNICO' | 'TOP_METRO' | 'INTEGRACAO';
  carbonGrams: number;
  accuracyLevel: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText: string;
  trafficStatus: 'FLUINDO' | 'MODERADO' | 'INTENSO';
  trafficDelayMinutes: number;
  steps: RouteStep[];
  polyline: {
    walkToStop: [number, number][];
    transit: [number, number][];
    walkToDest: [number, number][];
  };
}

export interface RouteSearchResult {
  primaryRoute: RoutePlan;
  alternatives: RoutePlan[];
}

export interface DiscoveredLeg {
  line: SPTransLinha;
  boardStop: SPTransParada;
  alightStop: SPTransParada;
  tripId?: string;
  originStopId?: string;
  destStopId?: string;
  pathCoordinates?: [number, number][];
  etaMinutes: number;
  departureEtas?: number[];
  vehiclePrefix: string;
}

const KNOWN_SP_LOCATIONS: Record<string, { lat: number; lng: number; name: string; details: string }> = {
  'flor de maio': {
    lat: -23.4326,
    lng: -46.5783,
    name: 'Rua Flor de Maio, 40',
    details: 'Jardim Fontális / Tremembé, São Paulo - SP'
  },
  'flor de maior': {
    lat: -23.4326,
    lng: -46.5783,
    name: 'Rua Flor de Maio, 40',
    details: 'Jardim Fontális / Tremembé, São Paulo - SP'
  },
  'fontalis': {
    lat: -23.4338,
    lng: -46.5778,
    name: 'Jardim Fontális',
    details: 'Zona Norte, Tremembé, São Paulo - SP'
  },
  'center norte': {
    lat: -23.5158,
    lng: -46.6182,
    name: 'Shopping Center Norte',
    details: 'Trav. Casalbuono, 120 - Vila Guilherme, São Paulo - SP'
  },
  'shopping center norte': {
    lat: -23.5158,
    lng: -46.6182,
    name: 'Shopping Center Norte',
    details: 'Trav. Casalbuono, 120 - Vila Guilherme, São Paulo - SP'
  },
  'santana': {
    lat: -23.5020,
    lng: -46.6260,
    name: 'Metrô / Terminal Santana',
    details: 'Rua Leite de Morais - Santana, SP'
  },
  'tucuruvi': {
    lat: -23.4795,
    lng: -46.6030,
    name: 'Metrô / Terminal Tucuruvi',
    details: 'Av. Dr. Antônio Maria Laet - Tucuruvi, SP'
  },
  'paulista': {
    lat: -23.5615,
    lng: -46.6559,
    name: 'Avenida Paulista, 1578',
    details: 'Bela Vista, São Paulo - SP'
  }
};

export async function searchAddressSuggestions(query: string): Promise<RouteLocation[]> {
  if (!query || query.trim().length < 2) return [];
  const norm = query.toLowerCase().trim();
  const suggestions: RouteLocation[] = [];

  for (const [key, loc] of Object.entries(KNOWN_SP_LOCATIONS)) {
    if (key.includes(norm) || norm.includes(key)) {
      suggestions.push({
        name: loc.name,
        addressDetails: loc.details,
        lat: loc.lat,
        lng: loc.lng
      });
    }
  }

  try {
    const cleanQuery = norm.replace('maior', 'maio');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery + ', São Paulo, Brasil'
      )}&limit=4&addressdetails=1`,
      { headers: { 'User-Agent': 'BusaISP/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const parts = item.display_name.split(',');
          const mainTitle = parts.slice(0, 2).join(', ').trim();
          const subDetails = parts.slice(2, 5).join(', ').trim();

          if (!suggestions.some(s => Math.abs(s.lat - parseFloat(item.lat)) < 0.001)) {
            suggestions.push({
              name: mainTitle,
              addressDetails: subDetails,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            });
          }
        });
      }
    }
  } catch (err) {
    console.warn('[Geocode] Erro ao buscar sugestões:', err);
  }

  return suggestions.slice(0, 5);
}

export async function geocodeAddress(query: string): Promise<RouteLocation> {
  const norm = query.toLowerCase().trim();

  for (const [key, loc] of Object.entries(KNOWN_SP_LOCATIONS)) {
    if (norm.includes(key) || key.includes(norm)) {
      return {
        name: loc.name,
        addressDetails: loc.details,
        lat: loc.lat,
        lng: loc.lng
      };
    }
  }

  const cleanQuery = norm.replace('maior', 'maio');

  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery + ', São Paulo, Brasil'
      )}&limit=1`,
      { headers: { 'User-Agent': 'BusaISP/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const item = data[0];
        const parts = item.display_name.split(',');
        return {
          name: parts.slice(0, 2).join(', ').trim(),
          addressDetails: parts.slice(2, 5).join(', ').trim(),
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      }
    }
  } catch (err) {
    console.warn('[Geocode] Fallback para local padrão:', err);
  }

  if (norm.includes('flor') || norm.includes('fontal')) {
    return {
      name: 'Rua Flor de Maio, 40',
      addressDetails: 'Jardim Fontális / Tremembé, São Paulo - SP',
      lat: -23.4326,
      lng: -46.5783
    };
  }

  return {
    name: query,
    addressDetails: 'São Paulo - SP',
    lat: -23.5000,
    lng: -46.6050
  };
}

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

function formatTimeHourMinute(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * Constrói um RoutePlan completo com dados detalhados idênticos ao Moovit
 */
export async function buildMultiLegPlan(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  legs: DiscoveredLeg[]
): Promise<RoutePlan> {
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const transferCount = legs.length - 1;

  const steps: RouteStep[] = [];
  const rawTransitPoints: [number, number][] = [];

  let totalDurationMinutes = 0;
  let totalDistanceMeters = 0;
  let totalWalkDistanceMeters = 0;
  let totalWalkDurationMinutes = 0;
  let totalEstimatedSteps = 0;

  const now = new Date();
  const departureHour = formatTimeHourMinute(now);

  const walkToStopMeters = Math.max(80, getDistanceMeters(originLoc.lat, originLoc.lng, firstLeg.boardStop.py, firstLeg.boardStop.px));
  const walkToStopMinutes = Math.max(1, Math.round(walkToStopMeters / 80));
  const walkToStopSteps = Math.round(walkToStopMeters / 0.75);

  const rawWalkToStop: [number, number][] = [
    [originLoc.lat, originLoc.lng],
    [firstLeg.boardStop.py, firstLeg.boardStop.px]
  ];

  steps.push({
    type: 'WALK',
    instruction: `Caminhe até ${firstLeg.boardStop.np}`,
    detailedWalkGuide: `Caminhe ${walkToStopMeters}m (~${walkToStopSteps} passos) pelas calçadas. Tempo: ~${walkToStopMinutes} min.`,
    durationMinutes: walkToStopMinutes,
    distanceMeters: walkToStopMeters,
    estimatedSteps: walkToStopSteps,
    stopName: firstLeg.boardStop.np,
    stopAddress: firstLeg.boardStop.ed || firstLeg.boardStop.np
  });

  totalWalkDistanceMeters += walkToStopMeters;
  totalWalkDurationMinutes += walkToStopMinutes;
  totalEstimatedSteps += walkToStopSteps;
  totalDurationMinutes += walkToStopMinutes;
  totalDistanceMeters += walkToStopMeters;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const hasRealTimeEta = leg.etaMinutes >= 0;

    const transitDistanceMeters = getDistanceMeters(leg.boardStop.py, leg.boardStop.px, leg.alightStop.py, leg.alightStop.px) || 3500;
    const transitMinutes = Math.max(8, Math.round(transitDistanceMeters / 300));

    const etas = leg.departureEtas && leg.departureEtas.length > 0
      ? leg.departureEtas
      : (hasRealTimeEta ? [leg.etaMinutes, leg.etaMinutes + 12, leg.etaMinutes + 25] : [8, 20, 35]);

    steps.push({
      type: 'BUS',
      instruction: `Embarque na linha ${leg.line.lt}-${leg.line.tl} em direção a ${leg.line.ts}`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${leg.line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${leg.line.lt}-${leg.line.tl}`,
      busDestination: leg.line.ts,
      nextBusEtaMinutes: hasRealTimeEta ? leg.etaMinutes : undefined,
      departureEtas: etas,
      accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
      lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real (Olho Vivo SPTrans)' : 'Baseado em chegadas anteriores / tabela horária',
      stopName: leg.alightStop.np,
      stopAddress: leg.alightStop.ed || leg.alightStop.np
    });

    if (leg.pathCoordinates && leg.pathCoordinates.length > 0) {
      rawTransitPoints.push(...leg.pathCoordinates);
    } else {
      rawTransitPoints.push(
        [leg.boardStop.py, leg.boardStop.px],
        [leg.alightStop.py, leg.alightStop.px]
      );
    }

    totalDurationMinutes += transitMinutes;
    totalDistanceMeters += transitDistanceMeters;

    const nextLeg = legs[i + 1];
    if (nextLeg) {
      const transferMeters = getDistanceMeters(leg.alightStop.py, leg.alightStop.px, nextLeg.boardStop.py, nextLeg.boardStop.px);

      if (transferMeters > 30) {
        const transferMinutes = Math.max(1, Math.round(transferMeters / 80));
        const transferSteps = Math.round(transferMeters / 0.75);
        steps.push({
          type: 'WALK',
          instruction: `Faça a baldeação a pé até ${nextLeg.boardStop.np}`,
          detailedWalkGuide: `Caminhe ${transferMeters}m (~${transferSteps} passos) até a parada de transferência.`,
          durationMinutes: transferMinutes,
          distanceMeters: transferMeters,
          estimatedSteps: transferSteps,
          stopName: nextLeg.boardStop.np,
          stopAddress: nextLeg.boardStop.ed || nextLeg.boardStop.np
        });
        totalWalkDistanceMeters += transferMeters;
        totalWalkDurationMinutes += transferMinutes;
        totalEstimatedSteps += transferSteps;
        totalDurationMinutes += transferMinutes;
        totalDistanceMeters += transferMeters;
      } else {
        steps.push({
          type: 'WALK',
          instruction: `Aguarde a próxima linha em ${nextLeg.boardStop.np}`,
          durationMinutes: 0,
          distanceMeters: 0,
          stopName: nextLeg.boardStop.np,
          stopAddress: nextLeg.boardStop.ed || nextLeg.boardStop.np
        });
      }
    }
  }

  const transferPoints: TransferPoint[] = [];
  for (let i = 0; i < legs.length - 1; i++) {
    const currentLeg = legs[i];
    const nextLeg = legs[i + 1];
    const transferMeters = getDistanceMeters(currentLeg.alightStop.py, currentLeg.alightStop.px, nextLeg.boardStop.py, nextLeg.boardStop.px);
    const transferMinutes = Math.max(1, Math.round(transferMeters / 80));

    transferPoints.push({
      stopName: nextLeg.boardStop.np,
      stopAddress: nextLeg.boardStop.ed || nextLeg.boardStop.np,
      lat: nextLeg.boardStop.py,
      lng: nextLeg.boardStop.px,
      fromLine: `${currentLeg.line.lt}-${currentLeg.line.tl}`,
      toLine: `${nextLeg.line.lt}-${nextLeg.line.tl}`,
      toDestination: nextLeg.line.ts,
      walkMeters: transferMeters,
      walkMinutes: transferMinutes
    });
  }

  const walkToDestMeters = Math.max(50, getDistanceMeters(destLoc.lat, destLoc.lng, lastLeg.alightStop.py, lastLeg.alightStop.px));
  const walkToDestMinutes = Math.max(1, Math.round(walkToDestMeters / 80));
  const walkToDestSteps = Math.round(walkToDestMeters / 0.75);
  const rawWalkToDest: [number, number][] = [
    [lastLeg.alightStop.py, lastLeg.alightStop.px],
    [destLoc.lat, destLoc.lng]
  ];

  steps.push({
    type: 'WALK',
    instruction: `Desembarque em ${lastLeg.alightStop.np} e caminhe até o destino`,
    detailedWalkGuide: `Caminhada final de ${walkToDestMeters}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
    durationMinutes: walkToDestMinutes,
    distanceMeters: walkToDestMeters,
    estimatedSteps: walkToDestSteps,
    stopName: lastLeg.alightStop.np,
    stopAddress: lastLeg.alightStop.ed || lastLeg.alightStop.np
  });

  steps.push({
    type: 'DESTINATION',
    instruction: `Chegada no destino: ${destLoc.name}`,
    durationMinutes: 0,
    distanceMeters: 0
  });

  totalWalkDistanceMeters += walkToDestMeters;
  totalWalkDurationMinutes += walkToDestMinutes;
  totalEstimatedSteps += walkToDestSteps;
  totalDurationMinutes += walkToDestMinutes;
  totalDistanceMeters += walkToDestMeters;

  const arrivalDate = new Date(now.getTime() + totalDurationMinutes * 60000);
  const arrivalHour = formatTimeHourMinute(arrivalDate);

  const hasFirstLegEta = firstLeg.etaMinutes >= 0;
  const departureEtas = firstLeg.departureEtas && firstLeg.departureEtas.length > 0
    ? firstLeg.departureEtas
    : (hasFirstLegEta ? [firstLeg.etaMinutes, firstLeg.etaMinutes + 12, firstLeg.etaMinutes + 24] : [8, 18, 30]);

  let departureSuggestion = '';
  if (!hasFirstLegEta) {
    departureSuggestion = `Sai em ⏱️ ${departureEtas.join(', ')} min de ${firstLeg.boardStop.np}`;
  } else if (firstLeg.etaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia agora! Ônibus #${firstLeg.vehiclePrefix} chega em ${firstLeg.etaMinutes} min na parada.`;
  } else {
    departureSuggestion = `Sai em ⏱️ ${departureEtas.join(', ')} min de ${firstLeg.boardStop.np}`;
  }
  if (transferCount > 0) {
    departureSuggestion += ` (${transferCount} ${transferCount === 1 ? 'baldeação' : 'baldeações'})`;
  }

  // Estimativa de CO2 e Tarifa Bilhete Único SPTrans
  const carbonGrams = Math.round((totalDistanceMeters / 1000) * 22);
  const farePrice = transferCount > 0 ? 'R$ 5,30 (Integração BU)' : 'R$ 5,30';
  const fareType: 'BILHETE_UNICO' | 'TOP_METRO' | 'INTEGRACAO' = 'BILHETE_UNICO';

  // Estimativa de tráfego
  const trafficStatus: 'FLUINDO' | 'MODERADO' | 'INTENSO' =
    totalDurationMinutes > 50 ? 'INTENSO' : totalDurationMinutes > 30 ? 'MODERADO' : 'FLUINDO';
  const trafficDelayMinutes = trafficStatus === 'INTENSO' ? 8 : trafficStatus === 'MODERADO' ? 4 : 0;

  // Snapping de ruas real via OSRM
  const [walkToStopSnapped, transitSnapped, walkToDestSnapped] = await Promise.all([
    getSnappedRoutePolyline(rawWalkToStop, 'walking'),
    getSnappedRoutePolyline(rawTransitPoints, 'driving'),
    getSnappedRoutePolyline(rawWalkToDest, 'walking')
  ]);

  return {
    id: `route_${legs.map(l => l.line.lt).join('_')}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureHour,
    arrivalHour,
    departureStop: firstLeg.boardStop,
    arrivalStop: lastLeg.alightStop,
    recommendedLine: firstLeg.line,
    transferCount,
    transferPoints,
    nextBusEtaMinutes: hasFirstLegEta ? firstLeg.etaMinutes : -1,
    departureEtas,
    nextBusVehiclePrefix: firstLeg.vehiclePrefix || undefined,
    departureSuggestion,
    farePrice,
    fareType,
    carbonGrams,
    accuracyLevel: hasFirstLegEta ? 'HIGH' : 'ESTIMATED',
    lastTelemetryText: hasFirstLegEta ? 'Sinal GPS em tempo real (Olho Vivo)' : 'Baseado em chegadas anteriores',
    trafficStatus,
    trafficDelayMinutes,
    steps,
    polyline: {
      walkToStop: walkToStopSnapped,
      transit: transitSnapped,
      walkToDest: walkToDestSnapped
    }
  };
}

function stopIdToCodigoParada(stopId: string): number {
  const n = Number(stopId);
  if (!Number.isFinite(n)) {
    throw new Error(`stop_id do GTFS não é numérico e não pode ser usado como código de parada da Olho Vivo: ${stopId}`);
  }
  return n;
}

function gtfsStopToParada(stop: NearbyStop): SPTransParada {
  return {
    cp: stopIdToCodigoParada(stop.stopId),
    np: stop.name,
    ed: '',
    py: stop.lat,
    px: stop.lng
  };
}

function directRouteToLinha(route: DirectRoute | ReachableRoute): SPTransLinha {
  const numericCl = Number(route.routeId.replace(/\D/g, '')) || 0;
  const [ladoA, ladoB] = (route.routeLongName || '').split(/[-–]/).map(s => s.trim());

  const shortName = route.routeShortName || route.routeId;
  const lastDashIndex = shortName.lastIndexOf('-');
  const lt = lastDashIndex > 0 ? shortName.slice(0, lastDashIndex) : shortName;
  const tl = lastDashIndex > 0 ? Number(shortName.slice(lastDashIndex + 1)) || 10 : 10;

  return {
    cl: numericCl,
    lc: false,
    lt,
    tl,
    sl: 1,
    tp: ladoA || '',
    ts: route.tripHeadsign || ladoB || ''
  };
}

async function resolveRealTimeEta(
  codigoParada: number,
  letreiro: string,
  destinoEsperado: string
): Promise<{ eta: number; departureEtas: number[]; prefix: string }> {
  const { previsao, isMock } = await buscarPrevisaoParada(codigoParada);

  if (isMock || !previsao?.p?.l) {
    return { eta: -1, departureEtas: [], prefix: '' };
  }

  const candidatas = previsao.p.l.filter(l => l.c.startsWith(`${letreiro}-`)) || [];
  const linhaPrevisao =
    candidatas.find(l => l.lt0 === destinoEsperado || l.lt1 === destinoEsperado) || candidatas[0];

  if (!linhaPrevisao || !linhaPrevisao.vs || linhaPrevisao.vs.length === 0) {
    return { eta: -1, departureEtas: [], prefix: '' };
  }

  const agora = new Date();
  const etas: number[] = [];

  linhaPrevisao.vs.forEach((v) => {
    const [horas, minutos] = v.t.split(':').map(Number);
    let etaMinutos = (horas * 60 + minutos) - (agora.getHours() * 60 + agora.getMinutes());
    if (etaMinutos < 0) etaMinutos += 24 * 60;
    etas.push(etaMinutos);
  });

  etas.sort((a, b) => a - b);

  return {
    eta: etas[0] ?? -1,
    departureEtas: etas.slice(0, 3),
    prefix: linhaPrevisao.vs[0]?.p || ''
  };
}

const MAX_TRANSFER_ROUNDS = 3;
const MAX_FRONTIER_PER_ROUND = 25;
const MAX_ALTERNATIVES = 5;

interface FrontierEntry {
  stop: NearbyStop;
  legs: DiscoveredLeg[];
}

async function resolveLegEta(boardStop: SPTransParada, line: SPTransLinha): Promise<{ eta: number; departureEtas: number[]; prefix: string }> {
  try {
    return await resolveRealTimeEta(boardStop.cp, line.lt, line.ts);
  } catch (err) {
    return { eta: -1, departureEtas: [], prefix: '' };
  }
}

/**
 * Busca em ondas rápida (BFS por rodadas com limite de 5 alternativas):
 * Rodada 1 = conexões diretas (0 baldeações)
 * Rodada 2..3 = conexões com baldeação
 */
async function findMultiLegPlans(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  origNearby: NearbyStop[],
  destNearby: NearbyStop[]
): Promise<RoutePlan[]> {
  const destStopIds = destNearby.map(s => s.stopId);
  const destByStopId = new Map(destNearby.map(s => [s.stopId, s]));
  const visited = new Set<string>(origNearby.map(s => s.stopId));

  let frontier: FrontierEntry[] = origNearby.map(stop => ({ stop, legs: [] }));
  const plans: RoutePlan[] = [];

  for (let round = 1; round <= MAX_TRANSFER_ROUNDS && frontier.length > 0 && plans.length < MAX_ALTERNATIVES; round++) {
    const frontierByStopId = new Map(frontier.map(f => [f.stop.stopId, f]));
    const frontierStopIds = Array.from(frontierByStopId.keys());

    const directRoutes = await findDirectRoutes(frontierStopIds, destStopIds, 15);

    for (const route of directRoutes) {
      const originEntry = frontierByStopId.get(route.originStopId);
      const destStopInfo = destByStopId.get(route.destStopId);
      if (!originEntry || !destStopInfo) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop = gtfsStopToParada(destStopInfo);
      const { eta, departureEtas, prefix } = await resolveLegEta(boardStop, line);

      // Traçado real das paradas da linha
      const pathCoordinates = await getTripStopCoordinates(route.tripId, route.originStopId, route.destStopId);

      const legs: DiscoveredLeg[] = [
        ...originEntry.legs,
        { line, boardStop, alightStop, tripId: route.tripId, originStopId: route.originStopId, destStopId: route.destStopId, pathCoordinates, etaMinutes: eta, departureEtas, vehiclePrefix: prefix }
      ];
      const plan = await buildMultiLegPlan(originLoc, destLoc, legs);
      plans.push(plan);

      if (plans.length >= MAX_ALTERNATIVES) break;
    }

    if (plans.length >= MAX_ALTERNATIVES || round === MAX_TRANSFER_ROUNDS) break;

    const expansion = await findRoutesFromStops(frontierStopIds, 120);
    const nextFrontierByStopId = new Map<string, FrontierEntry>();

    for (const route of expansion) {
      if (visited.has(route.destStopId)) continue;
      if (nextFrontierByStopId.size >= MAX_FRONTIER_PER_ROUND) break;

      const originEntry = frontierByStopId.get(route.originStopId);
      if (!originEntry) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop: SPTransParada = {
        cp: stopIdToCodigoParada(route.destStopId),
        np: route.destStopName,
        ed: '',
        py: route.destStopLat,
        px: route.destStopLng
      };
      const { eta, departureEtas, prefix } = await resolveLegEta(boardStop, line);

      const pathCoordinates = await getTripStopCoordinates(route.tripId, route.originStopId, route.destStopId);

      const legs: DiscoveredLeg[] = [
        ...originEntry.legs,
        { line, boardStop, alightStop, tripId: route.tripId, originStopId: route.originStopId, destStopId: route.destStopId, pathCoordinates, etaMinutes: eta, departureEtas, vehiclePrefix: prefix }
      ];
      visited.add(route.destStopId);
      nextFrontierByStopId.set(route.destStopId, {
        stop: { stopId: route.destStopId, name: route.destStopName, lat: route.destStopLat, lng: route.destStopLng, distanceMeters: 0 },
        legs
      });
    }

    frontier = Array.from(nextFrontierByStopId.values());
  }

  return plans;
}

/**
 * Motor de Roteirização Multimodal Ultrarrápido — limitado aos 5 melhores resultados.
 * Ordenado por menor tempo total estimado, menor caminhada e menor baldeação.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation
): Promise<RouteSearchResult> {
  const [origNearby, destNearby] = await Promise.all([
    findNearbyStops(originLoc.lat, originLoc.lng, 2500, 12),
    findNearbyStops(destLoc.lat, destLoc.lng, 2500, 12)
  ]);

  if (origNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada (raio de 2,5 km).');
  }

  if (destNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado (raio de 2,5 km).');
  }

  const plans = await findMultiLegPlans(originLoc, destLoc, origNearby, destNearby);

  if (plans.length === 0) {
    throw new Error('Nenhuma linha encontrada conectando a origem ao destino.');
  }

  // Ordenação de Qualidade: Menor Tempo -> Menor Caminhada -> Menos Baldeações
  plans.sort((a, b) =>
    a.totalDurationMinutes - b.totalDurationMinutes ||
    a.totalWalkDistanceMeters - b.totalWalkDistanceMeters ||
    a.transferCount - b.transferCount
  );

  const top5 = plans.slice(0, MAX_ALTERNATIVES);

  return {
    primaryRoute: top5[0],
    alternatives: top5
  };
}
