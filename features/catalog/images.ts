import { supabaseAdmin } from '@/lib/supabase/server';
import type { Product } from '@/types/database';

export type ProductWithImages = Product & {
  images?: Array<{ path: string; alt_text?: string | null; is_cover?: boolean }>;
};

export async function attachImages(products: Product[]): Promise<ProductWithImages[]> {
  if (products.length === 0) return [];
  const ids = products.map((p) => p.id);
  const { data: images } = await supabaseAdmin
    .from('product_images')
    .select('product_id, path, alt_text, is_cover, position')
    .in('product_id', ids)
    .order('position');
  const map: Record<string, any[]> = {};
  for (const img of images || []) {
    if (!map[img.product_id]) map[img.product_id] = [];
    map[img.product_id].push(img);
  }
  return products.map((p) => ({ ...p, images: map[p.id] || [] }));
}