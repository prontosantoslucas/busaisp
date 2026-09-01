import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gtfs', () => ({
  findNearbyStops: vi.fn(),
  findDirectRoutes: vi.fn(),
  findRoutesFromStops: vi.fn(),
  getTripStopCoordinates: vi.fn(),
  getTripDetailedStops: vi.fn()
}));

vi.mock('@/lib/sptrans', () => ({
  buscarPrevisaoParada: vi.fn()
}));

vi.mock('@/lib/osrm', () => ({
  getSnappedRoutePolyline: vi.fn().mockImplementation((pts) => Promise.resolve(pts))
}));

vi.mock('@/lib/trafficService', () => ({
  getLiveTrafficIncidents: vi.fn().mockResolvedValue({
    incidents: [],
    summary: { total: 0, accidents: 0, police: 0, construction: 0, jams: 0, hazards: 0 },
    lastUpdated: ''
  })
}));

import { findNearbyStops, findDirectRoutes, findRoutesFromStops, getTripDetailedStops } from '@/lib/gtfs';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { getLiveTrafficIncidents } from '@/lib/trafficService';
import { calculateRoute } from '@/lib/routing';

const origin = { name: 'Origem', lat: -23.43, lng: -46.58 };
const dest = { name: 'Destino', lat: -23.51, lng: -46.62 };

beforeEach(() => {
  vi.clearAllMocks();
  (findRoutesFromStops as any).mockResolvedValue([]);
  (getTripDetailedStops as any).mockResolvedValue([]);
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
    // Só uma linha encontrada no total -> zero alternativas de verdade além da
    // primária (antes o bug duplicava primaryRoute dentro de alternatives).
    expect(result.alternatives).toHaveLength(0);
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

    // 2 linhas encontradas -> primaryRoute (a mais rápida) + 1 alternativa
    // real (antes o bug incluía a própria primaryRoute de novo em alternatives[0]).
    expect(result.alternatives).toHaveLength(1);
    expect(result.primaryRoute.arrivalStop.cp).toBe(340015350);
    expect(result.primaryRoute.totalDurationMinutes).toBeLessThanOrEqual(result.alternatives[0].totalDurationMinutes);
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

    expect(result.alternatives).toHaveLength(1);
    expect(result.primaryRoute.nextBusEtaMinutes).toBe(-1);
    expect(result.alternatives.every(plan => plan.nextBusEtaMinutes === -1)).toBe(true);
  });

  it('descarta previsão de veículo desatualizada em vez de "virar" um horário absurdo no futuro', async () => {
    vi.useFakeTimers();
    // "Agora" = 16:12. Previsão do veículo é 13:00 (já passou há 3h12 —
    // dado desatualizado da SPTrans), não "amanhã às 13:00".
    vi.setSystemTime(new Date(2026, 7, 24, 16, 12, 0));

    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10', routeShortName: '1703', routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1', tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353', originDepartureSeconds: 0, destStopId: '340015350', destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any).mockResolvedValueOnce({
      previsao: {
        hr: '16:12',
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
              vs: [{ p: '21045', t: '13:00', a: true, ta: '13:00', py: -23.43, px: -46.58, destination: 'SHOPPING CENTER NORTE' }]
            }
          ]
        }
      },
      isMock: false
    });

    const result = await calculateRoute(origin, dest);

    // Sem previsão utilizável (a única disponível foi descartada por estar
    // no passado) — nunca deve virar "em 1268 min" ou qualquer outro número
    // inventado no futuro distante.
    expect(result.primaryRoute.nextBusEtaMinutes).toBe(-1);
    expect(result.primaryRoute.departureEtas).toEqual([]);

    vi.useRealTimers();
  });

  it('calcula departureHour, arrivalHour e ETA no fuso de São Paulo mesmo quando o servidor está em UTC', async () => {
    // Simula 18:43 UTC = 15:43 em São Paulo
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-26T18:43:00Z'));

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
        hr: '15:43',
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
              vs: [{ p: '21045', t: '15:50', a: true, ta: '15:43', py: -23.43, px: -46.58, destination: 'SHOPPING CENTER NORTE' }]
            }
          ]
        }
      },
      isMock: false
    });

    const result = await calculateRoute(origin, dest);

    // Deve ser 15:43 no fuso de SP, NÃO 18:43 (UTC)
    expect(result.primaryRoute.departureHour).toBe('15:43');
    // Previsão do ônibus das 15:50 em relação a 15:43 = 7 min
    expect(result.primaryRoute.nextBusEtaMinutes).toBe(7);
    expect(result.primaryRoute.departureEtas).toEqual([7]);

    vi.useRealTimers();
  });

  it('desduplica múltiplas viagens da mesma linha retornando apenas uma opção por linha distinta', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '101', name: 'PARADA PERTO', lat: -23.43, lng: -46.58, distanceMeters: 30 }])
      .mockResolvedValueOnce([{ stopId: '201', name: 'PARADA DESTINO', lat: -23.51, lng: -46.62, distanceMeters: 40 }]);

    // Banco devolve 5 trips da MESMA linha 175T e 1 trip da linha 172N
    (findDirectRoutes as any).mockResolvedValueOnce([
      { routeId: '175T-10', routeShortName: '175T', routeLongName: 'TREMEMBE - METRO SANTANA', tripId: 't1', tripHeadsign: 'METRO SANTANA', originStopId: '101', originDepartureSeconds: 100, destStopId: '201', destArrivalSeconds: 800 },
      { routeId: '175T-10', routeShortName: '175T', routeLongName: 'TREMEMBE - METRO SANTANA', tripId: 't2', tripHeadsign: 'METRO SANTANA', originStopId: '101', originDepartureSeconds: 200, destStopId: '201', destArrivalSeconds: 900 },
      { routeId: '175T-10', routeShortName: '175T', routeLongName: 'TREMEMBE - METRO SANTANA', tripId: 't3', tripHeadsign: 'METRO SANTANA', originStopId: '101', originDepartureSeconds: 300, destStopId: '201', destArrivalSeconds: 1000 },
      { routeId: '175T-10', routeShortName: '175T', routeLongName: 'TREMEMBE - METRO SANTANA', tripId: 't4', tripHeadsign: 'METRO SANTANA', originStopId: '101', originDepartureSeconds: 400, destStopId: '201', destArrivalSeconds: 1100 },
      { routeId: '172N-10', routeShortName: '172N', routeLongName: 'SHOPPING CENTER NORTE - METRO BELÉM', tripId: 't5', tripHeadsign: 'METRO BELÉM', originStopId: '101', originDepartureSeconds: 150, destStopId: '201', destArrivalSeconds: 850 }
    ]);

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    // Deve retornar 2 opções distintas (175T e 172N), não 5 cópias de 175T —
    // uma delas é primaryRoute, a outra a única alternativa real (não checa
    // qual das duas vira primária, só que as duas aparecem e sem duplicata).
    expect(result.alternatives).toHaveLength(1);
    const allLineNames = [result.primaryRoute, ...result.alternatives].map(a => a.recommendedLine.lt);
    expect(allLineNames).toContain('175T');
    expect(allLineNames).toContain('172N');
    expect(new Set(allLineNames).size).toBe(2);
  });

  it('prioriza linha no ponto onde o usuário já está em vez de mandar andar desnecessariamente', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([
        { stopId: '101', name: 'PARADA ONDE ESTOU (10m)', lat: -23.4300, lng: -46.5800, distanceMeters: 10 },
        { stopId: '102', name: 'PARADA DISTANTE (400m)', lat: -23.4340, lng: -46.5830, distanceMeters: 400 }
      ])
      .mockResolvedValueOnce([
        { stopId: '201', name: 'PARADA DESTINO', lat: -23.5100, lng: -46.6200, distanceMeters: 50 }
      ]);

    (findDirectRoutes as any).mockResolvedValueOnce([
      // Linha A sai do ponto onde o usuário já está (101)
      { routeId: '1000-10', routeShortName: '1000', routeLongName: 'PONTO ATUAL - DESTINO', tripId: 't1', tripHeadsign: 'DESTINO', originStopId: '101', originDepartureSeconds: 0, destStopId: '201', destArrivalSeconds: 1200 },
      // Linha B sai de uma parada mais distante (102)
      { routeId: '2000-10', routeShortName: '2000', routeLongName: 'PONTO DISTANTE - DESTINO', tripId: 't2', tripHeadsign: 'DESTINO', originStopId: '102', originDepartureSeconds: 0, destStopId: '201', destArrivalSeconds: 1100 }
    ]);

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    // Ambas as opções devem estar presentes, mas a linha que sai de onde o usuário está deve ser a primeira
    expect(result.alternatives).toHaveLength(1);
    expect(result.primaryRoute.recommendedLine.lt).toBe('1000');
    expect(result.primaryRoute.departureStop.cp).toBe(101);
    expect(result.alternatives[0].recommendedLine.lt).toBe('2000');
  });

  it('usa a parada mais próxima do usuário pra uma linha, mesmo se o banco devolver a parada distante primeiro', async () => {
    // Reproduz o bug real relatado: o usuário está numa parada (10m) que já
    // tem a linha 1703 passando, mas direct_routes_between() ordena por
    // departure_time_seconds (campo sem relação com distância/relevância) —
    // então uma viagem da MESMA linha embarcando numa parada bem mais longe
    // (900m) pode aparecer primeiro na resposta do banco. Sem ordenar por
    // distância antes de desduplicar por linha, o algoritmo ancorava a linha
    // 1703 na parada errada (mais longe), fazendo o app pedir pra andar até
    // ali em vez de embarcar onde o usuário já estava.
    (findNearbyStops as any)
      .mockResolvedValueOnce([
        { stopId: '900', name: 'PARADA LONGE (900m)', lat: -23.4380, lng: -46.5850, distanceMeters: 900 },
        { stopId: '101', name: 'PARADA ONDE ESTOU (10m)', lat: -23.4300, lng: -46.5800, distanceMeters: 10 }
      ])
      .mockResolvedValueOnce([
        { stopId: '201', name: 'PARADA DESTINO', lat: -23.5100, lng: -46.6200, distanceMeters: 50 }
      ]);

    (findDirectRoutes as any).mockResolvedValueOnce([
      // direct_routes_between() devolve a viagem da parada DISTANTE primeiro
      // (departure_time_seconds menor não tem nada a ver com proximidade).
      { routeId: '1703-10', routeShortName: '1703', routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE', tripId: 't1', tripHeadsign: 'SHOPPING CENTER NORTE', originStopId: '900', originDepartureSeconds: 100, destStopId: '201', destArrivalSeconds: 900 },
      { routeId: '1703-10', routeShortName: '1703', routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE', tripId: 't2', tripHeadsign: 'SHOPPING CENTER NORTE', originStopId: '101', originDepartureSeconds: 500, destStopId: '201', destArrivalSeconds: 1300 }
    ]);

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.recommendedLine.lt).toBe('1703');
    expect(result.primaryRoute.departureStop.cp).toBe(101);
  });

  it('considera problemas e incidentes de trânsito no trajeto adicionando atraso na duração e hora de chegada', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '101', name: 'PARADA INICIAL', lat: -23.43, lng: -46.58, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '201', name: 'PARADA FINAL', lat: -23.51, lng: -46.62, distanceMeters: 50 }]);

    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'JD. FONTALIS - CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'CENTER NORTE',
        originStopId: '101',
        originDepartureSeconds: 0,
        destStopId: '201',
        destArrivalSeconds: 0
      }
    ]);

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    // Simula um acidente crítico no meio do trajeto (-23.47, -46.60)
    (getLiveTrafficIncidents as any).mockResolvedValueOnce({
      incidents: [
        {
          id: 'inc_1',
          type: 'ACCIDENT',
          title: 'Acidente grave na Av. General Ataliba Leonel',
          description: 'Bloqueio parcial de faixa',
          street: 'Av. General Ataliba Leonel',
          neighborhood: 'Santana',
          lat: -23.47,
          lng: -46.60,
          severity: 'CRITICAL',
          delaySeconds: 600, // 10 minutos
          source: 'TOMTOM',
          updatedAt: '12:00'
        }
      ],
      summary: { total: 1, accidents: 1, police: 0, construction: 0, jams: 0, hazards: 0 },
      lastUpdated: '12:00'
    });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.trafficDelayMinutes).toBeGreaterThan(0);
    expect(result.primaryRoute.trafficStatus).toBe('INTENSO');
    expect(result.primaryRoute.incidentsOnRoute).toBeDefined();
    expect(result.primaryRoute.incidentsOnRoute?.length).toBe(1);
    expect(result.primaryRoute.incidentsOnRoute?.[0].title).toContain('Acidente');
  });
});
