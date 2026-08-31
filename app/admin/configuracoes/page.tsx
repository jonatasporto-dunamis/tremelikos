import { supabaseAdmin } from '@/lib/supabase/server';

export const revalidate = 0;

export default async function AdminSettingsPage() {
  const { data: store } = await supabaseAdmin
    .from('stores')
    .select('*')
    .eq('slug', 'tremelikos-burguer')
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">Configurações</h1>
          <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Voltar ao painel
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Dados da Loja</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome
              </label>
              <input
                type="text"
                defaultValue={store?.name || ''}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                WhatsApp
              </label>
              <input
                type="text"
                defaultValue={store?.whatsapp || ''}
                className="w-full p-3 border border-gray-200 rounded-lg"
                placeholder="5573991542371"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pedido Mínimo
              </label>
              <input
                type="number"
                step="0.01"
                defaultValue={store?.minimum_order || 15}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cidade
              </label>
              <input
                type="text"
                defaultValue={store?.city || 'Jequié'}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                defaultValue={store?.address || ''}
                className="w-full p-3 border border-gray-200 rounded-lg"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button className="bg-brand text-white px-6 py-2 rounded-lg hover:bg-brand-hover">
              Salvar alterações
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Horários de Funcionamento</h2>
          <p className="text-sm text-gray-500">
            Terça a Sábado: 18:30 às 23:00
          </p>
          <p className="text-sm text-gray-500">
            Domingo e Segunda: Fechado
          </p>
        </div>
      </main>
    </div>
  );
}
