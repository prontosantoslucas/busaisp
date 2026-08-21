export function gtfsTimeToSeconds(hhmmss: string): number {
  const [h, m, s] = hhmmss.split(':').map(Number);
  return h * 3600 + m * 60 + s;
}

export function gtfsDateToIso(yyyymmdd: string): string {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export interface AgencyRow {
  agencyId: string;
  name: string;
  url: string;
  timezone: string;
}

export function parseAgencyRow(row: Record<string, string>): AgencyRow {
  return {
    agencyId: row.agency_id || 'sptrans',
    name: row.agency_name,
    url: row.agency_url,
    timezone: row.agency_timezone
  };
}

export interface RouteRow {
  routeId: string;
  agencyId: string | null;
  shortName: string | null;
  longName: string | null;
  routeType: number | null;
}

export function parseRouteRow(row: Record<string, string>): RouteRow {
  return {
    routeId: row.route_id,
    agencyId: row.agency_id || null,
    shortName: row.route_short_name || null,
    longName: row.route_long_name || null,
    routeType: row.route_type ? Number(row.route_type) : null
  };
}

export interface StopRow {
  stopId: string;
  name: string;
  lat: number;
  lng: number;
}

export function parseStopRow(row: Record<string, string>): StopRow {
  return {
    stopId: row.stop_id,
    name: row.stop_name,
    lat: Number(row.stop_lat),
    lng: Number(row.stop_lon)
  };
}

export interface TripRow {
  tripId: string;
  routeId: string;
  serviceId: string;
  headsign: string | null;
  directionId: number | null;
}

export function parseTripRow(row: Record<string, string>): TripRow {
  return {
    tripId: row.trip_id,
    routeId: row.route_id,
    serviceId: row.service_id,
    headsign: row.trip_headsign || null,
    directionId: row.direction_id !== undefined && row.direction_id !== '' ? Number(row.direction_id) : null
  };
}

export interface StopTimeRow {
  tripId: string;
  stopId: string;
  stopSequence: number;
  arrivalTimeSeconds: number;
  departureTimeSeconds: number;
}

export function parseStopTimeRow(row: Record<string, string>): StopTimeRow {
  return {
    tripId: row.trip_id,
    stopId: row.stop_id,
    stopSequence: Number(row.stop_sequence),
    arrivalTimeSeconds: gtfsTimeToSeconds(row.arrival_time),
    departureTimeSeconds: gtfsTimeToSeconds(row.departure_time)
  };
}

export interface CalendarRow {
  serviceId: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  startDate: string;
  endDate: string;
}

export function parseCalendarRow(row: Record<string, string>): CalendarRow {
  return {
    serviceId: row.service_id,
    monday: row.monday === '1',
    tuesday: row.tuesday === '1',
    wednesday: row.wednesday === '1',
    thursday: row.thursday === '1',
    friday: row.friday === '1',
    saturday: row.saturday === '1',
    sunday: row.sunday === '1',
    startDate: gtfsDateToIso(row.start_date),
    endDate: gtfsDateToIso(row.end_date)
  };
}

export interface CalendarDateRow {
  serviceId: string;
  date: string;
  exceptionType: number;
}

export function parseCalendarDateRow(row: Record<string, string>): CalendarDateRow {
  return {
    serviceId: row.service_id,
    date: gtfsDateToIso(row.date),
    exceptionType: Number(row.exception_type)
  };
}
