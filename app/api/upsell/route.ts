import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const revalidate = 600;

export async function GET() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('active', true)
    .eq('available', true);

  if (error || !data) {
    return NextResponse.json({ side: null, drink: null }, { status: 200 });
  }

  const sides = data.filter((p) => /batata/i.test(p.name));
  const drinks = data.filter((p) => /coca|guar|água|agua|suco/i.test(p.name));

  const side = sides.sort((a, b) => a.base_price - b.base_price)[0] || null;
  const drink =
    drinks.sort((a, b) => a.base_price - b.base_price).find((p) => /lata|500/i.test(p.name)) ||
    drinks.sort((a, b) => a.base_price - b.base_price)[0] ||
    null;

  return NextResponse.json({ side, drink });
}