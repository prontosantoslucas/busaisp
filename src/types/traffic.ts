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

export interface TrafficHotspotReason {
  type: IncidentType | 'RUSH_HOUR' | 'ROAD_NARROWING' | 'WEATHER';
  title: string;
  description: string;
  delayMinutes: number;
}

export interface TrafficCorridorHotspot {
  id: string;
  name: string;
  corridor: string;
  neighborhood: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  status: 'FLUINDO' | 'MODERADO' | 'INTENSO' | 'CRITICO';
  delayMinutes: number;
  avgSpeedKmh: number;
  normalSpeedKmh: number;
  reasons: TrafficHotspotReason[];
  updatedAt: string;
}

export interface TrafficHeatmapData {
  hotspots: TrafficCorridorHotspot[];
  cityStatus: 'FLUINDO' | 'MODERADO' | 'INTENSO';
  totalCongestionKm: number;
  lastUpdated: string;
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

