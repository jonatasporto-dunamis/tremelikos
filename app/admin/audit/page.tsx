import { supabaseAdmin } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminAuditPage() {
  const { data: logs } = await supabaseAdmin
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Auditoria</h1>
      <p className="text-sm text-gray-500 mb-3">Últimas 100 ações realizadas no painel.</p>
      <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left p-2 font-medium text-gray-700">Quando</th>
              <th className="text-left p-2 font-medium text-gray-700">Ação</th>
              <th className="text-left p-2 font-medium text-gray-700">Entidade</th>
              <th className="text-left p-2 font-medium text-gray-700">ID</th>
              <th className="text-left p-2 font-medium text-gray-700">Ator</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs?.map((l: any) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="p-2 text-gray-600 whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString('pt-BR')}
                </td>
                <td className="p-2 font-mono text-xs">{l.action}</td>
                <td className="p-2">{l.entity}</td>
                <td className="p-2 text-gray-500 text-xs font-mono">{l.entity_id?.slice(0, 8) || '—'}</td>
                <td className="p-2 text-gray-500 text-xs font-mono">{l.actor_id?.slice(0, 8) || '—'}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Nenhuma ação registrada ainda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}