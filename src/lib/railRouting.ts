/**
 * Roteirização por trilhos (Metrô/CPTM) com suporte a viagens diretas e baldeações
 * reais entre linhas da Rede Metropolitana de São Paulo.
 *
 * Utiliza o grafo de estações e estações de transferência (Sé, Luz, Paraíso, Ana Rosa,
 * Paulista/Consolação, República, Barra Funda, Brás, Pinheiros, Santo Amaro, Santa Cruz,
 * Chácara Klabin, Tamanduateí, Vila Prudente, Eng. Goulart, Tatuapé, Itaquera, etc.).
 */
import { SP_ALL_STATIONS, StationItem } from '@/lib/stationsData';
import { getSnappedRoutePolyline } from '@/lib/osrm';
import { getSaoPauloTime } from '@/lib/dateUtils';
import { getDistanceMeters } from '@/lib/geoUtils';
import type { RouteLocation, RoutePlan, RouteStep, TransferPoint } from '@/lib/routing';
import { SPTransLinha, SPTransParada } from '@/types/sptrans';

const WALK_TO_STATION_MAX_METERS = 2200;
const RAIL_AVG_SPEED_METERS_PER_MIN = 500; // ~30km/h médio real (Metrô/CPTM SP)
const TRANSFER_WALK_MINUTES = 4; // ~4 min médios de caminhada e troca de plataforma

function findNearbyStations(lat: number, lng: number, maxMeters: number) {
  return SP_ALL_STATIONS
    .filter((s) => s.type === 'METRO' || s.type === 'CPTM')
    .map((station) => ({ station, distanceMeters: getDistanceMeters(lat, lng, station.lat, station.lng) }))
    .filter((x) => x.distanceMeters <= maxMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);
}

function getLineSequence(lineCode: string): StationItem[] {
  return SP_ALL_STATIONS.filter((s) => s.lines.some((l) => l.code === lineCode));
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

interface DirectRailCandidate {
  type: 'DIRECT';
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
  totalMinutes: number;
}

interface TransferRailCandidate {
  type: 'TRANSFER';
  boardStation: StationItem;
  transferStation: StationItem;
  alightStation: StationItem;
  line1Code: string;
  line1Name: string;
  line2Code: string;
  line2Name: string;
  walkToStationMeters: number;
  walkToDestMeters: number;
  leg1StopCount: number;
  leg2StopCount: number;
  leg1RideDistanceMeters: number;
  leg2RideDistanceMeters: number;
  leg1Sequence: StationItem[];
  leg2Sequence: StationItem[];
  leg1BoardIndex: number;
  leg1AlightIndex: number;
  leg2BoardIndex: number;
  leg2AlightIndex: number;
  totalMinutes: number;
}

type RailCandidate = DirectRailCandidate | TransferRailCandidate;

/**
 * Monta um RoutePlan usando trilhos (Metrô/CPTM), com busca de rotas diretas
 * e rotas com 1 baldeação entre linhas metropolitanas.
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

  // 1. Buscar viagens DIRETAS (mesma linha)
  for (const o of nearOrigin) {
    for (const d of nearDest) {
      if (o.station.id === d.station.id) continue;
      for (const lineA of o.station.lines) {
        const lineB = d.station.lines.find((l) => l.code === lineA.code);
        if (!lineB) continue;

        const sequence = getLineSequence(lineA.code);
        const boardIndex = sequence.findIndex((s) => s.id === o.station.id);
        const alightIndex = sequence.findIndex((s) => s.id === d.station.id);
        if (boardIndex === -1 || alightIndex === -1 || boardIndex === alightIndex) continue;

        const rideDistanceMeters = getDistanceMeters(o.station.lat, o.station.lng, d.station.lat, d.station.lng);
        const rideMinutes = Math.max(3, Math.round(rideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
        const walkToStationMinutes = Math.max(1, Math.round(o.distanceMeters / 80));
        const walkToDestMinutes = Math.max(1, Math.round(d.distanceMeters / 80));
        const totalMinutes = walkToStationMinutes + rideMinutes + walkToDestMinutes;

        if (totalMinutes < bestTotalMinutes) {
          bestTotalMinutes = totalMinutes;
          best = {
            type: 'DIRECT',
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
            alightIndex,
            totalMinutes
          };
        }
      }
    }
  }

  // 2. Buscar viagens com 1 BALDEAÇÃO (Linha A -> Estação de Transferência -> Linha B)
  // Só busca baldeação se não houver rota direta ou para encontrar opção mais rápida
  const transferStations = SP_ALL_STATIONS.filter((s) => s.lines.length >= 2);

  for (const o of nearOrigin) {
    for (const d of nearDest) {
      if (o.station.id === d.station.id) continue;

      for (const lineA of o.station.lines) {
        for (const lineB of d.station.lines) {
          if (lineA.code === lineB.code) continue; // Direta já foi testada

          // Encontrar estações de baldeação que atendam lineA e lineB simultaneamente
          const junctions = transferStations.filter(
            (ts) => ts.lines.some((l) => l.code === lineA.code) && ts.lines.some((l) => l.code === lineB.code)
          );

          for (const junction of junctions) {
            if (junction.id === o.station.id || junction.id === d.station.id) continue;

            const seq1 = getLineSequence(lineA.code);
            const bIdx1 = seq1.findIndex((s) => s.id === o.station.id);
            const aIdx1 = seq1.findIndex((s) => s.id === junction.id);
            if (bIdx1 === -1 || aIdx1 === -1 || bIdx1 === aIdx1) continue;

            const seq2 = getLineSequence(lineB.code);
            const bIdx2 = seq2.findIndex((s) => s.id === junction.id);
            const aIdx2 = seq2.findIndex((s) => s.id === d.station.id);
            if (bIdx2 === -1 || aIdx2 === -1 || bIdx2 === aIdx2) continue;

            const dist1 = getDistanceMeters(o.station.lat, o.station.lng, junction.lat, junction.lng);
            const dist2 = getDistanceMeters(junction.lat, junction.lng, d.station.lat, d.station.lng);

            const ride1Minutes = Math.max(3, Math.round(dist1 / RAIL_AVG_SPEED_METERS_PER_MIN));
            const ride2Minutes = Math.max(3, Math.round(dist2 / RAIL_AVG_SPEED_METERS_PER_MIN));
            const walkToStationMinutes = Math.max(1, Math.round(o.distanceMeters / 80));
            const walkToDestMinutes = Math.max(1, Math.round(d.distanceMeters / 80));

            const totalMinutes =
              walkToStationMinutes + ride1Minutes + TRANSFER_WALK_MINUTES + ride2Minutes + walkToDestMinutes;

            // Priorizar rota com baldeação se for substancialmente melhor ou se não houver rota direta
            if (totalMinutes < bestTotalMinutes) {
              bestTotalMinutes = totalMinutes;
              best = {
                type: 'TRANSFER',
                boardStation: o.station,
                transferStation: junction,
                alightStation: d.station,
                line1Code: lineA.code,
                line1Name: lineA.name,
                line2Code: lineB.code,
                line2Name: lineB.name,
                walkToStationMeters: o.distanceMeters,
                walkToDestMeters: d.distanceMeters,
                leg1StopCount: Math.abs(aIdx1 - bIdx1),
                leg2StopCount: Math.abs(aIdx2 - bIdx2),
                leg1RideDistanceMeters: dist1,
                leg2RideDistanceMeters: dist2,
                leg1Sequence: seq1,
                leg2Sequence: seq2,
                leg1BoardIndex: bIdx1,
                leg1AlightIndex: aIdx1,
                leg2BoardIndex: bIdx2,
                leg2AlightIndex: aIdx2,
                totalMinutes
              };
            }
          }
        }
      }
    }
  }

  if (!best) return null;

  const now = new Date(Date.now() + targetOffsetMinutes * 60000);
  const departureHour = getSaoPauloTime(now).formatted;

  const walkToStationMinutes = Math.max(1, Math.round(best.walkToStationMeters / 80));
  const walkToStationSteps = Math.round(best.walkToStationMeters / 0.75);
  const walkToDestMinutes = Math.max(1, Math.round(best.walkToDestMeters / 80));
  const walkToDestSteps = Math.round(best.walkToDestMeters / 0.75);

  const totalWalkDistanceMeters = Math.round(best.walkToStationMeters + best.walkToDestMeters);
  const totalWalkDurationMinutes = walkToStationMinutes + walkToDestMinutes;
  const totalEstimatedSteps = walkToStationSteps + walkToDestSteps;

  const isSunday = getSaoPauloTime(now).isSunday;
  const farePrice = isSunday ? 'R$ 5,00 (Trilhos SP)' : 'R$ 5,00 (Metrô / CPTM)';

  if (best.type === 'DIRECT') {
    const rideMinutes = Math.max(3, Math.round(best.rideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
    const totalDurationMinutes = walkToStationMinutes + rideMinutes + walkToDestMinutes;
    const totalDistanceMeters = Math.round(best.walkToStationMeters + best.rideDistanceMeters + best.walkToDestMeters);

    const arrivalDate = new Date(now.getTime() + totalDurationMinutes * 60000);
    const arrivalHour = getSaoPauloTime(arrivalDate).formatted;

    const stationRange =
      best.boardIndex <= best.alightIndex
        ? best.sequence.slice(best.boardIndex, best.alightIndex + 1)
        : best.sequence.slice(best.alightIndex, best.boardIndex + 1).reverse();

    const boardParada = stationToParada(best.boardStation);
    const alightParada = stationToParada(best.alightStation);
    const intermediateStops = stationRange.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }));

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
        lastTelemetryText: 'Estimativa por distância real entre estações — intervalos regulares'
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

    const recommendedLine: SPTransLinha = {
      cl: 0,
      lc: false,
      lt: best.lineName,
      tl: 0,
      sl: 1,
      tp: best.boardStation.name,
      ts: best.alightStation.name
    };

    const rawTransit: [number, number][] = stationRange.map((s) => [s.lat, s.lng]);
    const [walkToStopSnapped, walkToDestSnapped] = await Promise.all([
      getSnappedRoutePolyline([[originLoc.lat, originLoc.lng], [best.boardStation.lat, best.boardStation.lng]], 'walking'),
      getSnappedRoutePolyline([[best.alightStation.lat, best.alightStation.lng], [destLoc.lat, destLoc.lng]], 'walking')
    ]);

    const carbonGrams = Math.round((totalDistanceMeters / 1000) * 10);

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
      transferPoints: [],
      allRouteStops: intermediateStops,
      nextBusEtaMinutes: -1,
      departureEtas: [],
      departureSuggestion: `Intervalo regular de trens no painel da estação ${best.boardStation.name}.`,
      farePrice,
      fareType: 'TOP_METRO',
      carbonGrams,
      accuracyLevel: 'ESTIMATED',
      lastTelemetryText: 'Estimativa por distância real entre estações',
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

  // Viagem com BALDEAÇÃO
  const ride1Minutes = Math.max(3, Math.round(best.leg1RideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
  const ride2Minutes = Math.max(3, Math.round(best.leg2RideDistanceMeters / RAIL_AVG_SPEED_METERS_PER_MIN));
  const totalDurationMinutes =
    walkToStationMinutes + ride1Minutes + TRANSFER_WALK_MINUTES + ride2Minutes + walkToDestMinutes;
  const totalDistanceMeters = Math.round(
    best.walkToStationMeters + best.leg1RideDistanceMeters + best.leg2RideDistanceMeters + best.walkToDestMeters
  );

  const arrivalDate = new Date(now.getTime() + totalDurationMinutes * 60000);
  const arrivalHour = getSaoPauloTime(arrivalDate).formatted;

  const leg1Range =
    best.leg1BoardIndex <= best.leg1AlightIndex
      ? best.leg1Sequence.slice(best.leg1BoardIndex, best.leg1AlightIndex + 1)
      : best.leg1Sequence.slice(best.leg1AlightIndex, best.leg1BoardIndex + 1).reverse();

  const leg2Range =
    best.leg2BoardIndex <= best.leg2AlightIndex
      ? best.leg2Sequence.slice(best.leg2BoardIndex, best.leg2AlightIndex + 1)
      : best.leg2Sequence.slice(best.leg2AlightIndex, best.leg2BoardIndex + 1).reverse();

  const boardParada = stationToParada(best.boardStation);
  const alightParada = stationToParada(best.alightStation);

  const allIntermediate = [
    ...leg1Range.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng })),
    ...leg2Range.slice(1).map((s) => ({ name: s.name, lat: s.lat, lng: s.lng }))
  ];

  const transferPoint: TransferPoint = {
    stopName: best.transferStation.name,
    stopAddress: best.transferStation.address,
    lat: best.transferStation.lat,
    lng: best.transferStation.lng,
    fromLine: best.line1Name,
    toLine: best.line2Name,
    toDestination: best.alightStation.name,
    walkMeters: 100,
    walkMinutes: TRANSFER_WALK_MINUTES
  };

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
      instruction: `Embarque na ${best.line1Name} em direção a ${best.transferStation.name}`,
      detailedWalkGuide: `Siga até ${best.transferStation.name} (${best.leg1StopCount} ${best.leg1StopCount === 1 ? 'estação' : 'estações'}) para baldeação.`,
      durationMinutes: ride1Minutes,
      distanceMeters: Math.round(best.leg1RideDistanceMeters),
      busLine: best.line1Name,
      busDestination: best.transferStation.name,
      boardStopName: best.boardStation.name,
      alightStopName: best.transferStation.name,
      stopCount: best.leg1StopCount,
      intermediateStops: leg1Range.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng })),
      stopName: best.transferStation.name,
      accuracyLevel: 'ESTIMATED'
    },
    {
      type: 'WALK',
      instruction: `Baldeação interna em ${best.transferStation.name} para ${best.line2Name}`,
      detailedWalkGuide: `Siga a sinalização interna para a plataforma da ${best.line2Name} (~${TRANSFER_WALK_MINUTES} min).`,
      durationMinutes: TRANSFER_WALK_MINUTES,
      distanceMeters: 100,
      stopName: best.transferStation.name,
      stopAddress: best.transferStation.address
    },
    {
      type: 'RAIL',
      instruction: `Embarque na ${best.line2Name} até ${best.alightStation.name}`,
      detailedWalkGuide: `Siga até ${best.alightStation.name} (${best.leg2StopCount} ${best.leg2StopCount === 1 ? 'estação' : 'estações'}).`,
      durationMinutes: ride2Minutes,
      distanceMeters: Math.round(best.leg2RideDistanceMeters),
      busLine: best.line2Name,
      busDestination: best.alightStation.name,
      boardStopName: best.transferStation.name,
      alightStopName: best.alightStation.name,
      stopCount: best.leg2StopCount,
      intermediateStops: leg2Range.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng })),
      stopName: best.alightStation.name,
      accuracyLevel: 'ESTIMATED'
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

  const recommendedLine: SPTransLinha = {
    cl: 0,
    lc: false,
    lt: `${best.line1Name} ➔ ${best.line2Name}`,
    tl: 0,
    sl: 1,
    tp: best.boardStation.name,
    ts: best.alightStation.name
  };

  const rawTransit: [number, number][] = [
    ...leg1Range.map((s): [number, number] => [s.lat, s.lng]),
    ...leg2Range.map((s): [number, number] => [s.lat, s.lng])
  ];

  const [walkToStopSnapped, walkToDestSnapped] = await Promise.all([
    getSnappedRoutePolyline([[originLoc.lat, originLoc.lng], [best.boardStation.lat, best.boardStation.lng]], 'walking'),
    getSnappedRoutePolyline([[best.alightStation.lat, best.alightStation.lng], [destLoc.lat, destLoc.lng]], 'walking')
  ]);

  const carbonGrams = Math.round((totalDistanceMeters / 1000) * 10);

  return {
    id: `route_rail_${best.line1Code}_${best.line2Code}_${Date.now()}`,
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
    transferCount: 1,
    transferPoints: [transferPoint],
    allRouteStops: allIntermediate,
    nextBusEtaMinutes: -1,
    departureEtas: [],
    departureSuggestion: `Baldeação na estação ${best.transferStation.name} (${best.line1Name} ➔ ${best.line2Name}).`,
    farePrice,
    fareType: 'TOP_METRO',
    carbonGrams,
    accuracyLevel: 'ESTIMATED',
    lastTelemetryText: `Integração de trilhos via ${best.transferStation.name}`,
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
