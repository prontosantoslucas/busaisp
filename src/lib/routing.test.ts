import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gtfs', () => ({
  findNearbyStops: vi.fn(),
  findDirectRoutes: vi.fn(),
  findRoutesFromStops: vi.fn(),
  getTripStopCoordinates: vi.fn()
}));

vi.mock('@/lib/sptrans', () => ({
  buscarPrevisaoParada: vi.fn()
}));

vi.mock('@/lib/osrm', () => ({
  getSnappedRoutePolyline: vi.fn().mockImplementation((pts) => Promise.resolve(pts))
}));

import { findNearbyStops, findDirectRoutes, findRoutesFromStops, getTripStopCoordinates } from '@/lib/gtfs';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { calculateRoute } from '@/lib/routing';

const origin = { name: 'Origem', lat: -23.43, lng: -46.58 };
const dest = { name: 'Destino', lat: -23.51, lng: -46.62 };

beforeEach(() => {
  vi.clearAllMocks();
  (findRoutesFromStops as any).mockResolvedValue([]);
  (getTripStopCoordinates as any).mockResolvedValue([]);
});

describe('calculateRoute', () => {
  it('lança erro claro quando não há paradas perto da origem', async () => {
    (findNearbyStops as any).mockResolvedValue([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma parada de ônibus encontrada');
  });

  it('lança erro claro quando não há linha conectando a origem ao destino', async () => {
    (findNearbyStops as any).mockImplementation((lat: number) => {
      if (lat < -23.45) {
        return Promise.resolve([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
      }
      return Promise.resolve([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }]);
    });
    (findDirectRoutes as any).mockResolvedValue([]);
    (findRoutesFromStops as any).mockResolvedValue([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma linha encontrada conectando a origem ao destino');
  });

  it('monta um plano de rota real usando paradas e linhas do GTFS, com previsão em tempo real', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353',
        originDepartureSeconds: 0,
        destStopId: '340015350',
        destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any).mockResolvedValueOnce({
      previsao: {
        hr: '10:00',
        p: {
          cp: 340015353,
          np: 'TERMINAL JD. FONTALIS',
          py: -23.4338,
          px: -46.5778,
          l: [
            {
              cl: 1703,
              c: '1703-10',
              sl: 1,
              lt0: 'SHOPPING CENTER NORTE',
              lt1: 'JD. FONTALIS',
              qv: 1,
              vs: [{ p: '21045', t: '10:05', a: true, ta: '10:00', py: -23.43, px: -46.58, destination: 'SHOPPING CENTER NORTE' }]
            }
          ]
        }
      },
      isMock: false
    });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.recommendedLine.lt).toBe('1703');
    expect(result.primaryRoute.departureStop.cp).toBe(340015353);
    expect(result.primaryRoute.arrivalStop.cp).toBe(340015350);
    expect(result.primaryRoute.transferCount).toBe(0);
    expect(result.alternatives).toHaveLength(1);
  });

  it('calcula rota com baldeação quando não há linha direta', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '100', name: 'PARADA INICIAL', lat: -23.43, lng: -46.58, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '300', name: 'PARADA FINAL', lat: -23.55, lng: -46.65, distanceMeters: 50 }]);
    
    // Rodada 1: sem rota direta entre 100 e 300
    (findDirectRoutes as any).mockResolvedValueOnce([]);

    // Expansão: linha 1 vai de 100 para parada intermediária 200
    (findRoutesFromStops as any).mockResolvedValueOnce([
      {
        routeId: '1000-10',
        routeShortName: '1000',
        routeLongName: 'INICIAL - INTERMEDIARIA',
        tripId: 't1',
        tripHeadsign: 'INTERMEDIARIA',
        originStopId: '100',
        originDepartureSeconds: 0,
        destStopId: '200',
        destStopName: 'PARADA INTERMEDIARIA',
        destStopLat: -23.48,
        destStopLng: -46.61,
        destArrivalSeconds: 600
      }
    ]);

    // Rodada 2: busca direta de 200 para 300 (encontra linha 2)
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '2000-10',
        routeShortName: '2000',
        routeLongName: 'INTERMEDIARIA - FINAL',
        tripId: 't2',
        tripHeadsign: 'FINAL',
        originStopId: '200',
        originDepartureSeconds: 0,
        destStopId: '300',
        destArrivalSeconds: 600
      }
    ]);

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.transferCount).toBe(1);
    expect(result.primaryRoute.steps.some(s => s.instruction.includes('Faça a baldeação') || s.instruction.includes('Aguarde a próxima linha'))).toBe(true);
    expect(result.primaryRoute.departureSuggestion).toContain('1 baldeação');
  });

  it('separa o número da linha do sub-código quando routeShortName vem no formato "NNNN-NN"', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '2012-10',
        routeShortName: '2012-10',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353',
        originDepartureSeconds: 0,
        destStopId: '340015350',
        destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any).mockResolvedValueOnce({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.recommendedLine.lt).toBe('2012');
    expect(result.primaryRoute.recommendedLine.tl).toBe(10);
  });

  it('lança erro claro quando um stop_id do GTFS não é numérico', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: 'nao-numerico', name: 'PARADA X', lat: -23.43, lng: -46.58, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'PARADA X - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: 'nao-numerico',
        originDepartureSeconds: 0,
        destStopId: '340015350',
        destArrivalSeconds: 0
      }
    ]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('não é numérico');
  });

  it('ordena as alternativas pela duração total quando há mais de uma linha', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([
        { stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 },
        { stopId: '999999999', name: 'PARADA MUITO DISTANTE', lat: -23.7, lng: -46.8, distanceMeters: 5000 }
      ]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10', routeShortName: '1703', routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1', tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353', originDepartureSeconds: 0, destStopId: '340015350', destArrivalSeconds: 0
      },
      {
        routeId: '1764-10', routeShortName: '1764', routeLongName: 'JD. CORISCO - PARADA MUITO DISTANTE',
        tripId: 'trip_2', tripHeadsign: 'PARADA MUITO DISTANTE',
        originStopId: '340015353', originDepartureSeconds: 0, destStopId: '999999999', destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.alternatives).toHaveLength(2);
    expect(result.primaryRoute.arrivalStop.cp).toBe(340015350);
    expect(result.primaryRoute.totalDurationMinutes).toBeLessThanOrEqual(result.alternatives[1].totalDurationMinutes);
  });

  it('mantém as demais alternativas quando a previsão em tempo real falha para uma delas', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10', routeShortName: '1703', routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1', tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353', originDepartureSeconds: 0, destStopId: '340015350', destArrivalSeconds: 0
      },
      {
        routeId: '1764-10', routeShortName: '1764', routeLongName: 'JD. CORISCO - METRO SANTANA',
        tripId: 'trip_2', tripHeadsign: 'METRO SANTANA',
        originStopId: '340015353', originDepartureSeconds: 0, destStopId: '340015350', destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any)
      .mockRejectedValueOnce(new Error('falha de rede simulada'))
      .mockResolvedValueOnce({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.alternatives).toHaveLength(2);
    expect(result.alternatives.every(plan => plan.nextBusEtaMinutes === -1)).toBe(true);
  });
});
