import { TrafficIncident, TrafficIncidentsResponse, IncidentType, IncidentSeverity } from '@/types/traffic';

const TOMTOM_INCIDENTS_URL = 'https://api.tomtom.com/traffic/services/5/incidentDetails';

const TOMTOM_FIELDS =
  '{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers}}}';

// Mapeamento das categorias numéricas da TomTom (iconCategory) para os tipos usados no app.
// Referência: TomTom Traffic Incidents API — iconCategory definitions.
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
 * (plano gratuito). Sem TOMTOM_API_KEY configurada, retorna uma lista vazia — nunca
 * inventa incidentes.
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

  // Bounding box aproximado ao redor do ponto informado (graus, não metros —
  // aproximação suficiente para a escala de uma cidade).
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
      // Só incidentes com impacto real (ignora lentidões triviais LOW, que na prática
      // são a maioria e não ajudam o usuário a decidir nada).
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
