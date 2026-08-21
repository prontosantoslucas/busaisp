import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn()
  }
}));

import { supabase } from '@/lib/supabase';
import { findNearbyStops, findDirectRoutes } from '@/lib/gtfs';

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
      radius_meters: 600,
      max_results: 8
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
