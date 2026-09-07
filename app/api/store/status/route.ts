import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { computeServerStoreStatus } from '@/features/storeStatus/serverStoreStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: store } = await supabaseAdmin
      .from('stores')
      .select('*')
      .eq('slug', 'tremelikos-burguer')
      .single();

    if (!store) {
      return NextResponse.json({ isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false });
    }

    const [{ data: hours }, { data: overrides }] = await Promise.all([
      supabaseAdmin
        .from('business_hours')
        .select('*')
        .eq('store_id', store.id)
        .order('weekday'),
      supabaseAdmin
        .from('store_overrides')
        .select('*')
        .eq('store_id', store.id)
        .order('date', { ascending: true }),
    ]);

    const status = computeServerStoreStatus({
      store,
      businessHours: hours || [],
      overrides: overrides || [],
    });

    return NextResponse.json({
      isOpen: status.isOpen,
      nextOpenTime: status.nextOpenTime,
      nextOpenAt: status.nextOpenAt ? status.nextOpenAt.toISOString() : null,
      closingSoon: status.closingSoon,
      manualPause: store.manual_pause || false,
      deliveryFee: store.delivery_fee || 0,
      deliveryMinMinutes: store.delivery_min_minutes || 0,
      deliveryMaxMinutes: store.delivery_max_minutes || 0,
    });
  } catch {
    return NextResponse.json({ isOpen: false, nextOpenTime: null, nextOpenAt: null, closingSoon: false });
  }
}
