# 🚌 BusaÍ SP — Ônibus em Tempo Real & Trilhos de São Paulo

> Aplicação Web & Mobile (PWA) moderna para monitoramento em tempo real do transporte público da Região Metropolitana de São Paulo: ônibus municipais da **SPTrans (API Olho Vivo)**, status operacional do **Metrô, CPTM, ViaQuatro e ViaMobilidade**, e **Roteirizador Multimodal** inteligente.

---

## ✨ Principais Funcionalidades

- 🗺️ **Mapa Interativo em Tempo Real (Leaflet)**:
  - Rastreamento dos ônibus da SPTrans com rotação de bússola, acessibilidade ♿, velocidade e prefixo.
  - Indicador de telemetria e **Nível de Precisão do Sinal GPS**.
  - Localização do usuário no mapa com radar de precisão GPS.
- 🧭 **Roteirizador Multimodal Inteligente**:
  - Traçado de rota da sua localização atual ou endereço até qualquer destino em SP.
  - Cálculo do tempo de caminhada e indicação da melhor linha de ônibus.
  - **Previsão em tempo real do próximo ônibus no ponto de embarque**.
- ⏱️ **Previsões de Chegada por Parada (ETA)**:
  - Tempo estimado em minutos para todas as linhas que passam no ponto.
- 🚇 **Status Operacional dos Trilhos**:
  - Painel com todas as 13 linhas de Metrô, CPTM e Concessionárias (1-Azul, 2-Verde, 3-Vermelha, 4-Amarela, 5-Lilás, 7, 8, 9, 10, 11, 12, 13 e 15).
  - Alertas de lentidão, paralisação e operação normal em tempo real.
- ⭐ **Favoritos & Nuvem**:
  - Salve suas linhas e paradas preferidas ("Casa 🏠", "Trabalho 💼").
  - Sincronização offline e integração com **Supabase**.
- 📱 **PWA Mobile-First**:
  - Instalável no celular (iOS/Android) e no computador com suporte a gestos e navegação por abas.

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
|---|---|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript, Vanilla CSS Tokens |
| **Mapa** | Leaflet & React Leaflet (Tiles Voyager & Carto) |
| **Backend Proxy** | Next.js Route Handlers (`/api/onibus`, `/api/rotas`, `/api/trilhos/status`) |
| **Cache de Sessão** | Upstash Redis & In-Memory Cache com TTL de 50 min |
| **Banco & Auth** | Supabase (PostgreSQL com RLS) |
| **Hospedagem** | Vercel |

---

## 🚀 Como Executar Localmente

### 1. Clonar o repositório
```bash
git clone https://github.com/SEU_USUARIO/busaisp.git
cd busaisp
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Crie um arquivo `.env.local` na raiz:
```env
# Token gratuito da API Olho Vivo (obtenha em http://www.sptrans.com.br/desenvolvedores)
SPTRANS_TOKEN=seu_token_aqui

# Supabase (Opcional para sincronização de favoritos)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Upstash Redis (Opcional para cache distribuído)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```
> 💡 *Se `SPTRANS_TOKEN` não for preenchido, o app ativa automaticamente o simulador com dados reais de linhas famosas de SP (8000-10, 8700-10, Paulista, Faria Lima).*

### 4. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse `http://localhost:3000` no seu navegador ou celular.

---

## 🗄️ Esquema do Banco de Dados (Supabase SQL)

Execute no SQL Editor do Supabase para habilitar login e favoritos na nuvem:

```sql
-- Perfil do usuário
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

-- Favoritos (Linhas, Paradas, Trilhos)
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  type text check (type in ('parada', 'linha', 'trilho')) not null,
  ref_code text not null,
  title text not null,
  label text,
  details jsonb,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table favorites enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

create policy "Users can manage own favorites" on favorites
  for all using (auth.uid() = user_id);
```

---

## 🔒 Segurança da API

O token da SPTrans **nunca é exposto no cliente**. Todas as chamadas para a API Olho Vivo e o gerenciamento dos cookies de sessão (`apiCredentials`) ocorrem exclusivamente nas Route Handlers serverless do Next.js.
