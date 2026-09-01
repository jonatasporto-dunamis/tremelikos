import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { Coupon } from '@/types/database';

export async function POST(request: Request) {
  const { code } = await request.json().catch(() => ({ code: '' }));
  const normalized = String(code || '').trim().toUpperCase();
  if (!normalized) {
    return NextResponse.json({ valid: false, error: 'Informe um código' }, { status: 400 });
  }

  const { data: coupon, error } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', normalized)
    .eq('active', true)
    .maybeSingle<Coupon>();

  if (error || !coupon) {
    return NextResponse.json({ valid: false, error: 'Cupom não encontrado' }, { status: 404 });
  }

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    return NextResponse.json({ valid: false, error: 'Cupom ainda não começou' }, { status: 400 });
  }
  if (coupon.ends_at && new Date(coupon.ends_at) < now) {
    return NextResponse.json({ valid: false, error: 'Cupom expirado' }, { status: 400 });
  }
  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    return NextResponse.json({ valid: false, error: 'Cupom esgotado' }, { status: 400 });
  }

  return NextResponse.json({
    valid: true,
    coupon: {
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minimum_order: coupon.minimum_order,
    },
  });
}