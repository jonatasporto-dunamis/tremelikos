import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function AdminPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('active', true)
    .order('name');

  const { data: sections } = await supabaseAdmin
    .from('sections')
    .select('*')
    .eq('active', true)
    .order('position');

  const totalProducts = products?.length || 0;
  const totalSections = sections?.length || 0;
  const featuredCount = products?.filter((p) => p.featured).length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Painel Admin — Tremeliko's Burguer
          </h1>
          <a
            href="/"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            ← Ver cardápio
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Produtos Ativos</p>
            <p className="text-2xl font-bold text-gray-900">{totalProducts}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Seções</p>
            <p className="text-2xl font-bold text-gray-900">{totalSections}</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Destaques</p>
            <p className="text-2xl font-bold text-gray-900">{featuredCount}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a
            href="/admin/produtos"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🍔</span>
            <h3 className="font-semibold text-gray-900 mt-2">Produtos</h3>
            <p className="text-sm text-gray-500">Gerenciar cardápio</p>
          </a>
          <a
            href="/admin/secoes"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">📂</span>
            <h3 className="font-semibold text-gray-900 mt-2">Seções</h3>
            <p className="text-sm text-gray-500">Organizar categorias</p>
          </a>
          <a
            href="/admin/promocoes"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">🏷️</span>
            <h3 className="font-semibold text-gray-900 mt-2">Promoções</h3>
            <p className="text-sm text-gray-500">Ofertas e cupons</p>
          </a>
          <a
            href="/admin/configuracoes"
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
          >
            <span className="text-2xl">⚙️</span>
            <h3 className="font-semibold text-gray-900 mt-2">Configurações</h3>
            <p className="text-sm text-gray-500">Dados da loja</p>
          </a>
        </div>

        {/* Products List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Produtos Recentes</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {products?.slice(0, 10).map((product) => (
              <div
                key={product.id}
                className="p-4 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-500">
                    R$ {product.base_price.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {product.featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                      Destaque
                    </span>
                  )}
                  {product.available ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      Disponível
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      Indisponível
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
