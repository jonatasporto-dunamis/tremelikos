import { supabaseAdmin } from '@/lib/supabase/server';
import type { Product } from '@/types/database';

export type BestSellerMap = Record<string, number>; // product_id -> rank (1-based)

export async function getBestSellers(limit = 6): Promise<BestSellerMap> {
  // Agrega add_to_cart (ou whatsapp_order/purchase) dos últimos 30 dias
  const since = new Date(Date.now() - 30 * 86400 * 1000).toISOString();
  const { data } = await supabaseAdmin
    .from('analytics_events')
    .select('event_name, items')
    .gte('created_at', since)
    .in('event_name', ['add_to_cart', 'purchase', 'whatsapp_order']);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    const items = (row.items as any[]) || [];
    for (const it of items) {
      if (it?.item_id) {
        counts[it.item_id] = (counts[it.item_id] || 0) + (it.quantity || 1);
      }
    }
  }

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const map: BestSellerMap = {};
  ranked.forEach(([id], i) => { map[id] = i + 1; });
  return map;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .in('id', ids)
    .eq('active', true)
    .eq('available', true);
  return (data as Product[]) || [];
}

export async function getCombos(): Promise<Product[]> {
  // Combos são produtos marcados com badge "Combo" (decisão inicial
  // sem modelar tabela combos_items). Em Fase 11.5+ criamos tabela.
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true)
    .ilike('badge', '%combo%')
    .order('name')
    .limit(6);
  return (data as Product[]) || [];
}