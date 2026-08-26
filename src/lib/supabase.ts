import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://andnuavykwjcivlesnky.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_8zWglq3GN3lCC0xmFxF4cg_AEXfvocn';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export interface FavoriteItem {
  id?: string;
  type: 'linha' | 'parada' | 'trilho' | 'endereco';
  ref_code: string;       // ex: "1703", "340015350", "1", "home", "work"
  title: string;          // ex: "1703-10 Jd. Fontális / Center Norte", ou o endereço real p/ 'endereco'
  label?: string;         // ex: "Casa 🏠", "Trabalho 💼"
  details?: Record<string, any>; // p/ 'endereco': { lat, lng, addressDetails }
  created_at?: string;
}

const LOCAL_STORAGE_FAVORITES_KEY = 'busaisp_favorites';

/**
 * Carrega favoritos salvos localmente no dispositivo
 */
export function getLocalFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Salva favoritos no LocalStorage
 */
export function saveLocalFavorites(items: FavoriteItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_FAVORITES_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Erro ao salvar favoritos no localStorage:', e);
  }
}

/**
 * Busca todos os favoritos do usuário (Supabase com fallback de LocalStorage)
 */
export async function fetchFavorites(): Promise<FavoriteItem[]> {
  const localItems = getLocalFavorites();

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return localItems;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[Supabase] Tabela favorites não encontrada ou erro na consulta:', error.message);
      return localItems;
    }

    if (data && data.length > 0) {
      return data as FavoriteItem[];
    }
    return localItems;
  } catch (err) {
    console.warn('[Supabase] Falha ao consultar nuvem:', err);
    return localItems;
  }
}

/**
 * Adiciona ou remove item dos favoritos
 */
export async function toggleFavorite(item: FavoriteItem): Promise<FavoriteItem[]> {
  const current = getLocalFavorites();
  const index = current.findIndex(
    f => f.type === item.type && String(f.ref_code) === String(item.ref_code)
  );

  let updated: FavoriteItem[];
  if (index >= 0) {
    updated = current.filter((_, idx) => idx !== index);
  } else {
    const newItem: FavoriteItem = {
      ...item,
      id: item.id || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    updated = [newItem, ...current];
  }

  saveLocalFavorites(updated);

  // Sincronizar com Supabase se usuário estiver autenticado
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      if (index >= 0) {
        await supabase
          .from('favorites')
          .delete()
          .match({ user_id: session.user.id, type: item.type, ref_code: item.ref_code });
      } else {
        await supabase.from('favorites').insert({
          user_id: session.user.id,
          type: item.type,
          ref_code: item.ref_code,
          title: item.title,
          label: item.label || '',
          details: item.details || {}
        });
      }
    }
  } catch (e) {
    console.warn('[Supabase] Erro ao sincronizar favorito na nuvem:', e);
  }

  return updated;
}
