import { supabaseAdmin } from '@/lib/supabase/server';
import { attachImages, type ProductWithImages } from './images';

const UPSELL_KEYWORDS = [
  'coca', 'guaraná', 'suco', 'água', 'agua', 'refrigerante',
  'batata', 'fritas', 'onion', 'calabresa', 'cheddar', 'molho',
];

/**
 * Sugere 1 produto para upsell no modal de confirmação.
 * Heurística: prioriza produtos cujo nome casa com palavras-chave
 * (bebida, acompanhamento). Se não houver, devolve o mais barato
 * (provável adicional barato).
 */
export async function getUpsellSuggestion(excludeProductId: string): Promise<ProductWithImages | null> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true)
    .neq('id', excludeProductId)
    .order('base_price', { ascending: true })
    .limit(20);

  const products = (data as any[]) || [];
  if (products.length === 0) return null;

  const withImages = await attachImages(products as any);

  // Prioriza match por keyword
  for (const kw of UPSELL_KEYWORDS) {
    const match = withImages.find(
      (p) => p.name.toLowerCase().includes(kw) || (p.description || '').toLowerCase().includes(kw)
    );
    if (match) return match;
  }
  // senão, devolve o mais barato
  return withImages[0] || null;
}