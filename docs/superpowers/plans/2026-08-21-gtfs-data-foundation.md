# Fundação de Dados Reais (GTFS) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded demo stop/line data (`MOCK_PARADAS`, `MOCK_LINHAS`, fixed candidate lines) in the route planner with a real, city-wide GTFS-backed dataset in Supabase, so "which stops are near this address" and "which direct bus lines connect these two areas" work for anywhere in São Paulo, not just the demo corridor.

**Architecture:** Import the official SPTrans GTFS static feed (via the Transitland mirror) into Postgres tables (`gtfs_stops`, `gtfs_routes`, `gtfs_trips`, `gtfs_stop_times`, `gtfs_calendar`, `gtfs_calendar_dates`, `gtfs_agency`) with PostGIS geospatial indexing on stops. Expose two read-only SQL RPC functions (`nearby_stops`, `direct_routes_between`) that the app calls through a new `src/lib/gtfs.ts` module. `src/lib/routing.ts` swaps its mock-data lookups for these real queries while keeping its existing walking/time-estimate math unchanged. Real-time ETA continues to come from the existing SPTrans Olho Vivo integration, now anchored to dynamically-discovered real stop/line codes instead of a fixed demo set.

**Tech Stack:** Next.js 15 / TypeScript (existing), Supabase Postgres + PostGIS, `pg` (direct Postgres connection for bulk import), `adm-zip` + `csv-parse` (GTFS parsing), `vitest` (new — no test runner exists yet), Transitland REST API (GTFS source).

---

## Task 1: Add a test runner (vitest)

No test framework exists in this project yet. This task adds one so every later task can follow red/green TDD.

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/lib/sanity.test.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`

- [ ] **Step 2: Create the vitest config with the `@/*` alias**

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node'
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
```

- [ ] **Step 3: Add the `test` script**

Modify `package.json` — add `"test": "vitest run"` to the `scripts` block, next to the existing `"lint"` entry:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  },
```

- [ ] **Step 4: Write a sanity test**

Create `src/lib/sanity.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('test runner sanity check', () => {
  it('runs and resolves the @/ alias', async () => {
    const { supabase } = await import('@/lib/supabase');
    expect(supabase).toBeDefined();
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 5: Run it**

Run: `npm test`
Expected: `1 passed` (the sanity test), no other tests exist yet.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/lib/sanity.test.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: GTFS core schema in Supabase (stops, routes, trips, calendar)

**Files:**
- Create: `supabase/gtfs_schema.sql`
- Create: `scripts/gtfs/schema.smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

Create `scripts/gtfs/schema.smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)('gtfs core schema (Supabase)', () => {
  const supabase = createClient(url as string, anonKey as string);

  const tables = [
    'gtfs_agency',
    'gtfs_routes',
    'gtfs_stops',
    'gtfs_trips',
    'gtfs_stop_times',
    'gtfs_calendar',
    'gtfs_calendar_dates'
  ];

  it.each(tables)('%s table exists and is publicly readable', async (table) => {
    const { error } = await supabase.from(table).select('*').limit(1);
    expect(error).toBeNull();
  });
});
```

This test requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to be set in `.env.local` (they already are, per the existing Supabase favorites integration). If they are missing, the whole suite is skipped rather than failing noisily.

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- schema.smoke`
Expected: FAIL — each table check reports `error` is not `null` (Postgres/PostgREST returns a `relation "public.gtfs_agency" does not exist` style error, code `42P01`), because none of these tables exist yet.

- [ ] **Step 3: Write the schema SQL**

Create `supabase/gtfs_schema.sql`:

```sql
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
```

No `insert`/`update`/`delete` policies are defined, so with RLS enabled the anon/authenticated roles can only read. Writes happen exclusively from the import script (Task 5) using the service role key, which bypasses RLS by design.

- [ ] **Step 4: Apply it (manual action)**

Open the Supabase SQL Editor for this project and run the full contents of `supabase/gtfs_schema.sql`.

- [ ] **Step 5: Run the test again to verify it passes**

Run: `npm test -- schema.smoke`
Expected: `7 passed` (one per table), all `error` values `null`.

- [ ] **Step 6: Commit**

```bash
git add supabase/gtfs_schema.sql scripts/gtfs/schema.smoke.test.ts
git commit -m "feat: add GTFS core schema with PostGIS-indexed stops"
```

---

## Task 3: Real query functions (`nearby_stops`, `direct_routes_between`)

**Files:**
- Create: `supabase/gtfs_functions.sql`
- Create: `scripts/gtfs/functions.smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

Create `scripts/gtfs/functions.smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)('gtfs query functions (Supabase)', () => {
  const supabase = createClient(url as string, anonKey as string);

  it('nearby_stops is callable and returns an array', async () => {
    const { data, error } = await supabase.rpc('nearby_stops', {
      in_lat: -23.5615,
      in_lng: -46.6559,
      radius_meters: 500,
      max_results: 5
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('direct_routes_between is callable and returns an array', async () => {
    const { data, error } = await supabase.rpc('direct_routes_between', {
      origin_stop_ids: ['does-not-exist-1'],
      dest_stop_ids: ['does-not-exist-2'],
      max_results: 5
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- functions.smoke`
Expected: FAIL — both calls return a non-null `error` (PostgREST reports the function does not exist, e.g. `Could not find the function public.nearby_stops(...)`).

- [ ] **Step 3: Write the functions SQL**

Create `supabase/gtfs_functions.sql`:

```sql
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
  where ST_DWithin(s.geog, ST_SetSRID(ST_MakePoint(in_lng, in_lat), 4326)::geography, radius_meters)
  order by distance_meters asc
  limit max_results;
$$;

grant execute on function public.nearby_stops(double precision, double precision, integer, integer) to anon, authenticated;

create or replace function public.direct_routes_between(
  origin_stop_ids text[],
  dest_stop_ids text[],
  max_results integer default 10
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
  order by o.departure_time_seconds asc
  limit max_results;
$$;

grant execute on function public.direct_routes_between(text[], text[], integer) to anon, authenticated;
```

Both functions run as plain `sql`/`stable` (no `security definer`), so they execute with the caller's privileges — this works because the Task 2 RLS policies already allow public `select` on every `gtfs_*` table.

- [ ] **Step 4: Apply it (manual action)**

Run the full contents of `supabase/gtfs_functions.sql` in the Supabase SQL Editor.

- [ ] **Step 5: Run the test again to verify it passes**

Run: `npm test -- functions.smoke`
Expected: `2 passed`, both returning `[]` (no stops/routes loaded yet, but the calls succeed).

- [ ] **Step 6: Commit**

```bash
git add supabase/gtfs_functions.sql scripts/gtfs/functions.smoke.test.ts
git commit -m "feat: add nearby_stops and direct_routes_between SQL functions"
```

---

## Task 4: GTFS row-parsing functions (pure, unit-tested)

**Files:**
- Create: `scripts/gtfs/transform.ts`
- Create: `scripts/gtfs/transform.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `scripts/gtfs/transform.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  gtfsTimeToSeconds,
  gtfsDateToIso,
  parseAgencyRow,
  parseRouteRow,
  parseStopRow,
  parseTripRow,
  parseStopTimeRow,
  parseCalendarRow,
  parseCalendarDateRow
} from './transform';

describe('gtfsTimeToSeconds', () => {
  it('converts a normal HH:MM:SS time', () => {
    expect(gtfsTimeToSeconds('08:30:00')).toBe(8 * 3600 + 30 * 60);
  });

  it('handles GTFS times past midnight (>= 24:00:00)', () => {
    expect(gtfsTimeToSeconds('25:10:15')).toBe(25 * 3600 + 10 * 60 + 15);
  });
});

describe('gtfsDateToIso', () => {
  it('converts YYYYMMDD to YYYY-MM-DD', () => {
    expect(gtfsDateToIso('20260315')).toBe('2026-03-15');
  });
});

describe('parseAgencyRow', () => {
  it('maps GTFS agency.txt columns', () => {
    expect(
      parseAgencyRow({ agency_id: 'sptrans', agency_name: 'SPTrans', agency_url: 'https://sptrans.com.br', agency_timezone: 'America/Sao_Paulo' })
    ).toEqual({ agencyId: 'sptrans', name: 'SPTrans', url: 'https://sptrans.com.br', timezone: 'America/Sao_Paulo' });
  });

  it('defaults agency_id to "sptrans" when absent', () => {
    expect(parseAgencyRow({ agency_name: 'SPTrans', agency_url: '', agency_timezone: 'America/Sao_Paulo' }).agencyId).toBe('sptrans');
  });
});

describe('parseRouteRow', () => {
  it('maps GTFS routes.txt columns and coerces route_type to a number', () => {
    expect(
      parseRouteRow({ route_id: '1703-10', agency_id: 'sptrans', route_short_name: '1703', route_long_name: 'JD. FONTALIS - CENTER NORTE', route_type: '3' })
    ).toEqual({ routeId: '1703-10', agencyId: 'sptrans', shortName: '1703', longName: 'JD. FONTALIS - CENTER NORTE', routeType: 3 });
  });
});

describe('parseStopRow', () => {
  it('maps GTFS stops.txt columns and coerces lat/lng to numbers', () => {
    expect(
      parseStopRow({ stop_id: '340015350', stop_name: 'PARADA SHOPPING CENTER NORTE', stop_lat: '-23.5152', stop_lon: '-46.6190' })
    ).toEqual({ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619 });
  });
});

describe('parseTripRow', () => {
  it('maps GTFS trips.txt columns, treating an empty direction_id as null', () => {
    expect(
      parseTripRow({ trip_id: 't1', route_id: '1703-10', service_id: 'svc1', trip_headsign: 'SHOPPING CENTER NORTE', direction_id: '' })
    ).toEqual({ tripId: 't1', routeId: '1703-10', serviceId: 'svc1', headsign: 'SHOPPING CENTER NORTE', directionId: null });
  });
});

describe('parseStopTimeRow', () => {
  it('maps GTFS stop_times.txt columns and converts times to seconds', () => {
    expect(
      parseStopTimeRow({ trip_id: 't1', stop_id: '340015350', stop_sequence: '3', arrival_time: '08:15:00', departure_time: '08:16:00' })
    ).toEqual({ tripId: 't1', stopId: '340015350', stopSequence: 3, arrivalTimeSeconds: 29700, departureTimeSeconds: 29760 });
  });
});

describe('parseCalendarRow', () => {
  it('converts day flags to booleans and dates to ISO', () => {
    expect(
      parseCalendarRow({
        service_id: 'svc1',
        monday: '1', tuesday: '1', wednesday: '1', thursday: '1', friday: '1', saturday: '0', sunday: '0',
        start_date: '20260101', end_date: '20261231'
      })
    ).toEqual({
      serviceId: 'svc1',
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
      startDate: '2026-01-01', endDate: '2026-12-31'
    });
  });
});

describe('parseCalendarDateRow', () => {
  it('maps GTFS calendar_dates.txt columns', () => {
    expect(
      parseCalendarDateRow({ service_id: 'svc1', date: '20260421', exception_type: '2' })
    ).toEqual({ serviceId: 'svc1', date: '2026-04-21', exceptionType: 2 });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- transform`
Expected: FAIL with `Cannot find module './transform'` (the file doesn't exist yet).

- [ ] **Step 3: Implement the transform functions**

Create `scripts/gtfs/transform.ts`:

```ts
export function gtfsTimeToSeconds(hhmmss: string): number {
  const [h, m, s] = hhmmss.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

export function gtfsDateToIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export interface AgencyRow {
  agencyId: string;
  name: string;
  url: string;
  timezone: string;
}

export function parseAgencyRow(row: Record<string, string>): AgencyRow {
  return {
    agencyId: row.agency_id || 'sptrans',
    name: row.agency_name,
    url: row.agency_url,
    timezone: row.agency_timezone
  };
}

export interface RouteRow {
  routeId: string;
  agencyId: string | null;
  shortName: string | null;
  longName: string | null;
  routeType: number | null;
}

export function parseRouteRow(row: Record<string, string>): RouteRow {
  return {
    routeId: row.route_id,
    agencyId: row.agency_id || null,
    shortName: row.route_short_name || null,
    longName: row.route_long_name || null,
    routeType: row.route_type ? Number(row.route_type) : null
  };
}

export interface StopRow {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
}

export function parseStopRow(row: Record<string, string>): StopRow {
  return {
    stopId: row.stop_id,
    name: row.stop_name,
    lat: Number(row.stop_lat),
    lng: Number(row.stop_lon)
  };
}

export interface TripRow {
  tripId: string;
  routeId: string;
  serviceId: string;
  headsign: string | null;
  directionId: number | null;
}

export function parseTripRow(row: Record<string, string>): TripRow {
  return {
    tripId: row.trip_id,
    routeId: row.route_id,
    serviceId: row.service_id,
    headsign: row.trip_headsign || null,
    directionId: row.direction_id !== undefined && row.direction_id !== '' ? Number(row.direction_id) : null
  };
}

export interface StopTimeRow {
  tripId: string;
  stopId: string;
  stopSequence: number;
  arrivalTimeSeconds: number;
  departureTimeSeconds: number;
}

export function parseStopTimeRow(row: Record<string, string>): StopTimeRow {
  return {
    tripId: row.trip_id,
    stopId: row.stop_id,
    stopSequence: Number(row.stop_sequence),
    arrivalTimeSeconds: gtfsTimeToSeconds(row.arrival_time),
    departureTimeSeconds: gtfsTimeToSeconds(row.departure_time)
  };
}

export interface CalendarRow {
  serviceId: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate: string;
}

export function parseCalendarRow(row: Record<string, string>): CalendarRow {
  return {
    serviceId: row.service_id,
    monday: row.monday === '1',
    tuesday: row.tuesday === '1',
    wednesday: row.wednesday === '1',
    thursday: row.thursday === '1',
    friday: row.friday === '1',
    saturday: row.saturday === '1',
    sunday: row.sunday === '1',
    startDate: gtfsDateToIso(row.start_date),
    endDate: gtfsDateToIso(row.end_date)
  };
}

export interface CalendarDateRow {
  serviceId: string;
  date: string;
  exceptionType: number;
}

export function parseCalendarDateRow(row: Record<string, string>): CalendarDateRow {
  return {
    serviceId: row.service_id,
    date: gtfsDateToIso(row.date),
    exceptionType: Number(row.exception_type)
  };
}
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- transform`
Expected: all tests in `transform.test.ts` pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/gtfs/transform.ts scripts/gtfs/transform.test.ts
git commit -m "feat: add pure GTFS row-parsing functions"
```

---

## Task 5: GTFS import script (manual-run orchestration)

This script downloads, parses and loads the real feed. It is glue code around network, filesystem and a database connection, so unlike the previous tasks it is verified by actually running it and inspecting the output — not by an automated test. The pure parsing logic it depends on was already covered by Task 4.

**Files:**
- Create: `scripts/import-gtfs.ts`
- Modify: `package.json`
- Modify: `.env.example`

- [ ] **Step 1: Install the script's dependencies**

Run: `npm install -D pg adm-zip csv-parse dotenv tsx @types/pg @types/adm-zip`

- [ ] **Step 2: Document the two new environment variables**

Modify `.env.example`, appending:

```env

# 4. Importação GTFS (Fase 1 - fundação de dados reais)
# Chave gratuita: crie uma conta em https://www.transit.land e gere uma API key.
TRANSITLAND_API_KEY=

# Connection string direta do Postgres (não a URL/anon key acima).
# Obtenha em: Supabase Dashboard > Project Settings > Database > Connection string.
# Necessária apenas para rodar `npm run import:gtfs` — nunca é usada em runtime da aplicação.
SUPABASE_DB_URL=
```

- [ ] **Step 3: Write the import script**

Create `scripts/import-gtfs.ts`:

```ts
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { Client } from 'pg';
import {
  parseAgencyRow,
  parseRouteRow,
  parseStopRow,
  parseTripRow,
  parseStopTimeRow,
  parseCalendarRow,
  parseCalendarDateRow
} from './gtfs/transform';

const TRANSITLAND_FEED_ID = 'f-6gy-sptrans';

async function downloadGtfsZip(): Promise<Buffer> {
  const apiKey = process.env.TRANSITLAND_API_KEY;
  if (!apiKey) {
    throw new Error('TRANSITLAND_API_KEY não configurado em .env.local');
  }

  const url = `https://transit.land/api/v2/rest/feeds/${TRANSITLAND_FEED_ID}/download_latest_feed_version?apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar GTFS do Transitland: HTTP ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function readCsvFromZip<T extends Record<string, string>>(zip: AdmZip, fileName: string): T[] {
  const entry = zip.getEntry(fileName);
  if (!entry) {
    throw new Error(`Arquivo ${fileName} não encontrado no GTFS`);
  }
  const content = entry.getData().toString('utf-8');
  return parse(content, { columns: true, skip_empty_lines: true }) as T[];
}

async function insertBatched(
  client: Client,
  tableName: string,
  columns: string[],
  rows: any[][],
  batchSize = 1000
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const placeholders = batch
      .map((_, rowIdx) => `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`)
      .join(', ');
    const values = batch.flat();
    await client.query(
      `insert into public.${tableName} (${columns.join(', ')}) values ${placeholders}`,
      values
    );
  }
  console.log(`  ${tableName}: ${rows.length} linhas inseridas`);
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error('SUPABASE_DB_URL não configurado em .env.local');
  }

  console.log('Baixando GTFS da SPTrans via Transitland...');
  const zipBuffer = await downloadGtfsZip();
  const zip = new AdmZip(zipBuffer);
  console.log(`GTFS baixado: ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  const agencyRows = readCsvFromZip(zip, 'agency.txt').map(parseAgencyRow);
  const routeRows = readCsvFromZip(zip, 'routes.txt').map(parseRouteRow);
  const stopRows = readCsvFromZip(zip, 'stops.txt').map(parseStopRow);
  const tripRows = readCsvFromZip(zip, 'trips.txt').map(parseTripRow);
  const stopTimeRows = readCsvFromZip(zip, 'stop_times.txt').map(parseStopTimeRow);
  const calendarRows = readCsvFromZip(zip, 'calendar.txt').map(parseCalendarRow);
  const calendarDateRows = readCsvFromZip(zip, 'calendar_dates.txt').map(parseCalendarDateRow);

  console.log('Linhas lidas do GTFS:');
  console.log(`  agency: ${agencyRows.length}`);
  console.log(`  routes: ${routeRows.length}`);
  console.log(`  stops: ${stopRows.length}`);
  console.log(`  trips: ${tripRows.length}`);
  console.log(`  stop_times: ${stopTimeRows.length}`);
  console.log(`  calendar: ${calendarRows.length}`);
  console.log(`  calendar_dates: ${calendarDateRows.length}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    console.log('Limpando tabelas antigas...');
    await client.query('delete from public.gtfs_stop_times');
    await client.query('delete from public.gtfs_trips');
    await client.query('delete from public.gtfs_calendar_dates');
    await client.query('delete from public.gtfs_calendar');
    await client.query('delete from public.gtfs_routes');
    await client.query('delete from public.gtfs_stops');
    await client.query('delete from public.gtfs_agency');

    console.log('Inserindo dados novos...');
    await insertBatched(
      client,
      'gtfs_agency',
      ['agency_id', 'name', 'url', 'timezone'],
      agencyRows.map(a => [a.agencyId, a.name, a.url, a.timezone])
    );
    await insertBatched(
      client,
      'gtfs_routes',
      ['route_id', 'agency_id', 'short_name', 'long_name', 'route_type'],
      routeRows.map(r => [r.routeId, r.agencyId, r.shortName, r.longName, r.routeType])
    );
    await insertBatched(
      client,
      'gtfs_stops',
      ['stop_id', 'name', 'lat', 'lng'],
      stopRows.map(s => [s.stopId, s.name, s.lat, s.lng])
    );
    await insertBatched(
      client,
      'gtfs_trips',
      ['trip_id', 'route_id', 'service_id', 'headsign', 'direction_id'],
      tripRows.map(t => [t.tripId, t.routeId, t.serviceId, t.headsign, t.directionId])
    );
    await insertBatched(
      client,
      'gtfs_stop_times',
      ['trip_id', 'stop_id', 'stop_sequence', 'arrival_time_seconds', 'departure_time_seconds'],
      stopTimeRows.map(st => [st.tripId, st.stopId, st.stopSequence, st.arrivalTimeSeconds, st.departureTimeSeconds]),
      500
    );
    await insertBatched(
      client,
      'gtfs_calendar',
      ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'],
      calendarRows.map(c => [c.serviceId, c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday, c.startDate, c.endDate])
    );
    await insertBatched(
      client,
      'gtfs_calendar_dates',
      ['service_id', 'date', 'exception_type'],
      calendarDateRows.map(c => [c.serviceId, c.date, c.exceptionType])
    );

    await client.query('COMMIT');
    console.log('Importação concluída com sucesso.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Importação falhou, nenhuma alteração foi salva:', err);
    await client.end();
    throw err;
  }

  const sizeResult = await client.query(`
    select relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as size
    from pg_catalog.pg_statio_user_tables
    where relname like 'gtfs_%'
    order by pg_total_relation_size(relid) desc
  `);
  console.log('Tamanho das tabelas GTFS no banco:');
  for (const row of sizeResult.rows) {
    console.log(`  ${row.table_name}: ${row.size}`);
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Add the `import:gtfs` script**

Modify `package.json` — add `"import:gtfs": "tsx scripts/import-gtfs.ts"` to `scripts`:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run",
    "import:gtfs": "tsx scripts/import-gtfs.ts"
  },
```

- [ ] **Step 5: Get the two required secrets (manual action)**

1. Sign up for a free account at `transit.land` and generate an API key. Put it in `.env.local` as `TRANSITLAND_API_KEY`.
2. In the Supabase dashboard, go to Project Settings → Database → Connection string, copy the direct Postgres connection URI (with password), and put it in `.env.local` as `SUPABASE_DB_URL`.

- [ ] **Step 6: Run the import for real (manual action)**

Run: `npm run import:gtfs`
Expected: console output listing row counts per GTFS file, then `Importação concluída com sucesso.`, then a per-table size report.

- [ ] **Step 7: Check the size against the Supabase free-tier budget (manual decision point)**

Sum the sizes printed in Step 6. If the total is comfortably under the 500MB Supabase free-tier database limit, proceed to Task 6 as planned.

If it does not fit: the highest-risk table is `gtfs_stop_times` (one row per stop visit per trip, citywide). Reduce it by keeping only trips whose `service_id` is active on a single representative weekday (join against `gtfs_calendar` and delete `stop_times` for trips outside that service before inserting, or filter `tripRows`/`stopTimeRows` in the script to a single representative day before the insert step) rather than every calendar variant in the feed. Record whatever decision is made here as a follow-up note in this plan's tracking (do not silently diverge from what's written).

- [ ] **Step 8: Commit**

```bash
git add scripts/import-gtfs.ts package.json package-lock.json .env.example
git commit -m "feat: add GTFS import script (Transitland -> Supabase)"
```

---

## Task 6: `src/lib/gtfs.ts` — typed access to the SQL functions

**Files:**
- Create: `src/lib/gtfs.ts`
- Create: `src/lib/gtfs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/gtfs.test.ts`:

```ts
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/lib/gtfs.test.ts`
Expected: FAIL with `Cannot find module '@/lib/gtfs'`.

- [ ] **Step 3: Implement `src/lib/gtfs.ts`**

Create `src/lib/gtfs.ts`:

```ts
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- src/lib/gtfs.test.ts`
Expected: `4 passed`.

- [ ] **Step 5: Commit**

```bash
git add src/lib/gtfs.ts src/lib/gtfs.test.ts
git commit -m "feat: add typed gtfs.ts wrapper around Supabase RPC functions"
```

---

## Task 7: Stop masking real "no data" as demo data in `buscarPrevisaoParada`

**Files:**
- Modify: `src/lib/sptrans.ts:231-244`

**Why this is in scope here:** once `calculateRoute` (Task 8) starts asking the Olho Vivo API for real-time predictions at stops discovered dynamically from GTFS — anywhere in São Paulo, not just the 8 demo stops — the current fallback behavior becomes actively misleading: `buscarPrevisaoParada` currently returns `getMockPrevisaoParada(codigoParada)` (a fabricated Shopping Center Norte-themed prediction) any time the real Olho Vivo call comes back empty, **even when SPTrans is fully authenticated** and genuinely just has no data for that specific real stop. It also always reports `isMock: false`, so nothing downstream can tell the difference. This directly violates the spec's error-handling requirement: "não deve mais ser o caminho normal fora do corredor de demonstração."

This is a small, contained fix. It is not covered by an automated test in this task: reproducing it faithfully requires mocking `fetch` across two sequential calls (auth + prediction) plus the module's cookie cache state, which is disproportionate effort for a five-line change. It is instead verified manually in Task 9, where a real non-demo stop is queried end to end.

- [ ] **Step 1: Read the current implementation**

Current code at `src/lib/sptrans.ts:231-244`:

```ts
export async function buscarPrevisaoParada(codigoParada: number): Promise<{ previsao: SPTransPrevisaoResponse | null; isMock: boolean }> {
  const { data } = await fetchSPTrans<SPTransPrevisaoResponse>(
    `/Previsao/Parada?codigoParada=${codigoParada}`
  );

  if (data && data.p) {
    return { previsao: data, isMock: false };
  }

  return {
    previsao: getMockPrevisaoParada(codigoParada),
    isMock: false
  };
}
```

- [ ] **Step 2: Replace it**

Replace the function body so mock data is only ever returned when SPTrans could not be authenticated at all (true demo mode), not whenever a specific real stop has no result:

```ts
export async function buscarPrevisaoParada(codigoParada: number): Promise<{ previsao: SPTransPrevisaoResponse | null; isMock: boolean }> {
  const cookie = await authenticateSPTrans();

  if (!cookie) {
    return { previsao: getMockPrevisaoParada(codigoParada), isMock: true };
  }

  const { data } = await fetchSPTrans<SPTransPrevisaoResponse>(
    `/Previsao/Parada?codigoParada=${codigoParada}`
  );

  if (data && data.p) {
    return { previsao: data, isMock: false };
  }

  return { previsao: null, isMock: false };
}
```

- [ ] **Step 3: Confirm nothing depends on the old always-false `isMock` value**

Run: `npm test`
Expected: all existing tests still pass (this function isn't covered by an automated test yet, so this just confirms the change didn't break anything else in the suite).

This change is safe to make in isolation: `isMock` from this specific function is plumbed through `/api/onibus` (`src/app/api/onibus/route.ts:72-76`) but the frontend's demo-mode banner (`isMockMode` in `src/app/page.tsx:77,105`) is driven by a separate `status_auth` check, not by this field — so there is no UI behavior relying on the old (always-`false`) value.

- [ ] **Step 4: Commit**

```bash
git add src/lib/sptrans.ts
git commit -m "fix: buscarPrevisaoParada no longer masks real per-stop empty results as demo data"
```

---

## Task 8: Wire `routing.ts` to real GTFS data

**Files:**
- Modify: `src/lib/routing.ts:1-3` (imports)
- Modify: `src/lib/routing.ts:243-366` (`buildPlanForLine`)
- Modify: `src/lib/routing.ts:368-431` (`calculateRoute`, plus new helpers)
- Create: `src/lib/routing.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/routing.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/gtfs', () => ({
  findNearbyStops: vi.fn(),
  findDirectRoutes: vi.fn()
}));

vi.mock('@/lib/sptrans', () => ({
  buscarPrevisaoParada: vi.fn()
}));

import { findNearbyStops, findDirectRoutes } from '@/lib/gtfs';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { calculateRoute } from '@/lib/routing';

const origin = { name: 'Origem', lat: -23.43, lng: -46.58 };
const dest = { name: 'Destino', lat: -23.51, lng: -46.62 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('calculateRoute', () => {
  it('lança erro claro quando não há paradas perto da origem', async () => {
    (findNearbyStops as any).mockResolvedValueOnce([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma parada de ônibus encontrada perto da origem');
  });

  it('lança erro claro quando não há linha direta entre origem e destino', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma linha direta encontrada');
  });

  it('monta um plano de rota real usando paradas e linhas do GTFS, com previsão em tempo real', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: '340015353',
        originDepartureSeconds: 0,
        destStopId: '340015350',
        destArrivalSeconds: 0
      }
    ]);
    (buscarPrevisaoParada as any).mockResolvedValueOnce({
      previsao: {
        hr: '10:00',
        p: {
          cp: 340015353,
          np: 'TERMINAL JD. FONTALIS',
          py: -23.4338,
          px: -46.5778,
          l: [
            {
              cl: 1703,
              c: '1703-10',
              sl: 1,
              lt0: 'SHOPPING CENTER NORTE',
              lt1: 'JD. FONTALIS',
              qv: 1,
              vs: [{ p: '21045', t: '10:05', a: true, ta: '10:00', py: -23.43, px: -46.58, destination: 'SHOPPING CENTER NORTE' }]
            }
          ]
        }
      },
      isMock: false
    });

    const result = await calculateRoute(origin, dest);

    // O ETA exato depende do relógio no momento do teste (comparado com "10:05" fixo),
    // então não é verificado aqui — só o encadeamento correto dos dados reais.
    expect(result.primaryRoute.recommendedLine.lt).toBe('1703');
    expect(result.primaryRoute.departureStop.cp).toBe(340015353);
    expect(result.primaryRoute.arrivalStop.cp).toBe(340015350);
    expect(result.alternatives).toHaveLength(1);
  });

  it('lança erro claro quando um stop_id do GTFS não é numérico', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: 'nao-numerico', name: 'PARADA X', lat: -23.43, lng: -46.58, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValueOnce([
      {
        routeId: '1703-10',
        routeShortName: '1703',
        routeLongName: 'PARADA X - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: 'nao-numerico',
        originDepartureSeconds: 0,
        destStopId: '340015350',
        destArrivalSeconds: 0
      }
    ]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('não é numérico');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/lib/routing.test.ts`
Expected: FAIL — `calculateRoute` still uses `MOCK_PARADAS`/`MOCK_LINHAS` and never calls `findNearbyStops`/`findDirectRoutes`, so the mocked calls are never asserted against real behavior and the "no stops" / "no direct route" / "non-numeric stop_id" cases don't throw the expected errors.

- [ ] **Step 3: Update the imports**

Replace `src/lib/routing.ts:1-3`:

```ts
import { SPTransLinha, SPTransParada, SPTransVeiculo } from '@/types/sptrans';
import { MOCK_LINHAS, MOCK_PARADAS } from '@/lib/mockData';
import { buscarPrevisaoParada } from '@/lib/sptrans';
```

with:

```ts
import { SPTransLinha, SPTransParada, SPTransVeiculo } from '@/types/sptrans';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { findNearbyStops, findDirectRoutes, NearbyStop, DirectRoute } from '@/lib/gtfs';
```

- [ ] **Step 4: Update `buildPlanForLine` to handle "no real-time data"**

Replace `src/lib/routing.ts:243-366` (the full `buildPlanForLine` function) with:

```ts
/**
 * Cria um plano de rota específico para uma linha de ônibus candidata
 */
function buildPlanForLine(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  line: SPTransLinha,
  origStop: SPTransParada,
  destStop: SPTransParada,
  busEtaMinutes: number,
  vehiclePrefix: string
): RoutePlan {
  const hasRealTimeEta = busEtaMinutes >= 0;

  const walkToStopMeters = Math.max(120, getDistanceMeters(originLoc.lat, originLoc.lng, origStop.py, origStop.px));
  const walkToStopMinutes = Math.max(2, Math.round(walkToStopMeters / 75));
  const walkToStopSteps = Math.round(walkToStopMeters / 0.75);

  const transitDistanceMeters = getDistanceMeters(origStop.py, origStop.px, destStop.py, destStop.px) || 4500;
  const transitMinutes = Math.max(12, Math.round(transitDistanceMeters / 280));

  const walkToDestMeters = Math.max(80, getDistanceMeters(destLoc.lat, destLoc.lng, destStop.py, destStop.px));
  const walkToDestMinutes = Math.max(1, Math.round(walkToDestMeters / 75));
  const walkToDestSteps = Math.round(walkToDestMeters / 0.75);

  const totalWalkDistanceMeters = walkToStopMeters + walkToDestMeters;
  const totalWalkDurationMinutes = walkToStopMinutes + walkToDestMinutes;
  const totalEstimatedSteps = walkToStopSteps + walkToDestSteps;

  const totalDurationMinutes = hasRealTimeEta
    ? walkToStopMinutes + Math.max(0, busEtaMinutes - walkToStopMinutes) + transitMinutes + walkToDestMinutes
    : walkToStopMinutes + transitMinutes + walkToDestMinutes;
  const totalDistanceMeters = walkToStopMeters + transitDistanceMeters + walkToDestMeters;

  let departureSuggestion = '';
  if (!hasRealTimeEta) {
    departureSuggestion = `🚶 Caminhe até ${origStop.np} (${walkToStopMinutes} min). Sem previsão em tempo real para a linha ${line.lt} agora — confira o horário no ponto.`;
  } else if (busEtaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia a pé agora! Você leva ${walkToStopMinutes} min até o ponto e o ônibus #${vehiclePrefix} chega em ${busEtaMinutes} min.`;
  } else {
    const waitTime = busEtaMinutes - walkToStopMinutes;
    departureSuggestion = `🚶 Saia a pé em ~${waitTime} min para chegar ao ponto exatamente quando o ônibus #${vehiclePrefix} estiver se aproximando.`;
  }

  const walkToStopPath = generatePedestrianWaypoints(
    [originLoc.lat, originLoc.lng],
    [origStop.py, origStop.px]
  );

  const midLat1 = (origStop.py * 2 + destStop.py) / 3;
  const midLng1 = (origStop.px * 2 + destStop.px) / 3 + 0.003;
  const midLat2 = (origStop.py + destStop.py * 2) / 3;
  const midLng2 = (origStop.px + destStop.py * 2) / 3 - 0.002;

  const transitPath: [number, number][] = [
    [origStop.py, origStop.px],
    [midLat1, midLng1],
    [midLat2, midLng2],
    [destStop.py, destStop.px]
  ];

  const walkToDestPath = generatePedestrianWaypoints(
    [destStop.py, destStop.px],
    [destLoc.lat, destLoc.lng]
  );

  const steps: RouteStep[] = [
    {
      type: 'WALK',
      instruction: `Caminhe a pé até ${origStop.np}`,
      detailedWalkGuide: `Siga pelas calçadas por ${walkToStopMeters}m (~${walkToStopSteps} passos). Tempo estimado: ${walkToStopMinutes} min.`,
      durationMinutes: walkToStopMinutes,
      distanceMeters: walkToStopMeters,
      estimatedSteps: walkToStopSteps,
      stopName: origStop.np
    },
    {
      type: 'BUS',
      instruction: `Embarque na linha ${line.lt}-${line.tl} (${line.ts})`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${line.lt}-${line.tl}`,
      busDestination: line.ts,
      nextBusEtaMinutes: hasRealTimeEta ? busEtaMinutes : undefined,
      accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
      lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real' : 'Sem sinal GPS em tempo real disponível'
    },
    {
      type: 'WALK',
      instruction: `Desembarque em ${destStop.np} e caminhe a pé até o destino`,
      detailedWalkGuide: `Caminhada final de ${walkToDestMeters}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
      durationMinutes: walkToDestMinutes,
      distanceMeters: walkToDestMeters,
      estimatedSteps: walkToDestSteps,
      stopName: destStop.np
    },
    {
      type: 'DESTINATION',
      instruction: `Chegada no destino: ${destLoc.name}`,
      durationMinutes: 0,
      distanceMeters: 0
    }
  ];

  return {
    id: `route_${line.lt}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureStop: origStop,
    arrivalStop: destStop,
    recommendedLine: line,
    nextBusEtaMinutes: hasRealTimeEta ? busEtaMinutes : -1,
    nextBusVehiclePrefix: vehiclePrefix || undefined,
    departureSuggestion,
    accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
    lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real (Alta Precisão)' : 'Sem sinal GPS em tempo real disponível para esta linha',
    steps,
    polyline: {
      walkToStop: walkToStopPath,
      transit: transitPath,
      walkToDest: walkToDestPath
    }
  };
}
```

- [ ] **Step 5: Replace the search engine with real GTFS lookups**

Replace `src/lib/routing.ts:368-431` (from the `calculateRoute` doc comment to the end of the function) with:

```ts
function stopIdToCodigoParada(stopId: string): number {
  const n = Number(stopId);
  if (!Number.isFinite(n)) {
    throw new Error(`stop_id do GTFS não é numérico e não pode ser usado como código de parada da Olho Vivo: ${stopId}`);
  }
  return n;
}

function gtfsStopToParada(stop: NearbyStop): SPTransParada {
  return {
    cp: stopIdToCodigoParada(stop.stopId),
    np: stop.name,
    ed: '',
    py: stop.lat,
    px: stop.lng
  };
}

function directRouteToLinha(route: DirectRoute): SPTransLinha {
  const numericCl = Number(route.routeId.replace(/\D/g, '')) || 0;
  const [ladoA, ladoB] = (route.routeLongName || '').split(/[-–]/).map(s => s.trim());

  return {
    cl: numericCl,
    lc: false,
    lt: route.routeShortName || route.routeId,
    tl: 10,
    sl: 1,
    tp: ladoA || '',
    ts: route.tripHeadsign || ladoB || ''
  };
}

async function resolveRealTimeEta(codigoParada: number, letreiro: string): Promise<{ eta: number; prefix: string }> {
  const { previsao } = await buscarPrevisaoParada(codigoParada);
  const linhaPrevisao = previsao?.p?.l.find(l => l.c.startsWith(letreiro));
  const proximoVeiculo = linhaPrevisao?.vs[0];

  if (!proximoVeiculo) {
    return { eta: -1, prefix: '' };
  }

  const [horas, minutos] = proximoVeiculo.t.split(':').map(Number);
  const agora = new Date();
  let etaMinutos = (horas * 60 + minutos) - (agora.getHours() * 60 + agora.getMinutes());
  if (etaMinutos < 0) etaMinutos += 24 * 60;

  return { eta: etaMinutos, prefix: proximoVeiculo.p };
}

/**
 * Motor de Roteirização Multimodal — busca paradas e linhas reais (GTFS)
 * perto da origem e do destino. Apenas viagens diretas (sem baldeação);
 * rotas com troca de ônibus ficam para uma fase futura do roteiro.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation
): Promise<RouteSearchResult> {
  const origNearby = await findNearbyStops(originLoc.lat, originLoc.lng);
  if (origNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada.');
  }

  const destNearby = await findNearbyStops(destLoc.lat, destLoc.lng);
  if (destNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado.');
  }

  const directRoutes = await findDirectRoutes(
    origNearby.map(s => s.stopId),
    destNearby.map(s => s.stopId)
  );

  if (directRoutes.length === 0) {
    throw new Error('Nenhuma linha direta encontrada conectando a origem ao destino. Rotas com baldeação ainda não são suportadas.');
  }

  const stopById = new Map<string, NearbyStop>(
    [...origNearby, ...destNearby].map(stop => [stop.stopId, stop])
  );

  const plans = await Promise.all(
    directRoutes.map(async (route) => {
      const origStopInfo = stopById.get(route.originStopId);
      const destStopInfo = stopById.get(route.destStopId);
      if (!origStopInfo || !destStopInfo) return null;

      const origStop = gtfsStopToParada(origStopInfo);
      const destStop = gtfsStopToParada(destStopInfo);
      const line = directRouteToLinha(route);

      const { eta, prefix } = await resolveRealTimeEta(origStop.cp, line.lt);

      return buildPlanForLine(originLoc, destLoc, line, origStop, destStop, eta, prefix);
    })
  );

  const validPlans = plans.filter((plan): plan is RoutePlan => plan !== null);
  validPlans.sort((a, b) => a.totalDurationMinutes - b.totalDurationMinutes);

  return {
    primaryRoute: validPlans[0],
    alternatives: validPlans
  };
}
```

- [ ] **Step 6: Run it to verify it passes**

Run: `npm test -- src/lib/routing.test.ts`
Expected: `4 passed`.

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: all tests across every file pass (some Supabase-dependent smoke tests may `skip` if `.env.local` isn't loaded in this shell — that's expected, not a failure).

- [ ] **Step 8: Commit**

```bash
git add src/lib/routing.ts src/lib/routing.test.ts
git commit -m "feat: route planner uses real GTFS stops/lines instead of hardcoded demo data"
```

---

## Task 9: Manual end-to-end verification

This is the check described in the design spec's "Testes" section. It cannot be automated without a browser/e2e harness (none exists in this project), so it's a manual checklist.

**Files:** none (verification only).

- [ ] **Step 1: Start the app**

Run: `npm run dev`

- [ ] **Step 2: Cross-check the stop_id ↔ código de parada assumption**

In the Supabase SQL Editor, run:

```sql
select stop_id, name from public.gtfs_stops where name ilike '%SHOPPING CENTER NORTE%';
```

Confirm one of the returned `stop_id` values is `340015350` — the same código de parada already hardcoded in `src/lib/mockData.ts` for this stop. If it does not match, `gtfsStopToParada`'s `Number(stopId)` in Task 8 is feeding the wrong código de parada into `buscarPrevisaoParada`, and real-time ETAs will silently come back empty (not wrong — `resolveRealTimeEta` degrades to `hasRealTimeEta: false` — but it should be investigated rather than assumed correct).

- [ ] **Step 3: Regression-test the existing demo corridor**

In the app, plan a route from "Rua Flor de Maio, 40" to "Shopping Center Norte" (the corridor `MOCK_PARADAS`/`MOCK_LINHAS` used to hardcode). Confirm the `1703` line still appears as an option, now sourced from real GTFS data instead of the hardcoded array.

- [ ] **Step 4: Test a region the demo data never covered**

Plan a route from "Avenida Paulista, 1578" to "Vila Madalena" (or another pair with no relation to the original 8 `MOCK_PARADAS` stops). Confirm the app returns real, plausible SPTrans stop names and line numbers for that area — this is the capability this whole plan exists to add, and it was impossible to test correctly before this work.

- [ ] **Step 5: Confirm the "no real-time data" path is honest, not fabricated**

Pick a real stop discovered in Step 4 and, in the Supabase SQL Editor or via a quick script, note its `stop_id`. If `SPTRANS_TOKEN` is configured and authenticated, and that specific stop currently has no vehicles predicted by Olho Vivo, confirm the UI shows the "Sem previsão em tempo real" message from Task 8's `buildPlanForLine` change — not a fabricated ETA borrowed from the Shopping Center Norte demo data (the old behavior, fixed in Task 7).

- [ ] **Step 6: Note the outcome**

No commit for this task — record any follow-up issues found (e.g., the stop_id mismatch from Step 2, or unexpectedly large `gtfs_stop_times`) as new tasks/notes rather than silently reworking earlier tasks after the fact.

---

## Task 10: Update documentation

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the new environment variables and import step**

In `README.md`, in the "Configurar variáveis de ambiente" section (around line 56-69), add the two new variables shown in `.env.example` (`TRANSITLAND_API_KEY`, `SUPABASE_DB_URL`) with the same descriptions used there.

Add a new subsection right after the existing "Esquema do Banco de Dados (Supabase SQL)" section (around line 80-115) explaining the GTFS import:

```markdown
## 🗺️ Importação de Dados GTFS (Paradas e Linhas Reais)

O planejador de rotas usa uma base real de paradas e linhas de toda São Paulo, importada do GTFS oficial da SPTrans (via espelho gratuito do Transitland) para dentro do Supabase.

1. Execute `supabase/gtfs_schema.sql` e depois `supabase/gtfs_functions.sql` no SQL Editor do seu projeto Supabase (uma única vez, ou sempre que quiser recriar o esquema).
2. Configure `TRANSITLAND_API_KEY` e `SUPABASE_DB_URL` no `.env.local` (veja `.env.example`).
3. Rode `npm run import:gtfs` para baixar o feed mais recente e carregar as tabelas `gtfs_*`.

O feed da SPTrans é atualizado diariamente pelo Transitland, mas a reimportação é manual — rode `npm run import:gtfs` novamente quando quiser atualizar (isso substitui todos os dados `gtfs_*` antigos).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document GTFS import setup"
```

---

## Coverage check against the design spec

- Real stop search by coordinate, city-wide → Tasks 2, 3, 6, 8.
- Real direct-line search between origin/destination → Tasks 2, 3, 6, 8.
- Scheduled times stored for future phases (depart-at/arrive-by) → `gtfs_stop_times.arrival_time_seconds`/`departure_time_seconds` in Task 2 (not consumed yet — intentionally out of scope here).
- Real-time Olho Vivo overlay anchored to dynamically-discovered stops/lines → Task 8's `resolveRealTimeEta`.
- No silent mock fallback for real per-stop absence of data → Task 7.
- Free-tier size risk called out with a concrete decision point → Task 5, Step 7.
- Explicitly out of scope (transfers, depart/arrive solving, walk-speed preference, rail integration, payments) → untouched in this plan, as agreed in the design spec.
