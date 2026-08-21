import {
  SPTransLinha,
  SPTransParada,
  SPTransPosicaoLinha,
  SPTransPrevisaoResponse
} from '@/types/sptrans';
import { supabase } from '@/lib/supabase';

const SPTRANS_BASE_URL = 'http://api.olhovivo.sptrans.com.br/v2.1';

let inMemoryCookie: string | null = null;
let inMemoryCookieExpiresAt = 0;

/**
 * Recupera o cookie de autenticação salvo do Upstash Redis ou memória
 */
async function getCachedCookie(): Promise<string | null> {
  const now = Date.now();

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      const res = await fetch(`${redisUrl}/get/sptrans_session_cookie`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.result) {
          return data.result;
        }
      }
    } catch (err) {
      console.warn('[SPTrans] Falha ao consultar cache Redis:', err);
    }
  }

  if (inMemoryCookie && now < inMemoryCookieExpiresAt) {
    return inMemoryCookie;
  }

  return null;
}

/**
 * Salva o cookie de sessão no Redis e na memória local
 */
async function setCachedCookie(cookie: string, ttlSeconds = 3000): Promise<void> {
  inMemoryCookie = cookie;
  inMemoryCookieExpiresAt = Date.now() + ttlSeconds * 1000;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (redisUrl && redisToken) {
    try {
      await fetch(`${redisUrl}/set/sptrans_session_cookie/${encodeURIComponent(cookie)}/ex/${ttlSeconds}`, {
        headers: { Authorization: `Bearer ${redisToken}` },
        cache: 'no-store'
      });
    } catch (err) {
      console.warn('[SPTrans] Falha ao salvar cookie no Redis:', err);
    }
  }
}

/**
 * Autentica na SPTrans e obtém o cookie apiCredentials
 */
export async function authenticateSPTrans(): Promise<string | null> {
  const token = process.env.SPTRANS_TOKEN || '141b3042e326eb358232f861c79898110e70799ccab530c5ed5dc3e369dab8fc';

  const cached = await getCachedCookie();
  if (cached) {
    return cached;
  }

  try {
    const authUrl = `${SPTRANS_BASE_URL}/Login/Autenticar?token=${encodeURIComponent(token.trim())}`;
    const res = await fetch(authUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BusaISP/1.0'
      },
      cache: 'no-store'
    });

    const isAuthed = await res.json();
    if (isAuthed === true || isAuthed === 'true') {
      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader) {
        const cookie = setCookieHeader.split(';')[0];
        await setCachedCookie(cookie, 3000); // 50 minutos
        return cookie;
      }
    }
  } catch (err) {
    console.error('[SPTrans] Erro na requisição de autenticação:', err);
  }

  return null;
}

/**
 * Executa uma requisição autenticada à API Olho Vivo
 */
async function fetchSPTrans<T>(endpoint: string): Promise<{ data: T | null; isMock: boolean }> {
  const cookie = await authenticateSPTrans();

  if (!cookie) {
    return { data: null, isMock: false };
  }

  try {
    let res = await fetch(`${SPTRANS_BASE_URL}${endpoint}`, {
      headers: {
        'Cookie': cookie,
        'Accept': 'application/json'
      },
      cache: 'no-store'
    });

    if (res.status === 401) {
      inMemoryCookie = null;
      const newCookie = await authenticateSPTrans();
      if (newCookie) {
        res = await fetch(`${SPTRANS_BASE_URL}${endpoint}`, {
          headers: {
            'Cookie': newCookie,
            'Accept': 'application/json'
          },
          cache: 'no-store'
        });
      }
    }

    if (res.ok) {
      const json = await res.json();
      return { data: json, isMock: false };
    }
  } catch (err) {
    console.error(`[SPTrans] Erro ao buscar ${endpoint}:`, err);
  }

  return { data: null, isMock: false };
}

// -------------------------------------------------------------
// Funções Públicas de Produção com Dados Reais SPTrans & GTFS
// -------------------------------------------------------------

export async function buscarLinhas(termosBusca: string): Promise<{ linhas: SPTransLinha[]; isMock: boolean }> {
  if (!termosBusca || termosBusca.trim().length === 0) {
    return { linhas: [], isMock: false };
  }

  // 1. Tenta buscar direto na Olho Vivo (SPTrans)
  const { data } = await fetchSPTrans<SPTransLinha[]>(
    `/Linha/Buscar?termosBusca=${encodeURIComponent(termosBusca)}`
  );

  if (data && Array.isArray(data) && data.length > 0) {
    return { linhas: data, isMock: false };
  }

  // 2. Fallback para banco GTFS PostGIS (1.361 linhas cadastradas)
  try {
    const cleanQuery = termosBusca.trim();
    const { data: gtfsData, error } = await supabase
      .from('gtfs_routes')
      .select('route_id, short_name, long_name')
      .or(`short_name.ilike.%${cleanQuery}%,long_name.ilike.%${cleanQuery}%`)
      .limit(25);

    if (!error && gtfsData && gtfsData.length > 0) {
      const linhas: SPTransLinha[] = gtfsData.map((r: any) => {
        const shortName = r.short_name || r.route_id;
        const lastDash = shortName.lastIndexOf('-');
        const lt = lastDash > 0 ? shortName.slice(0, lastDash) : shortName;
        const tl = lastDash > 0 ? Number(shortName.slice(lastDash + 1)) || 10 : 10;
        const [ladoA, ladoB] = (r.long_name || '').split(/[-–]/).map((s: string) => s.trim());
        const numericCl = Number(r.route_id.replace(/\D/g, '')) || 0;

        return {
          cl: numericCl,
          lc: false,
          lt,
          tl,
          sl: 1,
          tp: ladoA || '',
          ts: ladoB || ladoA || ''
        };
      });

      return { linhas, isMock: false };
    }
  } catch (err) {
    console.warn('[SPTrans] Erro ao buscar linhas no banco GTFS:', err);
  }

  return { linhas: [], isMock: false };
}

export async function buscarParadas(termosBusca: string): Promise<{ paradas: SPTransParada[]; isMock: boolean }> {
  if (!termosBusca || termosBusca.trim().length === 0) {
    return { paradas: [], isMock: false };
  }

  // 1. Tenta buscar direto na Olho Vivo (SPTrans)
  const { data } = await fetchSPTrans<SPTransParada[]>(
    `/Parada/Buscar?termosBusca=${encodeURIComponent(termosBusca)}`
  );

  if (data && Array.isArray(data) && data.length > 0) {
    return { paradas: data, isMock: false };
  }

  // 2. Fallback para banco GTFS PostGIS (22.241 paradas cadastradas)
  try {
    const cleanQuery = termosBusca.trim();
    const { data: gtfsData, error } = await supabase
      .from('gtfs_stops')
      .select('stop_id, name, lat, lng')
      .ilike('name', `%${cleanQuery}%`)
      .limit(25);

    if (!error && gtfsData && gtfsData.length > 0) {
      const paradas: SPTransParada[] = gtfsData.map((s: any) => ({
        cp: Number(s.stop_id) || 0,
        np: s.name,
        ed: '',
        py: s.lat,
        px: s.lng
      }));

      return { paradas, isMock: false };
    }
  } catch (err) {
    console.warn('[SPTrans] Erro ao buscar paradas no banco GTFS:', err);
  }

  return { paradas: [], isMock: false };
}

export async function buscarPosicaoLinha(codigoLinha: number): Promise<{ posicao: SPTransPosicaoLinha | null; isMock: boolean }> {
  const { data } = await fetchSPTrans<SPTransPosicaoLinha>(
    `/Posicao/Linha?codigoLinha=${codigoLinha}`
  );

  if (data && data.vs && data.vs.length > 0) {
    return { posicao: data, isMock: false };
  }

  return { posicao: null, isMock: false };
}

export async function buscarPrevisaoParada(codigoParada: number): Promise<{ previsao: SPTransPrevisaoResponse | null; isMock: boolean }> {
  const cookie = await authenticateSPTrans();

  if (!cookie) {
    return { previsao: null, isMock: false };
  }

  const { data } = await fetchSPTrans<SPTransPrevisaoResponse>(
    `/Previsao/Parada?codigoParada=${codigoParada}`
  );

  if (data && data.p) {
    return { previsao: data, isMock: false };
  }

  return { previsao: null, isMock: false };
}

export async function buscarPrevisaoLinha(codigoLinha: number): Promise<{ previsao: SPTransPrevisaoResponse | null; isMock: boolean }> {
  const { data } = await fetchSPTrans<SPTransPrevisaoResponse>(
    `/Previsao/Linha?codigoLinha=${codigoLinha}`
  );

  if (data) {
    return { previsao: data, isMock: false };
  }

  return { previsao: null, isMock: false };
}
