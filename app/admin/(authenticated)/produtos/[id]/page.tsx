import { supabaseAdmin } from '@/lib/supabase/server';
import { updateProduct, setProductSections, setProductOptionGroups } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: product } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', id)
    .single();
  if (!product) return <p>Produto não encontrado.</p>;

  const [{ data: allSections }, { data: allGroups }, { data: productSections }, { data: productGroups }] =
    await Promise.all([
      supabaseAdmin.from('sections').select('id, name').eq('active', true).order('position'),
      supabaseAdmin.from('option_groups').select('id, name').eq('active', true).order('name'),
      supabaseAdmin.from('section_products').select('section_id').eq('product_id', id),
      supabaseAdmin.from('product_option_groups').select('option_group_id').eq('product_id', id),
    ]);

  const selectedSectionIds = new Set((productSections || []).map((r) => r.section_id));
  const selectedGroupIds = new Set((productGroups || []).map((r) => r.option_group_id));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Editar produto</h1>

      <form action={updateProduct} className="bg-white rounded-xl border border-gray-100 p-4 space-y-3 max-w-2xl mb-6">
        <input type="hidden" name="id" value={product.id} />
        <input type="hidden" name="slug" value={product.slug} />
        <Field label="Nome" name="name" defaultValue={product.name} required />
        <Field label="Descrição" name="description" defaultValue={product.description || ''} textarea />
        <Field label="Preço base (R$)" name="base_price" type="number" step="0.01" defaultValue={String(product.base_price)} required />
        <Field label="Selo" name="badge" defaultValue={product.badge || ''} />
        <Checkbox label="Ativo" name="active" defaultChecked={product.active} />
        <Checkbox label="Disponível" name="available" defaultChecked={product.available} />
        <Checkbox label="Destaque" name="featured" defaultChecked={product.featured} />
        <div className="flex gap-2 pt-2">
          <button type="submit" className="btn-primary">Salvar</button>
          <a href="/admin/produtos" className="px-4 py-2 border border-gray-200 rounded-lg text-sm">
            Cancelar
          </a>
        </div>
      </form>

      <form action={async (fd) => {
        'use server';
        const sections = fd.getAll('section_ids').map(String);
        await setProductSections(product.id, sections);
      }} className="bg-white rounded-xl border border-gray-100 p-4 mb-6 max-w-2xl">
        <h2 className="font-semibold text-gray-900 mb-2">Seções</h2>
        <p className="text-xs text-gray-500 mb-3">Selecione em quais seções o produto aparece</p>
        <div className="space-y-1">
          {allSections?.map((s) => (
            <label key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="section_ids"
                value={s.id}
                defaultChecked={selectedSectionIds.has(s.id)}
                className="accent-brand"
              />
              {s.name}
            </label>
          ))}
        </div>
        <button type="submit" className="mt-3 btn-primary text-sm">Salvar seções</button>
      </form>

      <form action={async (fd) => {
        'use server';
        const groups = fd.getAll('group_ids').map(String);
        await setProductOptionGroups(product.id, groups);
      }} className="bg-white rounded-xl border border-gray-100 p-4 max-w-2xl">
        <h2 className="font-semibold text-gray-900 mb-2">Grupos de adicionais</h2>
        <p className="text-xs text-gray-500 mb-3">Ex: Ponto da carne, Adicionais, Remover</p>
        <div className="space-y-1">
          {allGroups?.map((g) => (
            <label key={g.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="group_ids"
                value={g.id}
                defaultChecked={selectedGroupIds.has(g.id)}
                className="accent-brand"
              />
              {g.name}
            </label>
          ))}
        </div>
        <button type="submit" className="mt-3 btn-primary text-sm">Salvar grupos</button>
      </form>
    </div>
  );
}

function Field({ label, name, defaultValue, type = 'text', required, textarea, step }: {
  label: string; name: string; defaultValue?: string; type?: string; required?: boolean; textarea?: boolean; step?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {textarea ? (
        <textarea name={name} defaultValue={defaultValue} required={required} rows={3} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
      ) : (
        <input name={name} type={type} defaultValue={defaultValue} required={required} step={step} className="w-full p-2 border border-gray-200 rounded-lg text-sm" />
      )}
    </div>
  );
}

function Checkbox({ label, name, defaultChecked }: { label: string; name: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="accent-brand" />
      {label}
    </label>
  );
}