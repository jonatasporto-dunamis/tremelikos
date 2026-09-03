import { supabaseAdmin } from '@/lib/supabase/server';
import BulkEditor from './BulkEditor';

export const dynamic = 'force-dynamic';

export default async function BulkProductsPage() {
  const [{ data: products }, { data: sections }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name, base_price, available, active, featured, badge, slug, sku, section_products(section_id, sections(id, name, slug))')
      .order('name'),
    supabaseAdmin
      .from('sections')
      .select('id, name, slug')
      .eq('active', true)
      .order('position'),
  ]);

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">📦 Edição em massa</h1>
        <p className="text-sm text-gray-500">
          Selecione vários produtos e altere seção, preço ou disponibilidade de uma vez. Use com cuidado — as alterações são registradas na auditoria.
        </p>
      </div>

      <BulkEditor
        products={(products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          base_price: p.base_price,
          available: p.available,
          active: p.active,
          featured: p.featured,
          badge: p.badge,
          slug: p.slug,
          sku: p.sku,
          sections: (p.section_products || []).map((sp: any) => sp.sections).filter(Boolean),
        }))}
        sections={(sections || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
        }))}
      />
    </div>
  );
}
