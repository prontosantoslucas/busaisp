import { describe, it, expect } from 'vitest';
import { generateSaoPauloTileUrls, offlineMapService } from './offlineMapService';

describe('offlineMapService', () => {
  it('generates tile URLs within São Paulo bounding box for zooms 11-14', () => {
    const urls = generateSaoPauloTileUrls();
    expect(urls.length).toBeGreaterThan(50);
    expect(urls[0]).toContain('https://services.arcgisonline.com/arcgis/rest/services/Canvas/');
    expect(urls.some((u) => u.includes('World_Light_Gray_Base'))).toBe(true);
    expect(urls.some((u) => u.includes('World_Dark_Gray_Base'))).toBe(true);
  });

  it('provides offline status structure', async () => {
    const status = await offlineMapService.getOfflineStatus();
    expect(typeof status.isDownloaded).toBe('boolean');
    expect(typeof status.tilesCount).toBe('number');
    expect(typeof status.sizeMb).toBe('number');
  });
});
