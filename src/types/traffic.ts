export type IncidentType = 'ACCIDENT' | 'POLICE' | 'CONSTRUCTION' | 'JAM' | 'HAZARD';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface TrafficIncident {
  id: string;
  type: IncidentType;
  subtype?: string;
  title: string;
  description: string;
  street: string;
  neighborhood: string;
  lat: number;
  lng: number;
  severity: IncidentSeverity;
  delaySeconds?: number;
  source: 'CET_SP' | 'TOMTOM' | 'WAZE_FEED' | 'SPTRANS_OPERACIONAL';
  updatedAt: string;
  reliability?: number; // 1 a 10
}

export interface TrafficIncidentsResponse {
  incidents: TrafficIncident[];
  summary: {
    total: number;
    accidents: number;
    police: number;
    construction: number;
    jams: number;
    hazards: number;
  };
  lastUpdated: string;
}
