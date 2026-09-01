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
  -- 2026-09-01: a versão anterior fazia `select distinct` (sem DISTINCT ON) e
  -- ordenava por departure_time_seconds — um campo de horário de viagem que o
  -- app nunca usa pra nada (o ETA real vem separado, via SPTrans) e que não
  -- tem relação nenhuma com distância até o usuário. Uma única linha real
  -- roda dezenas/centenas de viagens por dia entre o mesmo par de paradas, e
  -- cada uma virava uma linha diferente aqui — com o corte em 50 linhas,
  -- isso enchia o resultado inteiro com viagens (de qualquer horário do dia,
  -- inclusive madrugada) de só uma ou duas linhas, escondendo outras linhas
  -- reais que também conectam essas paradas. Bug relatado pelo usuário: uma
  -- linha existia bem na parada onde ele estava, mas nunca aparecia porque
  -- o corte de 50 já tinha sido consumido por viagens irrelevantes.
  -- DISTINCT ON (route_id, origin_stop_id) devolve só 1 linha por combinação
  -- linha+parada de embarque (não mais 1 por viagem do dia inteiro), então o
  -- mesmo limite de 50 agora cobre até 50 combinações DISTINTAS de linha+parada
  -- em vez de até 50 viagens repetidas de pouquíssimas linhas.
  select
    route_id, route_short_name, route_long_name, trip_id, trip_headsign,
    origin_stop_id, origin_departure_seconds, dest_stop_id, dest_arrival_seconds
  from (
    select distinct on (r.route_id, o.stop_id)
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
    order by r.route_id, o.stop_id, o.departure_time_seconds asc
  ) dedup
  limit least(max_results, 50);
$$;

grant execute on function public.direct_routes_between(text[], text[], integer, integer[]) to anon, authenticated;
