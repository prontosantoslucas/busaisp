-- ========================================================
-- GTFS — FUNÇÕES DE CONSULTA (Fase 1)
-- Execute após supabase/gtfs_schema.sql, no mesmo SQL Editor.
-- ========================================================

create or replace function public.nearby_stops(
  in_lat double precision,
  in_lng double precision,
  radius_meters integer default 600,
  max_results integer default 8
)
returns table (
  stop_id text,
  name text,
  lat double precision,
  lng double precision,
  distance_meters double precision
)
language sql
stable
as $$
  select
    s.stop_id,
    s.name,
    s.lat,
    s.lng,
    ST_Distance(s.geog, ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography) as distance_meters
  from public.gtfs_stops s
  where ST_DWithin(s.geog, ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography, least(radius_meters, 3000))
  order by distance_meters asc
  limit least(max_results, 50);
$$;

grant execute on function public.nearby_stops(double precision, double precision, integer, integer) to anon, authenticated;

-- A versão anterior tinha 3 parâmetros (sem route_types); "create or replace"
-- não substitui uma função quando a lista de parâmetros muda, ele cria uma
-- segunda versão sobreposta. Removemos a versão antiga explicitamente antes
-- de criar a nova, para evitar ambiguidade de overload no PostgREST.
drop function if exists public.direct_routes_between(text[], text[], integer);

create or replace function public.direct_routes_between(
  origin_stop_ids text[],
  dest_stop_ids text[],
  max_results integer default 10,
  route_types integer[] default array[3]
)
returns table (
  route_id text,
  route_short_name text,
  route_long_name text,
  trip_id text,
  trip_headsign text,
  origin_stop_id text,
  origin_departure_seconds integer,
  dest_stop_id text,
  dest_arrival_seconds integer
)
language sql
stable
as $$
  -- Nota: viagens circulares (mesma parada visitada 2x) podem gerar mais de uma linha por trip_id aqui.
  select distinct
    r.route_id,
    r.short_name as route_short_name,
    r.long_name as route_long_name,
    o.trip_id,
    t.headsign as trip_headsign,
    o.stop_id as origin_stop_id,
    o.departure_time_seconds as origin_departure_seconds,
    d.stop_id as dest_stop_id,
    d.arrival_time_seconds as dest_arrival_seconds
  from public.gtfs_stop_times o
  join public.gtfs_stop_times d
    on o.trip_id = d.trip_id
    and d.stop_sequence > o.stop_sequence
  join public.gtfs_trips t on t.trip_id = o.trip_id
  join public.gtfs_routes r on r.route_id = t.route_id
  where o.stop_id = any(origin_stop_ids)
    and d.stop_id = any(dest_stop_ids)
    and r.route_type = any(route_types)
  order by o.departure_time_seconds asc
  limit least(max_results, 50);
$$;

grant execute on function public.direct_routes_between(text[], text[], integer, integer[]) to anon, authenticated;
