# Roteirização com Baldeação (Fase 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the route planner to find viable multi-leg (transfer) bus journeys, not just direct ones — searching in "waves" (0 transfers, then 1, then 2, ...) up to a safety cap — and widen the stop-search radius from 600 m to 2.5 km, so trips that trade a longer walk for fewer transfers become findable. Results are sorted by **total estimated time first**, then total walking distance, then transfer count.

**Architecture:** A new SQL function `routes_from_stops` generalizes the existing `direct_routes_between` by dropping the destination filter, giving "what's reachable from here in one more ride." A round-based breadth-first search in `src/lib/routing.ts` uses this (plus the existing `findDirectRoutes`) to expand a frontier of reachable stops round by round, checking connectivity to the destination after every expansion. The existing single-leg plan builder (`buildPlanForLine`) is replaced by a general `buildMultiLegPlan` that handles 1-or-more legs uniformly (a direct trip is just the 1-leg case), reusing the same walking/distance math as before.

**Tech Stack:** Same as Phase 1 (Next.js/TypeScript, Supabase Postgres, vitest). No new dependencies.

---

## Task 1: `routes_from_stops` SQL function

**Files:**
- Modify: `supabase/gtfs_functions.sql`
- Create: `scripts/gtfs/routes-from-stops.smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

Create `scripts/gtfs/routes-from-stops.smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)('routes_from_stops (Supabase)', () => {
  const supabase = createClient(url as string, anonKey as string);

  it('is callable and returns an array', async () => {
    const { data, error } = await supabase.rpc('routes_from_stops', {
      origin_stop_ids: ['does-not-exist-1'],
      max_results: 5
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('returns stops with name/lat/lng for a real origin', async () => {
    // Parada real perto do Jd. Fontális, já usada nos testes da Fase 1.
    const { data, error } = await supabase.rpc('routes_from_stops', {
      origin_stop_ids: ['8313415'],
      max_results: 20
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    if ((data as any[]).length > 0) {
      const row = (data as any[])[0];
      expect(typeof row.dest_stop_name).toBe('string');
      expect(typeof row.dest_stop_lat).toBe('number');
      expect(typeof row.dest_stop_lng).toBe('number');
    }
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- routes-from-stops.smoke`
Expected: FAIL — `Could not find the function public.routes_from_stops(...)`.

- [ ] **Step 3: Add the SQL function**

Append to `supabase/gtfs_functions.sql`:

```sql
-- ========================================================
-- GTFS — EXPANSÃO DE ALCANCE (Fase 2: baldeação)
-- Execute após as funções acima, no mesmo SQL Editor.
-- ========================================================

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
  select distinct
    r.route_id,
    r.short_name as route_short_name,
    r.long_name as route_long_name,
    o.trip_id,
    t.headsign as trip_headsign,
    o.stop_id as origin_stop_id,
    o.departure_time_seconds as origin_departure_seconds,
    d.stop_id as dest_stop_id,
    ds.name as dest_stop_name,
    ds.lat as dest_stop_lat,
    ds.lng as dest_stop_lng,
    d.arrival_time_seconds as dest_arrival_seconds
  from public.gtfs_stop_times o
  join public.gtfs_stop_times d
    on o.trip_id = d.trip_id
    and d.stop_sequence > o.stop_sequence
  join public.gtfs_trips t on t.trip_id = o.trip_id
  join public.gtfs_routes r on r.route_id = t.route_id
  join public.gtfs_stops ds on ds.stop_id = d.stop_id
  where o.stop_id = any(origin_stop_ids)
    and r.route_type = any(route_types)
  order by o.departure_time_seconds asc
  limit least(max_results, 500);
$$;

grant execute on function public.routes_from_stops(text[], integer, integer[]) to anon, authenticated;
```

- [ ] **Step 4: Apply it (manual action)**

This sandbox has no network path to raw Postgres — same constraint as every SQL change in Phase 1. Open the Supabase SQL Editor (`https://supabase.com/dashboard/project/andnuavykwjcivlesnky/sql`) and run the new block above (it's additive — safe to run alongside the existing functions already there).

- [ ] **Step 5: Run the test again to verify it passes**

Run: `npm test -- routes-from-stops.smoke`
Expected: `2 passed`.

- [ ] **Step 6: Commit**

```bash
git add supabase/gtfs_functions.sql scripts/gtfs/routes-from-stops.smoke.test.ts
git commit -m "feat: add routes_from_stops SQL function for transfer-search expansion"
```

---

## Task 2: `findRoutesFromStops` wrapper in `src/lib/gtfs.ts`

**Files:**
- Modify: `src/lib/gtfs.ts`
- Modify: `src/lib/gtfs.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/lib/gtfs.test.ts` (new `describe` block, alongside the existing `findNearbyStops`/`findDirectRoutes` ones — don't remove or change those):

```ts
describe('findRoutesFromStops', () => {
  it('calls the routes_from_stops RPC with the right parameters and maps the rows', async () => {
    (supabase.rpc as any).mockResolvedValue({
      data: [
        {
          route_id: '1703-10',
          route_short_name: '1703-10',
          route_long_name: 'JD. FONTALIS - SHOPPING CENTER NORTE',
          trip_id: 'trip_1',
          trip_headsign: 'SHOPPING CENTER NORTE',
          origin_stop_id: 'A',
          origin_departure_seconds: 100,
          dest_stop_id: 'B',
          dest_stop_name: 'PARADA B',
          dest_stop_lat: -23.5,
          dest_stop_lng: -46.6,
          dest_arrival_seconds: 200
        }
      ],
      error: null
    });

    const result = await findRoutesFromStops(['A']);

    expect(supabase.rpc).toHaveBeenCalledWith('routes_from_stops', {
      origin_stop_ids: ['A'],
      max_results: 300
    });
    expect(result).toEqual([
      {
        routeId: '1703-10',
        routeShortName: '1703-10',
        routeLongName: 'JD. FONTALIS - SHOPPING CENTER NORTE',
        tripId: 'trip_1',
        tripHeadsign: 'SHOPPING CENTER NORTE',
        originStopId: 'A',
        originDepartureSeconds: 100,
        destStopId: 'B',
        destStopName: 'PARADA B',
        destStopLat: -23.5,
        destStopLng: -46.6,
        destArrivalSeconds: 200
      }
    ]);
  });

  it('throws a clear error when the RPC call fails', async () => {
    (supabase.rpc as any).mockResolvedValue({ data: null, error: { message: 'function not found' } });

    await expect(findRoutesFromStops(['A'])).rejects.toThrow('Falha ao buscar linhas alcançáveis');
  });
});
```

Add `findRoutesFromStops` to the existing import line at the top of the test file (`import { findNearbyStops, findDirectRoutes } from '@/lib/gtfs';` becomes `import { findNearbyStops, findDirectRoutes, findRoutesFromStops } from '@/lib/gtfs';`).

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/lib/gtfs.test.ts`
Expected: FAIL — `findRoutesFromStops is not a function` (or a TypeScript error if you run `tsc` first).

- [ ] **Step 3: Implement it**

Append to `src/lib/gtfs.ts`:

```ts
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
  maxResults = 300
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
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npm test -- src/lib/gtfs.test.ts`
Expected: `6 passed` (4 existing + 2 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/gtfs.ts src/lib/gtfs.test.ts
git commit -m "feat: add findRoutesFromStops wrapper for transfer-search expansion"
```

---

## Task 3: Unified multi-leg plan builder (replaces `buildPlanForLine`)

**Files:**
- Modify: `src/lib/routing.ts` (the `RoutePlan` interface, and replace `buildPlanForLine` with `buildMultiLegPlan`)
- Modify: `src/lib/routing.test.ts`

This task changes the plan *builder* only. `calculateRoute` itself (and the BFS that finds multi-leg candidates) is Task 4 — for this task, `buildMultiLegPlan` is unit-tested directly by calling it, not through `calculateRoute`.

- [ ] **Step 1: Write the failing tests**

Add to `src/lib/routing.test.ts`. First, add this import at the top (alongside the existing ones):

```ts
import { buildMultiLegPlan } from '@/lib/routing';
```

`buildMultiLegPlan` is not exported yet in the current code — exporting it is part of this task, so this import currently fails to resolve a named export (that's the expected failure).

Then add a new `describe` block (don't touch the existing `describe('calculateRoute', ...)` block in this task):

```ts
describe('buildMultiLegPlan', () => {
  const originLoc = { name: 'Origem', lat: -23.4338, lng: -46.5778 };
  const destLoc = { name: 'Destino', lat: -23.5152, lng: -46.619 };

  const boardStop1 = { cp: 8313415, np: 'R. Flor De Maio, 59', ed: '', py: -23.4328, px: -46.5786 };
  const alightStop1 = { cp: 8812600, np: 'Av. Otto Baumgart, 0', ed: '', py: -23.516, px: -46.6165 };
  const line1 = { cl: 1703, lc: false, lt: '1703', tl: 10, sl: 1, tp: 'JD. FONTALIS', ts: 'SHOPPING CENTER NORTE' };

  it('builds a single-leg (direct) plan with transferCount 0', () => {
    const plan = buildMultiLegPlan(originLoc, destLoc, [
      { line: line1, boardStop: boardStop1, alightStop: alightStop1, etaMinutes: 5, vehiclePrefix: '21045' }
    ]);

    expect(plan.transferCount).toBe(0);
    expect(plan.recommendedLine.lt).toBe('1703');
    expect(plan.departureStop.cp).toBe(8313415);
    expect(plan.arrivalStop.cp).toBe(8812600);
    expect(plan.nextBusEtaMinutes).toBe(5);
    // WALK (to stop) + BUS + WALK (to destination) + DESTINATION = 4 steps, no transfer step
    expect(plan.steps.map(s => s.type)).toEqual(['WALK', 'BUS', 'WALK', 'DESTINATION']);
  });

  it('builds a two-leg (1 transfer) plan with a transfer walk step when stops differ', () => {
    const transferBoardStop = { cp: 8812601, np: 'Av. Otto Baumgart, 50', ed: '', py: -23.5162, px: -46.617 };
    const finalAlightStop = { cp: 9000001, np: 'Parada Final', ed: '', py: -23.55, px: -46.63 };
    const line2 = { cl: 172, lc: false, lt: '172N', tl: 10, sl: 1, tp: 'SHOPPING CENTER NORTE', ts: 'METRO BELEM' };

    const plan = buildMultiLegPlan(originLoc, destLoc, [
      { line: line1, boardStop: boardStop1, alightStop: alightStop1, etaMinutes: 5, vehiclePrefix: '21045' },
      { line: line2, boardStop: transferBoardStop, alightStop: finalAlightStop, etaMinutes: -1, vehiclePrefix: '' }
    ]);

    expect(plan.transferCount).toBe(1);
    expect(plan.departureStop.cp).toBe(8313415);
    expect(plan.arrivalStop.cp).toBe(9000001);
    // WALK (to stop) + BUS + WALK (transfer) + BUS + WALK (to destination) + DESTINATION
    expect(plan.steps.map(s => s.type)).toEqual(['WALK', 'BUS', 'WALK', 'BUS', 'WALK', 'DESTINATION']);
    expect(plan.departureSuggestion).toContain('1 baldeação');
  });

  it('uses a zero-distance "wait" step instead of a walk when the transfer is at the same stop', () => {
    const line2 = { cl: 172, lc: false, lt: '172N', tl: 10, sl: 1, tp: 'SHOPPING CENTER NORTE', ts: 'METRO BELEM' };
    const finalAlightStop = { cp: 9000001, np: 'Parada Final', ed: '', py: -23.55, px: -46.63 };

    const plan = buildMultiLegPlan(originLoc, destLoc, [
      { line: line1, boardStop: boardStop1, alightStop: alightStop1, etaMinutes: 5, vehiclePrefix: '21045' },
      { line: line2, boardStop: alightStop1, alightStop: finalAlightStop, etaMinutes: -1, vehiclePrefix: '' }
    ]);

    const transferStep = plan.steps[2];
    expect(transferStep.type).toBe('WALK');
    expect(transferStep.distanceMeters).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- src/lib/routing.test.ts`
Expected: FAIL — `buildMultiLegPlan` is not exported / is undefined.

- [ ] **Step 3: Add `transferCount` to `RoutePlan`**

In `src/lib/routing.ts`, find the `RoutePlan` interface (currently right after `RouteStep`) and add one field. Current:

```ts
export interface RoutePlan {
  id: string;
  origin: RouteLocation;
  destination: RouteLocation;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalWalkDistanceMeters: number;
  totalWalkDurationMinutes: number;
  totalEstimatedSteps: number;
  departureStop: SPTransParada;
  arrivalStop: SPTransParada;
  recommendedLine: SPTransLinha;
  nextBusEtaMinutes: number;
  nextBusVehiclePrefix?: string;
  departureSuggestion: string;
  accuracyLevel: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText: string;
  steps: RouteStep[];
  polyline: {
    walkToStop: [number, number][];
    transit: [number, number][];
    walkToDest: [number, number][];
  };
}
```

New (only the addition is `transferCount`, placed right after `recommendedLine`):

```ts
export interface RoutePlan {
  id: string;
  origin: RouteLocation;
  destination: RouteLocation;
  totalDurationMinutes: number;
  totalDistanceMeters: number;
  totalWalkDistanceMeters: number;
  totalWalkDurationMinutes: number;
  totalEstimatedSteps: number;
  departureStop: SPTransParada;
  arrivalStop: SPTransParada;
  recommendedLine: SPTransLinha;
  transferCount: number;
  nextBusEtaMinutes: number;
  nextBusVehiclePrefix?: string;
  departureSuggestion: string;
  accuracyLevel: 'HIGH' | 'MEDIUM' | 'ESTIMATED';
  lastTelemetryText: string;
  steps: RouteStep[];
  polyline: {
    walkToStop: [number, number][];
    transit: [number, number][];
    walkToDest: [number, number][];
  };
}
```

`recommendedLine` continues to mean "the first leg's line" (what the rider boards first — the immediately actionable information), `departureStop` is the first leg's boarding stop, and `arrivalStop` becomes the *last* leg's alighting stop (where the rider gets off the bus for the final time, before walking to the destination). `nextBusEtaMinutes`/`nextBusVehiclePrefix` continue to describe the first leg only — that is what determines "when do I need to leave," which is what these fields have always been used for in the UI.

- [ ] **Step 4: Replace `buildPlanForLine` with `buildMultiLegPlan`**

`buildMultiLegPlan` handles both the direct (1-leg) case and multi-leg cases uniformly — a direct trip is just the special case of exactly one leg with no transfer step in between. Find the full `buildPlanForLine` function in `src/lib/routing.ts` (currently spans from its doc comment down to its closing `}`, right before `stopIdToCodigoParada`) and delete it entirely. In its place, add:

```ts
export interface DiscoveredLeg {
  line: SPTransLinha;
  boardStop: SPTransParada;
  alightStop: SPTransParada;
  etaMinutes: number;
  vehiclePrefix: string;
}

/**
 * Constrói um RoutePlan completo a partir de uma ou mais pernas de ônibus já
 * resolvidas (parada de embarque, parada de desembarque, linha e previsão em
 * tempo real de cada perna). Uma viagem direta é apenas o caso de uma única
 * perna — sem baldeação, sem etapa de transferência entre pernas.
 */
export function buildMultiLegPlan(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  legs: DiscoveredLeg[]
): RoutePlan {
  const firstLeg = legs[0];
  const lastLeg = legs[legs.length - 1];
  const transferCount = legs.length - 1;

  const steps: RouteStep[] = [];
  const transitPolyline: [number, number][] = [];

  let totalDurationMinutes = 0;
  let totalDistanceMeters = 0;
  let totalWalkDistanceMeters = 0;
  let totalWalkDurationMinutes = 0;
  let totalEstimatedSteps = 0;

  const walkToStopMeters = Math.max(120, getDistanceMeters(originLoc.lat, originLoc.lng, firstLeg.boardStop.py, firstLeg.boardStop.px));
  const walkToStopMinutes = Math.max(2, Math.round(walkToStopMeters / 75));
  const walkToStopSteps = Math.round(walkToStopMeters / 0.75);
  const walkToStopPath = generatePedestrianWaypoints(
    [originLoc.lat, originLoc.lng],
    [firstLeg.boardStop.py, firstLeg.boardStop.px]
  );

  steps.push({
    type: 'WALK',
    instruction: `Caminhe a pé até ${firstLeg.boardStop.np}`,
    detailedWalkGuide: `Siga pelas calçadas por ${walkToStopMeters}m (~${walkToStopSteps} passos). Tempo estimado: ${walkToStopMinutes} min.`,
    durationMinutes: walkToStopMinutes,
    distanceMeters: walkToStopMeters,
    estimatedSteps: walkToStopSteps,
    stopName: firstLeg.boardStop.np
  });

  totalWalkDistanceMeters += walkToStopMeters;
  totalWalkDurationMinutes += walkToStopMinutes;
  totalEstimatedSteps += walkToStopSteps;
  totalDurationMinutes += walkToStopMinutes;
  totalDistanceMeters += walkToStopMeters;

  for (let i = 0; i < legs.length; i++) {
    const leg = legs[i];
    const hasRealTimeEta = leg.etaMinutes >= 0;

    const transitDistanceMeters = getDistanceMeters(leg.boardStop.py, leg.boardStop.px, leg.alightStop.py, leg.alightStop.px) || 4500;
    const transitMinutes = Math.max(12, Math.round(transitDistanceMeters / 280));

    steps.push({
      type: 'BUS',
      instruction: `Embarque na linha ${leg.line.lt}-${leg.line.tl} (${leg.line.ts})`,
      detailedWalkGuide: `Aguarde na parada. Letreiro do ônibus: DESTINO ${leg.line.ts}`,
      durationMinutes: transitMinutes,
      distanceMeters: transitDistanceMeters,
      busLine: `${leg.line.lt}-${leg.line.tl}`,
      busDestination: leg.line.ts,
      nextBusEtaMinutes: hasRealTimeEta ? leg.etaMinutes : undefined,
      accuracyLevel: hasRealTimeEta ? 'HIGH' : 'ESTIMATED',
      lastTelemetryText: hasRealTimeEta ? 'Sinal GPS em tempo real' : 'Sem sinal GPS em tempo real disponível',
      stopName: leg.alightStop.np
    });

    const midLat1 = (leg.boardStop.py * 2 + leg.alightStop.py) / 3;
    const midLng1 = (leg.boardStop.px * 2 + leg.alightStop.px) / 3 + 0.003;
    const midLat2 = (leg.boardStop.py + leg.alightStop.py * 2) / 3;
    const midLng2 = (leg.boardStop.px + leg.alightStop.py * 2) / 3 - 0.002;
    transitPolyline.push(
      [leg.boardStop.py, leg.boardStop.px],
      [midLat1, midLng1],
      [midLat2, midLng2],
      [leg.alightStop.py, leg.alightStop.px]
    );

    totalDurationMinutes += transitMinutes;
    totalDistanceMeters += transitDistanceMeters;

    const nextLeg = legs[i + 1];
    if (nextLeg) {
      const transferMeters = getDistanceMeters(leg.alightStop.py, leg.alightStop.px, nextLeg.boardStop.py, nextLeg.boardStop.px);

      if (transferMeters > 30) {
        const transferMinutes = Math.max(1, Math.round(transferMeters / 75));
        const transferSteps = Math.round(transferMeters / 0.75);
        steps.push({
          type: 'WALK',
          instruction: `Faça a baldeação a pé até ${nextLeg.boardStop.np}`,
          detailedWalkGuide: `Caminhe ${transferMeters}m (~${transferSteps} passos) até o próximo ponto de embarque.`,
          durationMinutes: transferMinutes,
          distanceMeters: transferMeters,
          estimatedSteps: transferSteps,
          stopName: nextLeg.boardStop.np
        });
        totalWalkDistanceMeters += transferMeters;
        totalWalkDurationMinutes += transferMinutes;
        totalEstimatedSteps += transferSteps;
        totalDurationMinutes += transferMinutes;
        totalDistanceMeters += transferMeters;
      } else {
        steps.push({
          type: 'WALK',
          instruction: `Aguarde a próxima linha em ${nextLeg.boardStop.np}`,
          durationMinutes: 0,
          distanceMeters: 0,
          stopName: nextLeg.boardStop.np
        });
      }
    }
  }

  const walkToDestMeters = Math.max(80, getDistanceMeters(destLoc.lat, destLoc.lng, lastLeg.alightStop.py, lastLeg.alightStop.px));
  const walkToDestMinutes = Math.max(1, Math.round(walkToDestMeters / 75));
  const walkToDestSteps = Math.round(walkToDestMeters / 0.75);
  const walkToDestPath = generatePedestrianWaypoints(
    [lastLeg.alightStop.py, lastLeg.alightStop.px],
    [destLoc.lat, destLoc.lng]
  );

  steps.push({
    type: 'WALK',
    instruction: `Desembarque em ${lastLeg.alightStop.np} e caminhe a pé até o destino`,
    detailedWalkGuide: `Caminhada final de ${walkToDestMeters}m (~${walkToDestSteps} passos) até ${destLoc.name}.`,
    durationMinutes: walkToDestMinutes,
    distanceMeters: walkToDestMeters,
    estimatedSteps: walkToDestSteps,
    stopName: lastLeg.alightStop.np
  });

  steps.push({
    type: 'DESTINATION',
    instruction: `Chegada no destino: ${destLoc.name}`,
    durationMinutes: 0,
    distanceMeters: 0
  });

  totalWalkDistanceMeters += walkToDestMeters;
  totalWalkDurationMinutes += walkToDestMinutes;
  totalEstimatedSteps += walkToDestSteps;
  totalDurationMinutes += walkToDestMinutes;
  totalDistanceMeters += walkToDestMeters;

  const hasFirstLegEta = firstLeg.etaMinutes >= 0;

  let departureSuggestion = '';
  if (!hasFirstLegEta) {
    departureSuggestion = `🚶 Caminhe até ${firstLeg.boardStop.np} (${walkToStopMinutes} min). Sem previsão em tempo real para a linha ${firstLeg.line.lt} agora — confira o horário no ponto.`;
  } else if (firstLeg.etaMinutes <= walkToStopMinutes + 1) {
    departureSuggestion = `⚡ Saia a pé agora! Você leva ${walkToStopMinutes} min até o ponto e o ônibus #${firstLeg.vehiclePrefix} chega em ${firstLeg.etaMinutes} min.`;
  } else {
    const waitTime = firstLeg.etaMinutes - walkToStopMinutes;
    departureSuggestion = `🚶 Saia a pé em ~${waitTime} min para chegar ao ponto exatamente quando o ônibus #${firstLeg.vehiclePrefix} estiver se aproximando.`;
  }
  if (transferCount > 0) {
    departureSuggestion += ` Essa viagem tem ${transferCount} ${transferCount === 1 ? 'baldeação' : 'baldeações'}.`;
  }

  return {
    id: `route_${legs.map(l => l.line.lt).join('_')}_${Date.now()}`,
    origin: originLoc,
    destination: destLoc,
    totalDurationMinutes,
    totalDistanceMeters,
    totalWalkDistanceMeters,
    totalWalkDurationMinutes,
    totalEstimatedSteps,
    departureStop: firstLeg.boardStop,
    arrivalStop: lastLeg.alightStop,
    recommendedLine: firstLeg.line,
    transferCount,
    nextBusEtaMinutes: hasFirstLegEta ? firstLeg.etaMinutes : -1,
    nextBusVehiclePrefix: firstLeg.vehiclePrefix || undefined,
    departureSuggestion,
    accuracyLevel: hasFirstLegEta ? 'HIGH' : 'ESTIMATED',
    lastTelemetryText: hasFirstLegEta ? 'Sinal GPS em tempo real (Alta Precisão)' : 'Sem sinal GPS em tempo real disponível para esta linha',
    steps,
    polyline: {
      walkToStop: walkToStopPath,
      transit: transitPolyline,
      walkToDest: walkToDestPath
    }
  };
}
```

Note: `buildMultiLegPlan` is synchronous (it takes already-resolved `etaMinutes`/`vehiclePrefix` per leg, instead of calling `resolveRealTimeEta` itself like the old `buildPlanForLine` did). Real-time ETA resolution moves to the caller (Task 4's BFS) so that each leg's ETA can be resolved concurrently and independently, and so this function stays a pure, easily-testable builder with no network dependency.

- [ ] **Step 5: Run it to verify it passes**

Run: `npm test -- src/lib/routing.test.ts`
Expected: the 3 new `buildMultiLegPlan` tests pass. The existing `calculateRoute` tests in this same file will now FAIL to compile/run, because `calculateRoute` still calls the now-deleted `buildPlanForLine` — that's expected and is fixed in Task 4, not this task. Confirm specifically that the **3 new tests** pass; don't worry about the rest of the file yet.

- [ ] **Step 6: Commit**

```bash
git add src/lib/routing.ts src/lib/routing.test.ts
git commit -m "refactor: replace single-leg buildPlanForLine with unified buildMultiLegPlan"
```

---

## Task 4: Round-based transfer search, rewiring `calculateRoute`

**Files:**
- Modify: `src/lib/routing.ts`
- Modify: `src/lib/routing.test.ts`

- [ ] **Step 1: Update the existing `calculateRoute` tests**

The existing `describe('calculateRoute', ...)` block in `src/lib/routing.test.ts` needs two kinds of changes: (a) the module mock for `@/lib/gtfs` needs to also mock `findRoutesFromStops` (every existing test will otherwise crash calling an unmocked function, since `calculateRoute` now always attempts transfer expansion when direct search doesn't fully satisfy `MAX_ALTERNATIVES`), and (b) the "no direct route" test's expectations need to change, since that case no longer throws immediately — it now falls through to transfer search, and only throws if *that* also finds nothing.

Replace the top of the test file (the `vi.mock` calls and imports) from:

```ts
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
```

to:

```ts
vi.mock('@/lib/gtfs', () => ({
  findNearbyStops: vi.fn(),
  findDirectRoutes: vi.fn(),
  findRoutesFromStops: vi.fn()
}));

vi.mock('@/lib/sptrans', () => ({
  buscarPrevisaoParada: vi.fn()
}));

import { findNearbyStops, findDirectRoutes, findRoutesFromStops } from '@/lib/gtfs';
import { buscarPrevisaoParada } from '@/lib/sptrans';
import { calculateRoute, buildMultiLegPlan } from '@/lib/routing';
```

Then, in every existing test inside `describe('calculateRoute', ...)` that currently only mocks `findDirectRoutes` (not `findRoutesFromStops`), add `(findRoutesFromStops as any).mockResolvedValue([]);` right after the `findDirectRoutes` mock setup in that test, so the "no more expansion possible" path is well-defined instead of hitting an unmocked function. Concretely:

- The test `'lança erro claro quando não há linha direta entre origem e destino'` — this test's whole premise changes. Since `findRoutesFromStops` now also returns `[]` (no expansion possible), `calculateRoute` should now throw the Phase 2 error message instead of the Phase 1 one. Update it to:

```ts
  it('lança erro claro quando não há nenhuma rota (direta ou com baldeação) entre origem e destino', async () => {
    (findNearbyStops as any)
      .mockResolvedValueOnce([{ stopId: '340015353', name: 'TERMINAL JD. FONTALIS', lat: -23.4338, lng: -46.5778, distanceMeters: 50 }])
      .mockResolvedValueOnce([{ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619, distanceMeters: 50 }]);
    (findDirectRoutes as any).mockResolvedValue([]);
    (findRoutesFromStops as any).mockResolvedValue([]);

    await expect(calculateRoute(origin, dest)).rejects.toThrow('Nenhuma linha encontrada conectando a origem ao destino, mesmo considerando baldeações');
  });
```

- For every OTHER existing test in this `describe` block that mocks `findDirectRoutes` to return a non-empty array as its **first** (or only) `mockResolvedValueOnce` call (the happy-path tests, the sort-order test, the partial-failure test, the non-numeric-stop_id test): add `(findRoutesFromStops as any).mockResolvedValue([]);` right after their `findDirectRoutes` setup. This tells the round-2 expansion "there's nothing more to find," so the search stops after round 1 with just the direct-route results these tests already expect — preserving their existing assertions unchanged.

- [ ] **Step 2: Write the new failing tests for transfer search**

Add these tests to the end of the same `describe('calculateRoute', ...)` block:

```ts
  it('encontra uma rota com 1 baldeação quando não há linha direta, mas há conexão em 2 pernas', async () => {
    const origStop = { stopId: 'ORIG', name: 'PARADA ORIGEM', lat: -23.43, lng: -46.58, distanceMeters: 50 };
    const destStop = { stopId: 'DEST', name: 'PARADA DESTINO', lat: -23.51, lng: -46.62, distanceMeters: 50 };

    (findNearbyStops as any)
      .mockResolvedValueOnce([origStop])
      .mockResolvedValueOnce([destStop]);

    // Rodada 1: nenhuma linha direta da origem ao destino.
    (findDirectRoutes as any)
      .mockResolvedValueOnce([]) // ORIG -> DEST direto: não existe
      .mockResolvedValueOnce([  // TRANSFER -> DEST direto: existe (rodada 2)
        {
          routeId: '875-10',
          routeShortName: '875-10',
          routeLongName: 'TRANSFERENCIA - DESTINO',
          tripId: 'trip_b',
          tripHeadsign: 'PARADA DESTINO',
          originStopId: 'TRANSFER',
          originDepartureSeconds: 300,
          destStopId: 'DEST',
          destArrivalSeconds: 600
        }
      ]);

    // Expansão da fronteira: ORIG alcança TRANSFER em uma perna.
    (findRoutesFromStops as any)
      .mockResolvedValueOnce([
        {
          routeId: '1703-10',
          routeShortName: '1703-10',
          routeLongName: 'ORIGEM - TRANSFERENCIA',
          tripId: 'trip_a',
          tripHeadsign: 'PARADA TRANSFERENCIA',
          originStopId: 'ORIG',
          originDepartureSeconds: 0,
          destStopId: 'TRANSFER',
          destStopName: 'PARADA TRANSFERENCIA',
          destStopLat: -23.47,
          destStopLng: -46.6,
          destArrivalSeconds: 100
        }
      ])
      .mockResolvedValue([]); // rodadas seguintes: nada mais a expandir

    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.transferCount).toBe(1);
    expect(result.primaryRoute.steps.map((s: any) => s.type)).toEqual(['WALK', 'BUS', 'WALK', 'BUS', 'WALK', 'DESTINATION']);
  });

  it('mantém a rota direta como principal quando ela é a mais rápida', async () => {
    const origStop = { stopId: 'ORIG', name: 'PARADA ORIGEM', lat: -23.43, lng: -46.58, distanceMeters: 50 };
    const destStop = { stopId: 'DEST', name: 'PARADA DESTINO', lat: -23.51, lng: -46.62, distanceMeters: 50 };

    (findNearbyStops as any)
      .mockResolvedValueOnce([origStop])
      .mockResolvedValueOnce([destStop]);

    // Rodada 1: existe 1 linha direta. Sem nada a expandir, ela é a única
    // alternativa — e portanto a mais rápida por definição.
    (findDirectRoutes as any)
      .mockResolvedValueOnce([
        {
          routeId: '1703-10',
          routeShortName: '1703-10',
          routeLongName: 'ORIGEM - DESTINO',
          tripId: 'trip_direct',
          tripHeadsign: 'PARADA DESTINO',
          originStopId: 'ORIG',
          originDepartureSeconds: 0,
          destStopId: 'DEST',
          destArrivalSeconds: 900
        }
      ])
      .mockResolvedValue([]);

    (findRoutesFromStops as any).mockResolvedValue([]);
    (buscarPrevisaoParada as any).mockResolvedValue({ previsao: null, isMock: false });

    const result = await calculateRoute(origin, dest);

    expect(result.primaryRoute.transferCount).toBe(0);
  });
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- src/lib/routing.test.ts`
Expected: FAIL — `calculateRoute` doesn't yet expand beyond round 1, so the new "finds a route via 1 transfer" test fails (throws instead of succeeding), and other tests may fail from the unmocked `findRoutesFromStops` calls if Step 1's edits weren't applied yet.

- [ ] **Step 4: Implement the round-based search and rewire `calculateRoute`**

In `src/lib/routing.ts`, update the import line that currently reads:

```ts
import { findNearbyStops, findDirectRoutes, NearbyStop, DirectRoute } from '@/lib/gtfs';
```

to:

```ts
import { findNearbyStops, findDirectRoutes, findRoutesFromStops, NearbyStop, DirectRoute } from '@/lib/gtfs';
```

Then replace the existing `calculateRoute` function (everything from its doc comment to its closing `}`) with the following. This keeps `stopIdToCodigoParada`, `gtfsStopToParada`, `directRouteToLinha`, and `resolveRealTimeEta` exactly as they are today (defined just above `calculateRoute`) — this task only touches `calculateRoute` itself and adds the new BFS function right before it:

```ts
// Raio de 2,5 km (decidido com o usuário) — permite trocar uma baldeação por
// uma caminhada maior quando isso resulta em viagem mais rápida. A função SQL
// nearby_stops limita internamente em 3 km e 50 resultados, então estes valores
// ficam dentro do permitido.
const STOP_SEARCH_RADIUS_METERS = 2500;
const NEARBY_STOPS_LIMIT = 40;
const MAX_TRANSFER_ROUNDS = 4;
const MAX_FRONTIER_PER_ROUND = 40;
const MAX_ALTERNATIVES = 10;

interface FrontierEntry {
  stop: NearbyStop;
  legs: DiscoveredLeg[];
}

async function resolveLegEta(boardStop: SPTransParada, line: SPTransLinha): Promise<{ eta: number; prefix: string }> {
  try {
    return await resolveRealTimeEta(boardStop.cp, line.lt, line.ts);
  } catch (err) {
    console.warn(`[Routing] Falha ao buscar previsão em tempo real para a linha ${line.lt}:`, err);
    return { eta: -1, prefix: '' };
  }
}

/**
 * Busca em ondas: rodada 1 encontra viagens diretas (0 baldeações), rodada 2
 * expande a fronteira em uma perna e verifica conexão direta com o destino
 * (1 baldeação), e assim por diante, até um limite de segurança de rodadas.
 * Não há verificação de compatibilidade de horário entre pernas nesta fase
 * (ver docs/superpowers/specs/2026-08-21-transfer-routing-design.md) — apenas
 * conectividade real entre as linhas, na ordem correta de cada viagem GTFS.
 */
async function findMultiLegPlans(
  originLoc: RouteLocation,
  destLoc: RouteLocation,
  origNearby: NearbyStop[],
  destNearby: NearbyStop[]
): Promise<RoutePlan[]> {
  const destStopIds = destNearby.map(s => s.stopId);
  const destByStopId = new Map(destNearby.map(s => [s.stopId, s]));
  const visited = new Set<string>(origNearby.map(s => s.stopId));

  let frontier: FrontierEntry[] = origNearby.map(stop => ({ stop, legs: [] }));
  const plans: RoutePlan[] = [];

  for (let round = 1; round <= MAX_TRANSFER_ROUNDS && frontier.length > 0 && plans.length < MAX_ALTERNATIVES; round++) {
    const frontierByStopId = new Map(frontier.map(f => [f.stop.stopId, f]));
    const frontierStopIds = Array.from(frontierByStopId.keys());

    const directRoutes = await findDirectRoutes(frontierStopIds, destStopIds, 20);

    for (const route of directRoutes) {
      const originEntry = frontierByStopId.get(route.originStopId);
      const destStopInfo = destByStopId.get(route.destStopId);
      if (!originEntry || !destStopInfo) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop = gtfsStopToParada(destStopInfo);
      const { eta, prefix } = await resolveLegEta(boardStop, line);

      const legs: DiscoveredLeg[] = [...originEntry.legs, { line, boardStop, alightStop, etaMinutes: eta, vehiclePrefix: prefix }];
      plans.push(buildMultiLegPlan(originLoc, destLoc, legs));

      if (plans.length >= MAX_ALTERNATIVES) break;
    }

    if (plans.length >= MAX_ALTERNATIVES || round === MAX_TRANSFER_ROUNDS) break;

    const expansion = await findRoutesFromStops(frontierStopIds, 300);
    const nextFrontierByStopId = new Map<string, FrontierEntry>();

    for (const route of expansion) {
      if (visited.has(route.destStopId)) continue;
      if (nextFrontierByStopId.size >= MAX_FRONTIER_PER_ROUND) break;

      const originEntry = frontierByStopId.get(route.originStopId);
      if (!originEntry) continue;

      const line = directRouteToLinha(route);
      if (originEntry.legs.some(l => l.line.lt === line.lt)) continue;

      const boardStop = gtfsStopToParada(originEntry.stop);
      const alightStop: SPTransParada = {
        cp: stopIdToCodigoParada(route.destStopId),
        np: route.destStopName,
        ed: '',
        py: route.destStopLat,
        px: route.destStopLng
      };
      const { eta, prefix } = await resolveLegEta(boardStop, line);

      const legs: DiscoveredLeg[] = [...originEntry.legs, { line, boardStop, alightStop, etaMinutes: eta, vehiclePrefix: prefix }];
      visited.add(route.destStopId);
      nextFrontierByStopId.set(route.destStopId, {
        stop: { stopId: route.destStopId, name: route.destStopName, lat: route.destStopLat, lng: route.destStopLng, distanceMeters: 0 },
        legs
      });
    }

    frontier = Array.from(nextFrontierByStopId.values());
  }

  return plans;
}

/**
 * Motor de Roteirização Multimodal — busca paradas e linhas reais (GTFS)
 * perto da origem e do destino, incluindo viagens com baldeação quando não
 * há linha direta. Resultados ordenados por tempo total estimado (que já
 * inclui caminhada e espera), depois por distância a pé, depois por número
 * de baldeações — ver docs/superpowers/specs/2026-08-21-transfer-routing-design.md.
 */
export async function calculateRoute(
  originLoc: RouteLocation,
  destLoc: RouteLocation
): Promise<RouteSearchResult> {
  const origNearby = await findNearbyStops(originLoc.lat, originLoc.lng, STOP_SEARCH_RADIUS_METERS, NEARBY_STOPS_LIMIT);
  if (origNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto da origem informada.');
  }

  const destNearby = await findNearbyStops(destLoc.lat, destLoc.lng, STOP_SEARCH_RADIUS_METERS, NEARBY_STOPS_LIMIT);
  if (destNearby.length === 0) {
    throw new Error('Nenhuma parada de ônibus encontrada perto do destino informado.');
  }

  const plans = await findMultiLegPlans(originLoc, destLoc, origNearby, destNearby);

  if (plans.length === 0) {
    throw new Error('Nenhuma linha encontrada conectando a origem ao destino, mesmo considerando baldeações.');
  }

  plans.sort((a, b) =>
    a.totalDurationMinutes - b.totalDurationMinutes ||
    a.totalWalkDistanceMeters - b.totalWalkDistanceMeters ||
    a.transferCount - b.transferCount
  );

  return {
    primaryRoute: plans[0],
    alternatives: plans
  };
}
```

Note the resolved-eta calls that used to be inline in `calculateRoute`'s `Promise.all` (Phase 1) are now the small `resolveLegEta` helper, called sequentially per candidate leg inside the round loop rather than concurrently — this is a deliberate simplification for this first version of the BFS (sequential rounds are already inherently sequential; parallelizing within a round is a reasonable future optimization, not required now, and keeping it sequential makes the round-by-round logic easier to reason about and test).

- [ ] **Step 5: Run it to verify it passes**

Run: `npm test -- src/lib/routing.test.ts`
Expected: all tests in this file pass (the original ones with their Step-1 updates, the 3 `buildMultiLegPlan` tests from Task 3, and the 2 new transfer-search tests).

- [ ] **Step 6: Run the full suite**

Run: `npm test`
Expected: all tests pass across every file.

- [ ] **Step 7: Commit**

```bash
git add src/lib/routing.ts src/lib/routing.test.ts
git commit -m "feat: add round-based transfer search, calculateRoute now finds multi-leg routes"
```

---

## Task 5: Show transfer count in the alternatives list

**Files:**
- Modify: `src/components/Routing/RoutePlanner.tsx`

**Files:**
- Modify: `src/components/Routing/RoutePlanner.tsx`

- [ ] **Step 1: Find the alternatives list badge**

In `src/components/Routing/RoutePlanner.tsx`, find the block that renders each alternative's line badge (search for `alt.recommendedLine.lt}-{alt.recommendedLine.tl`), inside the `routeResult.alternatives.map((alt, idx) => { ... })` loop. It currently renders only the first leg's line code as the badge and a fixed "Destino: {alt.recommendedLine.ts}" label underneath.

- [ ] **Step 2: Add a transfer badge**

Right after the existing line-code badge `<div>` (the one styled with `background: 'var(--accent-sptrans)'`), add a small conditional pill that only renders when `alt.transferCount > 0`:

```tsx
                    {alt.transferCount > 0 && (
                      <div
                        style={{
                          background: 'rgba(251, 191, 36, 0.18)',
                          color: '#FBBF24',
                          padding: '4px 8px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {alt.transferCount} {alt.transferCount === 1 ? 'baldeação' : 'baldeações'}
                      </div>
                    )}
```

Place it as a sibling of the existing line-code badge `<div>`, inside the same flex container (the one with `display: 'flex', alignItems: 'center', gap: '12px'` that wraps the badge and the destination text) — so it shows up as a small pill next to the line number, not replacing anything already there.

- [ ] **Step 3: Verify manually**

Run: `npm run dev` (or use an already-running dev server) and, in the app, search a route you know requires a transfer (any pair the Fase 1 corridor doesn't directly connect). Confirm the alternatives list shows a "1 baldeação" (or more) pill next to any multi-leg result, and shows nothing extra next to direct (0-transfer) results.

- [ ] **Step 4: Commit**

```bash
git add src/components/Routing/RoutePlanner.tsx
git commit -m "feat: show transfer-count badge in the route alternatives list"
```

---

## Task 6: Manual end-to-end verification

**Files:** none (verification only).

- [ ] **Step 1: Regression check**

Using the running dev server, plan a route from "Rua Flor de Maio, 40" to "Shopping Center Norte" (the corridor already verified in Phase 1). Confirm it still returns the direct 1703-10 line as the primary result with `transferCount: 0` — this must not regress.

- [ ] **Step 2: Transfer case**

Find (or reuse, if already known from Phase 1 testing) an address pair that previously failed with "Nenhuma linha direta encontrada." Confirm it now either returns a route with 1+ transfers, or fails with the updated message ("mesmo considerando baldeações") if genuinely no connection exists even with transfers.

- [ ] **Step 3: Sanity-check response time**

Time how long a transfer search that has to expand through 2-3 rounds actually takes in practice (browser dev tools network tab, or a `curl` timing the `/api/rotas` call). If it's taking several seconds or more, that's a signal the round/frontier caps (`MAX_TRANSFER_ROUNDS`, `MAX_FRONTIER_PER_ROUND`, `MAX_ALTERNATIVES` in `src/lib/routing.ts`) may need to be tuned down — note the actual numbers observed rather than guessing.

- [ ] **Step 4: Note the outcome**

No commit for this task — record any follow-up issues found as new tasks/notes rather than silently reworking earlier tasks after the fact.

---

## Coverage check against the design spec

- Nova função SQL de expansão sem destino fixo → Task 1.
- Busca em ondas com limite de segurança → Task 4.
- Raio de busca de 2,5 km (`STOP_SEARCH_RADIUS_METERS`) e limite maior de paradas próximas (`NEARBY_STOPS_LIMIT`) → Task 4.
- Ordenação por tempo total → caminhada → baldeações → Task 4 (`plans.sort` em `calculateRoute`).
- Reaproveita a mesma matemática de caminhada/distância e a mesma resolução de previsão em tempo real por trecho → Task 3 (`buildMultiLegPlan` reuses `getDistanceMeters`/`generatePedestrianWaypoints`), Task 4 (`resolveLegEta` reuses `resolveRealTimeEta`).
- Sem verificação de compatibilidade de horário entre pernas (explicitamente fora de escopo) → documented in Task 4's `findMultiLegPlans` doc comment, not implemented.
- Interface mostra baldeações → Task 5.
- Verificação manual de regressão e do novo caso de baldeação → Task 6.
