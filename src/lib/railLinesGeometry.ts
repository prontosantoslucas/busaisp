import { SP_ALL_STATIONS, StationItem } from '@/lib/stationsData';

export interface RailLineGeometry {
  code: string;
  name: string;
  colorName: string;
  colorHex: string;
  operator: 'METRO' | 'VIAQUATRO' | 'VIAMOBILIDADE' | 'CPTM';
  stations: StationItem[];
  coordinates: [number, number][];
}

export const RAIL_LINES_METADATA: Record<
  string,
  {
    name: string;
    colorName: string;
    colorHex: string;
    operator: 'METRO' | 'VIAQUATRO' | 'VIAMOBILIDADE' | 'CPTM';
  }
> = {
  L1: { name: 'Linha 1 - Azul', colorName: 'Azul', colorHex: '#003399', operator: 'METRO' },
  L2: { name: 'Linha 2 - Verde', colorName: 'Verde', colorHex: '#008053', operator: 'METRO' },
  L3: { name: 'Linha 3 - Vermelha', colorName: 'Vermelha', colorHex: '#EE1D23', operator: 'METRO' },
  L4: { name: 'Linha 4 - Amarela', colorName: 'Amarela', colorHex: '#FFF000', operator: 'VIAQUATRO' },
  L5: { name: 'Linha 5 - Lilás', colorName: 'Lilás', colorHex: '#9B388D', operator: 'VIAMOBILIDADE' },
  L7: { name: 'Linha 7 - Rubi', colorName: 'Rubi', colorHex: '#A61358', operator: 'CPTM' },
  L8: { name: 'Linha 8 - Diamante', colorName: 'Diamante', colorHex: '#808080', operator: 'VIAMOBILIDADE' },
  L9: { name: 'Linha 9 - Esmeralda', colorName: 'Esmeralda', colorHex: '#009496', operator: 'VIAMOBILIDADE' },
  L10: { name: 'Linha 10 - Turquesa', colorName: 'Turquesa', colorHex: '#007C8F', operator: 'CPTM' },
  L11: { name: 'Linha 11 - Coral', colorName: 'Coral', colorHex: '#F04E23', operator: 'CPTM' },
  L12: { name: 'Linha 12 - Safira', colorName: 'Safira', colorHex: '#1C357E', operator: 'CPTM' },
  L13: { name: 'Linha 13 - Jade', colorName: 'Jade', colorHex: '#00A859', operator: 'CPTM' },
  L15: { name: 'Linha 15 - Prata', colorName: 'Prata', colorHex: '#A7A8AA', operator: 'METRO' }
};

/**
 * Retorna as estações ordenadas geograficamente para uma linha específica
 */
export function getStationsForLine(lineCode: string): StationItem[] {
  return SP_ALL_STATIONS.filter((s) => s.lines.some((l) => l.code === lineCode));
}

/**
 * Retorna as coordenadas sequenciais reais da linha a partir das estações existentes
 */
export function getRailLineCoordinates(lineCode: string): [number, number][] {
  const stations = getStationsForLine(lineCode);
  return stations.map((s) => [s.lat, s.lng]);
}

/**
 * Retorna todas as geometrias e metadados das 13 linhas metropolitanas de SP
 */
export function getAllRailLines(): RailLineGeometry[] {
  return Object.entries(RAIL_LINES_METADATA).map(([code, meta]) => {
    const stations = getStationsForLine(code);
    const coordinates = stations.map((s): [number, number] => [s.lat, s.lng]);
    return {
      code,
      name: meta.name,
      colorName: meta.colorName,
      colorHex: meta.colorHex,
      operator: meta.operator,
      stations,
      coordinates
    };
  });
}
