import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase/server';
import {
  toggleProductAvailable,
  toggleProductFeatured,
  softDeleteProduct,
} from '../actions';

export const dynamic = 'force-dynamic';

export default async function AdminProdutosPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('name');

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Produtos</h1>
          <p className="text-sm text-gray-500">
            {products?.length || 0} produtos cadastrados
          </p>
        </div>
        <Link href="/admin/produtos/novo" className="btn-primary text-sm">
          + Novo Produto
        </Link>
        <Link href="/admin/produtos/edicao-em-massa" className="text-sm px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          📦 Edição em massa
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-3 font-medium text-gray-700">Produto</th>
              <th className="text-left p-3 font-medium text-gray-700">Preço</th>
              <th className="text-center p-3 font-medium text-gray-700">Ativo</th>
              <th className="text-center p-3 font-medium text-gray-700">Disponível</th>
              <th className="text-center p-3 font-medium text-gray-700">Destaque</th>
              <th className="text-right p-3 font-medium text-gray-700">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div>
                    <h3 className="font-medium text-gray-900">{product.name}</h3>
                    {product.badge && (
                      <span className="text-xs text-gray-500">{product.badge}</span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-gray-700">
                  R$ {product.base_price.toFixed(2).replace('.', ',')}
                </td>
                <td className="p-3 text-center">
                  <Toggle
                    on={product.active}
                    onChange={(v) => updateProductActive(product.id, v)}
                  />
                </td>
                <td className="p-3 text-center">
                  <Toggle
                    on={product.available}
                    onChange={(v) => toggleProductAvailable(product.id, v)}
                    color="green"
                  />
                </td>
                <td className="p-3 text-center">
                  <Toggle
                    on={product.featured}
                    onChange={(v) => toggleProductFeatured(product.id, v)}
                  />
                </td>
                <td className="p-3 text-right space-x-2">
                  <Link
                    href={`/admin/produtos/${product.id}`}
                    className="text-sm text-brand-text hover:underline"
                  >
                    Editar
                  </Link>
                  <form action={deleteProductAction} className="inline">
                    <input type="hidden" name="id" value={product.id} />
                    <button
                      type="submit"
                      className="text-sm text-red-500 hover:text-red-700"
                    >
                      Excluir
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

async function updateProductActive(id: string, active: boolean) {
  'use server';
  const { getServerAuthClient } = await import('@/lib/supabase/auth');
  const { supabaseAdmin } = await import('@/lib/supabase/server');
  const sb = await getServerAuthClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;
  await supabaseAdmin.from('products').update({ active }).eq('id', id);
  const { revalidatePath } = await import('next/cache');
  revalidatePath('/admin/produtos');
  revalidatePath('/');
}

async function deleteProductAction(formData: FormData) {
  'use server';
  const id = String(formData.get('id'));
  await softDeleteProduct(id);
}

function Toggle({
  on,
  onChange,
  color = 'brand',
}: {
  on: boolean;
  onChange: (v: boolean) => void | Promise<void>;
  color?: 'brand' | 'green';
}) {
  const activeColor = color === 'green' ? 'bg-green-500' : 'bg-brand';
  return (
    <form
      action={async () => {
        'use server';
        await onChange(!on);
      }}
    >
      <button
        type="submit"
        className={`w-12 h-6 rounded-full transition-colors ${
          on ? activeColor : 'bg-gray-300'
        }`}
        aria-pressed={on}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
            on ? 'translate-x-6' : 'translate-x-0.5'
          }`}
        />
      </button>
    </form>
  );
}