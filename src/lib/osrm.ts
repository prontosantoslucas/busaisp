/**
 * Serviço de Snapping de Ruas em Tempo Real via OSRM (OpenStreetMap Routing)
 * Converte sequências de paradas e caminhadas em traçados reais com curvas e avenidas de São Paulo.
 */

const OSRM_CACHE = new Map<string, [number, number][]>();

export async function getSnappedRoutePolyline(
  points: [number, number][],
  profile: 'driving' | 'walking' = 'driving'
): Promise<[number, number][]> {
  if (!points || points.length < 2) return points || [];

  // Se tiver muitos pontos intermediários, amostrar até 25 pontos para não exceder limites de URL da OSRM
  let sampledPoints = points;
  if (points.length > 25) {
    const step = Math.ceil(points.length / 25);
    sampledPoints = [
      points[0],
      ...points.slice(1, -1).filter((_, i) => i % step === 0),
      points[points.length - 1]
    ];
  }

  // Chave de cache
  const cacheKey = `${profile}:${sampledPoints.map(p => `${p[0].toFixed(4)},${p[1].toFixed(4)}`).join(';')}`;
  if (OSRM_CACHE.has(cacheKey)) {
    return OSRM_CACHE.get(cacheKey)!;
  }

  try {
    // Formato OSRM: {lng},{lat};{lng},{lat}
    const coordStr = sampledPoints.map(p => `${p[1]},${p[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/${profile}/${coordStr}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'BusaISP/1.0' }
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const coords = data.routes[0].geometry.coordinates as [number, number][];
        // Converte de [lng, lat] para [lat, lng]
        const latLngCoords: [number, number][] = coords.map(c => [c[1], c[0]]);
        OSRM_CACHE.set(cacheKey, latLngCoords);
        return latLngCoords;
      }
    }
  } catch (err) {
    console.warn(`[OSRM] Falha ao obter traçado de ruas (${profile}), usando traçado de paradas:`, err);
  }

  // Fallback seguro: retorna os pontos originais
  return points;
}
