import { supabaseAdmin } from '@/lib/supabase/server';
import AuditTable, { type AuditLog } from './AuditTable';

export const dynamic = 'force-dynamic';

const PAGE_SIZE = 30;

export default async function AdminAuditPage({ searchParams }: {
  searchParams: Promise<{
    action?: string; entity?: string; actor?: string;
    from?: string; to?: string; page?: string;
  }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page || '1'));
  const offset = (page - 1) * PAGE_SIZE;

  let q = supabaseAdmin.from('audit_logs').select('*', { count: 'exact' });
  if (sp.action) q = q.eq('action', sp.action);
  if (sp.entity) q = q.eq('entity', sp.entity);
  if (sp.actor) q = q.eq('actor_id', sp.actor);
  if (sp.from) q = q.gte('created_at', new Date(sp.from).toISOString());
  if (sp.to) q = q.lte('created_at', new Date(sp.to + 'T23:59:59').toISOString());

  const { data, count } = await q
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  // Buscar listas de opções para os filtros
  const [{ data: actions }, { data: entities }, { data: actorsData }] = await Promise.all([
    supabaseAdmin.from('audit_logs').select('action').limit(500),
    supabaseAdmin.from('audit_logs').select('entity').limit(500),
    supabaseAdmin.from('admin_profiles').select('user_id, role').limit(100),
  ]);

  const actionSet = Array.from(new Set((actions || []).map((r) => r.action))).sort();
  const entitySet = Array.from(new Set((entities || []).map((r) => r.entity))).sort();
  const actorList = (actorsData || []).map((a: any) => ({
    id: a.user_id,
    label: `${a.role} (${a.user_id.slice(0, 8)}…)`,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Auditoria</h1>
      <p className="text-sm text-gray-500 mb-4">Histórico completo de ações no painel administrativo.</p>
      <AuditTable
        logs={(data || []) as AuditLog[]}
        total={count || 0}
        page={page}
        pageSize={PAGE_SIZE}
        actions={actionSet}
        entities={entitySet}
        actors={actorList}
      />
    </div>
  );
}
