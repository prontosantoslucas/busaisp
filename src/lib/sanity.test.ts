import { describe, it, expect } from 'vitest';

describe('test runner sanity check', () => {
  it('runs and resolves the @/ alias', async () => {
    const { supabase } = await import('@/lib/supabase');
    expect(supabase).toBeDefined();
    expect(1 + 1).toBe(2);
  });
});
