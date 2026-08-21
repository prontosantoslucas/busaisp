import { SPTransLinha, SPTransParada } from '@/types/sptrans';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { findNearbyStops, findDirectRoutes, NearbyStop, DirectRoute } from '@/lib/gtfs';

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
 * Cria um plano de rota específico para uma linha de ônibus candidata
 */
function buildPlanForLine(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  line: SPTransLinha,
  origStop: SPTransParada,
  destStop: SPTransParada,
  busEtaMinutes: number,
  vehiclePrefix: string
): RoutePlan {
  const hasRealTimeEta = busEtaMinutes >= 0;

  const walkToStopMeters = Math.max(120, getDistanceMeters(originLoc.lat, originLoc.lng, origStop.py, origStop.px));
  const walkToStopMinutes = Math.max(2, Math.round(walkToStopMeters / 75));
  const walkToStopSteps = Math.round(walkToStopMeters / 0.75);

  const transitDistanceMeters = getDistanceMeters(origStop.py, origStop.px, destStop.py, destStop.px) || 4500;
  const transitMinutes = Math.max(12, Math.round(transitDistanceMeters / 280));

  const walkToDestMeters = Math.max(80, getDistanceMeters(destLoc.lat, destLoc.lng, destStop.py, destStop.px));
  const walkToDestMinutes = Math.max(1, Math.round(walkToDestMeters / 75));
  const walkToDestSteps = Math.round(walkToDestMeters / 0.75);

  const totalWalkDistanceMeters = walkToStopMeters + walkToDestMeters;
  const totalWalkDurationMinutes = walkToStopMinutes + walkToDestMinutes;
  const totalEstimatedSteps = walkToStopSteps + walkToDestSteps;

  const totalDurationMinutes = hasRealTimeEta
    ? walkToStopMinutes + Math.max(0, busEtaMinutes - walkToStopMinutes) + transitMinutes + walkToDestMinutes
    : walkToStopMinutes + transitMinutes + walkToDestMinutes;
  const totalDistanceMeters = walkToStopMeters + transitDistanceMeters + walkToDestMeters;

  let departureSuggestion = '';
  if (!hasRealTimeEta) {
    departureSuggestion = `🚶 Caminhe até ${origStop.np} (${walkToStopMinutes} min). Sem previsão em tempo real para a linha ${line.lt} agora — confira o horário no ponto.`;
  } else if (busEtaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia a pé agora! Você leva ${walkToStopMinutes} min até o ponto e o ônibus #${vehiclePrefix} chega em ${busEtaMinutes} min.`;
  } else {
    const waitTime = busEtaMinutes - walkToStopMinutes;
    departureSuggestion = `🚶 Saia a pé em ~${waitTime} min para chegar ao ponto exatamente quando o ônibus #${vehiclePrefix} estiver se aproximando.`;
  }

  const walkToStopPath = generatePedestrianWaypoints(
    [originLoc.lat, originLoc.lng],
    [origStop.py, origStop.px]
  );

  const midLat1 = (origStop.py * 2 + destStop.py) / 3;
  const midLng1 = (origStop.px * 2 + destStop.px) / 3 + 0.003;
  const midLat2 = (origStop.py + destStop.py * 2) / 3;
  const midLng2 = (origStop.px + destStop.py * 2) / 3 - 0.002;

  const transitPath: [number, number][] = [
    [origStop.py, origStop.px],
    [midLat1, midLng1],
    [midLat2, midLng2],
    [destStop.py, destStop.px]
  ];

  const walkToDestPath = generatePedestrianWaypoints(
    [destStop.py, destStop.px],
    [destLoc.lat, destLoc.lng]
  );

  const steps: RouteStep[] = [
    {
      type: 'WALK',
      instruction: `Caminhe a pé até ${origStop.np}`,
      detailedWalkGuide: `Siga pelas calçadas por ${walkToStopMeters}m (~${walkToStopSteps} passos). Tempo estimado: ${walkToStopMinutes} min.`,
      durationMinutes: walkToStopMinutes,
      distanceMeters: walkToStopMeters,
      estimatedSteps: walkToStopSteps,
      stopName: origStop.np
    },
    {
      type: 'BUS',
      instruction: `Embarque na linha ${line.lt}-${line.tl} (${line.ts})`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${line.lt}-${line.tl}`,
      busDestination: line.ts,
      nextBusEtaMinutes: hasRealTimeEta ? busEtaMinutes : undefined,
      accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
      lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real' : 'Sem sinal GPS em tempo real disponível'
    },
    {
      type: 'WALK',
      instruction: `Desembarque em ${destStop.np} e caminhe a pé até o destino`,
      detailedWalkGuide: `Caminhada final de ${walkToDestMeters}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
      durationMinutes: walkToDestMinutes,
      distanceMeters: walkToDestMeters,
      estimatedSteps: walkToDestSteps,
      stopName: destStop.np
    },
    {
      type: 'DESTINATION',
      instruction: `Chegada no destino: ${destLoc.name}`,
      durationMinutes: 0,
      distanceMeters: 0
    }
  ];

  return {
    id: `route_${line.lt}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureStop: origStop,
    arrivalStop: destStop,
    recommendedLine: line,
    nextBusEtaMinutes: hasRealTimeEta ? busEtaMinutes : -1,
    nextBusVehiclePrefix: vehiclePrefix || undefined,
    departureSuggestion,
    accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
    lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real (Alta Precisão)' : 'Sem sinal GPS em tempo real disponível para esta linha',
    steps,
    polyline: {
      walkToStop: walkToStopPath,
      transit: transitPath,
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

function directRouteToLinha(route: DirectRoute): SPTransLinha {
  const numericCl = Number(route.routeId.replace(/\D/g, '')) || 0;
  const [ladoA, ladoB] = (route.routeLongName || '').split(/[-–]/).map(s => s.trim());

  return {
    cl: numericCl,
    lc: false,
    lt: route.routeShortName || route.routeId,
    tl: 10,
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

/**
 * Motor de Roteirização Multimodal — busca paradas e linhas reais (GTFS)
 * perto da origem e do destino. Apenas viagens diretas (sem baldeação);
 * rotas com troca de ônibus ficam para uma fase futura do roteiro.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation
): Promise<RouteSearchResult> {
  const origNearby = await findNearbyStops(originLoc.lat, originLoc.lng);
  if (origNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada.');
  }

  const destNearby = await findNearbyStops(destLoc.lat, destLoc.lng);
  if (destNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado.');
  }

  const directRoutes = await findDirectRoutes(
    origNearby.map(s => s.stopId),
    destNearby.map(s => s.stopId)
  );

  if (directRoutes.length === 0) {
    throw new Error('Nenhuma linha direta encontrada conectando a origem ao destino. Rotas com baldeação ainda não são suportadas.');
  }

  const stopById = new Map<string, NearbyStop>(
    [...origNearby, ...destNearby].map(stop => [stop.stopId, stop])
  );

  const plans = await Promise.all(
    directRoutes.map(async (route) => {
      const origStopInfo = stopById.get(route.originStopId);
      const destStopInfo = stopById.get(route.destStopId);
      if (!origStopInfo || !destStopInfo) return null;

      const origStop = gtfsStopToParada(origStopInfo);
      const destStop = gtfsStopToParada(destStopInfo);
      const line = directRouteToLinha(route);

      let eta = -1;
      let prefix = '';
      try {
        const resolved = await resolveRealTimeEta(origStop.cp, line.lt, line.ts);
        eta = resolved.eta;
        prefix = resolved.prefix;
      } catch (err) {
        console.warn(`[Routing] Falha ao buscar previsão em tempo real para a linha ${line.lt}:`, err);
      }

      return buildPlanForLine(originLoc, destLoc, line, origStop, destStop, eta, prefix);
    })
  );

  const validPlans = plans.filter((plan): plan is RoutePlan => plan !== null);
  validPlans.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);

  return {
    primaryRoute: validPlans[0],
    alternatives: validPlans
  };
}
