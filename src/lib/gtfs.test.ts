import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn()
  }
}));

import { supabase } from '@/lib/supabase';
import { findNearbyStops, findDirectRoutes, findRoutesFromStops, getTripStopCoordinates } from '@/lib/gtfs';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('findNearbyStops', () => {
  it('calls the nearby_stops RPC with the right parameters and maps the rows', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [
        { stop_id: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distance_meters: 120.5 }
      ],
      error: null
    });

    const result = await findNearbyStops(-23.5158, -46.6182);

    expect(supabase.rpc).toHaveBeenCalledWith('nearby_stops', {
      in_lat: -23.5158,
      in_lng: -46.6182,
      radius_meters: 2500,
      max_results: 12
    });
    expect(result).toEqual([
      { stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 120.5 }
    ]);
  });

  it('throws a clear error when the RPC call fails', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'relation does not exist' } });

    await expect(findNearbyStops(-23.5, -46.6)).rejects.toThrow('Falha ao buscar paradas próximas');
  });
});

describe('findDirectRoutes', () => {
  it('calls the direct_routes_between RPC and maps the rows', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [
        {
          route_id: '1703-10',
          route_short_name: '1703',
          route_long_name: 'JD. FONTALIS - SHOPPING CENTER NORTE',
          trip_id: 'trip_1',
          trip_headsign: 'SHOPPING CENTER NORTE',
          origin_stop_id: 'A',
          origin_departure_seconds: 3600,
          dest_stop_id: 'B',
          dest_arrival_seconds: 4500
        }
      ],
      error: null
    });

    const result = await findDirectRoutes(['A'], ['B']);

    expect(result).toEqual([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: 'A',
        originDepartureSeconds: 3600,
        destStopId: 'B',
        destArrivalSeconds: 4500
      }
    ]);
  });

  it('throws a clear error when the RPC call fails', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'function not found' } });

    await expect(findDirectRoutes(['A'], ['B'])).rejects.toThrow('Falha ao buscar linhas diretas');
  });
});

describe('findRoutesFromStops', () => {
  it('calls the routes_from_stops RPC and maps the rows', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [
        {
          route_id: '1703-10',
          route_short_name: '1703-10',
          route_long_name: 'JD. FONTALIS - SHOPPING CENTER NORTE',
          trip_id: 'trip_1',
          trip_headsign: 'SHOPPING CENTER NORTE',
          origin_stop_id: 'A',
          origin_departure_seconds: 100,
          dest_stop_id: 'B',
          dest_stop_name: 'PARADA B',
          dest_stop_lat: -23.5,
          dest_stop_lng: -46.6,
          dest_arrival_seconds: 200
        }
      ],
      error: null
    });

    const result = await findRoutesFromStops(['A']);

    expect(supabase.rpc).toHaveBeenCalledWith('routes_from_stops', {
      origin_stop_ids: ['A'],
      max_results: 120
    });
    expect(result).toEqual([
      {
        routeId: '1703-10',
        routeShortName: '1703-10',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: 'A',
        originDepartureSeconds: 100,
        destStopId: 'B',
        destStopName: 'PARADA B',
        destStopLat: -23.5,
        destStopLng: -46.6,
        destArrivalSeconds: 200
      }
    ]);
  });

  it('throws a clear error when the RPC call fails', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'function not found' } });

    await expect(findRoutesFromStops(['A'])).rejects.toThrow('Falha ao buscar linhas alcançáveis');
  });
});

describe('getTripStopCoordinates', () => {
  it('queries stop times and returns lat/lng coordinates', async () => {
    const mockOrder = vi.fn().mockResolvedValue({
      data: [
        { stop_sequence: 1, stop_id: 'A', gtfs_stops: { lat: -23.4, lng: -46.5 } },
        { stop_sequence: 2, stop_id: 'B', gtfs_stops: { lat: -23.5, lng: -46.6 } }
      ],
      error: null
    });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (supabase.from as any).mockReturnValue({ select: mockSelect });

    const coords = await getTripStopCoordinates('trip_1', 'A', 'B');
    expect(coords).toEqual([
      [-23.4, -46.5],
      [-23.5, -46.6]
    ]);
  });
});
