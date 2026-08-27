import {
  TrafficIncident,
  TrafficIncidentsResponse,
  IncidentType,
  IncidentSeverity,
  TrafficCorridorHotspot,
  TrafficHotspotReason,
  TrafficHeatmapData
} from '@/types/traffic';
import { getDistanceMeters } from '@/lib/geoUtils';
import { getSaoPauloTime } from '@/lib/dateUtils';

const TOMTOM_INCIDENTS_URL = 'https://api.tomtom.com/traffic/services/5/incidentDetails';

const TOMTOM_FIELDS =
  '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers}}}';

// Principais corredores viários estruturais da Grande São Paulo
const SP_TRAFFIC_CORRIDORS: Array<{
  id: string;
  name: string;
  corridor: string;
  neighborhood: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  normalSpeedKmh: number;
  isPeakHeavy: boolean;
}> = [
  { id: 'corridor-tiete-bandeiras', name: 'Marginal Tietê (Pte. das Bandeiras)', corridor: 'Marginal Tietê (Sentido Castelo/Ayrton Senna)', neighborhood: 'Santana / Bom Retiro', lat: -23.5186, lng: -46.6264, radiusMeters: 600, normalSpeedKmh: 70, isPeakHeavy: true },
  { id: 'corridor-tiete-piqueri', name: 'Marginal Tietê (Pte. do Piqueri)', corridor: 'Marginal Tietê (Pista Expressa e Local)', neighborhood: 'Lapa / Freguesia do Ó', lat: -23.5090, lng: -46.6890, radiusMeters: 650, normalSpeedKmh: 70, isPeakHeavy: true },
  { id: 'corridor-pinheiros-pinheiros', name: 'Marginal Pinheiros (Pte. Cidade Universitária)', corridor: 'Marginal Pinheiros (Sentido Interlagos)', neighborhood: 'Pinheiros / Butantã', lat: -23.5600, lng: -46.7020, radiusMeters: 600, normalSpeedKmh: 70, isPeakHeavy: true },
  { id: 'corridor-pinheiros-estaiada', name: 'Marginal Pinheiros (Pte. Estaiada)', corridor: 'Marginal Pinheiros (Sentido Castelo Branco)', neighborhood: 'Brooklin / Morumbi', lat: -23.6120, lng: -46.6990, radiusMeters: 600, normalSpeedKmh: 70, isPeakHeavy: true },
  { id: 'corridor-paulista-masp', name: 'Avenida Paulista (Masp / Augusta)', corridor: 'Av. Paulista (Ambos os Sentidos)', neighborhood: 'Bela Vista / Cerqueira César', lat: -23.5615, lng: -46.6559, radiusMeters: 500, normalSpeedKmh: 40, isPeakHeavy: true },
  { id: 'corridor-23-de-maio', name: 'Avenida 23 de Maio (Corredor Norte-Sul)', corridor: 'Av. 23 de Maio (Sentido Aeroporto / Centro)', neighborhood: 'Paraíso / Vila Mariana', lat: -23.5780, lng: -46.6430, radiusMeters: 550, normalSpeedKmh: 60, isPeakHeavy: true },
  { id: 'corridor-bandeirantes-aeroporto', name: 'Avenida dos Bandeirantes (Aeroporto Congonhas)', corridor: 'Av. dos Bandeirantes (Sentido Marginal / Imigrantes)', neighborhood: 'Campo Belo / Moema', lat: -23.6060, lng: -46.6680, radiusMeters: 550, normalSpeedKmh: 50, isPeakHeavy: true },
  { id: 'corridor-radial-leste-tatuape', name: 'Radial Leste (Viaduto Pery Ronchetti)', corridor: 'Radial Leste (Sentido Bairro / Centro)', neighborhood: 'Tatuapé / Belém', lat: -23.5380, lng: -46.5750, radiusMeters: 600, normalSpeedKmh: 60, isPeakHeavy: true },
  { id: 'corridor-reboucas-faria-lima', name: 'Avenida Rebouças x Faria Lima', corridor: 'Av. Rebouças (Sentido Centro / Bairro)', neighborhood: 'Pinheiros / Jardins', lat: -23.5680, lng: -46.6840, radiusMeters: 500, normalSpeedKmh: 45, isPeakHeavy: true },
  { id: 'corridor-cruzeiro-do-sul-santana', name: 'Avenida Cruzeiro do Sul (Terminal Santana)', corridor: 'Av. Cruzeiro do Sul (Sentido Centro)', neighborhood: 'Santana / Carandiru', lat: -23.5080, lng: -46.6250, radiusMeters: 450, normalSpeedKmh: 50, isPeakHeavy: true },
  { id: 'corridor-av-do-estado-mercadao', name: 'Avenida do Estado (Pq. Dom Pedro)', corridor: 'Av. do Estado (Sentido ABC / Marginal)', neighborhood: 'Centro / Brás', lat: -23.5450, lng: -46.6280, radiusMeters: 500, normalSpeedKmh: 50, isPeakHeavy: false },
  { id: 'corridor-santo-amaro', name: 'Avenida Santo Amaro (Vila Olímpia)', corridor: 'Av. Santo Amaro (Corredor de Ônibus)', neighborhood: 'Moema / Itaim Bibi', lat: -23.5970, lng: -46.6770, radiusMeters: 450, normalSpeedKmh: 40, isPeakHeavy: true },
  { id: 'corridor-teotonio-vilela', name: 'Avenida Senador Teotônio Vilela', corridor: 'Av. Sen. Teotônio Vilela (Sentido Centro)', neighborhood: 'Interlagos / Socorro', lat: -23.7050, lng: -46.6890, radiusMeters: 550, normalSpeedKmh: 50, isPeakHeavy: false },
  { id: 'corridor-inajar-freguesia', name: 'Avenida Inajar de Souza', corridor: 'Av. Inajar de Souza (Sentido Bairro / Ponte Freguesia)', neighborhood: 'Freguesia do Ó / Brasilândia', lat: -23.4860, lng: -46.6900, radiusMeters: 500, normalSpeedKmh: 50, isPeakHeavy: false }
];

// Mapeamento das categorias numéricas da TomTom (iconCategory) para os tipos usados no app.
function mapIconCategoryToType(iconCategory: number): IncidentType {
  switch (iconCategory) {
    case 1:
      return 'ACCIDENT';
    case 6:
      return 'JAM';
    case 7:
    case 8:
    case 9:
      return 'CONSTRUCTION';
    default:
      return 'HAZARD';
  }
}

// magnitudeOfDelay da TomTom: 0=indefinido, 1=leve, 2=moderado, 3=grave, 4=indefinido/via fechada.
function mapMagnitudeToSeverity(magnitude: number): IncidentSeverity {
  if (magnitude >= 4) return 'CRITICAL';
  if (magnitude === 3) return 'HIGH';
  if (magnitude === 2) return 'MEDIUM';
  return 'LOW';
}

function emptyResponse(): TrafficIncidentsResponse {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return {
    incidents: [],
    summary: { total: 0, accidents: 0, police: 0, construction: 0, jams: 0, hazards: 0 },
    lastUpdated: timeStr
  };
}

/**
 * Incidentes de trânsito reais da região de São Paulo, via TomTom Traffic Incidents API
 */
export async function getLiveTrafficIncidents(
  userLat = -23.5158,
  userLng = -46.6182,
  radiusKm = 25
): Promise<TrafficIncidentsResponse> {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) {
    return emptyResponse();
  }

  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const degreesLat = radiusKm / 111;
  const degreesLng = radiusKm / (111 * Math.cos((userLat * Math.PI) / 180));
  const bbox = [
    userLng - degreesLng,
    userLat - degreesLat,
    userLng + degreesLng,
    userLat + degreesLat
  ].join(',');

  try {
    const url = new URL(TOMTOM_INCIDENTS_URL);
    url.searchParams.set('bbox', bbox);
    url.searchParams.set('fields', TOMTOM_FIELDS);
    url.searchParams.set('language', 'pt-PT');
    url.searchParams.set('key', apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) {
      console.error('[TomTom] Falha ao buscar incidentes:', res.status, await res.text());
      return emptyResponse();
    }

    const json = await res.json();
    const rawIncidents: any[] = Array.isArray(json.incidents) ? json.incidents : [];

    const severityRank: Record<IncidentSeverity, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };

    const incidents: TrafficIncident[] = rawIncidents
      .map((inc, idx) => {
        const props = inc.properties || {};
        const coordinates: [number, number][] = inc.geometry?.coordinates || [];
        const midpoint = coordinates[Math.floor(coordinates.length / 2)] || coordinates[0] || [userLng, userLat];
        const event = Array.isArray(props.events) && props.events.length > 0 ? props.events[0] : null;
        const type = mapIconCategoryToType(props.iconCategory);

        const incident: TrafficIncident = {
          id: `tomtom_${idx}_${props.startTime || now.getTime()}`,
          type,
          subtype: event?.description,
          title: event?.description || 'Ocorrência de trânsito',
          description: props.from && props.to ? `Entre ${props.from} e ${props.to}` : (event?.description || ''),
          street: props.from || '',
          neighborhood: props.to || '',
          lat: midpoint[1],
          lng: midpoint[0],
          severity: mapMagnitudeToSeverity(props.magnitudeOfDelay ?? 0),
          delaySeconds: typeof props.delay === 'number' ? props.delay : undefined,
          source: 'TOMTOM',
          updatedAt: timeStr,
          reliability: undefined
        };
        return incident;
      })
      .filter(i => i.severity !== 'LOW')
      .sort((a, b) => severityRank[b.severity] - severityRank[a.severity] || (b.delaySeconds || 0) - (a.delaySeconds || 0))
      .slice(0, 30);

    return {
      incidents,
      summary: {
        total: incidents.length,
        accidents: incidents.filter(i => i.type === 'ACCIDENT').length,
        police: 0,
        construction: incidents.filter(i => i.type === 'CONSTRUCTION').length,
        jams: incidents.filter(i => i.type === 'JAM').length,
        hazards: incidents.filter(i => i.type === 'HAZARD').length
      },
      lastUpdated: timeStr
    };
  } catch (err) {
    console.error('[TomTom] Erro ao buscar incidentes de trânsito:', err);
    return emptyResponse();
  }
}

/**
 * Gera os Hotspots e Corredores de Trânsito com Níveis (Verde/Laranja/Vermelho/Vinho) e Motivos Reais
 */
export function getTrafficCorridorsAndHotspots(incidents: TrafficIncident[] = []): TrafficHeatmapData {
  const spTime = getSaoPauloTime();
  const timeStr = `${String(spTime.hours).padStart(2, '0')}:${String(spTime.minutes).padStart(2, '0')}`;
  
  // Detecção de horário de pico em SP (07h-09h30 e 17h30-20h nos dias de semana)
  const isWeekday = !spTime.isSunday && new Date().getDay() !== 6;
  const currentTotalMinutes = spTime.hours * 60 + spTime.minutes;
  const isMorningPeak = isWeekday && currentTotalMinutes >= 7 * 60 + 30 && currentTotalMinutes <= 9 * 60 + 30;
  const isEveningPeak = isWeekday && currentTotalMinutes >= 17 * 60 + 30 && currentTotalMinutes <= 20 * 60;
  const isPeak = isMorningPeak || isEveningPeak;

  let totalDelayAccumulated = 0;

  const hotspots: TrafficCorridorHotspot[] = SP_TRAFFIC_CORRIDORS.map((c) => {
    // 1. Encontrar incidentes associados ao raio do corredor
    const nearbyIncidents = incidents.filter((inc) => {
      const d = getDistanceMeters(c.lat, c.lng, inc.lat, inc.lng);
      return d <= c.radiusMeters + 300;
    });

    const reasons: TrafficHotspotReason[] = [];
    let corridorDelay = 0;
    let hasCritical = false;
    let hasHigh = false;

    // Converter incidentes reais em motivos detalhados
    nearbyIncidents.forEach((inc) => {
      let delay = 0;
      if (typeof inc.delaySeconds === 'number' && inc.delaySeconds > 0) {
        delay = Math.round(inc.delaySeconds / 60);
      } else if (inc.severity === 'CRITICAL') {
        delay = 12;
      } else if (inc.severity === 'HIGH' || inc.type === 'ACCIDENT') {
        delay = 7;
      } else if (inc.severity === 'MEDIUM' || inc.type === 'CONSTRUCTION') {
        delay = 4;
      } else {
        delay = 2;
      }

      if (inc.severity === 'CRITICAL') hasCritical = true;
      if (inc.severity === 'HIGH') hasHigh = true;

      corridorDelay += delay;
      reasons.push({
        type: inc.type,
        title: inc.title,
        description: inc.description || (inc.type === 'ACCIDENT' ? 'Acidente com retenção de faixa' : 'Obras/interferência na pista'),
        delayMinutes: delay
      });
    });

    // 2. Se não houver incidentes específicos, aplicar condições de horário de pico de São Paulo
    if (reasons.length === 0) {
      if (isPeak && c.isPeakHeavy) {
        const peakDelay = isEveningPeak ? 8 : 6;
        corridorDelay += peakDelay;
        reasons.push({
          type: 'RUSH_HOUR',
          title: `Horário de Pico ${isMorningPeak ? 'da Manhã' : 'da Tarde'}`,
          description: 'Alto volume de veículos e retenção nos acessos às pontes e viadutos.',
          delayMinutes: peakDelay
        });
      } else if (isPeak && !c.isPeakHeavy) {
        const peakDelay = 3;
        corridorDelay += peakDelay;
        reasons.push({
          type: 'RUSH_HOUR',
          title: 'Tráfego Carregado',
          description: 'Aumento na densidade de veículos em direção aos polos comerciais.',
          delayMinutes: peakDelay
        });
      } else {
        reasons.push({
          type: 'WEATHER',
          title: 'Fluxo Livre',
          description: 'Sem ocorrências no momento. Pistas expressa e local fluindo normalmente.',
          delayMinutes: 0
        });
      }
    }

    // 3. Determinar Status e Velocidade Média
    let status: 'FLUINDO' | 'MODERADO' | 'INTENSO' | 'CRITICO' = 'FLUINDO';
    let avgSpeed = c.normalSpeedKmh;

    if (hasCritical || corridorDelay >= 12) {
      status = 'CRITICO';
      avgSpeed = Math.round(c.normalSpeedKmh * 0.25);
    } else if (hasHigh || corridorDelay >= 6) {
      status = 'INTENSO';
      avgSpeed = Math.round(c.normalSpeedKmh * 0.45);
    } else if (corridorDelay >= 3) {
      status = 'MODERADO';
      avgSpeed = Math.round(c.normalSpeedKmh * 0.70);
    } else {
      status = 'FLUINDO';
      avgSpeed = c.normalSpeedKmh;
    }

    totalDelayAccumulated += corridorDelay;

    return {
      id: c.id,
      name: c.name,
      corridor: c.corridor,
      neighborhood: c.neighborhood,
      lat: c.lat,
      lng: c.lng,
      radiusMeters: c.radiusMeters,
      status,
      delayMinutes: corridorDelay,
      avgSpeedKmh: avgSpeed,
      normalSpeedKmh: c.normalSpeedKmh,
      reasons,
      updatedAt: timeStr
    };
  });

  const criticalCount = hotspots.filter(h => h.status === 'CRITICO' || h.status === 'INTENSO').length;
  const cityStatus = criticalCount >= 4 ? 'INTENSO' : criticalCount >= 2 ? 'MODERADO' : 'FLUINDO';
  const totalCongestionKm = Math.round(criticalCount * 14 + (isPeak ? 45 : 8));

  return {
    hotspots,
    cityStatus,
    totalCongestionKm,
    lastUpdated: timeStr
  };
}

