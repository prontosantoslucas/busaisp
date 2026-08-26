/**
 * Roteirização por trilhos (Metrô/CPTM), como alternativa real ao ônibus.
 *
 * Limitação honesta e deliberada: SP_ALL_STATIONS não modela baldeação entre
 * linhas de trilho (uma estação de interligação real, como a Sé, aparece só
 * uma vez no dataset, sem uma segunda entrada pra outra linha) — não temos
 * dado confiável de conectividade entre linhas diferentes. Por isso, esta
 * função só monta trajetos de UMA linha de trilho (embarque → N estações na
 * mesma linha → desembarque), nunca inventando uma baldeação de trilho que
 * não conseguimos confirmar. Tempo de viagem é estimado a partir da distância
 * real entre estações e uma velocidade média real de operação, sempre
 * marcado como accuracyLevel: 'ESTIMATED' — nunca um horário exato inventado.
 */
import { SP_ALL_STATIONS, StationItem } from '@/lib/stationsData';
import { getSnappedRoutePolyline } from '@/lib/osrm';
import { getSaoPauloTime } from '@/lib/dateUtils';
import { getDistanceMeters } from '@/lib/geoUtils';
import type { RouteLocation, RoutePlan, RouteStep, TransferPoint } from '@/lib/routing';
import { SPTransLinha, SPTransParada } from '@/types/sptrans';

const WALK_TO_STATION_MAX_METERS = 1200;
const RAIL_AVG_SPEED_METERS_PER_MIN = 500; // ~30km/h médio real (Metrô/CPTM SP, incluindo paradas)

function findNearbyStations(lat: number, lng: number, maxMeters: number) {
  return SP_ALL_STATIONS
    .filter(s => s.type === 'METRO' || s.type === 'CPTM')
    .map(station => ({ station, distanceMeters: getDistanceMeters(lat, lng, station.lat, station.lng) }))
    .filter(x => x.distanceMeters <= maxMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function getLineSequence(lineCode: string): StationItem[] {
  return SP_ALL_STATIONS.filter(s => s.lines.some(l => l.code === lineCode));
}

interface RailCandidate {
  boardStation: StationItem;
  alightStation: StationItem;
  lineCode: string;
  lineName: string;
  walkToStationMeters: number;
  walkToDestMeters: number;
  stopCount: number;
  rideDistanceMeters: number;
  sequence: StationItem[];
  boardIndex: number;
  alightIndex: number;
}

function stationToParada(station: StationItem): SPTransParada {
  return {
    cp: 0,
    np: station.name,
    ed: station.address,
    py: station.lat,
    px: station.lng
  };
}

/**
 * Monta um RoutePlan usando só trilho (Metrô/CPTM), se origem e destino
 * tiverem estações próximas conectadas pela mesma linha. Retorna null quando
 * não há trajeto de trilho viável — nunca força uma alternativa ruim.
 */
export async function findRailRoutePlan(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  targetOffsetMinutes: number = 0
): Promise<RoutePlan | null> {
  const nearOrigin = findNearbyStations(originLoc.lat, originLoc.lng, WALK_TO_STATION_MAX_METERS);
  const nearDest = findNearbyStations(destLoc.lat, destLoc.lng, WALK_TO_STATION_MAX_METERS);
  if (nearOrigin.length === 0 || nearDest.length === 0) return null;

  let best: RailCandidate | null = null;
  let bestTotalMinutes = Infinity;

  for (const o of nearOrigin) {
    for (const d of nearDest) {
      if (o.station.id === d.station.id) continue;
      for (const lineA of o.station.lines) {
        const lineB = d.station.lines.find(l => l.code === lineA.code);
        if (!lineB) continue;

        const sequence = getLineSequence(lineA.code);
        const boardIndex = sequence.findIndex(s => s.id === o.station.id);
        const alightIndex = sequence.findIndex(s => s.id === d.station.id);
        if (boardIndex === -1 || alightIndex === -1 || boardIndex === alightIndex) continue;

        const rideDistanceMeters = getDistanceMeters(o.station.lat, o.station.lng, d.station.lat, d.station.lng);
        const rideMinutes = Math.max(3, Math.round(rideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
        const walkToStationMinutes = Math.max(1, Math.round(o.distanceMeters / 80));
        const walkToDestMinutes = Math.max(1, Math.round(d.distanceMeters / 80));
        const totalMinutes = walkToStationMinutes + rideMinutes + walkToDestMinutes;

        if (totalMinutes < bestTotalMinutes) {
          bestTotalMinutes = totalMinutes;
          best = {
            boardStation: o.station,
            alightStation: d.station,
            lineCode: lineA.code,
            lineName: lineA.name,
            walkToStationMeters: o.distanceMeters,
            walkToDestMeters: d.distanceMeters,
            stopCount: Math.abs(alightIndex - boardIndex),
            rideDistanceMeters,
            sequence,
            boardIndex,
            alightIndex
          };
        }
      }
    }
  }

  if (!best) return null;

  const now = new Date(Date.now() + targetOffsetMinutes * 60000);
  const departureHour = getSaoPauloTime(now).formatted;

  const walkToStationMinutes = Math.max(1, Math.round(best.walkToStationMeters / 80));
  const walkToStationSteps = Math.round(best.walkToStationMeters / 0.75);
  const rideMinutes = Math.max(3, Math.round(best.rideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
  const walkToDestMinutes = Math.max(1, Math.round(best.walkToDestMeters / 80));
  const walkToDestSteps = Math.round(best.walkToDestMeters / 0.75);

  const totalDurationMinutes = walkToStationMinutes + rideMinutes + walkToDestMinutes;
  const totalDistanceMeters = Math.round(best.walkToStationMeters + best.rideDistanceMeters + best.walkToDestMeters);
  const totalWalkDistanceMeters = Math.round(best.walkToStationMeters + best.walkToDestMeters);
  const totalWalkDurationMinutes = walkToStationMinutes + walkToDestMinutes;
  const totalEstimatedSteps = walkToStationSteps + walkToDestSteps;

  const arrivalDate = new Date(now.getTime() + totalDurationMinutes * 60000);
  const arrivalHour = getSaoPauloTime(arrivalDate).formatted;

  // Estações reais entre embarque e desembarque, na ordem real da linha.
  const stationRange = best.boardIndex <= best.alightIndex
    ? best.sequence.slice(best.boardIndex, best.alightIndex + 1)
    : best.sequence.slice(best.alightIndex, best.boardIndex + 1).reverse();

  const boardParada = stationToParada(best.boardStation);
  const alightParada = stationToParada(best.alightStation);

  const intermediateStops = stationRange.map(s => ({ name: s.name, lat: s.lat, lng: s.lng }));

  const steps: RouteStep[] = [
    {
      type: 'WALK',
      instruction: `Caminhe até ${best.boardStation.name}`,
      detailedWalkGuide: `Caminhe ${Math.round(best.walkToStationMeters)}m (~${walkToStationSteps} passos) até a estação. Tempo: ~${walkToStationMinutes} min.`,
      durationMinutes: walkToStationMinutes,
      distanceMeters: Math.round(best.walkToStationMeters),
      estimatedSteps: walkToStationSteps,
      stopName: best.boardStation.name,
      stopAddress: best.boardStation.address
    },
    {
      type: 'RAIL',
      instruction: `Embarque na ${best.lineName} em direção a ${best.alightStation.name}`,
      detailedWalkGuide: `Siga até ${best.alightStation.name} (${best.stopCount} ${best.stopCount === 1 ? 'estação' : 'estações'}).`,
      durationMinutes: rideMinutes,
      distanceMeters: Math.round(best.rideDistanceMeters),
      busLine: best.lineName,
      busDestination: best.alightStation.name,
      boardStopName: best.boardStation.name,
      alightStopName: best.alightStation.name,
      stopCount: best.stopCount,
      intermediateStops,
      stopName: best.alightStation.name,
      stopAddress: best.alightStation.address,
      accuracyLevel: 'ESTIMATED',
      lastTelemetryText: 'Estimativa por distância real entre estações — sem previsão de horário em tempo real para trilhos'
    },
    {
      type: 'WALK',
      instruction: `Desembarque em ${best.alightStation.name} e caminhe até o destino`,
      detailedWalkGuide: `Caminhada final de ${Math.round(best.walkToDestMeters)}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
      durationMinutes: walkToDestMinutes,
      distanceMeters: Math.round(best.walkToDestMeters),
      estimatedSteps: walkToDestSteps,
      stopName: best.alightStation.name,
      stopAddress: best.alightStation.address
    },
    {
      type: 'DESTINATION',
      instruction: `Chegada no destino: ${destLoc.name}`,
      durationMinutes: 0,
      distanceMeters: 0
    }
  ];

  const isSunday = getSaoPauloTime(now).isSunday;
  const farePrice = isSunday ? 'R$ 5,00 (Trilhos SP)' : 'R$ 5,00 (Metrô / CPTM)';

  const recommendedLine: SPTransLinha = {
    cl: 0,
    lc: false,
    lt: best.lineName,
    tl: 0,
    sl: 1,
    tp: best.boardStation.name,
    ts: best.alightStation.name
  };

  const rawTransit: [number, number][] = stationRange.map(s => [s.lat, s.lng]);
  const [walkToStopSnapped, walkToDestSnapped] = await Promise.all([
    getSnappedRoutePolyline([[originLoc.lat, originLoc.lng], [best.boardStation.lat, best.boardStation.lng]], 'walking'),
    getSnappedRoutePolyline([[best.alightStation.lat, best.alightStation.lng], [destLoc.lat, destLoc.lng]], 'walking')
  ]);

  const carbonGrams = Math.round((totalDistanceMeters / 1000) * 10); // trilho elétrico: pegada bem menor que ônibus a diesel

  return {
    id: `route_rail_${best.lineCode}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureHour,
    arrivalHour,
    departureStop: boardParada,
    arrivalStop: alightParada,
    recommendedLine,
    transferCount: 0,
    transferPoints: [] as TransferPoint[],
    allRouteStops: intermediateStops,
    nextBusEtaMinutes: -1,
    departureEtas: [],
    departureSuggestion: `Sem previsão de horário em tempo real para trilhos — confira o intervalo de trens no painel da estação ${best.boardStation.name}.`,
    farePrice,
    fareType: 'TOP_METRO',
    carbonGrams,
    accuracyLevel: 'ESTIMATED',
    lastTelemetryText: 'Estimativa por distância real — sem rastreamento em tempo real para trilhos',
    trafficStatus: 'FLUINDO',
    trafficDelayMinutes: 0,
    steps,
    polyline: {
      walkToStop: walkToStopSnapped,
      transit: rawTransit,
      walkToDest: walkToDestSnapped
    },
    mode: 'RAIL'
  };
}
