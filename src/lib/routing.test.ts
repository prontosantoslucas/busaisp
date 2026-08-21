import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gtfs', () => ({
  findNearbyStops: vi.fn(),
  findDirectRoutes: vi.fn()
}));

vi.mock('@/lib/sptrans', () => ({
  buscarPrevisaoParada: vi.fn()
}));

import { findNearbyStops, findDirectRoutes } from '@/lib/gtfs';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { calculateRoute } from '@/lib/routing';

const origin = { name: 'Origem', lat: -23.43, lng: -46.58 };
const dest = { name: 'Destino', lat: -23.51, lng: -46.62 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calculateRoute', () => {
  it('lança erro claro quando não há paradas perto da origem', async () => {
    (findNearbyStops as any).mockResolvedValueOnce([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma parada de ônibus encontrada perto da origem');
  });

  it('lança erro claro quando não há linha direta entre origem e destino', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma linha direta encontrada');
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

    // O ETA exato depende do relógio no momento do teste (comparado com "10:05" fixo),
    // então não é verificado aqui — só o encadeamento correto dos dados reais.
    expect(result.primaryRoute.recommendedLine.lt).toBe('1703');
    expect(result.primaryRoute.departureStop.cp).toBe(340015353);
    expect(result.primaryRoute.arrivalStop.cp).toBe(340015350);
    expect(result.alternatives).toHaveLength(1);
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

  it('ordena as alternativas pela duração total quando há mais de uma linha direta', async () => {
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
    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.alternatives).toHaveLength(2);
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
