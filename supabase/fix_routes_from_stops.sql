-- ========================================================
-- FIX: routes_from_stops devolvia até 500 linhas sem eliminar
-- viagens repetidas da mesma linha/parada-destino. Em pontos com
-- muitos horários (ex.: corredores, terminais), isso enchia o limite
-- inteiro só com viagens de madrugada, escondendo linhas diurnas reais
-- que davam conexão pro destino — causando "nenhuma rota encontrada"
-- mesmo quando a rota existe.
--
-- Fix: DISTINCT ON (origem, linha, destino) — mantém só 1 linha por
-- combinação linha+parada-destino, em vez de 1 por viagem/horário.
-- Isso deixa o limite de 500 cobrir muito mais linhas/paradas distintas
-- em vez de ser consumido por dezenas de horários da mesma linha.
-- ========================================================

drop function if exists public.routes_from_stops(text[], integer);
drop function if exists public.routes_from_stops(text[], integer, integer[]);

create or replace function public.routes_from_stops(
  origin_stop_ids text[],
  max_results integer default 300,
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
  dest_stop_name text,
  dest_stop_lat double precision,
  dest_stop_lng double precision,
  dest_arrival_seconds integer
)
language sql
stable
as $$
  select distinct on (o.stop_id, r.route_id, d.stop_id)
    r.route_id,
    r.short_name as route_short_name,
    r.long_name as route_long_name,
    o.trip_id,
    t.headsign as trip_headsign,
    o.stop_id as origin_stop_id,
    o.departure_time_seconds as origin_departure_seconds,
    d.stop_id as dest_stop_id,
    s.name as dest_stop_name,
    s.lat as dest_stop_lat,
    s.lng as dest_stop_lng,
    d.arrival_time_seconds as dest_arrival_seconds
  from public.gtfs_stop_times o
  join public.gtfs_stop_times d
    on o.trip_id = d.trip_id
    and d.stop_sequence > o.stop_sequence
  join public.gtfs_trips t on t.trip_id = o.trip_id
  join public.gtfs_routes r on r.route_id = t.route_id
  join public.gtfs_stops s on s.stop_id = d.stop_id
  where o.stop_id = any(origin_stop_ids)
    and r.route_type = any(route_types)
  order by o.stop_id, r.route_id, d.stop_id, o.departure_time_seconds asc
  limit least(max_results, 500);
$$;

grant execute on function public.routes_from_stops(text[], integer, integer[]) to anon, authenticated;
