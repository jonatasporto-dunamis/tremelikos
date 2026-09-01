import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 60;

export async function GET() {
  const now = new Date().toISOString();

  const [{ data: promos }, { data: prodLinks }, { data: secLinks }] = await Promise.all([
    supabase
      .from('promotions')
      .select('id, name, type, value, starts_at, ends_at, weekdays, priority, active')
      .eq('active', true)
      .or(`ends_at.is.null,ends_at.gte.${now}`),
    supabase
      .from('promotion_products')
      .select('promotion_id, product_id'),
    supabase
      .from('promotion_sections')
      .select('promotion_id, section_id'),
  ]);

  const promotions = promos || [];
  const productMap = new Map<string, string[]>();
  for (const link of prodLinks || []) {
    if (!productMap.has(link.product_id)) productMap.set(link.product_id, []);
    productMap.get(link.product_id)!.push(link.promotion_id);
  }
  const sectionMap = new Map<string, string[]>();
  for (const link of secLinks || []) {
    if (!sectionMap.has(link.section_id)) sectionMap.set(link.section_id, []);
    sectionMap.get(link.section_id)!.push(link.promotion_id);
  }

  return NextResponse.json({
    promotions,
    productPromotions: Object.fromEntries(productMap),
    sectionPromotions: Object.fromEntries(sectionMap),
  });
}