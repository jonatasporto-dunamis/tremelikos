import { supabaseAdmin } from '@/lib/supabase/server';
import ProductEditForm from './ProductEditForm';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [{ data: product }, { data: allSections }, { data: allGroups }, { data: productSections }, { data: productGroups }, { data: coverImage }] =
    await Promise.all([
      supabaseAdmin.from('products').select('*').eq('id', id).single(),
      supabaseAdmin.from('sections').select('id, name').eq('active', true).order('position'),
      supabaseAdmin.from('option_groups').select('id, name').eq('active', true).order('name'),
      supabaseAdmin.from('section_products').select('section_id').eq('product_id', id),
      supabaseAdmin.from('product_option_groups').select('option_group_id').eq('product_id', id),
      supabaseAdmin.from('product_images').select('path').eq('product_id', id).eq('is_cover', true).maybeSingle(),
    ]);

  if (!product) return <p>Produto não encontrado.</p>;

  const selectedSectionIds = (productSections || []).map((r) => r.section_id);
  const selectedGroupIds = (productGroups || []).map((r) => r.option_group_id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink mb-4">Editar produto</h1>
      <ProductEditForm
        product={product}
        allSections={allSections || []}
        allGroups={allGroups || []}
        selectedSectionIds={selectedSectionIds}
        selectedGroupIds={selectedGroupIds}
        {...(coverImage?.path ? { coverPath: coverImage.path } : {})}
      />
    </div>
  );
}
