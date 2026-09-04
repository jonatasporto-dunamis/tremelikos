import { supabaseAdmin } from '@/lib/supabase/server';
import PromotionsList from './PromotionsList';

export const dynamic = 'force-dynamic';

export default async function AdminPromocoesPage() {
  const [{ data: promos }, { data: products }] = await Promise.all([
    supabaseAdmin.from('promotions').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }),
    supabaseAdmin.from('products').select('id, name, base_price').eq('active', true).order('name'),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Promoções</h1>
      <PromotionsList
        promotions={(promos || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          type: p.type,
          value: p.value,
          active: p.active,
          starts_at: p.starts_at,
          ends_at: p.ends_at,
          weekdays: p.weekdays,
          priority: p.priority,
        }))}
        products={products || []}
      />
    </div>
  );
}
