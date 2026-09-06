import { supabaseAdmin } from '@/lib/supabase/server';

export interface ServerCoupon {
  code: string;
  type: 'fixed_percent' | 'fixed_amount';
  value: number;
  minimum_order: number;
}

export async function loadValidCoupon(
  storeId: string,
  couponCode?: string | null,
  now: Date = new Date()
): Promise<ServerCoupon | null> {
  const code = couponCode?.trim();
  if (!code) return null;

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('store_id', storeId)
    .eq('code', code)
    .eq('active', true)
    .maybeSingle();

  if (error) throw new Error(`coupon: ${error.message}`);
  if (!data) throw new Error('invalid_coupon');

  if (data.starts_at && new Date(data.starts_at) > now) throw new Error('invalid_coupon');
  if (data.ends_at && new Date(data.ends_at) < now) throw new Error('invalid_coupon');
  if (data.max_uses !== null && data.current_uses >= data.max_uses) {
    throw new Error('coupon_exhausted');
  }

  return {
    code: data.code,
    type: data.type,
    value: Number(data.value),
    minimum_order: Number(data.minimum_order || 0),
  };
}
