import { describe, it, expect, vi } from 'vitest';
import { findRailRoutePlan } from './railRouting';
import type { RouteLocation } from './routing';

vi.mock('@/lib/osrm', () => ({
  getSnappedRoutePolyline: vi.fn().mockImplementation((coords) => Promise.resolve(coords))
}));

describe('findRailRoutePlan (Multimodal Rail Router)', () => {
  it('calculates direct rail route on the same line (e.g. Tucuruvi to Santana on Line 1)', async () => {
    const origin: RouteLocation = {
      name: 'Perto do Metrô Tucuruvi',
      lat: -23.4795,
      lng: -46.6030
    };
    const destination: RouteLocation = {
      name: 'Perto do Metrô Santana',
      lat: -23.5025,
      lng: -46.6245
    };

    const plan = await findRailRoutePlan(origin, destination);
    expect(plan).not.toBeNull();
    expect(plan?.mode).toBe('RAIL');
    expect(plan?.transferCount).toBe(0);
    expect(plan?.recommendedLine.lt).toContain('1-Azul');
    expect(plan?.steps.some((s) => s.type === 'RAIL')).toBe(true);
    expect(plan?.allRouteStops.length).toBeGreaterThan(1);
  });

  it('calculates multi-leg rail route with transfer at a junction station (e.g. Santana on L1 to Corinthians-Itaquera via Luz/L11 or Sé/L3)', async () => {
    const origin: RouteLocation = {
      name: 'Santana (Zona Norte)',
      lat: -23.5029,
      lng: -46.6247
    };
    const destination: RouteLocation = {
      name: 'Itaquera (Zona Leste)',
      lat: -23.5422,
      lng: -46.4710
    };

    const plan = await findRailRoutePlan(origin, destination);
    expect(plan).not.toBeNull();
    expect(plan?.mode).toBe('RAIL');
    expect(plan?.transferCount).toBe(1);
    expect(plan?.transferPoints.length).toBe(1);
    // Deve fazer baldeação numa estação de integração real
    expect(['Estação Luz', 'Estação Sé', 'Estação Brás']).toContain(plan?.transferPoints[0].stopName);
    expect(plan?.steps.filter((s) => s.type === 'RAIL').length).toBe(2);
  });

  it('calculates multi-leg rail route between L2 and L4 via Consolação/Paulista or L5 and L1 via Santa Cruz', async () => {
    const origin: RouteLocation = {
      name: 'Moema (Linha 5)',
      lat: -23.6041,
      lng: -46.6612
    };
    const destination: RouteLocation = {
      name: 'São Bento (Linha 1)',
      lat: -23.5445,
      lng: -46.6341
    };

    const plan = await findRailRoutePlan(origin, destination);
    expect(plan).not.toBeNull();
    expect(plan?.mode).toBe('RAIL');
    expect(plan?.transferCount).toBe(1);
    expect(plan?.transferPoints[0].stopName).toContain('Santa Cruz');
    expect(plan?.recommendedLine.lt).toContain('5-Lilás');
    expect(plan?.recommendedLine.lt).toContain('1-Azul');
  });

  it('returns null when origin or destination is out of reach of any rail station', async () => {
    const farOrigin: RouteLocation = {
      name: 'Área Rural Sem Trilhos',
      lat: -23.1000,
      lng: -46.1000
    };
    const farDestination: RouteLocation = {
      name: 'Outro Local Remoto',
      lat: -23.2000,
      lng: -46.2000
    };

    const plan = await findRailRoutePlan(farOrigin, farDestination);
    expect(plan).toBeNull();
  });
});
