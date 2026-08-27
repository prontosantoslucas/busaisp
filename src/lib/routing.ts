import { SPTransLinha, SPTransParada } from '@/types/sptrans';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import {
  findNearbyStops,
  findDirectRoutes,
  findRoutesFromStops,
  getTripDetailedStops,
  NearbyStop,
  DirectRoute,
  ReachableRoute
} from '@/lib/gtfs';
import { getSnappedRoutePolyline } from '@/lib/osrm';
import { formatSaoPauloTime, getSaoPauloTime, getDiffMinutesFromSaoPaulo } from '@/lib/dateUtils';
import { getDistanceMeters, distanceToPolylineMeters } from '@/lib/geoUtils';
import { findRailRoutePlan } from '@/lib/railRouting';
import { getLiveTrafficIncidents } from '@/lib/trafficService';
import { TrafficIncident } from '@/types/traffic';

export { getDistanceMeters, distanceToPolylineMeters };

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
  boardStopName?: string;
  alightStopName?: string;
  stopCount?: number;
  intermediateStops?: { name: string; lat: number; lng: number }[];
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
  allRouteStops: { name: string; lat: number; lng: number }[];
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
  incidentsOnRoute?: TrafficIncident[];
  steps: RouteStep[];
  polyline: {
    walkToStop: [number, number][];
    transit: [number, number][];
    walkToDest: [number, number][];
  };
  mode?: 'BUS' | 'RAIL';
  // Presente só em buscas "Chegar até": true quando nem saindo agora dá tempo de
  // chegar no horário desejado — o plano retornado é o de sair imediatamente mesmo
  // assim, nunca uma chegada forçada/inventada para bater o horário pedido.
  arrivalTimeUnreachable?: boolean;
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
  detailedStops?: { stopId: string; name: string; lat: number; lng: number; sequence: number }[];
  stopCount?: number;
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
  const seenNames = new Set<string>();

  for (const [key, loc] of Object.entries(KNOWN_SP_LOCATIONS)) {
    if (key.includes(norm) || norm.includes(key)) {
      if (!seenNames.has(loc.name.toLowerCase())) {
        seenNames.add(loc.name.toLowerCase());
        suggestions.push({
          name: loc.name,
          addressDetails: loc.details,
          lat: loc.lat,
          lng: loc.lng
        });
      }
    }
  }

  try {
    const cleanQuery = norm.replace('maior', 'maio');
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery + ', São Paulo, Brasil'
      )}&limit=5&addressdetails=1`,
      { headers: { 'User-Agent': 'BusaISP/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          const parts = item.display_name.split(',');
          const mainTitle = parts.slice(0, 2).join(', ').trim();
          const subDetails = parts.slice(2, 5).join(', ').trim();

          const lowerMain = mainTitle.toLowerCase();
          if (!seenNames.has(lowerMain) && !suggestions.some(s => Math.abs(s.lat - parseFloat(item.lat)) < 0.001 && Math.abs(s.lng - parseFloat(item.lon)) < 0.001)) {
            seenNames.add(lowerMain);
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

  if (norm.includes('local atual') || norm.includes('minha localiz') || norm === 'origem' || norm === '') {
    return {
      name: 'Minha Localização',
      addressDetails: 'Localização atual (São Paulo)',
      lat: -23.5158,
      lng: -46.6182
    };
  }

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

  if (norm.includes('flor') || norm.includes('fontal') || norm.includes('trememb')) {
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


/**
 * Constrói um RoutePlan completo com dados detalhados idênticos ao Moovit
 */
// Acima disso, uma "baldeação a pé" deixa de ser plausível — indica coordenadas
// inconsistentes entre consultas (ex.: a mesma parada com lat/lng ligeiramente
// diferente vinda de duas RPCs distintas), não uma baldeação real. Preferimos
// descartar o plano a mostrar um tempo de caminhada sem sentido (ex.: milhares
// de minutos).
const MAX_PLAUSIBLE_TRANSFER_WALK_METERS = 2500;

export async function buildMultiLegPlan(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  legs: DiscoveredLeg[],
  targetOffsetMinutes: number = 0
): Promise<RoutePlan | null> {
  for (let i = 0; i < legs.length - 1; i++) {
    const dist = getDistanceMeters(legs[i].alightStop.py, legs[i].alightStop.px, legs[i + 1].boardStop.py, legs[i + 1].boardStop.px);
    if (dist > MAX_PLAUSIBLE_TRANSFER_WALK_METERS) {
      return null;
    }
  }

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

  // Horário de referência do planejamento: "agora" por padrão, ou o horário futuro
  // escolhido pelo usuário (targetOffsetMinutes minutos a partir de agora), sempre no fuso de São Paulo.
  const now = new Date(Date.now() + targetOffsetMinutes * 60000);
  const departureHour = formatSaoPauloTime(now);

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
  totalDistanceMeters += walkToStopMeters;

  // Determinar o momento efetivo de partida considerando a caminhada até o ponto e os ETAs em tempo real
  let departureDelayMinutes = walkToStopMinutes;
  if (firstLeg.etaMinutes >= 0) {
    // Se o usuário precisa de walkToStopMinutes para caminhar até a parada,
    // o veículo viável deve ter ETA >= walkToStopMinutes - 1 (margem de tolerância).
    const viableEta = (firstLeg.departureEtas && firstLeg.departureEtas.length > 0)
      ? firstLeg.departureEtas.find(e => e >= Math.max(0, walkToStopMinutes - 1))
      : (firstLeg.etaMinutes >= Math.max(0, walkToStopMinutes - 1) ? firstLeg.etaMinutes : undefined);

    if (viableEta !== undefined) {
      // O usuário caminha walkToStopMinutes e aguarda até viableEta minutos a partir de agora
      departureDelayMinutes = viableEta;
    } else {
      // O primeiro veículo passaria antes do usuário chegar a pé; estima próximo ônibus em ~8 min após chegada
      departureDelayMinutes = walkToStopMinutes + 8;
    }
  } else {
    // Sem previsão em tempo real: estima espera média razoável de ~5 min no ponto
    departureDelayMinutes = walkToStopMinutes + 5;
  }

  // O tempo até o embarque real (caminhada + espera) entra na duração total
  totalDurationMinutes += departureDelayMinutes;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const hasRealTimeEta = leg.etaMinutes >= 0;

    const transitDistanceMeters = getDistanceMeters(leg.boardStop.py, leg.boardStop.px, leg.alightStop.py, leg.alightStop.px) || 3500;
    const transitMinutes = Math.max(8, Math.round(transitDistanceMeters / 300));

    const etas = leg.departureEtas && leg.departureEtas.length > 0
      ? leg.departureEtas
      : (hasRealTimeEta ? [leg.etaMinutes] : []);

    const stopCount = leg.stopCount || (leg.detailedStops && leg.detailedStops.length > 0 ? leg.detailedStops.length - 1 : undefined);
    const intermediateStops = leg.detailedStops ? leg.detailedStops.map(s => ({ name: s.name, lat: s.lat, lng: s.lng })) : [];

    steps.push({
      type: 'BUS',
      instruction: `Embarque na linha ${leg.line.lt}-${leg.line.tl} em direção a ${leg.line.ts}`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${leg.line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${leg.line.lt}-${leg.line.tl}`,
      busDestination: leg.line.ts,
      boardStopName: leg.boardStop.np,
      alightStopName: leg.alightStop.np,
      stopCount: stopCount,
      intermediateStops: intermediateStops,
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
  const arrivalHour = formatSaoPauloTime(arrivalDate);

  const hasFirstLegEta = firstLeg.etaMinutes >= 0;
  const departureEtas = firstLeg.departureEtas && firstLeg.departureEtas.length > 0
    ? firstLeg.departureEtas
    : (hasFirstLegEta ? [firstLeg.etaMinutes] : []);

  let departureSuggestion = '';
  if (!hasFirstLegEta) {
    departureSuggestion = `Sem previsão em tempo real para a linha ${firstLeg.line.lt} agora — confira o horário no ponto ${firstLeg.boardStop.np}.`;
  } else if (firstLeg.etaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia agora! Ônibus #${firstLeg.vehiclePrefix} chega em ${firstLeg.etaMinutes} min na parada.`;
  } else {
    departureSuggestion = `Sai em ⏱️ ${departureEtas.join(', ')} min de ${firstLeg.boardStop.np}`;
  }
  if (transferCount > 0) {
    departureSuggestion += ` (${transferCount} ${transferCount === 1 ? 'baldeação' : 'baldeações'})`;
  }

  // Estimativa de CO2
  const carbonGrams = Math.round((totalDistanceMeters / 1000) * 22);

  // Cálculo exato de tarifa conforme linhas e modais utilizados no fuso de SP
  const isSunday = getSaoPauloTime(now).isSunday;
  const isRailLine = (lineCode: string) => {
    const lc = lineCode.toLowerCase();
    return lc.includes('linha') || lc.includes('metro') || lc.includes('cptm');
  };

  const hasRail = legs.some(l => isRailLine(l.line.lt));
  const hasBus = legs.some(l => !isRailLine(l.line.lt));

  let farePrice = 'R$ 4,40';
  let fareType: 'BILHETE_UNICO' | 'TOP_METRO' | 'INTEGRACAO' = 'BILHETE_UNICO';

  if (isSunday && hasBus && !hasRail) {
    farePrice = 'Gratuito (Domingão Tarifa Zero)';
  } else if (hasBus && hasRail) {
    farePrice = isSunday ? 'R$ 5,00 (Trilhos SP)' : 'R$ 8,20 (Integração Ônibus + Metrô)';
    fareType = 'INTEGRACAO';
  } else if (hasRail && !hasBus) {
    farePrice = 'R$ 5,00 (Metrô / CPTM)';
    fareType = 'TOP_METRO';
  } else {
    // Linha municipal de ônibus SPTrans
    if (transferCount > 0) {
      farePrice = 'R$ 4,40 (Até 4 ônibus em 3h com Bilhete Único)';
    } else {
      const lineName = firstLeg.line.lt ? `Linha ${firstLeg.line.lt}` : 'SPTrans';
      farePrice = `R$ 4,40 (${lineName})`;
    }
  }

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

  const allRouteStops: { name: string; lat: number; lng: number }[] = [];
  legs.forEach((l) => {
    if (l.detailedStops && l.detailedStops.length > 0) {
      l.detailedStops.forEach((s) => allRouteStops.push({ name: s.name, lat: s.lat, lng: s.lng }));
    }
  });

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
    allRouteStops,
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
  destinoEsperado: string,
  targetOffsetMinutes: number = 0
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
  const etasComPrefixo: Array<{ etaMinutos: number; prefixo: string }> = [];

  linhaPrevisao.vs.forEach((v) => {
    const etaMinutos = getDiffMinutesFromSaoPaulo(v.t, agora);
    if (etaMinutos !== null) {
      etasComPrefixo.push({ etaMinutos, prefixo: v.p });
    }
  });

  etasComPrefixo.sort((a, b) => a.etaMinutos - b.etaMinutos);

  // Previsão em tempo real da SPTrans só existe pra ônibus já circulando — não dá
  // pra "prever" um horário futuro que ainda não tem veículo na rua. Quando o
  // usuário planeja saída num horário futuro, descartamos os veículos que chegam
  // ANTES desse horário (ele perderia esse ônibus) e usamos os que vêm depois.
  const relevantes = targetOffsetMinutes > 2
    ? etasComPrefixo.filter(e => e.etaMinutos >= targetOffsetMinutes - 2)
    : etasComPrefixo;

  const escolhidos = relevantes.length > 0 ? relevantes : etasComPrefixo;

  return {
    eta: escolhidos[0]?.etaMinutos ?? -1,
    departureEtas: escolhidos.slice(0, 3).map(e => e.etaMinutos),
    prefix: escolhidos[0]?.prefixo || ''
  };
}

const MAX_TRANSFER_ROUNDS = 4;
const MAX_FRONTIER_PER_ROUND = 40;
const MAX_ALTERNATIVES = 10;

interface FrontierEntry {
  stop: NearbyStop;
  legs: DiscoveredLeg[];
}

async function resolveLegEta(
  boardStop: SPTransParada,
  line: SPTransLinha,
  targetOffsetMinutes: number = 0
): Promise<{ eta: number; departureEtas: number[]; prefix: string }> {
  try {
    return await resolveRealTimeEta(boardStop.cp, line.lt, line.ts, targetOffsetMinutes);
  } catch (err) {
    return { eta: -1, departureEtas: [], prefix: '' };
  }
}

function isNightLine(lineCode: string): boolean {
  return lineCode.toUpperCase().startsWith('N');
}

/**
 * Busca em ondas inteligente:
 * Rodada 1 = conexões diretas (0 baldeações) - prioridade máxima
 * Rodada 2 = conexões com 1 baldeação (caso não haja direto ou para alternativas)
 */
async function findMultiLegPlans(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  origNearby: NearbyStop[],
  destNearby: NearbyStop[],
  targetOffsetMinutes: number = 0
): Promise<RoutePlan[]> {
  const destStopIds = destNearby.map(s => s.stopId);
  const destByStopId = new Map(destNearby.map(s => [s.stopId, s]));
  const visited = new Set<string>(origNearby.map(s => s.stopId));

  let frontier: FrontierEntry[] = origNearby.map(stop => ({ stop, legs: [] }));
  const plans: RoutePlan[] = [];

  // Madrugada é decidida pelo horário planejado da viagem no fuso de São Paulo, não pelo relógio real
  // no momento da busca — se o usuário vai saír de madrugada, linha noturna deve
  // aparecer; se vai saír de manhã, mesmo que a busca seja feita de madrugada, não.
  const targetDate = new Date(Date.now() + targetOffsetMinutes * 60000);
  const currentHour = getSaoPauloTime(targetDate).hours;
  const isNightTime = currentHour >= 0 && currentHour < 5;

  for (let round = 1; round <= MAX_TRANSFER_ROUNDS && frontier.length > 0 && plans.length < MAX_ALTERNATIVES; round++) {
    const frontierByStopId = new Map(frontier.map(f => [f.stop.stopId, f]));
    const frontierStopIds = Array.from(frontierByStopId.keys());

    const directRoutes = await findDirectRoutes(frontierStopIds, destStopIds, 40);

    // Ordenar directRoutes para preferir linhas diurnas se não for de madrugada
    directRoutes.sort((a, b) => {
      const aNight = isNightLine(a.routeShortName || a.routeId);
      const bNight = isNightLine(b.routeShortName || b.routeId);
      if (!isNightTime) {
        if (!aNight && bNight) return -1;
        if (aNight && !bNight) return 1;
      }
      return 0;
    });

    const seenDirectLineKeys = new Set<string>();
    const directCandidates: Array<{ route: DirectRoute; originEntry: FrontierEntry; destStopInfo: NearbyStop; line: SPTransLinha }> = [];
    for (const route of directRoutes) {
      const originEntry = frontierByStopId.get(route.originStopId);
      const destStopInfo = destByStopId.get(route.destStopId);
      if (!originEntry || !destStopInfo) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      // Linha noturna (prefixo "N") não circula fora do horário de madrugada — nunca
      // recomendar uma linha que o usuário não conseguiria de fato embarcar agora.
      if (!isNightTime && isNightLine(line.lt)) continue;

      // Desduplicação inteligente: evitar incluir dezenas de viagens repetidas da mesma linha.
      // Como frontierByStopId prioriza paradas mais próximas do usuário, a primeira ocorrência
      // de cada linha usará a melhor parada de embarque disponível.
      const lineKey = `${line.lt}-${line.tl}`;
      if (seenDirectLineKeys.has(lineKey) || seenDirectLineKeys.has(line.lt)) continue;
      seenDirectLineKeys.add(lineKey);
      seenDirectLineKeys.add(line.lt);

      directCandidates.push({ route, originEntry, destStopInfo, line });
      if (directCandidates.length >= MAX_ALTERNATIVES) break;
    }

    const newPlans = await Promise.all(
      directCandidates.map(async ({ route, originEntry, destStopInfo, line }) => {
        const boardStop = gtfsStopToParada(originEntry.stop);
        const alightStop = gtfsStopToParada(destStopInfo);

        const [{ eta, departureEtas, prefix }, tripStops] = await Promise.all([
          resolveLegEta(boardStop, line, targetOffsetMinutes),
          getTripDetailedStops(route.tripId, route.originStopId, route.destStopId)
        ]);

        const pathCoordinates: [number, number][] = tripStops.length > 0
          ? tripStops.map(s => [s.lat, s.lng])
          : [[boardStop.py, boardStop.px], [alightStop.py, alightStop.px]];

        const detailedStops = tripStops.length > 0
          ? tripStops.map((s, sIdx) => ({ stopId: s.stopId, name: s.name, lat: s.lat, lng: s.lng, sequence: sIdx + 1 }))
          : pathCoordinates.map((c, sIdx) => ({
              stopId: `${route.tripId}_${sIdx}`,
              name: sIdx === 0 ? boardStop.np : sIdx === pathCoordinates.length - 1 ? alightStop.np : 'Parada intermediária',
              lat: c[0],
              lng: c[1],
              sequence: sIdx + 1
            }));

        const legs: DiscoveredLeg[] = [
          ...originEntry.legs,
          { line, boardStop, alightStop, tripId: route.tripId, originStopId: route.originStopId, destStopId: route.destStopId, pathCoordinates, detailedStops, stopCount: Math.max(1, pathCoordinates.length - 1), etaMinutes: eta, departureEtas, vehiclePrefix: prefix }
        ];
        return buildMultiLegPlan(originLoc, destLoc, legs, targetOffsetMinutes);
      })
    );
    plans.push(...newPlans.filter((p): p is RoutePlan => p !== null));

    if (plans.length >= MAX_ALTERNATIVES || round === MAX_TRANSFER_ROUNDS) break;

    // Expandir a fronteira para a próxima rodada (busca por mais uma baldeação).
    // Sem limite artificial de número de trocas aqui — o loop de rodadas
    // (MAX_TRANSFER_ROUNDS) já limita a profundidade máxima com segurança.
    //
    // IMPORTANTE: 500 (não 120) porque em pontos com muita linha noturna passando
    // (ex.: terminais/corredores), as ~120 primeiras linhas retornadas pelo banco
    // podem ser inteiramente noturnas, escondendo linhas diurnas reais que só
    // aparecem mais abaixo na lista — o filtro de linha noturna então zera a
    // rodada inteira mesmo havendo conexão diurna genuína. 500 é o teto real
    // observado da função no banco (pedir mais não traz mais resultados).
    const expansion = await findRoutesFromStops(frontierStopIds, 500);
    const viableCandidates: Array<{
      route: ReachableRoute;
      originEntry: FrontierEntry;
      line: SPTransLinha;
      boardStop: SPTransParada;
      alightStop: SPTransParada;
      distAlightToDest: number;
    }> = [];

    for (const route of expansion) {
      if (visited.has(route.destStopId)) continue;

      const originEntry = frontierByStopId.get(route.originStopId);
      if (!originEntry) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      // Mesma regra da rodada de rotas diretas: não usar linha noturna como perna de
      // baldeação fora do horário em que ela realmente circula.
      if (!isNightTime && isNightLine(line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop: SPTransParada = {
        cp: stopIdToCodigoParada(route.destStopId),
        np: route.destStopName,
        ed: '',
        py: route.destStopLat,
        px: route.destStopLng
      };

      // Regra de sanidade: uma perna de baldeação não pode ser um pulo curtinho e inútil (< 400m).
      const legDistance = getDistanceMeters(boardStop.py, boardStop.px, alightStop.py, alightStop.px);
      if (legDistance < 400) continue;

      // Regra de progresso: a parada de descida precisa representar avanço real em direção ao destino.
      const distBoardToDest = getDistanceMeters(boardStop.py, boardStop.px, destLoc.lat, destLoc.lng);
      const distAlightToDest = getDistanceMeters(alightStop.py, alightStop.px, destLoc.lat, destLoc.lng);
      if (distAlightToDest >= distBoardToDest - 100) continue;

      viableCandidates.push({ route, originEntry, line, boardStop, alightStop, distAlightToDest });
    }

    // Priorizar a fronteira por proximidade real ao destino (busca gulosa), não pela
    // ordem arbitrária em que o banco devolve os resultados — sem isso, a busca podia
    // "andar" por centenas de paradas de SP sem nunca convergir para o corredor certo,
    // mesmo quando ele existe (paradas mais próximas do destino primeiro).
    viableCandidates.sort((a, b) => a.distAlightToDest - b.distAlightToDest);

    const expansionCandidates: typeof viableCandidates = [];
    for (const candidate of viableCandidates) {
      if (expansionCandidates.length >= MAX_FRONTIER_PER_ROUND) break;
      if (visited.has(candidate.route.destStopId)) continue;
      visited.add(candidate.route.destStopId);
      expansionCandidates.push(candidate);
    }

    const expandedEntries = await Promise.all(
      expansionCandidates.map(async ({ route, originEntry, line, boardStop, alightStop }) => {
        const [{ eta, departureEtas, prefix }, tripStops] = await Promise.all([
          resolveLegEta(boardStop, line, targetOffsetMinutes),
          getTripDetailedStops(route.tripId, route.originStopId, route.destStopId)
        ]);

        const pathCoordinates: [number, number][] = tripStops.length > 0
          ? tripStops.map(s => [s.lat, s.lng])
          : [[boardStop.py, boardStop.px], [alightStop.py, alightStop.px]];

        const detailedStops = tripStops.length > 0
          ? tripStops.map((s, sIdx) => ({ stopId: s.stopId, name: s.name, lat: s.lat, lng: s.lng, sequence: sIdx + 1 }))
          : pathCoordinates.map((c, sIdx) => ({
              stopId: `${route.tripId}_${sIdx}`,
              name: sIdx === 0 ? boardStop.np : sIdx === pathCoordinates.length - 1 ? alightStop.np : 'Parada intermediária',
              lat: c[0],
              lng: c[1],
              sequence: sIdx + 1
            }));

        const legs: DiscoveredLeg[] = [
          ...originEntry.legs,
          { line, boardStop, alightStop, tripId: route.tripId, originStopId: route.originStopId, destStopId: route.destStopId, pathCoordinates, detailedStops, stopCount: Math.max(1, pathCoordinates.length - 1), etaMinutes: eta, departureEtas, vehiclePrefix: prefix }
        ];

        const frontierEntry: FrontierEntry = {
          stop: { stopId: route.destStopId, name: route.destStopName, lat: route.destStopLat, lng: route.destStopLng, distanceMeters: 0 },
          legs
        };
        return { stopId: route.destStopId, entry: frontierEntry };
      })
    );

    const nextFrontierByStopId = new Map<string, FrontierEntry>();
    for (const { stopId, entry } of expandedEntries) {
      nextFrontierByStopId.set(stopId, entry);
    }

    frontier = Array.from(nextFrontierByStopId.values());
  }

  return plans;
}

/**
 * Motor de Roteirização Multimodal Inteligente — Priorização Absoluta de Rotas Diretas.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  targetOffsetMinutes: number = 0
): Promise<RouteSearchResult> {
  let [origNearby, destNearby] = await Promise.all([
    findNearbyStops(originLoc.lat, originLoc.lng, 2500, 15),
    findNearbyStops(destLoc.lat, destLoc.lng, 2500, 15)
  ]);

  if (origNearby.length === 0) {
    origNearby = await findNearbyStops(originLoc.lat, originLoc.lng, 4000, 25);
  }

  if (destNearby.length === 0) {
    destNearby = await findNearbyStops(destLoc.lat, destLoc.lng, 4000, 25);
  }

  // Busca trilho (Metrô/CPTM) e incidentes de trânsito em paralelo com ônibus
  const railPlanPromise = findRailRoutePlan(originLoc, destLoc, targetOffsetMinutes).catch((err) => {
    console.warn('[calculateRoute] Falha ao buscar rota de trilho:', err);
    return null;
  });

  const trafficIncidentsPromise = getLiveTrafficIncidents(
    (originLoc.lat + destLoc.lat) / 2,
    (originLoc.lng + destLoc.lng) / 2,
    25
  ).catch((err) => {
    console.warn('[calculateRoute] Falha ao buscar incidentes de trânsito:', err);
    return { incidents: [], summary: { total: 0, accidents: 0, police: 0, construction: 0, jams: 0, hazards: 0 }, lastUpdated: '' };
  });

  let plans: RoutePlan[] = [];

  if (origNearby.length > 0 && destNearby.length > 0) {
    plans = await findMultiLegPlans(originLoc, destLoc, origNearby, destNearby, targetOffsetMinutes);

    // Se não encontrar na primeira busca, tenta ampliar o raio e o limite de paradas
    if (plans.length === 0) {
      const [expandedOrig, expandedDest] = await Promise.all([
        findNearbyStops(originLoc.lat, originLoc.lng, 3500, 30),
        findNearbyStops(destLoc.lat, destLoc.lng, 3500, 30)
      ]);
      plans = await findMultiLegPlans(originLoc, destLoc, expandedOrig, expandedDest, targetOffsetMinutes);
    }
  }

  const [railPlan, trafficData] = await Promise.all([
    railPlanPromise,
    trafficIncidentsPromise
  ]);

  if (railPlan) plans.push(railPlan);

  // Aplicar impacto de incidentes de trânsito reais no trajeto ou próximo a ele
  const liveIncidents = trafficData?.incidents || [];
  if (liveIncidents.length > 0) {
    for (const plan of plans) {
      // Trilho (Metrô/CPTM) trafega em via segregada e não sofre interferência do tráfego de superfície
      if (plan.mode === 'RAIL') continue;

      const transitCoords = plan.polyline.transit;
      if (!transitCoords || transitCoords.length === 0) continue;

      const matchedIncidents = liveIncidents.filter((inc) => {
        const dist = distanceToPolylineMeters([inc.lat, inc.lng], transitCoords);
        return dist <= 350; // Ocorrência dentro de 350m do corredor de ônibus
      });

      if (matchedIncidents.length > 0) {
        let delayMinutes = 0;
        matchedIncidents.forEach((inc) => {
          if (typeof inc.delaySeconds === 'number' && inc.delaySeconds > 0) {
            delayMinutes += Math.round(inc.delaySeconds / 60);
          } else if (inc.severity === 'CRITICAL') {
            delayMinutes += 10;
          } else if (inc.severity === 'HIGH' || inc.type === 'ACCIDENT') {
            delayMinutes += 6;
          } else if (inc.severity === 'MEDIUM' || inc.type === 'JAM') {
            delayMinutes += 4;
          } else {
            delayMinutes += 2;
          }
        });

        const totalDelay = Math.min(25, Math.max(2, delayMinutes));
        plan.trafficDelayMinutes = totalDelay;
        plan.totalDurationMinutes += totalDelay;
        plan.trafficStatus = totalDelay >= 7 ? 'INTENSO' : 'MODERADO';
        plan.incidentsOnRoute = matchedIncidents;

        // Recalcular hora prevista de chegada com o atraso de trânsito considerado
        const refDate = new Date(Date.now() + targetOffsetMinutes * 60000);
        const arrivalDate = new Date(refDate.getTime() + plan.totalDurationMinutes * 60000);
        plan.arrivalHour = formatSaoPauloTime(arrivalDate);

        // Adicionar alerta na instrução do ônibus
        const busStep = plan.steps.find(s => s.type === 'BUS');
        if (busStep) {
          const incTitles = matchedIncidents.slice(0, 2).map(i => i.title).join(', ');
          busStep.detailedWalkGuide = `${busStep.detailedWalkGuide || ''} · ⚠️ Lentidão/Ocorrência na via (+${totalDelay} min): ${incTitles}`.trim();
        }
      }
    }
  }

  if (plans.length === 0) {
    if (origNearby.length === 0) {
      throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada.');
    }
    if (destNearby.length === 0) {
      throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado.');
    }
    throw new Error('Nenhuma linha encontrada conectando a origem ao destino.');
  }

  // Ordenação inteligente:
  // 1. Menor tempo total decorrido (espera real no ponto + caminhada + tempo no veículo).
  // 2. Se tempos forem semelhantes, priorizar o embarque mais próximo de onde o usuário já está (menor caminhada inicial).
  // 3. Menor distância total de caminhada.
  // 4. Menos baldeações (viagem direta é preferível a trocar de ônibus quando os tempos são equivalentes).
  plans.sort((a, b) => {
    if (a.totalDurationMinutes !== b.totalDurationMinutes) {
      return a.totalDurationMinutes - b.totalDurationMinutes;
    }
    const aWalkToStop = a.steps.find(s => s.type === 'WALK')?.distanceMeters || 0;
    const bWalkToStop = b.steps.find(s => s.type === 'WALK')?.distanceMeters || 0;
    if (aWalkToStop !== bWalkToStop) {
      return aWalkToStop - bWalkToStop;
    }
    if (a.totalWalkDistanceMeters !== b.totalWalkDistanceMeters) {
      return a.totalWalkDistanceMeters - b.totalWalkDistanceMeters;
    }
    return a.transferCount - b.transferCount;
  });

  // Garantir que a lista final não tenha planos redundantes
  const seenSignatures = new Set<string>();
  const uniquePlans: RoutePlan[] = [];
  for (const plan of plans) {
    const sig = `${plan.mode || 'BUS'}_${plan.recommendedLine.lt}_${plan.departureStop.cp}_${plan.arrivalStop.cp}_${plan.transferCount}`;
    if (!seenSignatures.has(sig)) {
      seenSignatures.add(sig);
      uniquePlans.push(plan);
    }
    if (uniquePlans.length >= MAX_ALTERNATIVES) break;
  }

  const finalPlans = uniquePlans.length > 0 ? uniquePlans : plans.slice(0, MAX_ALTERNATIVES);

  return {
    primaryRoute: finalPlans[0],
    alternatives: finalPlans
  };
}

/**
 * Calcula uma rota para CHEGAR até um horário desejado (em vez de partir num
 * horário). Faz duas buscas reais em vez de reaproveitar a rota de "agora" com o
 * horário só remarcado por conta — isso seria inventar, já que os ônibus
 * disponíveis, linhas noturnas e previsões reais mudam conforme o horário do dia:
 *
 * 1ª busca: calcula a rota partindo agora, só para estimar a duração real da viagem.
 * 2ª busca: usa essa duração pra decidir o horário de partida necessário, e
 *           RECALCULA a rota de verdade nesse horário (não reaproveita a 1ª).
 *
 * Se nem saindo agora dá tempo de chegar no horário pedido, retorna o plano de
 * sair imediatamente mesmo assim, com `arrivalTimeUnreachable: true` — nunca finge
 * uma chegada que não é fisicamente possível.
 */
export async function calculateRouteArrivingBy(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  desiredArrivalHHMM: string
): Promise<RouteSearchResult> {
  const parts = desiredArrivalHHMM.split(':').map(Number);
  if (parts.length !== 2 || parts.some(Number.isNaN)) {
    throw new Error('Horário de chegada inválido.');
  }
  const [desiredHours, desiredMinutes] = parts;

  const spNow = getSaoPauloTime();
  const nowMinutes = spNow.hours * 60 + spNow.minutes;
  const desiredArrivalMinutesTotal = desiredHours * 60 + desiredMinutes;
  let desiredArrivalOffsetMinutes = desiredArrivalMinutesTotal - nowMinutes;
  if (desiredArrivalOffsetMinutes < 0) desiredArrivalOffsetMinutes += 24 * 60;

  const baseline = await calculateRoute(originLoc, destLoc, 0);
  const estimatedDurationMinutes = baseline.primaryRoute.totalDurationMinutes;

  let departureOffsetMinutes = desiredArrivalOffsetMinutes - estimatedDurationMinutes;
  const isUnreachable = departureOffsetMinutes < 0;
  if (isUnreachable) departureOffsetMinutes = 0;

  const result = await calculateRoute(originLoc, destLoc, departureOffsetMinutes);

  if (isUnreachable) {
    result.primaryRoute.arrivalTimeUnreachable = true;
    result.alternatives.forEach((r) => { r.arrivalTimeUnreachable = true; });
  }

  return result;
}
