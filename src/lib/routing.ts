import { SPTransLinha, SPTransParada } from '@/types/sptrans';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { findNearbyStops, findDirectRoutes, findRoutesFromStops, NearbyStop, DirectRoute, ReachableRoute } from '@/lib/gtfs';

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
  nextBusEtaMinutes?: number;
  accuracyLevel?: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText?: string;
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
  departureStop: SPTransParada;
  arrivalStop: SPTransParada;
  recommendedLine: SPTransLinha;
  transferCount: number;
  nextBusEtaMinutes: number;
  nextBusVehiclePrefix?: string;
  departureSuggestion: string;
  accuracyLevel: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText: string;
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
  etaMinutes: number;
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

function generatePedestrianWaypoints(start: [number, number], end: [number, number]): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;

  return [
    [lat1, lng1],
    [lat1, (lng1 + lng2) / 2],
    [(lat1 + lat2) / 2, (lng1 + lng2) / 2],
    [lat2, (lng1 + lng2) / 2],
    [lat2, lng2]
  ];
}

/**
 * Constrói um RoutePlan completo a partir de uma ou mais pernas de ônibus já
 * resolvidas (parada de embarque, parada de desembarque, linha e previsão em
 * tempo real de cada perna). Uma viagem direta é apenas o caso de uma única
 * perna — sem baldeação, sem etapa de transferência entre pernas.
 */
export function buildMultiLegPlan(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  legs: DiscoveredLeg[]
): RoutePlan {
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const transferCount = legs.length - 1;

  const steps: RouteStep[] = [];
  const transitPolyline: [number, number][] = [];

  let totalDurationMinutes = 0;
  let totalDistanceMeters = 0;
  let totalWalkDistanceMeters = 0;
  let totalWalkDurationMinutes = 0;
  let totalEstimatedSteps = 0;

  const walkToStopMeters = Math.max(120, getDistanceMeters(originLoc.lat, originLoc.lng, firstLeg.boardStop.py, firstLeg.boardStop.px));
  const walkToStopMinutes = Math.max(2, Math.round(walkToStopMeters / 75));
  const walkToStopSteps = Math.round(walkToStopMeters / 0.75);
  const walkToStopPath = generatePedestrianWaypoints(
    [originLoc.lat, originLoc.lng],
    [firstLeg.boardStop.py, firstLeg.boardStop.px]
  );

  steps.push({
    type: 'WALK',
    instruction: `Caminhe a pé até ${firstLeg.boardStop.np}`,
    detailedWalkGuide: `Siga pelas calçadas por ${walkToStopMeters}m (~${walkToStopSteps} passos). Tempo estimado: ${walkToStopMinutes} min.`,
    durationMinutes: walkToStopMinutes,
    distanceMeters: walkToStopMeters,
    estimatedSteps: walkToStopSteps,
    stopName: firstLeg.boardStop.np
  });

  totalWalkDistanceMeters += walkToStopMeters;
  totalWalkDurationMinutes += walkToStopMinutes;
  totalEstimatedSteps += walkToStopSteps;
  totalDurationMinutes += walkToStopMinutes;
  totalDistanceMeters += walkToStopMeters;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const hasRealTimeEta = leg.etaMinutes >= 0;

    const transitDistanceMeters = getDistanceMeters(leg.boardStop.py, leg.boardStop.px, leg.alightStop.py, leg.alightStop.px) || 4500;
    const transitMinutes = Math.max(12, Math.round(transitDistanceMeters / 280));

    steps.push({
      type: 'BUS',
      instruction: `Embarque na linha ${leg.line.lt}-${leg.line.tl} (${leg.line.ts})`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${leg.line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${leg.line.lt}-${leg.line.tl}`,
      busDestination: leg.line.ts,
      nextBusEtaMinutes: hasRealTimeEta ? leg.etaMinutes : undefined,
      accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
      lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real' : 'Sem sinal GPS em tempo real disponível',
      stopName: leg.alightStop.np
    });

    const midLat1 = (leg.boardStop.py * 2 + leg.alightStop.py) / 3;
    const midLng1 = (leg.boardStop.px * 2 + leg.alightStop.px) / 3 + 0.003;
    const midLat2 = (leg.boardStop.py + leg.alightStop.py * 2) / 3;
    const midLng2 = (leg.boardStop.px + leg.alightStop.py * 2) / 3 - 0.002;
    transitPolyline.push(
      [leg.boardStop.py, leg.boardStop.px],
      [midLat1, midLng1],
      [midLat2, midLng2],
      [leg.alightStop.py, leg.alightStop.px]
    );

    totalDurationMinutes += transitMinutes;
    totalDistanceMeters += transitDistanceMeters;

    const nextLeg = legs[i + 1];
    if (nextLeg) {
      const transferMeters = getDistanceMeters(leg.alightStop.py, leg.alightStop.px, nextLeg.boardStop.py, nextLeg.boardStop.px);

      if (transferMeters > 30) {
        const transferMinutes = Math.max(1, Math.round(transferMeters / 75));
        const transferSteps = Math.round(transferMeters / 0.75);
        steps.push({
          type: 'WALK',
          instruction: `Faça a baldeação a pé até ${nextLeg.boardStop.np}`,
          detailedWalkGuide: `Caminhe ${transferMeters}m (~${transferSteps} passos) até o próximo ponto de embarque.`,
          durationMinutes: transferMinutes,
          distanceMeters: transferMeters,
          estimatedSteps: transferSteps,
          stopName: nextLeg.boardStop.np
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
          stopName: nextLeg.boardStop.np
        });
      }
    }
  }

  const walkToDestMeters = Math.max(80, getDistanceMeters(destLoc.lat, destLoc.lng, lastLeg.alightStop.py, lastLeg.alightStop.px));
  const walkToDestMinutes = Math.max(1, Math.round(walkToDestMeters / 75));
  const walkToDestSteps = Math.round(walkToDestMeters / 0.75);
  const walkToDestPath = generatePedestrianWaypoints(
    [lastLeg.alightStop.py, lastLeg.alightStop.px],
    [destLoc.lat, destLoc.lng]
  );

  steps.push({
    type: 'WALK',
    instruction: `Desembarque em ${lastLeg.alightStop.np} e caminhe a pé até o destino`,
    detailedWalkGuide: `Caminhada final de ${walkToDestMeters}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
    durationMinutes: walkToDestMinutes,
    distanceMeters: walkToDestMeters,
    estimatedSteps: walkToDestSteps,
    stopName: lastLeg.alightStop.np
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

  const hasFirstLegEta = firstLeg.etaMinutes >= 0;

  let departureSuggestion = '';
  if (!hasFirstLegEta) {
    departureSuggestion = `🚶 Caminhe até ${firstLeg.boardStop.np} (${walkToStopMinutes} min). Sem previsão em tempo real para a linha ${firstLeg.line.lt} agora — confira o horário no ponto.`;
  } else if (firstLeg.etaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia a pé agora! Você leva ${walkToStopMinutes} min até o ponto e o ônibus #${firstLeg.vehiclePrefix} chega em ${firstLeg.etaMinutes} min.`;
  } else {
    const waitTime = firstLeg.etaMinutes - walkToStopMinutes;
    departureSuggestion = `🚶 Saia a pé em ~${waitTime} min para chegar ao ponto exatamente quando o ônibus #${firstLeg.vehiclePrefix} estiver se aproximando.`;
  }
  if (transferCount > 0) {
    departureSuggestion += ` Essa viagem tem ${transferCount} ${transferCount === 1 ? 'baldeação' : 'baldeações'}.`;
  }

  return {
    id: `route_${legs.map(l => l.line.lt).join('_')}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureStop: firstLeg.boardStop,
    arrivalStop: lastLeg.alightStop,
    recommendedLine: firstLeg.line,
    transferCount,
    nextBusEtaMinutes: hasFirstLegEta ? firstLeg.etaMinutes : -1,
    nextBusVehiclePrefix: firstLeg.vehiclePrefix || undefined,
    departureSuggestion,
    accuracyLevel: hasFirstLegEta ? 'HIGH' : 'ESTIMATED',
    lastTelemetryText: hasFirstLegEta ? 'Sinal GPS em tempo real (Alta Precisão)' : 'Sem sinal GPS em tempo real disponível para esta linha',
    steps,
    polyline: {
      walkToStop: walkToStopPath,
      transit: transitPolyline,
      walkToDest: walkToDestPath
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
): Promise<{ eta: number; prefix: string }> {
  const { previsao, isMock } = await buscarPrevisaoParada(codigoParada);

  if (isMock) {
    return { eta: -1, prefix: '' };
  }

  const candidatas = previsao?.p?.l.filter(l => l.c.startsWith(`${letreiro}-`)) || [];
  const linhaPrevisao =
    candidatas.find(l => l.lt0 === destinoEsperado || l.lt1 === destinoEsperado) || candidatas[0];
  const proximoVeiculo = linhaPrevisao?.vs[0];

  if (!proximoVeiculo) {
    return { eta: -1, prefix: '' };
  }

  const [horas, minutos] = proximoVeiculo.t.split(':').map(Number);
  const agora = new Date();
  let etaMinutos = (horas * 60 + minutos) - (agora.getHours() * 60 + agora.getMinutes());
  if (etaMinutos < 0) etaMinutos += 24 * 60;

  return { eta: etaMinutos, prefix: proximoVeiculo.p };
}

const MAX_TRANSFER_ROUNDS = 4;
const MAX_FRONTIER_PER_ROUND = 40;
const MAX_ALTERNATIVES = 10;

interface FrontierEntry {
  stop: NearbyStop;
  legs: DiscoveredLeg[];
}

async function resolveLegEta(boardStop: SPTransParada, line: SPTransLinha): Promise<{ eta: number; prefix: string }> {
  try {
    return await resolveRealTimeEta(boardStop.cp, line.lt, line.ts);
  } catch (err) {
    console.warn(`[Routing] Falha ao buscar previsão em tempo real para a linha ${line.lt}:`, err);
    return { eta: -1, prefix: '' };
  }
}

/**
 * Busca em ondas (BFS por rodadas):
 * Rodada 1 = conexões diretas (0 baldeações)
 * Rodada 2..4 = expande a fronteira de paradas e testa conexão direta com o destino (1+ baldeações)
 * Resultados ordenados por tempo total primeiro, depois por distância a pé, depois por baldeações.
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

    const directRoutes = await findDirectRoutes(frontierStopIds, destStopIds, 20);

    for (const route of directRoutes) {
      const originEntry = frontierByStopId.get(route.originStopId);
      const destStopInfo = destByStopId.get(route.destStopId);
      if (!originEntry || !destStopInfo) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop = gtfsStopToParada(destStopInfo);
      const { eta, prefix } = await resolveLegEta(boardStop, line);

      const legs: DiscoveredLeg[] = [...originEntry.legs, { line, boardStop, alightStop, etaMinutes: eta, vehiclePrefix: prefix }];
      plans.push(buildMultiLegPlan(originLoc, destLoc, legs));

      if (plans.length >= MAX_ALTERNATIVES) break;
    }

    if (plans.length >= MAX_ALTERNATIVES || round === MAX_TRANSFER_ROUNDS) break;

    const expansion = await findRoutesFromStops(frontierStopIds, 300);
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
      const { eta, prefix } = await resolveLegEta(boardStop, line);

      const legs: DiscoveredLeg[] = [...originEntry.legs, { line, boardStop, alightStop, etaMinutes: eta, vehiclePrefix: prefix }];
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
 * Motor de Roteirização Multimodal — busca paradas e linhas reais (GTFS)
 * perto da origem e do destino com raio de 2,5km, incluindo viagens com baldeação.
 * Ordenado por tempo total estimado primeiro, depois distância a pé, depois baldeações.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation
): Promise<RouteSearchResult> {
  const origNearby = await findNearbyStops(originLoc.lat, originLoc.lng, 2500, 15);
  if (origNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada (raio de 2,5 km).');
  }

  const destNearby = await findNearbyStops(destLoc.lat, destLoc.lng, 2500, 15);
  if (destNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado (raio de 2,5 km).');
  }

  const plans = await findMultiLegPlans(originLoc, destLoc, origNearby, destNearby);

  if (plans.length === 0) {
    throw new Error('Nenhuma linha encontrada conectando a origem ao destino, mesmo considerando baldeações.');
  }

  // Ordenação: Tempo Total -> Distância a Pé -> Baldeações
  plans.sort((a, b) =>
    a.totalDurationMinutes - b.totalDurationMinutes ||
    a.totalWalkDistanceMeters - b.totalWalkDistanceMeters ||
    a.transferCount - b.transferCount
  );

  return {
    primaryRoute: plans[0],
    alternatives: plans
  };
}
