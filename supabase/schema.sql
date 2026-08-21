-- ========================================================
-- SCRIPT DE INICIALIZAÇÃO DO BANCO DE DADOS - BUSAÍ SP
-- Execute este script no SQL Editor do seu projeto Supabase:
-- https://supabase.com/dashboard/project/andnuavykwjcivlesnky/sql
-- ========================================================

-- 1. Criar extensão UUID se não existir
create extension if not exists "uuid-ossp";

-- 2. Tabela de Perfis de Usuário
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- 3. Tabela de Favoritos (Linhas, Paradas, Trilhos)
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  type text check (type in ('parada', 'linha', 'trilho')) not null,
  ref_code text not null,        -- ex: "1703", "340015350", "1"
  title text not null,           -- ex: "1703-10 Jd. Fontális / Shopping Center Norte"
  label text,                    -- ex: "Casa 🏠", "Trabalho 💼"
  details jsonb default '{}'::jsonb, -- metadados extras da linha ou parada
  created_at timestamptz default now()
);

-- 4. Habilitar Segurança por Linha (Row Level Security - RLS)
alter table public.profiles enable row level security;
alter table public.favorites enable row level security;

-- 5. Políticas de Acesso (RLS)
-- Permitir leitura e escrita de favoritos públicos/anônimos ou por usuário autenticado
create policy "Acesso a favoritos" on public.favorites
  for all using (true)
  with check (true);

create policy "Usuários leem próprio perfil" on public.profiles
  for select using (auth.uid() = id);

create policy "Usuários atualizam próprio perfil" on public.profiles
  for update using (auth.uid() = id);
