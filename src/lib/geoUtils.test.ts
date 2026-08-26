import { describe, it, expect } from 'vitest';
import { getDistanceMeters, distanceToPolylineMeters } from './geoUtils';

describe('getDistanceMeters', () => {
  it('retorna 0 para o mesmo ponto', () => {
    expect(getDistanceMeters(-23.5505, -46.6333, -23.5505, -46.6333)).toBe(0);
  });

  it('calcula uma distância real plausível entre dois pontos conhecidos de SP', () => {
    // Praça da Sé -> Av. Paulista, ~2.7km reais em linha reta
    const d = getDistanceMeters(-23.5505, -46.6333, -23.5615, -46.6559);
    expect(d).toBeGreaterThan(2000);
    expect(d).toBeLessThan(3500);
  });
});

describe('distanceToPolylineMeters', () => {
  it('retorna Infinity para polilinha vazia', () => {
    expect(distanceToPolylineMeters([-23.55, -46.63], [])).toBe(Infinity);
  });

  it('retorna ~0 para um ponto sobre a própria polilinha', () => {
    const polyline: [number, number][] = [
      [-23.55, -46.63],
      [-23.56, -46.64]
    ];
    // Ponto exatamente no primeiro vértice
    expect(distanceToPolylineMeters([-23.55, -46.63], polyline)).toBeLessThan(5);
  });

  it('mede uma distância real e crescente conforme o ponto se afasta do segmento', () => {
    const polyline: [number, number][] = [
      [-23.55, -46.63],
      [-23.55, -46.64]
    ];
    // Ponto a meio caminho do segmento, mas deslocado ~0.001 grau de latitude (~111m)
    const near = distanceToPolylineMeters([-23.5505, -46.635], polyline);
    const far = distanceToPolylineMeters([-23.560, -46.635], polyline);
    expect(near).toBeGreaterThan(0);
    expect(far).toBeGreaterThan(near);
  });

  it('usa o ponto mais próximo entre múltiplos segmentos, não só o primeiro', () => {
    const polyline: [number, number][] = [
      [-23.50, -46.60],
      [-23.55, -46.63],
      [-23.60, -46.66]
    ];
    // Ponto bem perto do segmento do meio/final, longe do primeiro segmento
    const d = distanceToPolylineMeters([-23.60, -46.66], polyline);
    expect(d).toBeLessThan(50);
  });
});
