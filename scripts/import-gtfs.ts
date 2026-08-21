import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });

import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { Client } from 'pg';
import {
  parseAgencyRow,
  parseRouteRow,
  parseStopRow,
  parseTripRow,
  parseStopTimeRow,
  parseCalendarRow,
  parseCalendarDateRow
} from './gtfs/transform';

const TRANSITLAND_FEED_ID = 'f-6gy-sptrans';

async function downloadGtfsZip(): Promise<Buffer> {
  const apiKey = process.env.TRANSITLAND_API_KEY;
  if (!apiKey) {
    throw new Error('TRANSITLAND_API_KEY não configurado em .env.local');
  }

  const url = `https://transit.land/api/v2/rest/feeds/${TRANSITLAND_FEED_ID}/download_latest_feed_version?apikey=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Falha ao baixar GTFS do Transitland: HTTP ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function readCsvFromZip<T extends Record<string, string>>(zip: AdmZip, fileName: string, required = true): T[] {
  const entry = zip.getEntry(fileName);
  if (!entry) {
    if (required) {
      throw new Error(`Arquivo ${fileName} não encontrado no GTFS`);
    }
    console.log(`  ${fileName} não presente neste feed (opcional) — ignorando.`);
    return [];
  }
  const content = entry.getData().toString('utf-8');
  return parse(content, { columns: true, skip_empty_lines: true }) as T[];
}

async function insertBatched(
  client: Client,
  tableName: string,
  columns: string[],
  rows: any[][],
  batchSize = 1000
): Promise<void> {
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const placeholders = batch
      .map((_, rowIdx) => `(${columns.map((_, colIdx) => `$${rowIdx * columns.length + colIdx + 1}`).join(', ')})`)
      .join(', ');
    const values = batch.flat();
    await client.query(
      `insert into public.${tableName} (${columns.join(', ')}) values ${placeholders}`,
      values
    );
  }
  console.log(`  ${tableName}: ${rows.length} linhas inseridas`);
}

async function main() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    throw new Error('SUPABASE_DB_URL não configurado em .env.local');
  }

  console.log('Baixando GTFS da SPTrans via Transitland...');
  const zipBuffer = await downloadGtfsZip();
  const zip = new AdmZip(zipBuffer);
  console.log(`GTFS baixado: ${(zipBuffer.length / 1024 / 1024).toFixed(1)} MB`);

  const agencyRows = readCsvFromZip(zip, 'agency.txt').map(parseAgencyRow);
  const routeRows = readCsvFromZip(zip, 'routes.txt').map(parseRouteRow);
  const stopRows = readCsvFromZip(zip, 'stops.txt').map(parseStopRow);
  const tripRows = readCsvFromZip(zip, 'trips.txt').map(parseTripRow);
  const stopTimeRows = readCsvFromZip(zip, 'stop_times.txt').map(parseStopTimeRow);
  const calendarRows = readCsvFromZip(zip, 'calendar.txt').map(parseCalendarRow);
  const calendarDateRows = readCsvFromZip(zip, 'calendar_dates.txt', false).map(parseCalendarDateRow);

  console.log('Linhas lidas do GTFS:');
  console.log(`  agency: ${agencyRows.length}`);
  console.log(`  routes: ${routeRows.length}`);
  console.log(`  stops: ${stopRows.length}`);
  console.log(`  trips: ${tripRows.length}`);
  console.log(`  stop_times: ${stopTimeRows.length}`);
  console.log(`  calendar: ${calendarRows.length}`);
  console.log(`  calendar_dates: ${calendarDateRows.length}`);

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    await client.query('BEGIN');

    console.log('Limpando tabelas antigas...');
    await client.query('delete from public.gtfs_stop_times');
    await client.query('delete from public.gtfs_trips');
    await client.query('delete from public.gtfs_calendar_dates');
    await client.query('delete from public.gtfs_calendar');
    await client.query('delete from public.gtfs_routes');
    await client.query('delete from public.gtfs_stops');
    await client.query('delete from public.gtfs_agency');

    console.log('Inserindo dados novos...');
    await insertBatched(
      client,
      'gtfs_agency',
      ['agency_id', 'name', 'url', 'timezone'],
      agencyRows.map(a => [a.agencyId, a.name, a.url, a.timezone])
    );
    await insertBatched(
      client,
      'gtfs_routes',
      ['route_id', 'agency_id', 'short_name', 'long_name', 'route_type'],
      routeRows.map(r => [r.routeId, r.agencyId, r.shortName, r.longName, r.routeType])
    );
    await insertBatched(
      client,
      'gtfs_stops',
      ['stop_id', 'name', 'lat', 'lng'],
      stopRows.map(s => [s.stopId, s.name, s.lat, s.lng])
    );
    await insertBatched(
      client,
      'gtfs_trips',
      ['trip_id', 'route_id', 'service_id', 'headsign', 'direction_id'],
      tripRows.map(t => [t.tripId, t.routeId, t.serviceId, t.headsign, t.directionId])
    );
    await insertBatched(
      client,
      'gtfs_stop_times',
      ['trip_id', 'stop_id', 'stop_sequence', 'arrival_time_seconds', 'departure_time_seconds'],
      stopTimeRows.map(st => [st.tripId, st.stopId, st.stopSequence, st.arrivalTimeSeconds, st.departureTimeSeconds]),
      500
    );
    await insertBatched(
      client,
      'gtfs_calendar',
      ['service_id', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'start_date', 'end_date'],
      calendarRows.map(c => [c.serviceId, c.monday, c.tuesday, c.wednesday, c.thursday, c.friday, c.saturday, c.sunday, c.startDate, c.endDate])
    );
    await insertBatched(
      client,
      'gtfs_calendar_dates',
      ['service_id', 'date', 'exception_type'],
      calendarDateRows.map(c => [c.serviceId, c.date, c.exceptionType])
    );

    await client.query('COMMIT');
    console.log('Importação concluída com sucesso.');

    const sizeResult = await client.query(`
      select relname as table_name, pg_size_pretty(pg_total_relation_size(relid)) as size
      from pg_catalog.pg_statio_user_tables
      where relname like 'gtfs_%'
      order by pg_total_relation_size(relid) desc
    `);
    console.log('Tamanho das tabelas GTFS no banco:');
    for (const row of sizeResult.rows) {
      console.log(`  ${row.table_name}: ${row.size}`);
    }
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // A conexão pode já ter caído; o erro original abaixo é o que importa.
    }
    console.error('Importação falhou, nenhuma alteração foi salva:', err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
