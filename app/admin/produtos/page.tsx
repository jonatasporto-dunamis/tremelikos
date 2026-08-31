import { supabaseAdmin } from '@/lib/supabase/server';
import { Product } from '@/types/database';

export const revalidate = 0;

async function getProducts(): Promise<Product[]> {
  const { data } = await supabaseAdmin
    .from('products')
    .select('*')
    .order('name');
  return data || [];
}

async function toggleProductAvailability(productId: string, available: boolean) {
  'use server';
  await supabaseAdmin
    .from('products')
    .update({ available })
    .eq('id', productId);
}

async function toggleProductFeatured(productId: string, featured: boolean) {
  'use server';
  await supabaseAdmin
    .from('products')
    .update({ featured })
    .eq('id', productId);
}

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Produtos</h1>
            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              ← Voltar ao painel
            </a>
          </div>
          <button className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover">
            + Novo Produto
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Produto</th>
                <th className="text-left p-4 font-medium text-gray-700">Preço</th>
                <th className="text-center p-4 font-medium text-gray-700">Disponível</th>
                <th className="text-center p-4 font-medium text-gray-700">Destaque</th>
                <th className="text-right p-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <h3 className="font-medium text-gray-900">{product.name}</h3>
                      {product.badge && (
                        <span className="text-xs text-gray-500">{product.badge}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-700">
                    R$ {product.base_price.toFixed(2).replace('.', ',')}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className={`w-12 h-6 rounded-full transition-colors ${
                        product.available ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          product.available ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      className={`w-12 h-6 rounded-full transition-colors ${
                        product.featured ? 'bg-brand' : 'bg-gray-300'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${
                          product.featured ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-sm text-gray-600 hover:text-gray-900 mr-3">
                      Editar
                    </button>
                    <button className="text-sm text-red-500 hover:text-red-700">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
