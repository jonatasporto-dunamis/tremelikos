import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import ProductsList from './ProductsList';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const [{ data: products }, { data: sections }, { data: images }] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, name, base_price, available, active, featured, badge, slug, updated_at, section_products(section_id, sections(id, name))')
      .order('name'),
    supabaseAdmin.from('sections').select('id, name').eq('active', true).order('position'),
    supabaseAdmin.from('product_images').select('product_id'),
  ]);

  const imageMap = new Set((images || []).map((i) => i.product_id));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">
            {products?.length || 0} produtos cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/produtos/edicao-em-massa" className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            📦 Edição em massa
          </Link>
          <Link href="/admin/produtos/novo" className="btn-primary text-sm">
            + Novo Produto
          </Link>
        </div>
      </div>

      <ProductsList
        products={(products || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          base_price: p.base_price,
          available: p.available,
          active: p.active,
          featured: p.featured,
          badge: p.badge,
          slug: p.slug,
          updated_at: p.updated_at,
          sections: (p.section_products || []).map((sp: any) => sp.sections).filter(Boolean),
          hasImage: imageMap.has(p.id),
        }))}
        sections={sections || []}
      />
    </div>
  );
}
