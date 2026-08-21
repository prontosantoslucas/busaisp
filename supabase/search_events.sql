-- ========================================================
-- TABELA DE EVENTOS DE BUSCA & DESTINOS MAIS PROCURADOS
-- Execute este arquivo no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/andnuavykwjcivlesnky/sql
-- ========================================================

create table if not exists public.search_events (
  id bigint generated always as identity primary key,
  origin_name text,
  origin_lat double precision,
  origin_lng double precision,
  destination_name text not null,
  destination_lat double precision,
  destination_lng double precision,
  created_at timestamptz not null default now()
);

create index if not exists idx_search_events_destination on public.search_events(destination_name);
create index if not exists idx_search_events_created_at on public.search_events(created_at desc);

alter table public.search_events enable row level security;

drop policy if exists "Permitir leitura anonima de buscas" on public.search_events;
create policy "Permitir leitura anonima de buscas"
  on public.search_events
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Permitir insercao anonima de buscas" on public.search_events;
create policy "Permitir insercao anonima de buscas"
  on public.search_events
  for insert
  to anon, authenticated
  with check (true);

create or replace function public.get_popular_destinations(limit_count integer default 5)
returns table (
  destination_name text,
  search_count bigint
)
language sql
stable
as $$
  select
    destination_name,
    count(*) as search_count
  from public.search_events
  where destination_name is not null and length(trim(destination_name)) > 1
  group by destination_name
  order by count(*) desc
  limit least(limit_count, 20);
$$;

grant execute on function public.get_popular_destinations(integer) to anon, authenticated;
