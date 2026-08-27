/**
 * Serviço de Gerenciamento de Mapa e Dados Offline de São Paulo (BusaíSP)
 * Pré-carrega e armazena em CacheStorage os tiles de mapa e dados essenciais de São Paulo
 * para carregamento instantâneo (0ms de latência) e economia de franquia móvel.
 */

export interface OfflineMapProgress {
  downloaded: number;
  total: number;
  percent: number;
  sizeMb: number;
  status: 'IDLE' | 'DOWNLOADING' | 'COMPLETED' | 'ERROR' | 'PAUSED';
  errorMessage?: string;
}

export interface OfflineMapInfo {
  isDownloaded: boolean;
  tilesCount: number;
  sizeMb: number;
  lastUpdated: string | null;
}

const CACHE_NAME = 'busaisp-offline-tiles-v1';
const SP_BOUNDS = {
  north: -23.38,
  south: -23.75,
  west: -46.85,
  east: -46.35
};

// Conversão de Latitude / Longitude para coordenadas de Tile XYZ
function latLngToTile(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

// Gerar lista de URLs de tiles de São Paulo para zooms selecionados (11 a 14)
export function generateSaoPauloTileUrls(): string[] {
  const urls: string[] = [];
  const zooms = [11, 12, 13, 14];
  const themes: Array<'dark' | 'light'> = ['dark', 'light'];

  for (const theme of themes) {
    const style = theme === 'light' ? 'World_Light_Gray_Base' : 'World_Dark_Gray_Base';
    for (const z of zooms) {
      const nw = latLngToTile(SP_BOUNDS.north, SP_BOUNDS.west, z);
      const se = latLngToTile(SP_BOUNDS.south, SP_BOUNDS.east, z);

      const minX = Math.min(nw.x, se.x);
      const maxX = Math.max(nw.x, se.x);
      const minY = Math.min(nw.y, se.y);
      const maxY = Math.max(nw.y, se.y);

      for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
          urls.push(`https://services.arcgisonline.com/arcgis/rest/services/Canvas/${style}/MapServer/tile/${z}/${y}/${x}`);
        }
      }
    }
  }

  return urls;
}

class OfflineMapService {
  private isCancelled = false;
  private currentProgress: OfflineMapProgress = {
    downloaded: 0,
    total: 0,
    percent: 0,
    sizeMb: 0,
    status: 'IDLE'
  };

  async getOfflineStatus(): Promise<OfflineMapInfo> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      return { isDownloaded: false, tilesCount: 0, sizeMb: 0, lastUpdated: null };
    }

    try {
      const cache = await caches.open(CACHE_NAME);
      const keys = await cache.keys();
      const isDownloaded = localStorage.getItem('busaisp_offline_map_completed') === 'true';
      const sizeMb = parseFloat(localStorage.getItem('busaisp_offline_map_size') || '0');
      const lastUpdated = localStorage.getItem('busaisp_offline_map_date');

      return {
        isDownloaded: isDownloaded && keys.length > 50,
        tilesCount: keys.length,
        sizeMb: sizeMb || Number((keys.length * 0.015).toFixed(1)), // Estimativa média ~15KB por tile
        lastUpdated
      };
    } catch {
      return { isDownloaded: false, tilesCount: 0, sizeMb: 0, lastUpdated: null };
    }
  }

  async startDownload(onProgress: (p: OfflineMapProgress) => void): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) {
      onProgress({
        downloaded: 0,
        total: 0,
        percent: 0,
        sizeMb: 0,
        status: 'ERROR',
        errorMessage: 'CacheStorage não suportado neste navegador.'
      });
      return;
    }

    this.isCancelled = false;
    const tileUrls = generateSaoPauloTileUrls();
    const total = tileUrls.length;
    let downloaded = 0;
    let totalBytes = 0;

    this.currentProgress = {
      downloaded: 0,
      total,
      percent: 0,
      sizeMb: 0,
      status: 'DOWNLOADING'
    };
    onProgress(this.currentProgress);

    try {
      const cache = await caches.open(CACHE_NAME);
      const BATCH_SIZE = 8; // Baixar em lotes de 8 conexões paralelas

      for (let i = 0; i < total; i += BATCH_SIZE) {
        if (this.isCancelled) {
          this.currentProgress.status = 'PAUSED';
          onProgress(this.currentProgress);
          return;
        }

        const batch = tileUrls.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map(async (url) => {
            try {
              // Verificar se já está em cache
              const match = await cache.match(url);
              if (!match) {
                const response = await fetch(url, { mode: 'cors', cache: 'force-cache' });
                if (response.ok) {
                  const clone = response.clone();
                  const blob = await clone.blob();
                  totalBytes += blob.size;
                  await cache.put(url, response);
                }
              }
            } catch {
              // Ignorar falhas individuais de tile para não interromper todo o mapa
            } finally {
              downloaded++;
            }
          })
        );

        const percent = Math.round((downloaded / total) * 100);
        const sizeMb = Number((totalBytes / (1024 * 1024)).toFixed(1));

        this.currentProgress = {
          downloaded,
          total,
          percent,
          sizeMb,
          status: 'DOWNLOADING'
        };
        onProgress(this.currentProgress);
      }

      const finalSizeMb = Number((totalBytes / (1024 * 1024)).toFixed(1)) || Number((total * 0.015).toFixed(1));
      localStorage.setItem('busaisp_offline_map_completed', 'true');
      localStorage.setItem('busaisp_offline_map_size', String(finalSizeMb));
      localStorage.setItem('busaisp_offline_map_date', new Date().toLocaleDateString('pt-BR'));

      this.currentProgress = {
        downloaded: total,
        total,
        percent: 100,
        sizeMb: finalSizeMb,
        status: 'COMPLETED'
      };
      onProgress(this.currentProgress);
    } catch (err: any) {
      this.currentProgress = {
        downloaded,
        total,
        percent: Math.round((downloaded / total) * 100),
        sizeMb: Number((totalBytes / (1024 * 1024)).toFixed(1)),
        status: 'ERROR',
        errorMessage: err?.message || 'Falha ao baixar tiles de mapa.'
      };
      onProgress(this.currentProgress);
    }
  }

  cancelDownload(): void {
    this.isCancelled = true;
    this.currentProgress.status = 'PAUSED';
  }

  async clearCache(): Promise<void> {
    if (typeof window === 'undefined' || !('caches' in window)) return;
    try {
      await caches.delete(CACHE_NAME);
      localStorage.removeItem('busaisp_offline_map_completed');
      localStorage.removeItem('busaisp_offline_map_size');
      localStorage.removeItem('busaisp_offline_map_date');
    } catch (e) {
      console.warn('[OfflineMapService] Erro ao limpar cache:', e);
    }
  }
}

export const offlineMapService = new OfflineMapService();
