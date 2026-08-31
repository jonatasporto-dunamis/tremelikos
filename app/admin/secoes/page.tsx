import { supabaseAdmin } from '@/lib/supabase/server';
import { Section } from '@/types/database';

export const revalidate = 0;

async function getSections(): Promise<Section[]> {
  const { data } = await supabaseAdmin
    .from('sections')
    .select('*')
    .order('position');
  return data || [];
}

export default async function AdminSectionsPage() {
  const sections = await getSections();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Seções</h1>
            <a href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
              ← Voltar ao painel
            </a>
          </div>
          <button className="bg-brand text-white px-4 py-2 rounded-lg hover:bg-brand-hover">
            + Nova Seção
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">Posição</th>
                <th className="text-left p-4 font-medium text-gray-700">Nome</th>
                <th className="text-left p-4 font-medium text-gray-700">Slug</th>
                <th className="text-center p-4 font-medium text-gray-700">Status</th>
                <th className="text-right p-4 font-medium text-gray-700">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sections.map((section) => (
                <tr key={section.id} className="hover:bg-gray-50">
                  <td className="p-4 text-gray-500">{section.position}</td>
                  <td className="p-4 font-medium text-gray-900">{section.name}</td>
                  <td className="p-4 text-gray-500">{section.slug}</td>
                  <td className="p-4 text-center">
                    {section.active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                        Ativa
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        Inativa
                      </span>
                    )}
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
