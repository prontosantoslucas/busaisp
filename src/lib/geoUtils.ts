export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Distância aproximada (em metros) de um ponto até o segmento de reta AB, usando uma
// projeção equirretangular local — suficiente para as distâncias curtas (algumas
// centenas de metros) que interessam pra detectar desvio de rota, sem o custo de uma
// projeção geodésica completa por segmento.
function distancePointToSegmentMeters(
  pointLat: number, pointLng: number,
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const latRad = (aLat * Math.PI) / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLng = 111320 * Math.cos(latRad);

  const toXY = (lat: number, lng: number): [number, number] => [
    (lng - aLng) * metersPerDegLng,
    (lat - aLat) * metersPerDegLat
  ];

  const [pX, pY] = toXY(pointLat, pointLng);
  const [aX, aY] = [0, 0];
  const [bX, bY] = toXY(bLat, bLng);

  const dx = bX - aX;
  const dy = bY - aY;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) {
    return Math.hypot(pX - aX, pY - aY);
  }

  let t = ((pX - aX) * dx + (pY - aY) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const projX = aX + t * dx;
  const projY = aY + t * dy;

  return Math.hypot(pX - projX, pY - projY);
}

/**
 * Menor distância (em metros) de um ponto até qualquer segmento de uma polilinha real
 * (ex.: o trajeto planejado de uma rota). Usada para detectar desvio de rota comparando
 * a posição de GPS ao vivo com o caminho que a rota deveria seguir — nunca inventa uma
 * posição "correta", só mede a distância real até o traçado.
 */
export function distanceToPolylineMeters(point: [number, number], polyline: [number, number][]): number {
  if (!polyline || polyline.length === 0) return Infinity;
  if (polyline.length === 1) {
    return getDistanceMeters(point[0], point[1], polyline[0][0], polyline[0][1]);
  }

  let min = Infinity;
  for (let i = 0; i < polyline.length - 1; i++) {
    const d = distancePointToSegmentMeters(
      point[0], point[1],
      polyline[i][0], polyline[i][1],
      polyline[i + 1][0], polyline[i + 1][1]
    );
    if (d < min) min = d;
  }
  return Math.round(min);
}
