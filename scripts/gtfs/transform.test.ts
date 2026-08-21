import { describe, it, expect } from 'vitest';
import {
  gtfsTimeToSeconds,
  gtfsDateToIso,
  parseAgencyRow,
  parseRouteRow,
  parseStopRow,
  parseTripRow,
  parseStopTimeRow,
  parseCalendarRow,
  parseCalendarDateRow
} from './transform';

describe('gtfsTimeToSeconds', () => {
  it('converts a normal HH:MM:SS time', () => {
    expect(gtfsTimeToSeconds('08:30:00')).toBe(8 * 3600 + 30 * 60);
  });

  it('handles GTFS times past midnight (>= 24:00:00)', () => {
    expect(gtfsTimeToSeconds('25:10:15')).toBe(25 * 3600 + 10 * 60 + 15);
  });
});

describe('gtfsDateToIso', () => {
  it('converts YYYYMMDD to YYYY-MM-DD', () => {
    expect(gtfsDateToIso('20260315')).toBe('2026-03-15');
  });
});

describe('parseAgencyRow', () => {
  it('maps GTFS agency.txt columns', () => {
    expect(
      parseAgencyRow({ agency_id: 'sptrans', agency_name: 'SPTrans', agency_url: 'https://sptrans.com.br', agency_timezone: 'America/Sao_Paulo' })
    ).toEqual({ agencyId: 'sptrans', name: 'SPTrans', url: 'https://sptrans.com.br', timezone: 'America/Sao_Paulo' });
  });

  it('defaults agency_id to "sptrans" when absent', () => {
    expect(parseAgencyRow({ agency_name: 'SPTrans', agency_url: '', agency_timezone: 'America/Sao_Paulo' }).agencyId).toBe('sptrans');
  });
});

describe('parseRouteRow', () => {
  it('maps GTFS routes.txt columns and coerces route_type to a number', () => {
    expect(
      parseRouteRow({ route_id: '1703-10', agency_id: 'sptrans', route_short_name: '1703', route_long_name: 'JD. FONTALIS - CENTER NORTE', route_type: '3' })
    ).toEqual({ routeId: '1703-10', agencyId: 'sptrans', shortName: '1703', longName: 'JD. FONTALIS - CENTER NORTE', routeType: 3 });
  });
});

describe('parseStopRow', () => {
  it('maps GTFS stops.txt columns and coerces lat/lng to numbers', () => {
    expect(
      parseStopRow({ stop_id: '340015350', stop_name: 'PARADA SHOPPING CENTER NORTE', stop_lat: '-23.5152', stop_lon: '-46.6190' })
    ).toEqual({ stopId: '340015350', name: 'PARADA SHOPPING CENTER NORTE', lat: -23.5152, lng: -46.619 });
  });
});

describe('parseTripRow', () => {
  it('maps GTFS trips.txt columns, treating an empty direction_id as null', () => {
    expect(
      parseTripRow({ trip_id: 't1', route_id: '1703-10', service_id: 'svc1', trip_headsign: 'SHOPPING CENTER NORTE', direction_id: '' })
    ).toEqual({ tripId: 't1', routeId: '1703-10', serviceId: 'svc1', headsign: 'SHOPPING CENTER NORTE', directionId: null });
  });
});

describe('parseStopTimeRow', () => {
  it('maps GTFS stop_times.txt columns and converts times to seconds', () => {
    expect(
      parseStopTimeRow({ trip_id: 't1', stop_id: '340015350', stop_sequence: '3', arrival_time: '08:15:00', departure_time: '08:16:00' })
    ).toEqual({ tripId: 't1', stopId: '340015350', stopSequence: 3, arrivalTimeSeconds: 29700, departureTimeSeconds: 29760 });
  });
});

describe('parseCalendarRow', () => {
  it('converts day flags to booleans and dates to ISO', () => {
    expect(
      parseCalendarRow({
        service_id: 'svc1',
        monday: '1', tuesday: '1', wednesday: '1', thursday: '1', friday: '1', saturday: '0', sunday: '0',
        start_date: '20260101', end_date: '20261231'
      })
    ).toEqual({
      serviceId: 'svc1',
      monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: false, sunday: false,
      startDate: '2026-01-01', endDate: '2026-12-31'
    });
  });
});

describe('parseCalendarDateRow', () => {
  it('maps GTFS calendar_dates.txt columns', () => {
    expect(
      parseCalendarDateRow({ service_id: 'svc1', date: '20260421', exception_type: '2' })
    ).toEqual({ serviceId: 'svc1', date: '2026-04-21', exceptionType: 2 });
  });
});
