import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)('gtfs core schema (Supabase)', () => {
  const supabase = createClient(url as string, anonKey as string);

  const tables = [
    'gtfs_agency',
    'gtfs_routes',
    'gtfs_stops',
    'gtfs_trips',
    'gtfs_stop_times',
    'gtfs_calendar',
    'gtfs_calendar_dates'
  ];

  it.each(tables)('%s table exists and is publicly readable', async (table) => {
    const { error } = await supabase.from(table).select('*').limit(1);
    expect(error).toBeNull();
  });
});
