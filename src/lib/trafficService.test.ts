import { describe, it, expect } from 'vitest';
import { getTrafficCorridorsAndHotspots } from '@/lib/trafficService';
import { TrafficIncident } from '@/types/traffic';

describe('getTrafficCorridorsAndHotspots', () => {
  it('gera hotspots de trânsito para os principais corredores de São Paulo', () => {
    const data = getTrafficCorridorsAndHotspots([]);
    expect(data.hotspots.length).toBeGreaterThan(10);

    const tiete = data.hotspots.find(h => h.id.includes('tiete'));
    expect(tiete).toBeDefined();
    expect(tiete?.reasons.length).toBeGreaterThan(0);
    expect(['FLUINDO', 'MODERADO', 'INTENSO', 'CRITICO']).toContain(tiete?.status);
  });

  it('associa incidentes reais ao corredor e calcula o tempo de atraso e diagnóstico', () => {
    const mockIncident: TrafficIncident = {
      id: 'inc-test-1',
      type: 'ACCIDENT',
      title: 'Colisão grave na Marginal Tietê',
      description: 'Bloqueio de duas faixas da pista expressa',
      street: 'Marginal Tietê',
      neighborhood: 'Santana',
      lat: -23.5186,
      lng: -46.6264,
      severity: 'CRITICAL',
      delaySeconds: 900,
      source: 'TOMTOM',
      updatedAt: '13:00'
    };

    const data = getTrafficCorridorsAndHotspots([mockIncident]);
    const bandeiras = data.hotspots.find(h => h.id === 'corridor-tiete-bandeiras');

    expect(bandeiras).toBeDefined();
    expect(bandeiras?.delayMinutes).toBeGreaterThanOrEqual(12);
    expect(bandeiras?.status).toBe('CRITICO');
    expect(bandeiras?.reasons.some(r => r.type === 'ACCIDENT')).toBe(true);
    expect(bandeiras?.reasons[0].title).toContain('Colisão');
  });
});
