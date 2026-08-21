import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export interface FavoriteItem {
  id?: string;
  type: 'linha' | 'parada' | 'trilho';
  ref_code: string;       // ex: codigoLinha ("1001"), codigoParada ("340015339") ou id Linha Trilha ("4")
  title: string;          // ex: "8000-10 Term. Lapa"
  label?: string;         // ex: "Casa 🏠", "Trabalho 💼"
  details?: Record<string, any>;
  created_at?: string;
}

const LOCAL_STORAGE_FAVORITES_KEY = 'busaisp_favorites';

/**
 * Carrega favoritos do LocalStorage
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

  if (!supabase) {
    return localItems;
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return localItems;
    }

    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      return data as FavoriteItem[];
    }
    return localItems;
  } catch (err) {
    console.warn('Erro ao buscar favoritos no Supabase:', err);
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
    // Remover
    updated = current.filter((_, idx) => idx !== index);
  } else {
    // Adicionar
    const newItem: FavoriteItem = {
      ...item,
      id: item.id || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString()
    };
    updated = [newItem, ...current];
  }

  saveLocalFavorites(updated);

  // Se o Supabase estiver autenticado, sincronizar em background
  if (supabase) {
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
      console.warn('Falha na sincronização do Supabase:', e);
    }
  }

  return updated;
}
