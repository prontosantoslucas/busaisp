import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anonKey)('gtfs query functions (Supabase)', () => {
  const supabase = createClient(url as string, anonKey as string);

  it('nearby_stops is callable and returns an array', async () => {
    const { data, error } = await supabase.rpc('nearby_stops', {
      in_lat: -23.5615,
      in_lng: -46.6559,
      radius_meters: 500,
      max_results: 5
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });

  it('direct_routes_between is callable and returns an array', async () => {
    const { data, error } = await supabase.rpc('direct_routes_between', {
      origin_stop_ids: ['does-not-exist-1'],
      dest_stop_ids: ['does-not-exist-2'],
      max_results: 5
    });
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  });
});
