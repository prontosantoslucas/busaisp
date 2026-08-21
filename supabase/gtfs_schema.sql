-- ========================================================
-- GTFS — SCHEMA BASE (Fase 1: fundação de dados reais)
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/andnuavykwjcivlesnky/sql
--
-- Pré-requisito: extensão PostGIS habilitada.
-- Se "create extension postgis" abaixo falhar por permissão,
-- habilite manualmente em Database > Extensions > postgis
-- antes de rodar o restante deste script.
-- ========================================================

create extension if not exists postgis;

create table if not exists public.gtfs_agency (
  agency_id text primary key,
  name text not null,
  url text,
  timezone text
);

create table if not exists public.gtfs_routes (
  route_id text primary key,
  agency_id text references public.gtfs_agency(agency_id),
  short_name text,
  long_name text,
  route_type smallint
);

create table if not exists public.gtfs_stops (
  stop_id text primary key,
  name text not null,
  lat double precision not null,
  lng double precision not null,
  geog geography(Point, 4326) generated always as (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography
  ) stored
);
create index if not exists gtfs_stops_geog_idx on public.gtfs_stops using gist (geog);

create table if not exists public.gtfs_trips (
  trip_id text primary key,
  route_id text not null references public.gtfs_routes(route_id),
  service_id text not null,
  headsign text,
  direction_id smallint
);
create index if not exists gtfs_trips_route_idx on public.gtfs_trips(route_id);

create table if not exists public.gtfs_stop_times (
  trip_id text not null references public.gtfs_trips(trip_id),
  stop_id text not null references public.gtfs_stops(stop_id),
  stop_sequence smallint not null,
  arrival_time_seconds integer not null,
  departure_time_seconds integer not null,
  primary key (trip_id, stop_sequence)
);
create index if not exists gtfs_stop_times_stop_idx on public.gtfs_stop_times(stop_id);

create table if not exists public.gtfs_calendar (
  service_id text primary key,
  monday boolean not null,
  tuesday boolean not null,
  wednesday boolean not null,
  thursday boolean not null,
  friday boolean not null,
  saturday boolean not null,
  sunday boolean not null,
  start_date date not null,
  end_date date not null
);

create table if not exists public.gtfs_calendar_dates (
  service_id text not null,
  date date not null,
  exception_type smallint not null,
  primary key (service_id, date)
);

alter table public.gtfs_agency enable row level security;
alter table public.gtfs_routes enable row level security;
alter table public.gtfs_stops enable row level security;
alter table public.gtfs_trips enable row level security;
alter table public.gtfs_stop_times enable row level security;
alter table public.gtfs_calendar enable row level security;
alter table public.gtfs_calendar_dates enable row level security;

create policy "Leitura pública gtfs_agency" on public.gtfs_agency for select using (true);
create policy "Leitura pública gtfs_routes" on public.gtfs_routes for select using (true);
create policy "Leitura pública gtfs_stops" on public.gtfs_stops for select using (true);
create policy "Leitura pública gtfs_trips" on public.gtfs_trips for select using (true);
create policy "Leitura pública gtfs_stop_times" on public.gtfs_stop_times for select using (true);
create policy "Leitura pública gtfs_calendar" on public.gtfs_calendar for select using (true);
create policy "Leitura pública gtfs_calendar_dates" on public.gtfs_calendar_dates for select using (true);
