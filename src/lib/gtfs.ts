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
  radiusMeters = 600,
  maxResults = 8
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
  maxResults = 10
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
