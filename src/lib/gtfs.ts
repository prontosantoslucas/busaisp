import { supabase } from '@/lib/supabase';

export interface NearbyStop {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
  distanceMeters: number;
}

export async function findNearbyStops(
  lat: number,
  lng: number,
  radiusMeters = 2500,
  maxResults = 12
): Promise<NearbyStop[]> {
  const { data, error } = await supabase.rpc('nearby_stops', {
    in_lat: lat,
    in_lng: lng,
    radius_meters: radiusMeters,
    max_results: maxResults
  });

  if (error) {
    throw new Error(`Falha ao buscar paradas próximas: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    stopId: row.stop_id,
    name: row.name,
    lat: row.lat,
    lng: row.lng,
    distanceMeters: row.distance_meters
  }));
}

export interface DirectRoute {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  tripId: string;
  tripHeadsign: string | null;
  originStopId: string;
  originDepartureSeconds: number;
  destStopId: string;
  destArrivalSeconds: number;
}

export async function findDirectRoutes(
  originStopIds: string[],
  destStopIds: string[],
  maxResults = 15
): Promise<DirectRoute[]> {
  const { data, error } = await supabase.rpc('direct_routes_between', {
    origin_stop_ids: originStopIds,
    dest_stop_ids: destStopIds,
    max_results: maxResults
  });

  if (error) {
    throw new Error(`Falha ao buscar linhas diretas: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    routeId: row.route_id,
    routeShortName: row.route_short_name,
    routeLongName: row.route_long_name,
    tripId: row.trip_id,
    tripHeadsign: row.trip_headsign,
    originStopId: row.origin_stop_id,
    originDepartureSeconds: row.origin_departure_seconds,
    destStopId: row.dest_stop_id,
    destArrivalSeconds: row.dest_arrival_seconds
  }));
}

export interface ReachableRoute {
  routeId: string;
  routeShortName: string | null;
  routeLongName: string | null;
  tripId: string;
  tripHeadsign: string | null;
  originStopId: string;
  originDepartureSeconds: number;
  destStopId: string;
  destStopName: string;
  destStopLat: number;
  destStopLng: number;
  destArrivalSeconds: number;
}

export async function findRoutesFromStops(
  originStopIds: string[],
  maxResults = 120
): Promise<ReachableRoute[]> {
  const { data, error } = await supabase.rpc('routes_from_stops', {
    origin_stop_ids: originStopIds,
    max_results: maxResults
  });

  if (error) {
    throw new Error(`Falha ao buscar linhas alcançáveis: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    routeId: row.route_id,
    routeShortName: row.route_short_name,
    routeLongName: row.route_long_name,
    tripId: row.trip_id,
    tripHeadsign: row.trip_headsign,
    originStopId: row.origin_stop_id,
    originDepartureSeconds: row.origin_departure_seconds,
    destStopId: row.dest_stop_id,
    destStopName: row.dest_stop_name,
    destStopLat: row.dest_stop_lat,
    destStopLng: row.dest_stop_lng,
    destArrivalSeconds: row.dest_arrival_seconds
  }));
}

/**
 * Busca a sequência real de paradas no banco GTFS para desenhar a rota fiel nas ruas
 */
export async function getTripStopCoordinates(
  tripId: string,
  originStopId?: string,
  destStopId?: string
): Promise<[number, number][]> {
  try {
    const { data, error } = await supabase
      .from('gtfs_stop_times')
      .select('stop_sequence, stop_id, gtfs_stops(lat, lng)')
      .eq('trip_id', tripId)
      .order('stop_sequence', { ascending: true });

    if (error || !data || data.length === 0) return [];

    let startIndex = 0;
    let endIndex = data.length - 1;

    if (originStopId) {
      const idx = data.findIndex((r: any) => r.stop_id === originStopId);
      if (idx >= 0) startIndex = idx;
    }
    if (destStopId) {
      const idx = data.findIndex((r: any) => r.stop_id === destStopId);
      if (idx >= 0 && idx >= startIndex) endIndex = idx;
    }

    const sliced = data.slice(startIndex, endIndex + 1);
    return sliced
      .filter((r: any) => r.gtfs_stops?.lat && r.gtfs_stops?.lng)
      .map((r: any) => [r.gtfs_stops.lat, r.gtfs_stops.lng] as [number, number]);
  } catch (err) {
    console.warn('[GTFS] Erro ao buscar sequência de paradas do trip:', err);
    return [];
  }
}
